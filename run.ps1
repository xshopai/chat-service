# Run script for chat-service with Dapr sidecar (PowerShell)

$ErrorActionPreference = "Stop"

$SERVICE_NAME = "chat-service"
$APP_PORT = 1014
$DAPR_HTTP_PORT = 3514
$DAPR_GRPC_PORT = 50014

Write-Host "Starting $SERVICE_NAME..." -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor Yellow
npm run build

# Run with Dapr
Write-Host "Starting with Dapr sidecar..." -ForegroundColor Yellow
dapr run `
    --app-id $SERVICE_NAME `
    --app-port $APP_PORT `
    --dapr-http-port $DAPR_HTTP_PORT `
    --dapr-grpc-port $DAPR_GRPC_PORT `
    --config ".dapr/config.yaml" `
    --resources-path ".dapr/components" `
    -- node dist/server.js
