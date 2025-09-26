#!/bin/bash
set -e

# Start the NestJS application
node dist/main.js &
APP_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Shutting down..."
    kill $APP_PID 2>/dev/null || true
    if [ -f /app/data/dnsmasq.pid ]; then
        DNSMASQ_PID=$(cat /app/data/dnsmasq.pid)
        kill $DNSMASQ_PID 2>/dev/null || true
        rm -f /app/data/dnsmasq.pid
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Wait for the application to start
sleep 5

# Keep the container running
wait $APP_PID