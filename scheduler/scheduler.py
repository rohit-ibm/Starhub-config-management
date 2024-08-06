import requests
import sqlite3
import time
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from datetime import datetime
import atexit
from logger_config import logger

class BackupScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        atexit.register(lambda: self.scheduler.shutdown(wait=False))
        self.scheduler.add_listener(self.job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    
    def job_listener(self, event):
        if event.exception:
            logger.error(f"Job {event.job_id} failed.")
        else:
            logger.info(f"Job {event.job_id} completed successfully.")
            self.delete_schedule_from_db(event.job_id)

    def delete_schedule_from_db(self, job_id):
        conn = sqlite3.connect('/scheduler/db/config.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM schedules WHERE id = ?', (job_id,))
        conn.commit()
        conn.close()
        logger.debug(f"Schedule with ID {job_id} deleted from database.")

    def set_schedule(self, schedule, custom_date, devices, day_of_week='mon', hour=15, minute=0, day=1):
        # Remove old jobs with the same parameters
        # logger.debug("Initial Jobs in Scheduler:")
        # jobs = self.scheduler.get_jobs()
        # # logger.debug(jobs)
        # for job in jobs:
        #     logger.debug(f"Job ID: {job.id}, Args: {job.args}, Trigger: {job.trigger}")
        
        if self.is_duplicate_job(schedule, custom_date, devices, day_of_week, hour, minute, day):
                # logger.debug("Duplicate job detected. Skipping scheduling.")
                return f"This is Duplicate scheduling."
        
        job_id = f'backup_job_{datetime.now().timestamp()}'

        # print(f"Adding new job with ID: {job_id}")
        if schedule == 'daily':
            self.scheduler.add_job(self.backup_job, 'interval', days=1, id=job_id, args=[devices])
        elif schedule == 'weekly':
            self.scheduler.add_job(self.backup_job, 'cron', day_of_week=day_of_week, hour=hour, minute=minute, id=job_id, args=[devices])
            print(self.scheduler.get_jobs())
        elif schedule == 'monthly':
            self.scheduler.add_job(self.backup_job, 'cron', day=day, hour=hour, minute=minute, id=job_id, args=[devices])
        elif schedule == 'custom' and custom_date:
            run_date = datetime.strptime(custom_date, '%Y-%m-%d %H:%M:%S')
            self.scheduler.add_job(self.backup_job, 'date', run_date=run_date, id=job_id, args=[devices])

        conn = sqlite3.connect('/scheduler/db/config.db')
        cursor = conn.cursor()
        cursor.execute('''SELECT rowid FROM schedules WHERE schedule = ? AND custom_date = ? AND devices = ? AND 
                            day_of_week = ? AND hour = ? AND minute = ? AND day = ?''',
                        (schedule, custom_date, ','.join(devices), day_of_week, hour, minute, day))
        existing_row = cursor.fetchone()

        if existing_row:
            # If the schedule exists, update the job_id
            cursor.execute('UPDATE schedules SET id = ? WHERE rowid = ?', (job_id, existing_row[0]))
        else:
            # If the schedule doesn't exist, insert a new row
            cursor.execute('''INSERT INTO schedules (id, schedule, custom_date, devices, day_of_week, hour, minute, day)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                            (job_id, schedule, custom_date, ','.join(devices), day_of_week, hour, minute, day))
        conn.commit()
        conn.close()

        if not self.scheduler.running:
            self.scheduler.start()
         
    
    def is_duplicate_job(self, schedule, custom_date, devices, day_of_week, hour, minute, day):

        # logger.debug(f'This are the values: schedule: {schedule}, custom_date: {custom_date}, devices: {devices}, day_of_week: {day_of_week}, hour: {hour}, minute: {minute}, day: {day}')
        # logger.debug("Current jobs in scheduler:")
        # jobs = self.scheduler.get_jobs()
        # if not jobs:
        #     logger.debug("No jobs found in the scheduler.")
        # for job in jobs:
        #         logger.debug(f"Job ID: {job.id}, Next Run Time: {job.next_run_time}, Args: {job.args}")
        
        new_devices_set = set(devices)
        for job in self.scheduler.get_jobs():
            job_args = set(job.args[0])
            job_trigger = job.trigger

            # logger.debug(f"Checking job {job.id} with args {job.args} and trigger {job.trigger}")

            if job_args == new_devices_set:
                if schedule == 'daily' and isinstance(job_trigger, IntervalTrigger):
                    return True
                elif schedule == 'weekly' and isinstance(job_trigger, CronTrigger):
                    
                    if (str(job_trigger.fields[4].expressions[0]) == str(day_of_week) and
                        str(job_trigger.fields[5].expressions[0]) == str(hour) and
                        str(job_trigger.fields[6].expressions[0]) == str(minute)):
                        return True
                elif schedule == 'monthly' and isinstance(job_trigger, CronTrigger):

                    # logger.debug(f"Monthly job trigger details: day={job_trigger.fields[2].expressions[0]}, "
                    #      f"hour={job_trigger.fields[5].expressions[0]}, minute={job_trigger.fields[6].expressions[0]}")

                    if (str(job_trigger.fields[2].expressions[0]) == str(day) and
                        str(job_trigger.fields[5].expressions[0]) == str(hour) and
                        str(job_trigger.fields[6].expressions[0]) == str(minute)):
                        return True
                elif schedule == 'custom' and isinstance(job_trigger, DateTrigger):
                    dt_with_timezone = datetime.fromisoformat(str(job_trigger.run_date))
                    naive_datetime = dt_with_timezone.replace(tzinfo=None)
                    naive_datetime_str = naive_datetime.strftime("%Y-%m-%d %H:%M:%S")
                    # logger.debug(naive_datetime_str)
                    custom_date_check = datetime.strptime(custom_date, '%Y-%m-%d %H:%M:%S')
                    if str(naive_datetime_str) == str(custom_date_check):
                        return True
        return False
    
    def backup_job(self, devices):
        url_post = "http://9.46.112.167:5000/post_backup"
        for device in devices:
            logger.debug(device)
            response_get = requests.get(f'http://9.46.112.167:5000/inventory_data/devices?devices={device}')
            logger.debug(f"response {response_get.json()}")

            response_post = requests.post(url_post, json=response_get.json())
            logger.debug(response_post.json())
                


    def poll_database(self):
        while True:
            logger.debug("Current jobs in scheduler:")
            jobs = self.scheduler.get_jobs()
            if not jobs:
                logger.debug("No jobs found in the scheduler.")
            for job in jobs:
                    logger.debug(f"Job ID: {job.id}, Next Run Time: {job.next_run_time}, Args: {job.args}")
            conn = sqlite3.connect("/scheduler/db/config.db")
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM schedules')
            rows = cursor.fetchall()
            for row in rows:
                schedule, custom_date, devices, day_of_week, hour, minute, day = row[1:]
                devices = devices.split(',')
                self.set_schedule(schedule, custom_date, devices, day_of_week, hour, minute, day)
                # cursor.execute('DELETE FROM schedules WHERE id = ?', (row[0],))
            conn.commit()
            conn.close()
            time.sleep(30)


def main():
    scheduler = BackupScheduler()
    scheduler.poll_database()

if __name__ == '__main__':
    main()