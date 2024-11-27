
#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define paths for Python scripts
RBAC_DIR="./rbac"
WEB_DIR="./web"
SCRIPT1="$RBAC_DIR/create_sevone_roles.py"
SCRIPT2="$RBAC_DIR/sync_sevone_users.py"

# Function to set up a cron job for running script2 (sync_sevone_users.py)
setup_cronjob() {
  local CRON_INTERVAL="*/15 * * * *"  # Default interval: every 15 minutes
  local CRON_COMMAND="python3 $(realpath $SCRIPT2) > /dev/null 2>&1"
  local CRON_JOB="$CRON_INTERVAL $CRON_COMMAND"

  echo "Setting up cron job for sync_sevone_users.py..."

  # Check if the cron job already exists
  if crontab -l 2>/dev/null | grep -F "$CRON_COMMAND" > /dev/null; then
    echo "Cron job for sync_sevone_users.py is already configured."
  else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "Cron job for sync_sevone_users.py has been set up."
  fi
}

# Run script1 (create_sevone_roles.py)
if [[ -f "$SCRIPT1" ]]; then
  echo "Running create_sevone_roles.py..."
  python3 "$SCRIPT1"
else
  echo "Error: create_sevone_roles.py not found."
  exit 1
fi

# Set up the cron job for script2
setup_cronjob

# Start services with docker-compose from root, rbac, and web directories
declare -A COMPOSE_FILES=(
  ["Root Directory"]="./docker-compose.yaml"
  ["RBAC Directory"]="$RBAC_DIR/docker-compose.yaml"
  ["Web Directory"]="$WEB_DIR/docker-compose.yaml"
)

for LOCATION_NAME in "${!COMPOSE_FILES[@]}"; do
  COMPOSE_FILE="${COMPOSE_FILES[$LOCATION_NAME]}"
  if [[ -f "$COMPOSE_FILE" ]]; then
    echo "Starting application in $LOCATION_NAME using $COMPOSE_FILE..."
    docker-compose -f "$COMPOSE_FILE" up -d
  else
    echo "No docker-compose.yaml found in $LOCATION_NAME. Skipping."
  fi
done

echo "All applications have been started successfully."

