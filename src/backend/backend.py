import sqlite3
import requests
import argparse
import yaml
import os
import base64
import zipfile
import io
from logger_config import logger
from flask import Flask, jsonify, request, current_app as app, send_from_directory, abort, Response, send_file
from flask_restful import Api, Resource
from flask_cors import CORS  # Import the CORS package
from flask_swagger_ui import get_swaggerui_blueprint
import subprocess
import json
import re
from datetime import datetime
import pytz


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
    api.add_resource(health_check, '/health')
    api.add_resource(get_token, '/get_token',resource_class_kwargs={'namespace': namespace})
    api.add_resource(inventory_management, '/inventory_data', '/inventory_data/devicegroups', '/inventory_data/devices', '/inventory_data/schedule_backup')
    api.add_resource(file_management, '/config_files', '/config_files/list', '/config_files/view', '/config_files/download', '/config_files/downloadall' )
    api.add_resource(backup_management, '/post_backup')
    api.add_resource(device_groups, '/device_groups' , resource_class_kwargs={'namespace': namespace})
    api.add_resource(update_device_group, '/update_device_groups' , resource_class_kwargs={'namespace': namespace})
    api.add_resource(DeleteDevices, '/delete_devices')
    api.add_resource(schedule_backup, '/schedules')
    api.add_resource(delete_schedule_backup, '/delete_schedule')

    return app


class health_check(Resource):
    def get(self):
        response = jsonify(status="healthy")
        response.status_code = 200
        return response

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

        if request.path.endswith('/schedule_backup'):

            data = request.get_json()

        # Check if input data is valid
            if not data or 'date' not in data or 'devices' not in data:
                response = jsonify({'error': 'Invalid input data'})
                response.status_code = 400
                return response

            date = data['date']
            devices = data['devices']
            return self.update_scheduled_times(date, devices)
        
        else:
            return self.add_inventory_data()

    def add_inventory_data(self):
        # Connect to the database (or create it if it doesn't exist)
        conn = sqlite3.connect('/app/db/config.db')

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
            return response
        finally:
            conn.close()
        return response
    
    def update_scheduled_times(self, date, devices):
        try:
            # Connect to the database
            conn = sqlite3.connect('/app/db/config.db')
            conn.execute("PRAGMA foreign_keys = 1")
            cur = conn.cursor()

            for hostname in devices:
                # Update the schedule_backup_time for the given hostname
                cur.execute('''
                    UPDATE inventory
                    SET schedule_backup_time = ?
                    WHERE hostname = ?
                ''', (date, hostname))

            conn.commit()

            # Fetch the updated inventory for the provided devices
            placeholders = ','.join('?' for _ in devices)
            query = f'SELECT hostname, ip_address, username, password, schedule_backup_time FROM inventory WHERE hostname IN ({placeholders})'
            cur.execute(query, devices)
            inventory_rows = cur.fetchall()

            result = [
                {
                    'hostname': row[0],
                    'ipaddress': row[1],
                    'schedule_backup_time': row[4]
                }
                for row in inventory_rows
            ]

            response = jsonify({'inventory': result})
            response.status_code = 200  # OK
        except sqlite3.IntegrityError as e:
            response = jsonify({'error': str(e)})
            response.status_code = 400
        finally:
            conn.close()
        
        return response
    
    def get(self):
        
        if request.path.endswith('/groups'):
            return self.get_device_groups()
        
        elif request.path.endswith('/devices'):
            return self.get_device_details()
        else:
            devicegroup = request.args.get('device_group')
            return self.get_inventory(devicegroup)
        
    def get_inventory(self, devicegroup):

        try:
            # Connect to the database (or create it if it doesn't exist)
            conn = sqlite3.connect('/app/db/config.db')

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
                'backup_status': row[8],
                'last_backup_time': row[9],
                'schedule_backup_time': row[10]
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
            conn = sqlite3.connect('/app/db/config.db')
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

    def get_device_details(self):
        try:
            # Get the devices from the query parameters
            conn = sqlite3.connect('/app/db/config.db')
            conn.execute("PRAGMA foreign_keys = 1")
            cur = conn.cursor()

            devices = request.args.getlist('devices')
            if not devices:
                result = []
                cur.execute('SELECT hostname, ip_address, username, password FROM inventory')
                inventory_rows = cur.fetchall()
                if inventory_rows:
                    for row in inventory_rows:
                        details = {
                            'hostname': row[0],
                            'ipaddress': row[1],
                            'username': row[2],
                            'password': self.decode_base64(row[3])
                        }
                        result.append(details)
                

                return jsonify({'inventory': result})
            

            result = []
            for device in devices:
                cur.execute('SELECT hostname, ip_address, username, password FROM inventory WHERE hostname = ?', (device,))
                inventory_rows = cur.fetchall()
                print(inventory_rows)
                if inventory_rows:
                    for row in inventory_rows:
                        details = {
                            'hostname': row[0],
                            'ipaddress': row[1],
                            'username': row[2],
                            'password': self.decode_base64(row[3])
                        }
                    result.append(details)

            return jsonify({'inventory': result})
        
        except sqlite3.OperationalError as e:
            logger.error(f"OperationalError: {e}")
            return str(e), 500  # Return HTTP 500 status code for server error

        finally:
            conn.close()

    def decode_base64(self, encoded_str):
        try:
        # Decode the base64 encoded string
            base64_bytes = encoded_str.encode('utf-8')
            message_bytes = base64.b64decode(base64_bytes)
            decoded_str = message_bytes.decode('utf-8')
            return decoded_str
        except Exception as e:
            logger.error(f"Error decoding base64: {e}")
            return str(e)

