# Build stage
FROM node:22.14-alpine3.21 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci


# Copy source code
COPY . .
# Copy static resources to dist for production
RUN mkdir -p dist/public && cp -r src/public/* dist/public/

# Build the application
RUN npm run build

# Production stage
FROM node:22.14-alpine3.21

# Install dnsmasq and other required packages
RUN apk add --no-cache dnsmasq curl bash

# Create app directory and non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/data /app/logs && \
    chown -R appuser:appgroup /app

# Set working directory
WORKDIR /app

# Copy built application
# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
# Copy the minimal example extra_hosts.conf to /app/data
COPY extra_hosts.conf /app/data/extra_hosts.conf

# Create necessary files with correct permissions
RUN touch /app/data/dnsmasq.pid /app/logs/dnsmasq.log /app/data/urls.json && \
    chown -R appuser:appgroup /app/data /app/logs

# Add metadata labels
LABEL maintainer="libzonda" \
      version="1.0" \
      description="DNSMasq Manager - A NestJS-based web application for managing DNSMasq service and hosts"

# Set environment variables
ENV DNSMASQ_HOSTS=/app/data/extra_hosts.conf \
    NODE_ENV=production

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 3000 53/tcp 53/udp

# Create startup script
COPY --chown=appuser:appgroup docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/dnsmasq/status || exit 1

# Start the application
CMD ["/app/docker-entrypoint.sh"]
