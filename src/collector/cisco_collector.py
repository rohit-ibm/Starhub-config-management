import requests
import yaml
import os
from cisco_collector_logger import logger
from flask import Flask, jsonify, request, current_app as app, send_from_directory, abort, Response, send_file
from flask_restful import Api, Resource
from flask_cors import CORS  # Import the CORS package
from flask_swagger_ui import get_swaggerui_blueprint
import subprocess
import json
import zipfile
import io
import re
from datetime import datetime
import pytz


def create_app():
    app = Flask(__name__)
    # CORS(app) # Enable CORS for the Flask app
    api = Api(app)

    # Load the swagger.yaml file
    with open('/ciscocollector/config/swagger.yaml', 'r') as file:
        swagger_spec = yaml.safe_load(file)

    # Setup the Swagger UI
    SWAGGER_URL = '/api-docs'
    API_URL = '/swagger.yaml'
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={
            'app_name': "SevOne Swaggers for Redirect API"
        }
    )
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    @app.route('/swagger.yaml')
    def swagger_yaml():
        return jsonify(swagger_spec)
    
    api.add_resource(backup_management, '/backup')
    api.add_resource(file_management, '/config_files/list', '/config_files/view', '/config_files/download', '/config_files/downloadall' )


    return app




class backup_management(Resource):

    def post(self):
        playbook_path = "/ciscocollector/config/config-playbook.yaml"
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
        inventory_path = "/ciscocollector/config/inventory.yaml"
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
        devices_info = []

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
                    'backup_status': 'Success'
                })
                devices_info.append({
                    'hostname': backup_details.get('hostname', 'Unknown'),
                    'filename': backup_details.get('filename', 'Unknown'),
                    'datetime': successful_readable_datetime,
                    'filepath': backup_details.get('filepath', 'Unknown'),
                    'backup_status': 'Success'
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
                'backup_status': 'Failed'
            })
            devices_info.append({
                'hostname': device_name,
                'filename': '',
                'datetime': failed_readable_datetime,
                'filepath': '',
                'backup_status': 'Failed'
            })

        response = {
            'devices': devices_info,
        }
        successful_response_output = {
            'devices': successful_devices_info,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode,
        }
        logger.info(f'successful_response {successful_response_output}')

        failed_response_output = {
            'devices': failed_devices_info,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode,
        }
        logger.info(f'failed_response {failed_response_output}')

        os.remove(inventory_path)
        # print(response)
        # print(config_files_data)
        

        try:
            url = "http://9.46.112.167:5000/backup_status"

            response_post = requests.post(url, json=response)
            logger.info(response_post.json())

            return response_post.json()
            
        except requests.RequestException as e:
            logger.error(f"Error during API call: {e}")
            return f"Error during API call: {e}"
        
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
                


app = create_app()


if __name__ == '__main__':
    
    app.run(debug=True, port=9000)