class file_management(Resource):

    def get(self):

        if request.path.endswith('/list'):
            return self.list_configfiles()
        
        elif request.path.endswith('/view'):
            return self.view_configfiles()
        
        elif request.path.endswith('/download'):
            return self.download_configfiles()
        
        elif request.path.endswith('/downloadall'):
            return self.download_all_files()       
        else:
            return self.get_configfiles()
        
    def get_configfiles(self):
        # Connect to the database (or create it if it doesn't exist)
        try:

            hostname = request.args.get('hostname')

            conn = sqlite3.connect('/app/db/config.db')

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

    def list_configfiles(self):

        hostname = request.args.get('hostname')
        BACKUP_DIR = "/backups"
        host_backup_dir = os.path.join(BACKUP_DIR, hostname)
        if not os.path.exists(host_backup_dir):
            abort(404, description="File not found")
        
        backups = []
        for file in os.listdir(host_backup_dir):
            file_path = os.path.join(host_backup_dir, file)
            backups.append({
                "hostname": hostname,
                "filename": file,
                "filepath": file_path.replace(BACKUP_DIR, "/backups"),  # Adjust filepath for serving
                "last_modified": self.format_iso_time(os.path.getmtime(file_path))
            })
        return jsonify(backups)        
    
    def view_configfiles(self):
        hostname = request.args.get('hostname')
        filename = request.args.get('filename')
        BACKUP_DIR = "/backups"
        file_path = os.path.join(BACKUP_DIR, hostname, filename)
        if not os.path.exists(file_path):
            abort(404, description="File not found")

        try:
            with open(file_path, 'r') as file:
                content = file.read()
            return Response(content, mimetype='text/plain')
        except Exception as e:
            abort(500, description=str(e))
    
    def format_iso_time(self, epoch_time):
        return datetime.fromtimestamp(epoch_time).isoformat() + 'Z'
    
    def download_configfiles(self):
        hostname = request.args.get('hostname')
        filename = request.args.get('filename')
        BACKUP_DIR = "/backups"
        file_path = os.path.join(BACKUP_DIR, hostname)
        try:
            return send_from_directory(file_path, filename, as_attachment=True)
        except Exception as e:
            abort(500, description=str(e))
    
    def download_all_files(self):
        hostname = request.args.get('hostname')
        filename = request.args.get('filename')
        BACKUP_DIR = "/backups"
        backup_dir = os.path.join(BACKUP_DIR, hostname)
        try:
            memory_file = io.BytesIO()
            with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root, dirs, files in os.walk(backup_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, BACKUP_DIR)
                        zf.write(file_path, arcname=arcname)
            memory_file.seek(0)
            return send_file(memory_file, download_name=f'{hostname}_backups.zip', as_attachment=True)
        except Exception as e:
            abort(500, description=str(e))


# Configfiles table entries

    def post(self):


        # Connect to the database (or create it if it doesn't exist)
        conn = sqlite3.connect('/app/db/config.db')

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
    
