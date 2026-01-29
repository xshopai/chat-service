#!/bin/bash
# Azure Container Apps Deployment Script for Chat Service
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_header() { echo -e "\n${BLUE}============================================================================${NC}\n${BLUE}$1${NC}\n${BLUE}============================================================================${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

prompt_with_default() { local prompt="$1" default="$2" varname="$3"; read -p "$prompt [$default]: " input; eval "$varname=\"${input:-$default}\""; }

# Prerequisites
print_header "Checking Prerequisites"
command -v az &> /dev/null || { echo "Azure CLI not installed"; exit 1; }
command -v docker &> /dev/null || { echo "Docker not installed"; exit 1; }
az account show &> /dev/null || az login
print_success "Prerequisites verified"

# Configuration
print_header "Azure Configuration"
prompt_with_default "Enter Resource Group name" "rg-xshopai-aca" RESOURCE_GROUP
prompt_with_default "Enter Azure Location" "swedencentral" LOCATION
prompt_with_default "Enter Azure Container Registry name" "acrxshopaiaca" ACR_NAME
prompt_with_default "Enter Container Apps Environment name" "cae-xshopai-aca" ENVIRONMENT_NAME
prompt_with_default "Enter Azure OpenAI Endpoint" "" AZURE_OPENAI_ENDPOINT
prompt_with_default "Enter Azure OpenAI API Key" "" AZURE_OPENAI_API_KEY
prompt_with_default "Enter Azure OpenAI Deployment Name" "gpt-4" AZURE_OPENAI_DEPLOYMENT

APP_NAME="chat-service"
APP_PORT=1010

# Container App name follows convention: ca-{service}-{env}-{suffix}
# Note: For simplified deployments without suffix, we default to APP_NAME
CONTAINER_APP_NAME="$APP_NAME"

read -p "Proceed with deployment? (y/N): " CONFIRM
[[ ! "$CONFIRM" =~ ^[Yy]$ ]] && exit 0

# Deploy
print_header "Deploying Chat Service"

az group exists --name "$RESOURCE_GROUP" | grep -q "true" || az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
az acr show --name "$ACR_NAME" &> /dev/null || az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true --output none
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
az acr login --name "$ACR_NAME"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"

IMAGE_TAG="${ACR_LOGIN_SERVER}/${APP_NAME}:latest"
docker build -t "$IMAGE_TAG" .
docker push "$IMAGE_TAG"

az containerapp env show --name "$ENVIRONMENT_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null || \
    az containerapp env create --name "$ENVIRONMENT_NAME" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" --output none

if az containerapp show --name "$CONTAINER_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    az containerapp update --name "$CONTAINER_APP_NAME" --resource-group "$RESOURCE_GROUP" --image "$IMAGE_TAG" --output none
else
    az containerapp create \
        --name "$CONTAINER_APP_NAME" \
        --container-name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ENVIRONMENT_NAME" \
        --image "$IMAGE_TAG" \
        --registry-server "$ACR_LOGIN_SERVER" \
        --target-port $APP_PORT \
        --ingress external \
        --min-replicas 1 \
        --max-replicas 5 \
        --cpu 0.5 \
        --memory 1Gi \
        --enable-dapr \
        --dapr-app-id "$APP_NAME" \
        --dapr-app-port $APP_PORT \
        --secrets "openai-key=${AZURE_OPENAI_API_KEY}" \
        --env-vars \
            "NODE_ENV=production" \
            "PORT=$APP_PORT" \
            "AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT" \
            "AZURE_OPENAI_API_KEY=secretref:openai-key" \
            "AZURE_OPENAI_DEPLOYMENT=$AZURE_OPENAI_DEPLOYMENT" \
            "DAPR_HTTP_PORT=3500" \
            "DAPR_GRPC_PORT=50001" \
            "DAPR_PUBSUB_NAME=pubsub" \
        --output none
fi

print_header "Deployment Complete!"
echo -e "${GREEN}Chat Service deployed!${NC} Dapr App ID: $CONTAINER_APP_NAME"
