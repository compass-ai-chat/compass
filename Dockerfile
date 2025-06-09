# Build stage
FROM node:22.11.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the web version with the correct public URL
RUN npm run build:web

# Proxy stage
FROM node:22.11.0-alpine AS proxy

WORKDIR /app

COPY proxy-server.js package*.json ./
RUN npm install express

# Production stage
FROM nginx:alpine

# Copy built static files from builder stage to the compass subdirectory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy proxy server from proxy stage
COPY --from=proxy /app /proxy

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Install Node.js in the final stage
RUN apk add --update nodejs npm

# Expose port 80
EXPOSE 80

# Start both nginx and the proxy server
COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]