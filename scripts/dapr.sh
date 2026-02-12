#!/bin/bash

# Chat Service - Run with Dapr Pub/Sub

echo "Starting Chat Service (Dapr Pub/Sub)..."
echo "Service will be available at: http://localhost:8013"
echo "Dapr HTTP endpoint: http://localhost:3513"
echo "Dapr gRPC endpoint: localhost:50013"
echo ""

# Kill any processes using required ports (prevents "address already in use" errors)
for PORT in 8013 3513 50013; do
    for pid in $(netstat -ano 2>/dev/null | grep ":$PORT" | grep LISTENING | awk '{print $5}' | sort -u); do
        echo "Killing process $pid on port $PORT..."
        taskkill //F //PID $pid 2>/dev/null
    done
done

dapr run \
  --app-id chat-service \
  --app-port 8013 \
  --dapr-http-port 3513 \
  --dapr-grpc-port 50013 \
  --log-level info \
  --config ./.dapr/config.yaml \
  --resources-path ./.dapr/components \
  -- npx tsx watch src/server.ts

