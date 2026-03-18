# Use Node.js to build the app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the app code
COPY . .

# Build the app for production
RUN npm run build

# Use a simple web server to serve the built files
FROM node:18-alpine AS production
WORKDIR /app

# Install a simple HTTP server
RUN npm install -g serve

# Copy the built files from builder
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 5173

# Start the production server
CMD ["serve", "-s", "dist", "-l", "5173"]
