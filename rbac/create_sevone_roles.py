import os
import logging
import urllib3
import requests
import base64

# Suppress InsecureRequestWarning
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
def load_env(file_path=".env"):
    """Load environment variables from a .env file."""
    if not os.path.exists(file_path):
        logger.warning(f"{file_path} does not exist. Skipping environment variable loading.")
        return

    with open(file_path, "r") as file:
        for line in file:
            line = line.strip()
            if line and not line.startswith("#"):  # Ignore empty lines and comments
                if "=" in line:
                    key, value = line.split("=", 1)  # Split on the first '='
                    os.environ[key.strip()] = value.strip()

load_env()

# Environment variables
NMS_IP = os.getenv("NMS_IP")
API_PORT = os.getenv("API_PORT")

AUTH_URL = f"https://{NMS_IP}:{API_PORT}/api/v2/authentication/signin"
ROLE_URL = f"https://{NMS_IP}:{API_PORT}/api/v2/roles"
ADMIN_API_URL = f"https://{NMS_IP}:{API_PORT}/api/v2/roles"

AUTH_USERNAME = base64.b64decode(os.getenv("AUTH_USERNAME_BASE64")).decode("utf-8")
AUTH_PASSWORD = base64.b64decode(os.getenv("AUTH_PASSWORD_BASE64")).decode("utf-8")
ROLE_NAMES = os.getenv(
    "ROLE_NAMES",
    "cm-Administrator,cm-DiscoveryManagement,cm-ScheduleManagement,cm-BackupManagement"
).strip('"').split(",")

# Authentication function
def authenticate(auth_url, username, password):
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
        res = requests.post(auth_url, headers=headers, json=data, verify=False)
        res.raise_for_status()
        token = res.json().get("token")
        if token:
            logger.info("Authentication successful.")
            return token
        else:
            logger.error("Token not found in authentication response.")
            return None
    except requests.RequestException as e:
        logger.error(f"Authentication failed: {e}")
        return None

# Check if a role exists
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
        logger.error(f"Error while checking role '{role_name}': {e}")
        return False

# Fetch Administrator ID
def get_administrators_id(admin_api_url, token, role_name="Administrators"):
    headers = {
        "Accept": "application/json",
        "X-AUTH-TOKEN": token
    }

    try:
        logger.info(f"Fetching roles from {admin_api_url}...")
        response = requests.get(admin_api_url, headers=headers, verify=False)
        response.raise_for_status()
        roles = response.json().get("content", [])

        for role in roles:
            if role.get("name") == role_name:
                logger.info(f"Found role '{role_name}' with ID: {role.get('id')}")
                return role.get("id")

        logger.warning(f"Role '{role_name}' not found.")
        return None
    except requests.RequestException as e:
        logger.error(f"Error fetching administrators ID: {e}")
        return None

# Create ConfigMgt role
def create_configMgt_role(parent_id, role_url, token):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-AUTH-TOKEN": token
    }

    role_data = {
        "name": "ConfigMgt-roles",
        "parentId": parent_id
    }

    if role_exists("ConfigMgt-roles", token):
        logger.info("ConfigMgt-roles already exists. Skipping creation.")
        return None

    try:
        response = requests.post(role_url, headers=headers, json=role_data, verify=False)
        response.raise_for_status()
        logger.info("ConfigMgt-roles created successfully.")
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error creating ConfigMgt role: {e}")
        return None

# Create a role if it doesn't exist
def create_role(token, name, parent_id):
    if role_exists(name, token):  # Check if the role exists first
        logger.info(f"Role '{name}' already exists. Skipping creation.")
        return  # Skip creation if the role exists

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
        response.raise_for_status()  # This will raise an exception if the status code is not 2xx
        logger.info(f"Role '{name}' created successfully.")
    except requests.RequestException as e:
        # If the role already exists (409 conflict), we log an informational message instead of an error
        if response.status_code == 409:
            logger.info(f"Role '{name}' already exists. Skipping creation.")
        else:
            logger.error(f"Error creating role '{name}': {e}")

# Create multiple roles
def create_config_roles(token, admin_api_url):
    parent_id = get_administrators_id(admin_api_url, token, role_name="ConfigMgt-roles")
    if not parent_id:
        logger.warning("ConfigMgt-roles ID not found. Aborting role creation.")
        return

    for role_name in ROLE_NAMES:
        create_role(token, role_name.strip(), parent_id)

# Main function
def main():
    token = authenticate(AUTH_URL, AUTH_USERNAME, AUTH_PASSWORD)
    if not token:
        logger.error("Authentication failed. Exiting.")
        return

    parent_id = get_administrators_id(ADMIN_API_URL, token, role_name="Administrators")
    if parent_id:
        create_configMgt_role(parent_id, ROLE_URL, token)
        create_config_roles(token, ADMIN_API_URL)
    else:
        logger.error("Administrators ID not found. Exiting.")

if __name__ == "__main__":
    main()

