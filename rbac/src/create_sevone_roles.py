import requests
import urllib3
from sync_sevone_users import authenticate
from dotenv import load_dotenv
import os
import base64
import logging

# Suppress InsecureRequestWarning
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables from a .env file
load_dotenv()

# Base IP and Port
NMS_IP = os.getenv("NMS_IP")
API_PORT = os.getenv("API_PORT")

# Construct URLs using base IP and port
AUTH_URL = f"https://{NMS_IP}:{API_PORT}/api/v2/authentication/signin"
USERS_URL = f"https://{NMS_IP}:{API_PORT}/api/v2/users"
ROLE_URL = f"https://{NMS_IP}:{API_PORT}/api/v2/roles"
ADMIN_API_URL = f"https://{NMS_IP}:{API_PORT}/api/v2/roles"
ROLE_FILTER = f"https://{NMS_IP}:{API_PORT}/api/v2/roles"

# Decode Base64 encoded credentials
AUTH_USERNAME = base64.b64decode(os.getenv("AUTH_USERNAME_BASE64")).decode("utf-8")
AUTH_PASSWORD = base64.b64decode(os.getenv("AUTH_PASSWORD_BASE64")).decode("utf-8")

# Get role names from .env or default roles if not set
ROLE_NAMES = os.getenv("ROLE_NAMES", "cm-Administrator,cm-DiscoveryManagement,cm-ScheduleManagement,cm-BackupManagement").split(",")

# Check if a role with the specified name exists
def role_exists(role_name, token):
    headers = {
        "Accept": "application/json",
        "X-AUTH-TOKEN": token
    }
    
    try:
        response = requests.get(ROLE_URL, headers=headers, verify=False)
        response.raise_for_status()
        roles = response.json().get("content", [])
        
        for role in roles:
            if role.get("name") == role_name:
                logger.info(f"Role '{role_name}' exists.")
                return True
        return False
        
    except requests.RequestException as e:
        logger.error(f"An error occurred while checking existence of role '{role_name}': {e}")
        return False

# Get the administrator id
def get_administrators_id(admin_api_url, auth_token, role_name="Administrators"):
    headers = {
        "Accept": "application/json",
        "X-AUTH-TOKEN": auth_token
    }
    
    try:
        response = requests.get(admin_api_url, headers=headers, verify=False)
        response.raise_for_status()
        data = response.json()
        
        for role in data.get("content", []):
            if role.get("name") == role_name:
                logger.info(f"Administrator role '{role_name}' found with ID: {role.get('id')}.")
                return role.get("id")
        
        logger.warning(f"Role '{role_name}' not found.")
        return None

    except requests.RequestException as e:
        logger.error(f"An error occurred while fetching administrators ID: {e}")
        return None
    
# Create ConfigMgt role if it doesn't exist
def create_configMgt_role(parent_id, role_filter_url, auth_token):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-AUTH-TOKEN": auth_token
    }
    
    role_data = {
        "name": "ConfigMgt-roles",
        "parentId": parent_id
    }
    
    if role_exists("ConfigMgt-roles", auth_token):
        logger.info("Skipping creation of ConfigMgt-roles as it already exists.")
        return None

    try:
        response = requests.post(role_filter_url, headers=headers, json=role_data, verify=False)
        response.raise_for_status()
        
        role_response = response.json()
        role_response["parentId"] = parent_id
        logger.info("ConfigMgt-roles created successfully: %s", role_response)
        return role_response
        
    except requests.RequestException as e:
        logger.error(f"An error occurred while creating ConfigMgt role: {e}")
        return None

# Create a role if it doesn't exist
def create_role(token, name, parent_id):
    if role_exists(name, token):
        logger.info(f"Role '{name}' already exists. Skipping creation.")
        return
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-AUTH-TOKEN": token
    }
    payload = {
        "name": name,
        "parentId": parent_id
    }
    try:
        response = requests.post(ROLE_URL, headers=headers, json=payload, verify=False)
        response.raise_for_status()
        logger.info(f"Role '{name}' created successfully.")
        
    except requests.HTTPError as e:
        if e.response.status_code == 409:
            logger.info(f"Role '{name}' already exists. Skipping creation.")
        else:
            logger.error(f"An error occurred while creating role '{name}': {e}")
    except requests.RequestException as e:
        logger.error(f"An error occurred while creating role '{name}': {e}")

# Function to create multiple roles based on ROLE_NAMES
def create_config_roles(token, admin_api_url):
    parent_id_cm = get_administrators_id(admin_api_url, token, role_name="ConfigMgt-roles")
    if not parent_id_cm:
        logger.warning("ConfigMgt-roles ID not found. Aborting role creation.")
        return
    
    roles = [{"name": role_name.strip(), "parentId": parent_id_cm} for role_name in ROLE_NAMES]
    
    for role in roles:
        create_role(token, role["name"], role["parentId"])

# Example usage
def main():
    token = authenticate(AUTH_URL, AUTH_USERNAME, AUTH_PASSWORD)
    if not token:
        logger.error("Authentication failed. Exiting.")
        return
    
    parent_id = get_administrators_id(ADMIN_API_URL, token, role_name="Administrators")
    if parent_id:
        config_mgt_response = create_configMgt_role(parent_id, ROLE_FILTER, token)
        
        # Call create_config_roles regardless of whether ConfigMgt-roles was created or already exists
        create_config_roles(token, ADMIN_API_URL)
    else:
        logger.error("Administrators ID not found. Exiting.")

# Run the script
if __name__ == "__main__":
    main()
