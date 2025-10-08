# Use node 22-alpine for a small image
FROM node:22.20-alpine

# Set app directory
WORKDIR /app

# Install dependencies first (for cache)
COPY package.json package-lock.json* ./
RUN npm install

# Copy all files (for dev, will be overwritten by volume)
COPY . .

# Expose the port
EXPOSE 4000

# Start with ts-node-dev for hot reload in dev
CMD ["npm", "run", "dev"]