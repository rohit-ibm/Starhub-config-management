import sqlite3
import requests
import argparse
import yaml
import os
from logger_config import logger
from flask_cors import CORS
from flask import Flask, jsonify, request, Response
from flask_restful import Api, Resource
from flask_swagger_ui import get_swaggerui_blueprint

def create_app(namespace):
    app = Flask(__name__)
    api = Api(app)
    CORS(app)

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