class DeleteDevices(Resource):

    def delete(self):
        devices = request.args.getlist('devices')

        if not devices:
            response = jsonify({'error': 'Invalid input data'})
            response.status_code = 400
            return response

        if not isinstance(devices, list):
            response = jsonify({'error': 'Devices should be a list'})
            response.status_code = 400
            return response

        return self.delete_devices_from_db(devices)

    def delete_devices_from_db(self, devices):
        try:
            conn = sqlite3.connect('/app/db/config.db')
            conn.execute("PRAGMA foreign_keys = 1")
            cur = conn.cursor()

            placeholders = ','.join('?' for _ in devices)
            query = f'DELETE FROM inventory WHERE hostname IN ({placeholders})'
            cur.execute(query, devices)

            conn.commit()

            response = jsonify({'message': 'Devices deleted successfully'})
            response.status_code = 200
        except sqlite3.OperationalError as e:
            response = jsonify({'error': str(e)})
            response.status_code = 400
        finally:
            conn.close()

        return response


class backup_management(Resource):

    def get_db(self):
        conn = sqlite3.connect('/app/db/config.db')
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
        try:
        # Run the Ansible playbook using subprocess
            result = subprocess.run(command, capture_output=True, text=True)
        except Exception as e:
            logger.error(f"Error running playbook: {e}")
            return str(e)
        # Parse the playbook output to extract the required information
        playbook_output = result.stdout
        logger.debug(f'Playbook_result {playbook_output}')
        # Example structured output from the playbook (assuming JSON format for simplicity)
        # Regular expression to find JSON objects in the output

        source_timezone_str = 'UTC'
        target_timezone_str = 'Asia/Kolkata'  # Replace with your target timezone

        source_timezone = pytz.timezone(source_timezone_str)
        target_timezone = pytz.timezone(target_timezone_str)


        successful_pattern = re.compile(r'\{\s*"msg":\s*\{.*?\}\s*\}', re.DOTALL)
        successful_devices = successful_pattern.findall(playbook_output)
        logger.debug(f'successful_devices{successful_devices}')
        

        successful_devices_info = []

        for match in successful_devices:
            try:
                # Parse the JSON match
                parsed_json = json.loads(match)
                backup_details = parsed_json['msg']
                datetime_str = datetime.now().isoformat()
                if '.' in datetime_str:
                    datetime_str = datetime_str.split('.')[0]
                successful_naive_datetime = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M:%S')
                successful_utc_datetime = source_timezone.localize(successful_naive_datetime)
                successful_localized_datetime = successful_utc_datetime.astimezone(target_timezone)
                successful_readable_datetime = successful_localized_datetime.strftime('%A, %B %d, %Y %I:%M %p')
                successful_devices_info.append({
                    'hostname': backup_details.get('hostname', 'Unknown'),
                    'filename': backup_details.get('filename', 'Unknown'),
                    'datetime': successful_readable_datetime,
                    'filepath': backup_details.get('filepath', 'Unknown'),
                    'backup_status': 'success'
                })

            except json.JSONDecodeError:
                continue


        failed_pattern = re.compile(r'fatal: \[([^]]+)\]: FAILED!')
        failed_devices = failed_pattern.findall(playbook_output)
        logger.debug(f'failed_devices{failed_devices}')

        failed_devices_info = []
        for device_name in failed_devices:
            failed_datetime_str = datetime.now().isoformat()
            logger.debug(failed_datetime_str)
            if '.' in failed_datetime_str:
                failed_datetime_str = failed_datetime_str.split('.')[0]
            failed_naive_datetime = datetime.strptime(failed_datetime_str, '%Y-%m-%dT%H:%M:%S')
            failed_utc_datetime = source_timezone.localize(failed_naive_datetime)
            failed_localized_datetime = failed_utc_datetime.astimezone(target_timezone)
            failed_readable_datetime = failed_localized_datetime.strftime('%A, %B %d, %Y %I:%M %p')
            failed_devices_info.append({
                'hostname': device_name,
                'filename': '',
                'datetime': failed_readable_datetime,
                'filepath': '',
                'backup_status': 'failed'
            })

        successful_response = {
            'devices': successful_devices_info,
        }
        successful_response_output = {
            'devices': successful_devices_info,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode,
        }
        logger.info(f'successful_response {successful_response_output}')

        failed_response = {
            'devices': failed_devices_info,
        }
        failed_response_output = {
            'devices': failed_devices_info,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode,
        }
        logger.info(f'successful_response {failed_response_output}')

        successful_config_files_data = {
            'devices': successful_devices_info,
        }

        failed_config_files_data = {
            'devices': failed_devices_info,
        }

        os.remove(inventory_path)
        # print(response)
        # print(config_files_data)
        
        if successful_pattern:
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
                        SET backup_status = ?,last_backup_time = ?
                        WHERE hostname = ?
                    ''', ('success' , item['datetime'], item['hostname']))
                conn.commit()
                successful_response['update_status'] = 'Backup status updated successfully'
            except sqlite3.Error as e:
                successful_response['update_status'] = f'Error: {str(e)}'
                successful_response['status'] = 'error'
            finally:
                conn.close()
            # response.status_code = 201
            self.sevone_metadata_update(successful_config_files_data)

        if failed_pattern:
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
                        SET backup_status = ?,last_backup_time = ?
                        WHERE hostname = ?
                    ''', ('failed' , item['datetime'], item['hostname']))
                conn.commit()
                failed_response['update_status'] = 'Backup status updated successfully'
            except sqlite3.Error as e:
                failed_response['update_status'] = f'Error: {str(e)}'
                failed_response['status'] = 'error'
            finally:
                conn.close()
            self.sevone_metadata_update(failed_config_files_data)
            # failed_response.status_code = 500
        return jsonify({'successful_output': successful_response, 'failed_output': failed_response })
    
    
    def authenticate(self, ip_address, username, password):
        
        url = "https://" + ip_address + "/api/v3/users/signin"
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
            elif method.upper() == "PATCH":
                response = requests.patch(url, headers=headers, json=payload, verify=verify)
            else:
                logger.error("Unsupported HTTP method.")
                return None
            response.raise_for_status()  # Raises HTTPError for bad responses (4xx and 5xx)
            return response
        except requests.RequestException as e:
            logger.error(f"Error during API call: {e}")
            return None
    
    def sevone_metadata_update(self, updatedevices):
        ip_address = "9.42.110.15:15673"
        username = "admin"
        password = "sdnban@123"
        bearer_token = self.authenticate(ip_address, username, password)
        logger.debug(updatedevices)

        for device in updatedevices["devices"]:
            deviceName = device["hostname"]
            backup_status = device["backup_status"]
            datetime = device["datetime"]
            api_url_1 = "/api/v3/metadata/devices"
            
            payload = {

                "displayName": {
                    "value": deviceName
                }
                }
        
        # Make the API call
            response = self.make_rest_api_call(ip_address, api_url_1, "POST", bearer_token, payload=payload, insecure=True)
        
        
            if response:
                    data = response.json()
                    for item in data["devices"]:
                        deviceId = item["id"]
                        api_url_2 = f"/api/v3/entity/DEVICES/id/{deviceId}/metadata"
                        payload = {
                                    "metadata": [
                                        {
                                        
                                        "attribute":"backup_status",
                                        "namespace": "Config",
                                        "text": {
                                            "values": [
                                            {
                                                "value": backup_status
                                            }
                                            ]
                                        }
                                        },
                                        {
                                        
                                        "attribute":"datetime",
                                        "namespace": "Config",
                                        "text": {
                                            "values": [
                                            {
                                                "value": datetime
                                            }
                                            ]
                                        }
                                        }
                                    ]
                                    }
                        response = self.make_rest_api_call(ip_address, api_url_2, "PATCH", bearer_token, payload=payload, insecure=True)
                        if response.status_code == 200:
                            logger.debug("The backup status update to sevone completed successfully.")
                        else:
                            logger.debug(response.json())
                            logger.debug("The backup status update to sevone failed.")
                

    




