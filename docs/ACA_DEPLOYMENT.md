# Chat Service - Azure Container Apps Deployment

## Overview

This guide covers deploying the Chat Service to Azure Container Apps (ACA) with Azure OpenAI integration.

## Prerequisites

- Azure CLI installed and authenticated
- Docker installed
- Azure subscription with appropriate permissions
- Azure Container Registry (ACR) created
- Azure OpenAI resource with deployment

## Quick Deployment

### Using the Deployment Script

**PowerShell (Windows):**

```powershell
cd scripts
.\aca.ps1
```

**Bash (macOS/Linux):**

```bash
cd scripts
./aca.sh
```

## Manual Deployment

### 1. Set Variables

```bash
RESOURCE_GROUP="rg-xshopai-aca"
LOCATION="swedencentral"
ACR_NAME="acrxshopaiaca"
ENVIRONMENT_NAME="cae-xshopai-aca"
APP_NAME="chat-service"
APP_PORT=1010
OPENAI_ENDPOINT="https://<your-openai>.openai.azure.com"
OPENAI_DEPLOYMENT="gpt-4"
```

### 2. Build and Push Image

```bash
az acr login --name $ACR_NAME
docker build -t $ACR_NAME.azurecr.io/$APP_NAME:latest .
docker push $ACR_NAME.azurecr.io/$APP_NAME:latest
```

### 3. Deploy Container App

```bash
az containerapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_NAME.azurecr.io/$APP_NAME:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --target-port $APP_PORT \
  --ingress internal \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 0.5 \
  --memory 1Gi \
  --enable-dapr \
  --dapr-app-id $APP_NAME \
  --dapr-app-port $APP_PORT \
  --secrets "openai-key=<your-api-key>" \
  --env-vars \
    "PORT=$APP_PORT" \
    "NODE_ENV=production" \
    "AZURE_OPENAI_ENDPOINT=$OPENAI_ENDPOINT" \
    "AZURE_OPENAI_API_KEY=secretref:openai-key" \
    "AZURE_OPENAI_DEPLOYMENT_NAME=$OPENAI_DEPLOYMENT" \
    "LOG_LEVEL=info"
```

## Configuration

### Environment Variables

| Variable                       | Description                |
| ------------------------------ | -------------------------- |
| `AZURE_OPENAI_ENDPOINT`        | Azure OpenAI endpoint URL  |
| `AZURE_OPENAI_API_KEY`         | API key (stored as secret) |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Model deployment name      |

## Monitoring

```bash
az containerapp logs show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --follow
```

## Troubleshooting

### OpenAI Connection Issues

1. Verify endpoint URL is correct
2. Check API key is valid
3. Ensure deployment name matches
4. Review OpenAI resource quotas
