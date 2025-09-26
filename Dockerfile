# Use Alpine Linux as base image
FROM alpine:edge

# Install Node.js, npm, and dnsmasq
RUN apk add --no-cache \
    nodejs \
    npm \
    dnsmasq \
    curl \
    bash

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create necessary directories and files
RUN mkdir -p /app/data && \
    touch /app/dnsmasq.pid /app/dnsmasq.log /app/urls.json

# Set environment variables
ENV DNSMASQ_HOSTS=/app/data/extra_hosts.conf
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Start the NestJS application\n\
node dist/main.js &\n\
APP_PID=$!\n\
\n\
# Function to cleanup on exit\n\
cleanup() {\n\
    echo "Shutting down..."\n\
    kill $APP_PID 2>/dev/null || true\n\
    if [ -f /app/dnsmasq.pid ]; then\n\
        DNSMASQ_PID=$(cat /app/dnsmasq.pid)\n\
        kill $DNSMASQ_PID 2>/dev/null || true\n\
        rm -f /app/dnsmasq.pid\n\
    fi\n\
    exit 0\n\
}\n\
\n\
# Set up signal handlers\n\
trap cleanup SIGTERM SIGINT\n\
\n\
# Wait for the application to start\n\
sleep 5\n\
\n\
# Keep the container running\n\
wait $APP_PID\n\
' > /app/start.sh && chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/dnsmasq/status || exit 1

# Start the application
CMD ["/app/start.sh"]
