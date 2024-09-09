from backend import create_app , schedule_backup
import argparse
import sqlite3
import os
import threading

## Database creation

conn = sqlite3.connect('/app/db/config.db')

        # Enable foreign key support
conn.execute("PRAGMA foreign_keys = 1")

# Create a cursor object
cur = conn.cursor()

    # Create a table
cur.execute('''
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostname TEXT NOT NULL UNIQUE,
        ip_address TEXT NOT NULL,
        device_group TEXT NOT NULL,
        device_type TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        location TEXT NOT NULL,
        backup_status TEXT DEFAULT 'NOT TRIGGERED',
        last_backup_time TEXT DEFAULT 'NOT STARTED',
        next_backup_time TEXT DEFAULT 'NOT CONFIGURED',
        UNIQUE(hostname, ip_address) -- Ensures uniqueness       
    )
''')

cur.execute('''
            CREATE TABLE IF NOT EXISTS configfiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hostname TEXT NOT NULL,
                filename TEXT NOT NULL,
                datetime TEXT NOT NULL,
                backup_status TEXT NOT NULL,
                filepath TEXT NOT NULL,
                FOREIGN KEY (hostname) REFERENCES inventory (hostname)
            )
        ''')

cur.execute('''
            CREATE TABLE IF NOT EXISTS schedules (
                id TEXT DEFAULT 'NOT CONFIGURED',
                schedule TEXT CHECK(schedule IN ('daily', 'weekly', 'monthly', 'custom')) DEFAULT 'NOT CONFIGURED',
                custom_date TEXT DEFAULT 'NOT CONFIGURED',
                devices TEXT DEFAULT 'NOT CONFIGURED',
                day_of_week TEXT CHECK(day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'null')) DEFAULT 'NOT CONFIGURED',
                hour TEXT DEFAULT 'null',
                minute TEXT  DEFAULT 'null',
                day TEXT  DEFAULT 'null',
                next_backup_time TEXT DEFAULT 'NOT CONFIGURED',
                UNIQUE(schedule, custom_date, devices, day_of_week, hour, minute, day)
            )
        ''')


conn.commit()


parser = argparse.ArgumentParser()

parser.add_argument("-sevonenmsresthost", default=os.getenv("SEVONE_NMS_REST_HOST",'9.42.110.15:15673'),
                            help="Log file location. Default: 'localhost'")
namespace, otherArgs = parser.parse_known_args()

app = create_app(namespace)

if __name__ == '__main__':

    app.run(debug=True, port=5000)
    