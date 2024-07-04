from backend import create_app
import argparse
import sqlite3
import os


## Database creation

conn = sqlite3.connect('config.db')

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
        backup_status TEXT DEFAULT 'NA',
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


conn.commit()


parser = argparse.ArgumentParser()

parser.add_argument("-sevonenmsresthost", default=os.getenv("SEVONE_NMS_REST_HOST",'9.42.110.15:15673'),
                            help="Log file location. Default: 'localhost'")
namespace, otherArgs = parser.parse_known_args()
app = create_app(namespace)

if __name__ == '__main__':

    app.run(debug=True, port=5000)