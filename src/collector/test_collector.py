# api/router.py
from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

# Function to determine which collector to send the request to
def determine_collector(parameters):
    # Example logic for determining the collector based on parameters
    # Modify this logic based on your specific requirements
    if 'hostname' in parameters and parameters['hostname'].startswith('server1'):
        return 'http://collector1:5000/backup'  # Collector 1 (port 5000)
    else:
        return 'http://collector2:5002/backup'  # Collector 2 (port 5002)

# API route to accept backup request
@app.route('/backup', methods=['POST'])
def backup_request():
    try:
        # Get the parameters from the request body (JSON)
        parameters = request.json

        # Determine the collector to send the request to
        collector_url = determine_collector(parameters)

        # Forward the request to the selected collector
        response = requests.post(collector_url, json=parameters)

        # Return the collector's response to the client
        if response.status_code == 200:
            return jsonify({"status": "success", "message": response.json()}), 200
        else:
            return jsonify({"status": "error", "message": response.text}), response.status_code

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)  # This API runs on port 8000
