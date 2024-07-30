# Use an official Node runtime as a parent image
FROM node:latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to work directory
COPY package*.json ./

# Install any dependencies
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable (optional)
ENV NODE_ENV=production

# Run the app when the container launches
CMD ["npm", "start"]

