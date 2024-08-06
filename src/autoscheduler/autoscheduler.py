import requests
import schedule
import time
import threading
from logger_config import logger
import argparse
import os




def call_run_playbook_api():

    url_get = "http://9.46.112.167:5000/inventory_data/devices"
    url_post = "http://9.46.112.167:5000/post_backup"

    try:
        response_get = requests.get(url_get)
       # response_get.raise_for_status()  # Raise an error for bad status codes
        logger.debug(response_get.json())

        # Use the response from the GET request as the body for the POST request
        response_post = requests.post(url_post, json=response_get.json())
       # response_post.raise_for_status()  # Raise an error for bad status codes
        logger.debug(response_post.json())

    except requests.exceptions.RequestException as e:
        logger.debug("Error: %s", e)

def call_device_group_api():
        
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
        
        except requests.exceptions.RequestException as e:
            logger.debug("Error: %s", e)


def schedule_daily_job():
    # Schedule the API call to run every 5 minutes
    schedule.every(2).minutes.do(call_device_group_api)
    # Schedule the API call to run daily at a specific time, e.g., 2:00 AM
    schedule.every().day.at("02:00").do(call_run_playbook_api)
    # schedule.every().day.at("01:00").do(call_device_group_api)

    while True:
        schedule.run_pending()
        time.sleep(1)

parser = argparse.ArgumentParser()

parser.add_argument("-sevonenmsresthost", default=os.getenv("SEVONE_NMS_REST_HOST",'9.46.116.210:5000'),
                            help="Log file location. Default: 'localhost'")
namespace, otherArgs = parser.parse_known_args()


schedule_daily_job()