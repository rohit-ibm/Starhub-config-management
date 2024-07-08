import sqlite3
import requests
import argparse
import yaml
import os
from logger_config import logger
from flask import Flask, jsonify, request, current_app as app
from flask_restful import Api, Resource
from flask_cors import CORS  # Import the CORS package
from flask_swagger_ui import get_swaggerui_blueprint
import subprocess
import json
import re
from datetime import datetime

def create_app(namespace):
    app = Flask(__name__)
    CORS(app) # Enable CORS for the Flask app
    api = Api(app)

    # Load the swagger.yaml file
    with open('/app/config/swagger.yaml', 'r') as file:
        swagger_spec = yaml.safe_load(file)

    # Setup the Swagger UI
    SWAGGER_URL = '/api-docs'
    API_URL = '/swagger.yaml'
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={
            'app_name': "Config management swagger for backend APIs"
        }
    )
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    @app.route('/swagger.yaml')
    def swagger_yaml():
        return jsonify(swagger_spec)
    
    # Add the resource to the API
    api.add_resource(get_token, '/get_token',resource_class_kwargs={'namespace': namespace})
    api.add_resource(inventory_management, '/inventory_data', '/inventory_data/devicegroups')
    api.add_resource(file_management, '/config_files')
    api.add_resource(backup_management, '/post_backup')
    


    return app

class get_token(Resource):

    def __init__(self, namespace):
        self.namespace = namespace

    def get(self):
        
        username = request.args.get('username')

        password = request.args.get('password')


        # Step 1: Get the authentication token
        url = "https://" + self.namespace.sevonenmsresthost + "/api/v3/users/signin"
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        data = {"password": password, "username": username}
        
        logger.debug("Url :" + url)
        logger.debug("Getting bearer token for user " + username)
        res = requests.post(url, headers=headers, json=data, verify=False)
        # Check if the request was successful (status code 200)
        if res.status_code == 200:
            # Parse the JSON data from the response
            response_data = res.json()
            # Extract the token
            token = response_data.get('token')
            if not token:
                logger.error("Error: Authentication token not found in the response.")
                return None
        else:
            # Print an error message if the request was not successful
            logger.error(f"Error: Unable to fetch authentication token. Status code: {res.status_code}")
            return None
        
        return token


class inventory_management(Resource):

    def post(self):

        # Connect to the database (or create it if it doesn't exist)
        conn = sqlite3.connect('config.db')

        # Enable foreign key support
        conn.execute("PRAGMA foreign_keys = 1")

        # Create a cursor object
        cur = conn.cursor()


        conn.commit()

        device_data = request.get_json()
        
        if not isinstance(device_data, list):
            response = jsonify({'error': 'Input data should be a list of records'})
            response.status_code = 400
            return response



        # backup_files = [('rna.com', 'abc.txt', '21:06:2024:12:00:00', 'Pass', '/opt/backup')
        #                 ]

        # Inventory table entries
        try:
            cur.executemany('''
                INSERT INTO inventory (hostname, ip_address, device_group, device_type, username, password, location)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''',[(
                item['hostname'],
                item['ip_address'],
                item['device_group'],
                item['device_type'],
                item['username'],
                item['password'],
                item['location']
            ) for item in device_data])
            conn.commit()
            response = jsonify({'message': 'Devices added successfully'})
            response.status_code = 201
        except sqlite3.IntegrityError as e:
            response = jsonify({'error': str(e)})
            response.status_code = 400
        finally:
            conn.close()
        return response
    
    def get(self):
        
        devicegroup = request.args.get('device_group')
        if request.path.endswith('/groups'):
            return self.get_device_groups()
        else:
            return self.get_inventory(devicegroup)
        
    def get_inventory(self, devicegroup):

        try:
            # Connect to the database (or create it if it doesn't exist)
            conn = sqlite3.connect('config.db')

            # Enable foreign key support
            conn.execute("PRAGMA foreign_keys = 1")

            # Create a cursor object
            cur = conn.cursor()

            # Query the database
            if devicegroup:
                    cur.execute('SELECT * FROM inventory WHERE device_group = ?', (devicegroup,))
            else:
                    cur.execute("SELECT * FROM inventory")
            inventory_rows = cur.fetchall()
            logger.debug("\nfiles:")
            # for row in user_rows:

            result = []
            for row in inventory_rows:
                    result.append({
                'id': row[0],
                'hostname': row[1],
                'ip_address': row[2],
                'device_group': row[3],
                'device_type': row[4],
                'username': row[5],
                'password': row[6],
                'location': row[7],
                'backup_status': row[8]
            })

            return jsonify(result)

        except sqlite3.OperationalError as e:
            logger.error(f"OperationalError: {e}")
            return str(e)
        finally:
            conn.close()

    def get_device_groups(self):
        try:
            # Connect to the database
            conn = sqlite3.connect('config.db')
            conn.execute("PRAGMA foreign_keys = 1")
            cur = conn.cursor()

            # Query to get distinct device groups
            cur.execute("SELECT DISTINCT device_group FROM inventory")
            device_groups = cur.fetchall()
            logger.debug("Fetched device groups: %s", device_groups)
            result = [row[3] for row in device_groups]

            return jsonify(result)

        except sqlite3.OperationalError as e:
            logger.error(f"OperationalError: {e}")
            return str(e), 500  # Return HTTP 500 status code for server error

        finally:
            conn.close()



