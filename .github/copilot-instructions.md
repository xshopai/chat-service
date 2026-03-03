# Copilot Instructions — chat-service

## Service Identity

- **Name**: chat-service
- **Purpose**: AI-powered conversational shopping assistant using Azure OpenAI GPT-4o with function calling
- **Port**: 8013
- **Language**: Node.js 20+ (TypeScript)
- **Framework**: Express with TypeScript
- **Database**: Stateless — no own database; calls other services via Dapr
- **Dapr App ID**: `chat-service`

## Architecture

- **Pattern**: AI orchestration service — receives user messages, calls Azure OpenAI, executes function tools via Dapr service invocation
- **API Style**: RESTful JSON APIs (chat endpoints)
- **Authentication**: JWT Bearer tokens
- **AI Provider**: Azure OpenAI GPT-4o with function calling (tools)
- **Service Calls**: Dapr service invocation to product-service, order-service

## Project Structure

```
chat-service/
├── src/
│   ├── controllers/     # Chat endpoint handlers
│   ├── services/        # AI orchestration, conversation management
│   ├── tools/           # Function calling tool definitions
│   ├── clients/         # Dapr service invocation clients
│   ├── middlewares/      # Auth, logging
│   ├── routes/          # Route definitions
│   └── core/            # Config, logger
├── tests/
├── .dapr/components/
└── package.json
```

## Code Conventions

- **TypeScript** with strict mode
- Use `@azure/openai` SDK for Azure OpenAI integration
- Function calling tools defined as JSON Schema in `src/tools/`
- Conversation history managed in-memory (per session)
- Error handling: graceful fallback if AI service unavailable

## AI Function Calling Tools

| Tool                | Description                 | Calls           |
| :------------------ | :-------------------------- | :-------------- |
| `searchProducts`    | Search product catalog      | product-service |
| `getProductDetails` | Get product by ID           | product-service |
| `getCategories`     | List product categories     | product-service |
| `getMyOrders`       | Get user's order history    | order-service   |
| `getOrderDetails`   | Get specific order          | order-service   |
| `trackOrder`        | Track order delivery status | order-service   |

## Environment Variables

```
PORT=8013
NODE_ENV=development
JWT_SECRET=<shared-secret>
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_DEPLOYMENT=gpt-4o
DAPR_HTTP_PORT=3500
```

## Security Rules

- JWT MUST be validated before accessing any chat endpoint
- Never include raw upstream error responses from Azure OpenAI in API responses to clients
- Conversation history MUST be session-scoped — never leak one user's history to another
- Never log user message content or AI response content
- Rate limiting must be applied to chat endpoints
- Sanitize all user inputs before passing to Azure OpenAI API

## Error Handling Contract

All errors MUST follow this JSON structure:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "correlationId": "uuid"
  }
}
```

- Never expose stack traces in production
- Gracefully fall back if Azure OpenAI is unavailable
- Use centralized error middleware only

## Logging Rules

- Use structured JSON logging only
- Include:
  - timestamp
  - level
  - serviceName
  - correlationId
  - message
- Never log JWT tokens
- Never log secrets or Azure OpenAI API keys
- Never log user message content or AI response content

## Testing Requirements

- All new controllers MUST have unit tests
- Use **Jest** with **ts-jest** as the test framework
- Mock Azure OpenAI responses in unit tests
- Mock Dapr service invocation calls in unit tests
- Do NOT call real Azure OpenAI or downstream services in unit tests
- Run: `npm test`

## Non-Goals

- This service is NOT responsible for product catalog management — reads via Dapr from product-service
- This service does NOT store chat history persistently — in-memory per session only
- This service does NOT handle authentication or JWT issuance
- This service does NOT process orders or payments directly
