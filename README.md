# The config management App

This repository contains the config management application that you can run using Docker and docker-compose.

## Prerequisites

- Docker

## Getting Started

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/your-username/my-react-app.git
   cd my-react-app

2. Build the Docker image:

   docker build -t my-react-app .


3. Run the container:

   docker-compose up


4. Open your web browser and navigate to http://localhost:3000 to see your React app.

   Customization
        Adjust the Dockerfile and docker-compose.yml as needed for your specific project requirements.
        Add your React code to the src folder.

5. Cleanup
To stop the container and remove unused images:

   docker-compose down
   docker image prune --all --force


