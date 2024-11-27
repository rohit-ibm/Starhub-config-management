#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Stopping and removing all Docker Compose services..."

# Define the paths to docker-compose.yaml files
declare -A COMPOSE_FILES=(
  ["Root Directory"]="./docker-compose.yaml"
  ["RBAC Directory"]="./rbac/docker-compose.yaml"
  ["WEB Directory"]="./web/docker-compose.yaml"
)

# Iterate over each location and stop services
for LOCATION_NAME in "${!COMPOSE_FILES[@]}"; do
  COMPOSE_FILE="${COMPOSE_FILES[$LOCATION_NAME]}"
  if [[ -f "$COMPOSE_FILE" ]]; then
    echo "Stopping services in $LOCATION_NAME using $COMPOSE_FILE..."
    docker-compose -f "$COMPOSE_FILE" down
  else
    echo "No docker-compose.yaml found in $LOCATION_NAME. Skipping."
  fi
done

echo "All services have been stopped and removed successfully."