class device_groups(Resource):
    def __init__(self, namespace):
        self.namespace = namespace

    def get(self):

        token = self.authenticate(self.namespace.sevonenmsresthost, "admin", "sdnban@123")

        if token:
            deviceGroupDetails = self.get_device_group("9.42.110.15:15673",token)
            if deviceGroupDetails:
                getDevicesBydeviceGroup = self.get_devices("9.42.110.15:15673",token,deviceGroupDetails)
                return getDevicesBydeviceGroup
                
                
        else:
            logger.debug("Failed to get token")

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
        api_url = "/api/v3/metadata/device_groups"
        response = self.make_rest_api_call(ip_address, api_url, "GET", bearer_token, insecure=True)
        
        if response:
            try:
                data = response.json()
                device_groups = data.get("groups", [])
                filtered_groups = {}
                for group in device_groups:
                    children = group.get("children", [])
                    # print(children)
                    for child in children:
                        if "All Device Groups/Manufacturer" in child.get("path", "") and "Cisco" in child.get("name", ""):
                            filtered_groups[child["name"]] = child["id"]
                return filtered_groups
            except json.JSONDecodeError as e:
                logger.error(f"Error decoding JSON response: {e}")
                return None
        else:
            logger.error("Failed to get device group details.")
            return None

    def get_device_metadata(self, ip_address, bearer_token, device_id):
        api_url = f"/api/v3/entity/DEVICES/id/{device_id}/metadata"
        response = self.make_rest_api_call(ip_address, api_url, "GET", bearer_token, insecure=True)
        
        if response:
            try:
                metadata = response.json()
                return {
                    'username': self.get_attribute_value(metadata, 'username'),
                    'password': self.get_attribute_value(metadata, 'password'),
                    'location': self.get_attribute_value(metadata, 'location'),
                    'device_type': self.get_attribute_value(metadata, 'devicetype')
                }
            except json.JSONDecodeError as e:
                logger.error(f"Error decoding JSON response: {e}")
                return None
        else:
            logger.error(f"Failed to get metadata for device ID {device_id}.")
            return None

    def get_attribute_value(self, metadata, attribute_name):
        attribute = metadata['attributevaluemap'].get(f"Config.{attribute_name}")
        if attribute and 'values' in attribute and len(attribute['values']) > 0:
            return attribute['values'][0]['value']
        return None

    def get_devices(self, ip_address, bearer_token, deviceGroupDetails):
        api_url = "/api/v3/metadata/devices"
        
        # Extract only the IDs from the deviceGroupDetails dictionary
        device_group_ids = list(deviceGroupDetails.values())
        
        # Create the payload
        payload = {
            "deviceGroupIds": device_group_ids
        }
        
        # Make the API call
        response = self.make_rest_api_call(ip_address, api_url, "POST", bearer_token, payload=payload, insecure=True)
        
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
                    metadata = self.get_device_metadata(ip_address, bearer_token, device_id)
                    
                    # Find the device group ID associated with this device
                    for group_name, group_id in deviceGroupDetails.items():
                        if group_id in device_group_ids:
                            device_info = {
                                #'device_id': device_id,
                                'hostname': device_name,
                                'ip_address': device_ip,
                                'device_group': group_name,
                                #'device_group_id': group_id
                            }
                            if metadata:
                                device_info.update(metadata)
                            processed_devices.append(device_info)
                            break
                
                return processed_devices
            except json.JSONDecodeError as e:
                logger.error(f"Error decoding JSON response: {e}")
                return None
        else:
            logger.error("Failed to get devices.")
            return None

    def authenticate(self, ip_address, username, password):
        url = "https://" + ip_address + "/api/v3/users/signin"
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

