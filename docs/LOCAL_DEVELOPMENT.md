# Chat Service - Local Development Guide

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 9+
- Azure OpenAI Service access (or OpenAI API key)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
NODE_ENV=development
PORT=1010
HOST=0.0.0.0

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# OR use OpenAI directly
OPENAI_API_KEY=sk-your-openai-key
```

### 3. Start the Service

```bash
npm run dev
```

Service available at `http://localhost:1010`

## API Endpoints

| Method | Endpoint                       | Description          |
| ------ | ------------------------------ | -------------------- |
| GET    | `/health`                      | Health check         |
| POST   | `/api/chat`                    | Send chat message    |
| POST   | `/api/chat/stream`             | Stream chat response |
| GET    | `/api/chat/history/:sessionId` | Get chat history     |

## Testing

### Send a Chat Message

```bash
curl -X POST http://localhost:1010/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What products do you recommend?",
    "sessionId": "session-123",
    "context": {"userId": "user-456"}
  }'
```

### Stream Response

```bash
curl -X POST http://localhost:1010/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about your return policy"}'
```

## Environment Variables

| Variable                  | Description                   | Required              |
| ------------------------- | ----------------------------- | --------------------- |
| `AZURE_OPENAI_ENDPOINT`   | Azure OpenAI endpoint URL     | Yes (if using Azure)  |
| `AZURE_OPENAI_API_KEY`    | Azure OpenAI API key          | Yes (if using Azure)  |
| `AZURE_OPENAI_DEPLOYMENT` | Deployment name (e.g., gpt-4) | Yes (if using Azure)  |
| `OPENAI_API_KEY`          | OpenAI API key                | Yes (if using OpenAI) |

## Troubleshooting

### Rate Limiting

Azure OpenAI has rate limits. For development, use lower token limits.

### Model Not Found

Ensure the deployment name matches your Azure OpenAI deployment exactly.
