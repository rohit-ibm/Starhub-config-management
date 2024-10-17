# Use the official Python image from the Docker Hub
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy the rest of the application code into the container
COPY . .

# Expose port 8001 for the application
EXPOSE 8001

# CMD to run the app and initialize the database
CMD ["gunicorn", "--timeout", "120", "-w", "3", "-b", "0.0.0.0:8001", "src.run:app"]