class update_device_group(Resource):

    def __init__(self, namespace):
        self.namespace = namespace

    def get(self):

        url_get_from_sevone = "http://9.46.112.167:5000/device_groups"
        url_get_from_db = "http://9.46.112.167:5000/inventory_data"
        url_post = "http://9.46.112.167:5000/inventory_data"

        device_list_db = []
        device_to_be_added_db = []

        try:
            # Get devices from SevOne
            response_get_from_sevone = requests.get(url_get_from_sevone)
            logger.debug(response_get_from_sevone.json())

            # Get devices from the database
            response_get_from_db = requests.get(url_get_from_db)
            for device2 in response_get_from_db.json():
                device_list_db.append(device2["hostname"])

            logger.debug(device_list_db)

            # Prepare a list of devices to be added
            for device1 in response_get_from_sevone.json():
                logger.debug(device1)
                if device1["hostname"] not in device_list_db:
                    device_to_be_added_db.append(device1)
                else:
                    logger.debug(f"Device {device1['hostname']} is already onboarded")

            # Send a single POST request with the list of devices to be added
            if device_to_be_added_db:
                response_post = requests.post(url_post, json=device_to_be_added_db)
                logger.debug(response_post.json())
                return "Devices added successfully"
            else:
                logger.debug("No new devices to be added.")
                return "No new devices to be added."


            # Use the response from the GET request as the body for the POST request
            

        except requests.exceptions.RequestException as e:
            logger.debug("Error: %s", e)
            return f"Error {e}"
        
