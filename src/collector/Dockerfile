# Use the official Python image from the Docker Hub
FROM python:3.11-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV ANSIBLE_HOST_KEY_CHECKING=False
# Set the working directory
WORKDIR /ciscocollector

# Copy the rest of the application code to the working directory
COPY . /ciscocollector/

RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 9000

# Command to run the application using Gunicorn
CMD ["gunicorn","--timeout", "120", "-w", "3", "-b", "0.0.0.0:9000", "cisco_collector:app"]