class file_management(Resource):

    def get(self):
        
        
        # Connect to the database (or create it if it doesn't exist)
        try:

            hostname = request.args.get('hostname')

            conn = sqlite3.connect('config.db')

            # Enable foreign key support
            conn.execute("PRAGMA foreign_keys = 1")

            # Create a cursor object
            cur = conn.cursor()

            # # Query the database
            # cur.execute("SELECT * FROM inventory")
            # device_rows = cur.fetchall()
            # print("Devices:")
            # for row in device_rows:
            #     print(row)

            # Query the users table to see the inserted data
            if hostname:
                cur.execute('SELECT * FROM configfiles WHERE hostname = ?', (hostname,))
            else:
                cur.execute("SELECT * FROM configfiles")
            files_rows = cur.fetchall()
            logger.debug("\nfiles:")
            # for row in user_rows:

            result = []
            for row in files_rows:
                result.append({
            'id': row[0],
            'hostname': row[1],
            'filename': row[2],
            'datetime': row[3],
            'backup_status': row[4],
            'filepath': row[5]
        })

            return jsonify(result)
            # return files_rows
        
        except sqlite3.OperationalError as e:
            logger.error(f"OperationalError: {e}")
            return str(e)
        finally:
            conn.close()
            
        



# Configfiles table entries

    def post(self):


        # Connect to the database (or create it if it doesn't exist)
        conn = sqlite3.connect('config.db')

        # Enable foreign key support
        conn.execute("PRAGMA foreign_keys = 1")

        # Create a cursor object
        cur = conn.cursor()

        device_configfiles_data = request.get_json()
        
        if not isinstance(device_configfiles_data, list):
            response = jsonify({'error': 'Input data should be a list of records'})
            response.status_code = 400
            return response

        try:
            cur.executemany('''
                INSERT INTO configfiles (hostname, filename, datetime, backup_status, filepath)
                VALUES (?, ?, ?, ?, ?)
            ''', [(item['hostname'], item['filename'], item['datetime'], item['backup_status'], item['filepath']) for item in device_configfiles_data])
            conn.commit()
            response = jsonify({'message': 'Config file added successfully'})
            response.status_code = 201

        except sqlite3.IntegrityError as e:
            response = jsonify({'error': str(e)})
            response.status_code = 400

        finally:
            conn.close()

        return response


