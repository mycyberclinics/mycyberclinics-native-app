# Use a Node image
FROM node:22-bullseye

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies (including Expo CLI)
RUN npm install -g expo-cli
RUN npm install

# Copy the rest of your project
COPY . .

# Expose Expo’s default ports
EXPOSE 8081 19000 19001 19002

# Start the app
CMD ["npx", "expo", "start"]