class schedule_backup(Resource):

    def get(self):

        devices_filter = request.args.get('devices')

        try:
            conn = sqlite3.connect('/app/db/config.db')
            cursor = conn.cursor()

            if devices_filter:
                devices_filter_list = devices_filter.split(',')
                query = 'SELECT * FROM schedules WHERE '
                query_conditions = []
                query_params = []

                for device in devices_filter_list:
                    query_conditions.append('devices LIKE ?')
                    query_params.append(f'%{device}%')

                query += ' OR '.join(query_conditions)

                cursor.execute(query, query_params)
            else:
                cursor.execute('SELECT * FROM schedules')

            schedules = cursor.fetchall()

        except sqlite3.Error as e:
            logger.error(f"Database error: {e}")
            return jsonify({"error": "Database error occurred"}), 500

        finally:
            if conn:
                conn.close()

        # Convert to a list of dictionaries
        schedule_list = []
        for schedule in schedules:
            schedule_dict = {
                "id": schedule[0],
                "schedule": schedule[1],
                "customDate": schedule[2] if schedule[2] is not None else "null",
                "devices": schedule[3].split(',') if schedule[3] else [],
                "dayOfWeek": schedule[4] if schedule[4] is not None else "null",
                "hour": schedule[5] if schedule[5] is not None else "null",
                "minute": schedule[6] if schedule[6] is not None else "null",
                "day": schedule[7] if schedule[7] is not None else "null",
                "next_run_time": schedule[8] if schedule[8] is not None else "null"
            }
            schedule_list.append(schedule_dict)

        return jsonify({"schedules": schedule_list})

    def post(self):
        data = request.json
        schedule = data.get('schedule', 'null')
        custom_date = data.get('customDate', 'null')
        devices = data.get('devices', 'null')
        day_of_week = data.get('dayOfWeek', 'null')
        hour = data.get('hour', 'null')
        minute = data.get('minute', 'null')
        day = data.get('day', 'null')

        logger.debug(data)
        try:
            conn = sqlite3.connect('/app/db/config.db')
            cursor = conn.cursor()
            cursor.execute('''SELECT COUNT(*) FROM schedules WHERE
                            schedule = ? AND
                            (custom_date = ? OR custom_date IS NULL AND ? IS NULL) AND
                            devices = ? AND
                            day_of_week = ? AND
                            hour = ? AND
                            minute = ? AND
                            day = ?''',
                        (schedule, custom_date, custom_date, ','.join(devices), day_of_week, hour, minute, day))
            count = cursor.fetchone()[0]
            
            if count > 0:
                conn.close()
                return jsonify({"message": "Duplicate schedule detected"})
            cursor.execute('''INSERT INTO schedules (schedule, custom_date, devices, day_of_week, hour, minute, day)
                            VALUES (?, ?, ?, ?, ?, ?, ?)''',
                        (schedule, custom_date, ','.join(devices), day_of_week, hour, minute, day))
            conn.commit()

            return jsonify({"message": "Schedule request stored successfully"})
        
        except sqlite3.IntegrityError as e:
            response = jsonify({'error': str(e)})
            response.status_code = 400
            logger.debug(response)
            return response
        finally:
            conn.close()



class delete_schedule_backup(Resource):
    
    def delete(self):
        data = request.json
        schedule = data.get('schedule')
        custom_date = data.get('customDate')
        devices = data.get('devices')
        day_of_week = data.get('dayOfWeek')
        hour = data.get('hour')
        minute = data.get('minute')
        day = data.get('day')

        logger.debug(data)
        try:
            conn = sqlite3.connect('/app/db/config.db')
            cursor = conn.cursor()

            query = '''DELETE FROM schedules WHERE
                schedule = ? AND
                (custom_date IS ? OR custom_date IS NULL) AND
                devices = ? AND
                day_of_week IS ? AND
                hour IS ? AND
                minute IS ? AND
                day IS ?'''

                    # Execute the query
            cursor.execute(query, (
                schedule,
                custom_date,
                ','.join(devices),
                day_of_week,
                hour,
                minute,
                day
            ))

            # Check if any row was affected
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({"message": "Schedule not found"})

            conn.commit()

        except sqlite3.IntegrityError as e:
            response = jsonify({'error': str(e)})
            response.status_code = 400
        finally:
            conn.close()

        return jsonify({"message": "Schedule deleted successfully"})

