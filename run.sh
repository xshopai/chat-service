#!/bin/bash

# Run script for chat-service with Dapr sidecar

set -e

SERVICE_NAME="chat-service"
APP_PORT=8013
DAPR_HTTP_PORT=3500
DAPR_GRPC_PORT=50001

echo "Starting $SERVICE_NAME..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Run with Dapr
echo "Starting with Dapr sidecar..."
dapr run \
    --app-id "$SERVICE_NAME" \
    --app-port "$APP_PORT" \
    --dapr-http-port "$DAPR_HTTP_PORT" \
    --dapr-grpc-port "$DAPR_GRPC_PORT" \
    --config ".dapr/config.yaml" \
    --resources-path ".dapr/components" \
    -- node dist/server.js
