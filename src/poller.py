import requests
import logging
import json

# Configure logging
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')

def make_rest_api_call(ip_address, api_url, method, auth_token, payload=None, insecure=False):
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {auth_token}'
    }
    verify = not insecure
    url = f"https://{ip_address}{api_url}"

    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, verify=verify)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=payload, verify=verify)
        else:
            logging.error("Unsupported HTTP method.")
            return None
        response.raise_for_status()  # Raises HTTPError for bad responses (4xx and 5xx)
        return response
    except requests.RequestException as e:
        logging.error(f"Error during API call: {e}")
        return None

def get_device_group(ip_address, bearer_token):
    api_url = "/api/v3/metadata/device_groups"
    response = make_rest_api_call(ip_address, api_url, "GET", bearer_token, insecure=True)
    
    if response:
        try:
            data = response.json()
            device_groups = data.get("groups", [])
            filtered_groups = {}
            for group in device_groups:
                children = group.get("children", [])
                print(children)
                for child in children:
                    if "All Device Groups/Operating System" in child.get("path", "") and "Cisco" in child.get("name", ""):
                        filtered_groups[child["name"]] = child["id"]
            return filtered_groups
        except json.JSONDecodeError as e:
            logging.error(f"Error decoding JSON response: {e}")
            return None
    else:
        logging.error("Failed to get device group details.")
        return None

def get_device_metadata(ip_address, bearer_token, device_id):
    api_url = f"/api/v3/entity/DEVICES/id/{device_id}/metadata"
    response = make_rest_api_call(ip_address, api_url, "GET", bearer_token, insecure=True)
    
    if response:
        try:
            metadata = response.json()
            return {
                'username': get_attribute_value(metadata, 'username'),
                'password': get_attribute_value(metadata, 'password'),
                'location': get_attribute_value(metadata, 'location'),
                'device_type': get_attribute_value(metadata, 'devicetype')
            }
        except json.JSONDecodeError as e:
            logging.error(f"Error decoding JSON response: {e}")
            return None
    else:
        logging.error(f"Failed to get metadata for device ID {device_id}.")
        return None

def get_attribute_value(metadata, attribute_name):
    attribute = metadata['attributevaluemap'].get(f"Config.{attribute_name}")
    if attribute and 'values' in attribute and len(attribute['values']) > 0:
        return attribute['values'][0]['value']
    return None

def get_devices(ip_address, bearer_token, deviceGroupDetails):
    api_url = "/api/v3/metadata/devices"
    
    # Extract only the IDs from the deviceGroupDetails dictionary
    device_group_ids = list(deviceGroupDetails.values())
    
    # Create the payload
    payload = {
        "deviceGroupIds": device_group_ids
    }
    
    # Make the API call
    response = make_rest_api_call(ip_address, api_url, "POST", bearer_token, payload=payload, insecure=True)
    
    # Check and process the response
    if response:
        try:
            devices_data = response.json()
            devices = devices_data.get('devices', [])

            # Extract required fields and add device group
            processed_devices = []
            for device in devices:
                device_id = device.get('id')
                device_ip = device.get('ip')
                device_name = device.get('name')
                # Fetch device metadata
                metadata = get_device_metadata(ip_address, bearer_token, device_id)
                
                # Find the device group ID associated with this device
                for group_name, group_id in deviceGroupDetails.items():
                    if group_id in device_group_ids:
                        device_info = {
                            'device_id': device_id,
                            'hostname': device_name,
                            'ip_address': device_ip,
                            'device_group': group_name,
                            'device_group_id': group_id
                        }
                        if metadata:
                            device_info.update(metadata)
                        processed_devices.append(device_info)
                        break
            
            return processed_devices
        except json.JSONDecodeError as e:
            logging.error(f"Error decoding JSON response: {e}")
            return None
    else:
        logging.error("Failed to get devices.")
        return None

def authenticate(ip_address, username, password):
    url = "https://" + ip_address + "/api/v3/users/signin"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    data = {"password": password, "username": username}
    
    logging.debug("Url :" + url)
    logging.debug("Getting bearer token for user " + username)
    res = requests.post(url, headers=headers, json=data, verify=False)
    # Check if the request was successful (status code 200)
    if res.status_code == 200:
        # Parse the JSON data from the response
        response_data = res.json()
        # Extract the token
        token = response_data.get('token')
        if not token:
            logging.error("Error: Authentication token not found in the response.")
            return None
    else:
        # Print an error message if the request was not successful
        logging.error(f"Error: Unable to fetch authentication token. Status code: {res.status_code}")
        return None
    
    return token

token = authenticate("9.42.110.15:15673", "admin", "sdnban@123")

if token:
    deviceGroupDetails = get_device_group("9.42.110.15:15673",token)
    if deviceGroupDetails:
        getDevicesBydeviceGroup = get_devices("9.42.110.15:15673",token,deviceGroupDetails)
        print(getDevicesBydeviceGroup)
else:
    print("Failed to get token")