class backup_management(Resource):

    def get_db(self):
        conn = sqlite3.connect('config.db')
        conn.execute("PRAGMA foreign_keys = 1")
        return conn

    def post(self):
        playbook_path = "/app/config/config-playbook.yaml"
        # inventory = request.json.get('inventory')
        inventory_data = request.json.get('inventory')

        inventory = {
                    'all': {
                        'children': {
                            'network_devices': {
                                'hosts': {},
                                'vars': {
                                    'ansible_user': '',
                                    'ansible_ssh_pass': '',
                                    'ansible_network_os': 'ios',
                                    'ansible_ssh_common_args': '-o StrictHostKeyChecking=no'
                                }
                            },
                            'remote_server': {
                                'hosts': {
                                    'backup_server': {
                                        'ansible_host': '9.30.220.205'
                                    }
                                },
                                'vars': {
                                    'ansible_user': 'root',
                                    'ansible_ssh_pass': ''
                                }
                            }
                        }
                    }
                }
            
        for device in inventory_data:
            inventory['all']['children']['network_devices']['hosts'][device['hostname']] = {
                'ansible_host': device['ipaddress'],
                'ansible_user': device['username'],
                'ansible_ssh_pass': device['password']
            }
        inventory_path = "/app/config/inventory.yaml"
        with open(inventory_path, 'w') as f:
            yaml.dump(inventory, f)

        # inventory_path = "/root/" + inventory
        # Construct the command to run the Ansible playbook
        command = ['ansible-playbook', playbook_path, '-i', inventory_path]

        # Run the Ansible playbook using subprocess
        result = subprocess.run(command, capture_output=True, text=True)

        # Parse the playbook output to extract the required information
        playbook_output = result.stdout
        # Example structured output from the playbook (assuming JSON format for simplicity)
        # Regular expression to find JSON objects in the output
        json_pattern = re.compile(r'\{\s*"msg":\s*\{.*?\}\s*\}', re.DOTALL)
        json_matches = json_pattern.findall(playbook_output)

        successful_devices_info = []

        for match in json_matches:
            try:
                # Parse the JSON match
                parsed_json = json.loads(match)
                backup_details = parsed_json['msg']
                successful_devices_info.append({
                    'hostname': backup_details.get('hostname', 'Unknown'),
                    'filename': backup_details.get('filename', 'Unknown'),
                    'datetime': backup_details.get('datetime', datetime.now().isoformat()),
                    'filepath': backup_details.get('filepath', 'Unknown'),
                    'backup_status': 'success' if result.returncode == 0 else 'error'
                })
            except json.JSONDecodeError:
                continue


        failed_pattern = re.compile(r'fatal: \[([^]]+)\]: FAILED!')
        failed_devices = failed_pattern.findall(playbook_output)

        failed_devices_info = []
        for device_name in failed_devices:
            failed_devices_info.append({
                'hostname': device_name,
                'filename': '',
                'datetime': datetime.now().isoformat(),
                'filepath': '',
                'backup_status': 'failed'
            })

        successful_response = {
            'devices': successful_devices_info,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode,
            'inventory_path': inventory_path
        }

        failed_response = {
            'devices': failed_devices_info,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode,
            'inventory_path': inventory_path,
        }

        successful_config_files_data = {
            'devices': successful_devices_info,
        }

        failed_config_files_data = {
            'devices': failed_devices_info,
        }

        os.remove(inventory_path)
        # print(response)
        # print(config_files_data)
        
        if result.returncode == 0:
            file_management_instance = file_management()
            with app.app_context():
                with app.test_request_context(json=successful_config_files_data['devices']):
                    post_response = file_management_instance.post()
                    post_response_data = post_response.get_json()
                    successful_config_files_data['post_status'] = post_response_data
            conn = self.get_db()
            cur = conn.cursor()
            try:
                for item in successful_config_files_data["devices"]:
                    cur.execute('''
                        UPDATE inventory
                        SET backup_status = ?
                        WHERE hostname = ?
                    ''', ('success', item['hostname']))
                conn.commit()
                successful_response['update_status'] = 'Backup status updated successfully'
            except sqlite3.Error as e:
                successful_response['update_status'] = f'Error: {str(e)}'
                successful_response['status'] = 'error'
            finally:
                conn.close()
            # response.status_code = 201
            return jsonify({'status': 'success', 'output': successful_response})
        else:
            file_management_instance = file_management()
            with app.app_context():
                with app.test_request_context(json=failed_config_files_data['devices']):
                    post_response = file_management_instance.post()
                    post_response_data = post_response.get_json()
                    failed_config_files_data['post_status'] = post_response_data
            conn = self.get_db()
            cur = conn.cursor()
            try:
                for item in failed_config_files_data["devices"]:
                    cur.execute('''
                        UPDATE inventory
                        SET backup_status = ?
                        WHERE hostname = ?
                    ''', ('failed', item['hostname']))
                conn.commit()
                failed_response['update_status'] = 'Backup status updated successfully'
            except sqlite3.Error as e:
                failed_response['update_status'] = f'Error: {str(e)}'
                failed_response['status'] = 'error'
            finally:
                conn.close()
            # failed_response.status_code = 500
            return jsonify({'status': 'error', 'output': failed_response})


class device_groups(Resource):
    def __init__(self, namespace):
        self.namespace = namespace

    def get(self):
        try:
            bearer_token = request.headers.get('Authorization').split(' ')[1]
            logger.debug(f"Bearer token: {bearer_token}")
            response = self.get_device_group(self.namespace.sevonenmsresthost, bearer_token)

            if response:
                return jsonify(response)
            else:
                logger.error("Failed to fetch device group details.")
                return jsonify({"error": "Unable to fetch device group details"}), 500
        except Exception as e:
            logger.error(f"Exception in get device groups: {e}")
            return jsonify({"error": str(e)}), 500

    def make_rest_api_call(self, ip_address, api_url, method, auth_token, payload=None, insecure=False):
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
                logger.error("Unsupported HTTP method.")
                return None
            response.raise_for_status()  # Raises HTTPError for bad responses (4xx and 5xx)
            return response
        except requests.RequestException as e:
            logger.error(f"Error during API call: {e}")
            return None

    def get_device_group(self, ip_address, bearer_token):
        method = "GET"
        api_url = "/api/v3/metadata/device_groups"
        response = self.make_rest_api_call(ip_address, api_url, method, bearer_token, insecure=True)

        if response:
            try:
                return response.json()
            except json.JSONDecodeError as e:
                logger.error(f"Error decoding JSON response: {e}")
                return None
        else:
            logger.error("Failed to get device group details.")
            return None





