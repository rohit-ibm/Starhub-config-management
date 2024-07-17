import requests
import schedule
import time
import threading
from logger_config import logger
import argparse
import os




def call_run_playbook_api():

    url_get = "http://9.46.116.210:5000/inventory_data/devices"
    url_post = "http://9.46.116.210:5000/post_backup"

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

def schedule_five_minute_job():
    # Schedule the API call to run every 5 minutes
    schedule.every(5).minutes.do(call_run_playbook_api)
    # Schedule the API call to run daily at a specific time, e.g., 2:00 AM
    # schedule.every().day.at("02:00").do(self.call_run_playbook_api)

    while True:
        schedule.run_pending()
        time.sleep(1)

parser = argparse.ArgumentParser()

parser.add_argument("-sevonenmsresthost", default=os.getenv("SEVONE_NMS_REST_HOST",'9.46.116.210:5000'),
                            help="Log file location. Default: 'localhost'")
namespace, otherArgs = parser.parse_known_args()


schedule_five_minute_job()