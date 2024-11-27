FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy the rest of the application code
COPY . .

# Ensure Python can locate the src module
ENV PYTHONPATH=/app

# Expose the port used by Gunicorn
EXPOSE 8001

# Command to start the app
CMD ["gunicorn", "--timeout", "120", "-w", "3", "-b", "0.0.0.0:8001", "src.run:app"]

