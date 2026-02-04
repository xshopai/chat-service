#!/bin/bash

# Chat Service - Run with Dapr

echo "Starting Chat Service with Dapr..."
echo "Service will be available at: http://localhost:8013"
echo "Dapr HTTP endpoint: http://localhost:3513"
echo "Dapr gRPC endpoint: localhost:50013"
echo ""

dapr run \
  --app-id chat-service \
  --app-port 8013 \
  --dapr-http-port 3513 \
  --dapr-grpc-port 50013 \
  --log-level info \
  --config ./.dapr/config.yaml \
  --resources-path ./.dapr/components \
  -- npx tsx watch src/server.ts

