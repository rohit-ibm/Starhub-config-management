from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_restx import Api
import logging
from sqlalchemy import inspect, MetaData, Table
from flask_cors import CORS

db = SQLAlchemy()

tables_to_check = ['user', 'group', 'task', 'user_group', 'group_task']  # Ensure table names are lowercase

def create_app():
    app = Flask(__name__)
    #CORS(app)
    CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["Content-Type"])  # Allow CORS for all routes
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rbac.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    api = Api(app, doc='/swagger', title='RBAC API', description='API for Role-Based Access Control')

    # Import and register the routes
    from .routes import register_routes
    register_routes(api)

    with app.app_context():
        inspector = inspect(db.engine)
        existing_tables = set(inspector.get_table_names())

        # Create a MetaData instance without binding it to the engine
        metadata = MetaData()

        for table_name in tables_to_check:
            if table_name not in existing_tables:
                logging.info(f"Table {table_name} does not exist. Creating now.")
                # Use the metadata to create the table if it doesn't exist
                # Assuming you have your table definitions somewhere
                table = Table(table_name, metadata, autoload_with=db.engine)
                table.create(db.engine)
            else:
                logging.info(f"Table {table_name} already exists.")

    return app
