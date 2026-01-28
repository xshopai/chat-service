# Chat Service

AI-powered chatbot service for XShopAI e-commerce platform. Provides natural language interface for product search and order inquiries using Azure OpenAI with function calling.

## Features

- 🤖 **Natural Language Chat**: Conversational interface powered by Azure OpenAI (GPT-4o)
- 🔍 **Product Search**: Find products by name, category, or price range
- 📦 **Order History**: View past orders and their status
- 🚚 **Order Tracking**: Track shipments and delivery status
- 🔗 **Dapr Integration**: Service-to-service communication via Dapr

## Architecture

```
┌─────────────────┐     ┌───────────────┐     ┌─────────────────┐
│   Customer UI   │────▶│    Web BFF    │────▶│  Chat Service   │
└─────────────────┘     └───────────────┘     └────────┬────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │  Azure OpenAI   │
                                              │   (GPT-4o)      │
                                              └────────┬────────┘
                                                       │
                                          ┌────────────┼────────────┐
                                          │            │            │
                                    ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
                                    │  Product  │ │  Order  │ │   Other   │
                                    │  Service  │ │ Service │ │ Services  │
                                    └───────────┘ └─────────┘ └───────────┘
```

## Prerequisites

- Node.js 20+
- npm 9+
- Dapr CLI (for local development)
- Azure OpenAI access with GPT-4o deployment

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Azure OpenAI credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT_NAME`: Your GPT-4o deployment name

### 3. Run in development mode

Without Dapr (standalone):

```bash
npm run dev
```

With Dapr sidecar:

```bash
# Windows
.\run.ps1

# Linux/Mac
./run.sh
```

### 4. Test the service

```bash
# Health check
curl http://localhost:8014/health

# Send a chat message
curl -X POST http://localhost:8014/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me running shoes under $100"}'
```

## API Endpoints

### Chat Endpoints

| Method | Endpoint                            | Description                        |
| ------ | ----------------------------------- | ---------------------------------- |
| POST   | `/api/chat/message`                 | Send a message and get AI response |
| GET    | `/api/chat/history/:conversationId` | Get conversation history           |

### Operational Endpoints

| Method | Endpoint  | Description     |
| ------ | --------- | --------------- |
| GET    | `/health` | Health check    |
| GET    | `/ready`  | Readiness probe |
| GET    | `/live`   | Liveness probe  |

## Request/Response Examples

### Send Chat Message

**Request:**

```json
POST /api/chat/message
{
  "message": "What are your best selling laptops?",
  "userId": "user-123",
  "conversationId": "conv_abc123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Here are our top laptops:\n\n1. **MacBook Pro 16\"** - $2,499\n2. **Dell XPS 15** - $1,799\n...",
    "conversationId": "conv_abc123",
    "metadata": {
      "toolsUsed": ["searchProducts"],
      "tokensUsed": 450
    }
  }
}
```

## Available Tools (Function Calling)

The chat service uses these tools to fetch real data:

### Product Tools

- `searchProducts` - Search products by keyword, category, price range
- `getProductDetails` - Get detailed product information
- `getCategories` - List all product categories

### Order Tools

- `getMyOrders` - Get user's order history
- `getOrderDetails` - Get specific order details
- `trackOrder` - Get tracking information

## Project Structure

```
chat-service/
├── src/
│   ├── clients/           # Dapr service clients
│   │   ├── order.client.ts
│   │   └── product.client.ts
│   ├── core/              # Core infrastructure
│   │   ├── config.ts
│   │   ├── daprClient.ts
│   │   └── logger.ts
│   ├── llm/               # LLM integration
│   │   └── azure-openai.ts
│   ├── middlewares/       # Express middlewares
│   │   └── traceContext.middleware.ts
│   ├── routes/            # API routes
│   │   ├── chat.routes.ts
│   │   └── operational.routes.ts
│   ├── services/          # Business logic
│   │   └── chat.service.ts
│   ├── tools/             # Function definitions
│   │   ├── index.ts
│   │   ├── order.tools.ts
│   │   └── product.tools.ts
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── .dapr/                 # Dapr configuration
│   └── config.yaml
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
├── run.ps1
├── run.sh
└── tsconfig.json
```

## Configuration

| Variable                     | Default         | Description                 |
| ---------------------------- | --------------- | --------------------------- |
| PORT                         | 8014            | Service port                |
| NODE_ENV                     | development     | Environment                 |
| LOG_LEVEL                    | debug           | Logging level               |
| AZURE_OPENAI_ENDPOINT        | -               | Azure OpenAI endpoint       |
| AZURE_OPENAI_API_KEY         | -               | Azure OpenAI API key        |
| AZURE_OPENAI_DEPLOYMENT_NAME | gpt-4o          | Model deployment name       |
| DAPR_HTTP_PORT               | 3500            | Dapr HTTP port              |
| PRODUCT_SERVICE_APP_ID       | product-service | Product service Dapr app ID |
| ORDER_SERVICE_APP_ID         | order-service   | Order service Dapr app ID   |

## Development

### Scripts

```bash
npm run build      # Compile TypeScript
npm run dev        # Run in development mode
npm run start      # Run in production mode
npm run lint       # Run ESLint
npm run test       # Run tests
```

### Adding New Tools

1. Create tool definition in `src/tools/`
2. Add to `allTools` array in `src/tools/index.ts`
3. Implement handler in `chat.service.ts` `executeToolCall` method

## Deployment

### Docker

```bash
# Build image
docker build -t chat-service .

# Run container
docker run -p 8014:8014 \
  -e AZURE_OPENAI_ENDPOINT=your-endpoint \
  -e AZURE_OPENAI_API_KEY=your-key \
  chat-service
```

### Docker Compose

```bash
docker-compose up -d
```

## License

MIT
