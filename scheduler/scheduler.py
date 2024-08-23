import requests
import sqlite3
import time
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from datetime import datetime , timedelta
import atexit
from logger_config import logger
import pytz

local_timezone = pytz.timezone('Asia/Kolkata')
class BackupScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone = local_timezone)
        self.scheduler.start()
        atexit.register(lambda: self.scheduler.shutdown(wait=False))
        self.scheduler.add_listener(self.job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
        timezone = local_timezone
    
    def job_listener(self, event):
        if event.exception:
            logger.error(f"Job {event.job_id} failed.")
        else:
            logger.info(f"Job {event.job_id} completed successfully.")
            job = self.scheduler.get_job(event.job_id)
            trigger = job.trigger

            if job:
                trigger = job.trigger
            # Determine the schedule type based on the trigger type
            if isinstance(trigger, DateTrigger):
                schedule_type = 'custom'
            elif isinstance(trigger, CronTrigger):
                if trigger.fields[4].name == 'day_of_week':
                    schedule_type = 'weekly'
                elif trigger.fields[4].name == 'day':
                    schedule_type = 'monthly'
                else:
                    schedule_type = 'unknown'
            elif isinstance(trigger, IntervalTrigger):
                schedule_type = 'daily'
            else:
                schedule_type = 'unknown'

            # Perform action based on the schedule type
            if schedule_type == 'custom':
                self.delete_schedule_from_db(event.job_id)
            elif schedule_type in ['weekly', 'monthly']:
                self.update_next_run_time(event.job_id)

    def delete_schedule_from_db(self, job_id):
        conn = sqlite3.connect('/scheduler/db/config.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM schedules WHERE id = ?', (job_id,))
        conn.commit()
        conn.close()
        logger.debug(f"Schedule with ID {job_id} deleted from database.")

    def update_next_run_time(self, job_id):
        job = self.scheduler.get_job(job_id)
        if job:
            next_run_time = job.next_run_time.strftime('%Y-%m-%d %H:%M:%S')
            
            conn = sqlite3.connect('/scheduler/db/config.db')
            cursor = conn.cursor()
            cursor.execute('UPDATE schedules SET next_run_time = ? WHERE id = ?', (next_run_time, job_id))
            conn.commit()
            conn.close()
            
            logger.debug(f"Next run time updated for job ID {job_id} in the database.")

    def set_schedule(self, schedule, custom_date, devices, day_of_week, hour, minute, day):
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
        try:
                job = None

                # Add job to scheduler based on schedule type
                if schedule == 'daily':
                    job = self.scheduler.add_job(self.backup_job, 'interval', days=1, id=job_id, args=[devices] )
                elif schedule == 'weekly':
                    trigger = CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute, timezone=local_timezone)
                    job = self.scheduler.add_job(self.backup_job, trigger, id=job_id, args=[devices])
                elif schedule == 'monthly':
                    trigger = CronTrigger(day=day, hour=hour, minute=minute, timezone=local_timezone)
                    job = self.scheduler.add_job(self.backup_job, trigger, id=job_id, args=[devices])
                elif schedule == 'custom' and custom_date:
                    naive_run_date = datetime.strptime(custom_date, '%Y-%m-%d %H:%M:%S')
                    run_date = local_timezone.localize(naive_run_date)
                    job = self.scheduler.add_job(self.backup_job, 'date', run_date=run_date, id=job_id, args=[devices])

                # If job is successfully added, get the next run time and update DB
                if job:
                    next_run_time = job.next_run_time
                    self.update_or_insert_schedule_in_db(job_id, schedule, custom_date, devices, day_of_week, hour, minute, day, next_run_time)

        # Start scheduler if not already running
                if not self.scheduler.running:
                    self.scheduler.start()

        except Exception as e:
            logger.error(f"Failed to schedule job: {e}")
            return "Failed to schedule job due to an error."

    def update_or_insert_schedule_in_db(self, job_id, schedule, custom_date, devices, day_of_week, hour, minute, day, next_run_time):

        try:
            conn = sqlite3.connect('/scheduler/db/config.db')
            cursor = conn.cursor()

            cursor.execute('''SELECT rowid FROM schedules WHERE schedule = ? AND custom_date = ? AND devices = ? AND 
                                day_of_week = ? AND hour = ? AND minute = ? AND day = ?''',
                            (schedule, custom_date, ','.join(devices), day_of_week, hour, minute, day))
            existing_row = cursor.fetchone()

            if existing_row:
                cursor.execute('UPDATE schedules SET id = ?, next_run_time = ? WHERE rowid = ?', 
                            (job_id, next_run_time.strftime('%Y-%m-%d %H:%M:%S'), existing_row[0]))
            else:
                cursor.execute('''INSERT INTO schedules (id, schedule, custom_date, devices, day_of_week, hour, minute, day, next_run_time)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                                (job_id, schedule, custom_date, ','.join(devices), day_of_week, hour, minute, day, next_run_time.strftime('%Y-%m-%d %H:%M:%S')))
            conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Database error: {e}")
        finally:
            conn.close() 
    
    
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
            conn.commit()
            conn.close()
            for row in rows:
                if len(row) == 9:  # Adjust the number based on your table schema
                    id, schedule, custom_date, devices, day_of_week, hour, minute, day, next_run_time = row
                    devices = devices.split(',')
                    self.set_schedule(schedule, custom_date, devices, day_of_week, hour, minute, day)
                # cursor.execute('DELETE FROM schedules WHERE id = ?', (row[0],))
            time.sleep(300)


def main():
    scheduler = BackupScheduler()
    scheduler.poll_database()

if __name__ == '__main__':
    main()