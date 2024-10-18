import logging
import os
import os.path
# Create a logger
logger = logging.getLogger("my_logger")
#logging.debug('--------------------------------------------------------------------------');

# Set the log level (you can adjust this to your needs)
logger.setLevel(logging.DEBUG)

dPath = os.getcwd()
print(dPath)

# Create a file handler
file_handler = logging.FileHandler("/app/backend.log")

# Create a formatter with your desired log format
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

# Add the file handler to the log
logger.addHandler(file_handler)
