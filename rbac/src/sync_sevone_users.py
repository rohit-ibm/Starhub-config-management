import os
import logging
import urllib3
import requests
from requests.exceptions import RequestException
from dotenv import load_dotenv
import base64

# Suppress InsecureRequestWarning
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Load environment variables from a .env file, if available
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Base IP and Port
NMS_IP = os.getenv("NMS_IP")
API_PORT = os.getenv("API_PORT")
CONFIG_IP = os.getenv("CONFIG_IP")
CONFIG_PORT = os.getenv("CONFIG_PORT")

# Environment configuration
AUTH_URL = f"https://{NMS_IP}:{API_PORT}/api/v2/authentication/signin"
USERS_URL = f"https://{NMS_IP}:{API_PORT}/api/v2/users"
CREATE_USER_URL = f"http://{CONFIG_IP}:{CONFIG_PORT}/create_user"

USERNAME = base64.b64decode(os.getenv("AUTH_USERNAME_BASE64")).decode("utf-8")
PASSWORD = base64.b64decode(os.getenv("AUTH_PASSWORD_BASE64")).decode("utf-8")


# Define valid roles and their corresponding group names
ROLE_GROUP_MAPPING = {
    "cm-Administrator": "Administrator", 
    "cm-DiscoveryManagement": "DiscoveryManagement", 
    "cm-ScheduleManagement": "Schedule Management", 
    "cm-BackupManagement": "Backup Management" 
}

def authenticate(url, username, password):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    data = {
        "name": username,
        "password": password
    }
    
    try:
        logger.info("Authenticating with the server...")
        res = requests.post(url, headers=headers, json=data, verify=False)
        res.raise_for_status()  # Raises an error if the request failed
        token = res.json().get("token")
        if token:
            logger.info("Authentication successful.")
            return token
        else:
            logger.error("Token not found in authentication response.")
            return None
    except RequestException as e:
        logger.error(f"Authentication failed: {e}")
        return None


def get_users(token):
    headers = {
        "Accept": "application/json",
        "X-AUTH-TOKEN": token
    }
    
    try:
        logger.info("Fetching user list from the server...")
        response = requests.get(f"{USERS_URL}?page=0&size=20", headers=headers, verify=False)
        response.raise_for_status()
        users_data = response.json()
        return users_data.get("content", [])
    except RequestException as e:
        logger.error(f"Failed to fetch users: {e}")
        return None

def get_user_roles(token, user_id):
    headers = {
        "Accept": "application/json",
        "X-AUTH-TOKEN": token
    }
    try:
        logger.info(f"Fetching roles for user ID {user_id}...")
        response = requests.get(f"https://{os.getenv('NMS_IP')}:{os.getenv('API_PORT')}/api/v2/users/{user_id}/roles", headers=headers, verify=False)
        response.raise_for_status()
        roles = response.json()
        return roles
    except RequestException as e:
        logger.error(f"Failed to fetch roles for user ID {user_id}: {e}")
        return []

def create_user(username, password, email):
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    data = {
        "username": username,
        "password": password,
        "email": email
    }
    
    try:
        logger.info(f"Attempting to create user: {username}")
        response = requests.post(CREATE_USER_URL, headers=headers, json=data)
        response.raise_for_status()
        logger.info(f"User {username} created successfully.")
        return response.json()  # Return user details for group assignment
    except RequestException as e:
        logger.error(f"Failed to create user {username}: {e}")
        return None

def assign_user_to_group(user_id, group_id):
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    data = {
        "user_id": user_id,
        "group_id": group_id
    }

    try:
        logger.info(f"Assigning user ID {user_id} to group ID {group_id}...")
        response = requests.post('http://9.46.112.167:8001/add_user_to_group', headers=headers, json=data)
        response.raise_for_status()
        logger.info(f"User ID {user_id} assigned to group ID {group_id} successfully.")
    except RequestException as e:
        logger.error(f"Failed to assign user ID {user_id} to group ID {group_id}: {e}")

def fetch_existing_users():
    try:
        logger.info("Fetching existing users...")
        response = requests.get('http://9.46.112.167:8001/users', headers={'accept': 'application/json'})
        response.raise_for_status()
        return {user['username']: user['user_id'] for user in response.json()}
    except RequestException as e:
        logger.error(f"Failed to fetch existing users: {e}")
        return {}

def fetch_existing_groups():
    try:
        logger.info("Fetching existing groups...")
        response = requests.get('http://9.46.112.167:8001/groups', headers={'accept': 'application/json'})
        response.raise_for_status()
        return {group['group_name']: group['group_id'] for group in response.json()}
    except RequestException as e:
        logger.error(f"Failed to fetch existing groups: {e}")
        return {}

def create_users_from_nms(token):
    users = get_users(token)
    if not users:
        logger.warning("No users retrieved to create.")
        return

    existing_users = fetch_existing_users()
    existing_groups = fetch_existing_groups()

    for user in users:
        username = user.get("username")
        password = username
        email = user.get("email")
        user_id = user.get("id")

        # Fetch roles for the user
        roles = get_user_roles(token, user_id)

        # Check for matching roles in the ROLE_GROUP_MAPPING
        user_groups = []
        for role in roles:
            role_name = role['name']
            if role_name in ROLE_GROUP_MAPPING:
                user_groups.append(existing_groups[ROLE_GROUP_MAPPING[role_name]])

        # Create user if any valid role was found
        if user_groups:
            created_user = create_user(username, password, email)
            if created_user:
                # After creating the user, fetch the user_id using the API
                newly_created_users = fetch_existing_users()  # Refresh the existing users
                new_user_id = newly_created_users.get(username)  # Get user_id after creation
                
                # Assign user to all valid groups
                for group_id in user_groups:
                    assign_user_to_group(new_user_id, group_id)
        else:
            logger.info(f"User {username} does not have any valid roles; skipping user creation.")

def main():
    token = authenticate(AUTH_URL, USERNAME, PASSWORD)
    if token:
        create_users_from_nms(token)
    else:
        logger.error("Authentication failed; exiting.")

if __name__ == "__main__":
    main()
