<div align="center">

# 🤖 Chat Service

**AI-powered conversational shopping assistant for the xshopai e-commerce platform**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Azure OpenAI](https://img.shields.io/badge/Azure_OpenAI-GPT--4o-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/products/ai-services/openai-service)
[![Dapr](https://img.shields.io/badge/Dapr-Enabled-0D597F?style=for-the-badge&logo=dapr&logoColor=white)](https://dapr.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Getting Started](#-getting-started) •
[Documentation](#-documentation) •
[API Reference](#api-endpoints) •
[Contributing](#-contributing)

</div>

---

## 🎯 Overview

The **Chat Service** provides a natural language shopping assistant powered by Azure OpenAI (GPT-4o) with function calling. Customers can search products, check order history, and track shipments through conversational chat. The service uses Dapr for service-to-service invocation to fetch real-time data from product-service and order-service.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🤖 AI-Powered Conversations

- Azure OpenAI GPT-4o with function calling
- Natural language product search & filtering
- Context-aware multi-turn conversations
- Managed Identity or API key authentication

</td>
<td width="50%">

### 🔍 Real-Time Data Access

- Product search by name, category, price range
- Order history and tracking lookups
- Live data via Dapr service invocation
- Tool-use metadata (tokens, tools used)

</td>
</tr>
<tr>
<td width="50%">

### 📡 Microservice Integration

- Dapr service-to-service invocation
- Product & order service clients
- Conversation history management
- Extensible tool/function framework

</td>
<td width="50%">

### 🛡️ Enterprise Ready

- Helmet security headers
- OpenTelemetry distributed tracing
- Azure Monitor integration
- Winston structured logging

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Azure OpenAI access with GPT-4o deployment
- Docker & Docker Compose (optional)
- Dapr CLI (for production-like setup)

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/xshopai/chat-service.git
cd chat-service

# Start the service
docker-compose up -d

# Verify the service is healthy
curl http://localhost:8013/health
```

### Local Development Setup

<details>
<summary><b>🔧 Without Dapr (Simple Setup)</b></summary>

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Azure OpenAI credentials

# Start in development mode
npm run dev
```

📖 See [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) for detailed instructions.

</details>

<details>
<summary><b>⚡ With Dapr (Production-like)</b></summary>

```bash
# Ensure Dapr is initialized
dapr init

# Start with Dapr sidecar
./run.sh       # Linux/Mac
.\run.ps1      # Windows

# Or manually
dapr run \
  --app-id chat-service \
  --app-port 8013 \
  --dapr-http-port 3500 \
  --resources-path .dapr/components \
  --config .dapr/config.yaml \
  -- npm start
```

> **Note:** All services now use the standard Dapr ports (3500 for HTTP, 50001 for gRPC).

</details>

---

## 📚 Documentation

| Document                                          | Description                                        |
| :------------------------------------------------ | :------------------------------------------------- |
| 📘 [Local Development](docs/LOCAL_DEVELOPMENT.md) | Step-by-step local setup and development workflows |
| ☁️ [Azure Container Apps](docs/ACA_DEPLOYMENT.md) | Deploy to serverless containers with built-in Dapr |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Test Coverage

| Metric      | Status    |
| :---------- | :-------- |
| Unit Tests  | ✅ Jest   |
| Integration | ✅ Jest   |
| Linting     | ✅ ESLint |

---

## API Endpoints

| Method | Endpoint                            | Description                        |
| :----- | :---------------------------------- | :--------------------------------- |
| POST   | `/api/chat/message`                 | Send a message and get AI response |
| GET    | `/api/chat/history/:conversationId` | Get conversation history           |
| GET    | `/health`                           | Health check                       |
| GET    | `/ready`                            | Readiness probe                    |
| GET    | `/live`                             | Liveness probe                     |

### Available Tools (Function Calling)

| Tool                | Description                                       |
| :------------------ | :------------------------------------------------ |
| `searchProducts`    | Search products by keyword, category, price range |
| `getProductDetails` | Get detailed product information                  |
| `getCategories`     | List all product categories                       |
| `getMyOrders`       | Get user's order history                          |
| `getOrderDetails`   | Get specific order details                        |
| `trackOrder`        | Get tracking information                          |

---

## 🏗️ Project Structure

```
chat-service/
├── 📁 src/                       # Application source code
│   ├── 📁 clients/               # Dapr service clients (product, order)
│   ├── 📁 core/                  # Config, Dapr client, logger
│   ├── 📁 llm/                   # Azure OpenAI integration
│   ├── 📁 middlewares/           # Express middlewares (tracing)
│   ├── 📁 routes/                # API routes (chat, operational)
│   ├── 📁 services/              # Business logic (chat service)
│   ├── 📁 tools/                 # Function calling tool definitions
│   ├── 📄 app.ts                 # Express app setup
│   └── 📄 server.ts              # Server entry point
├── 📁 dist/                      # Compiled JavaScript output
├── 📁 scripts/                   # Utility scripts
├── 📁 docs/                      # Documentation
├── 📁 .dapr/                     # Dapr configuration
├── 📄 docker-compose.yml         # Local containerized environment
├── 📄 Dockerfile                 # Production container image
└── 📄 package.json               # Dependencies and scripts
```

---

## 🔧 Technology Stack

| Category         | Technology                                |
| :--------------- | :---------------------------------------- |
| 🟢 Runtime       | Node.js 20+ with TypeScript               |
| 🌐 Framework     | Express 4.18                              |
| 🤖 AI            | Azure OpenAI GPT-4o with function calling |
| 📨 Integration   | Dapr service-to-service invocation        |
| 🔐 Security      | Helmet, CORS, Azure Managed Identity      |
| 🧪 Testing       | Jest with unit & integration tests        |
| 📊 Observability | OpenTelemetry + Azure Monitor + Winston   |

---

## ⚡ Quick Reference

```bash
# 🐳 Docker Compose
docker-compose up -d              # Start service
docker-compose down               # Stop service

# 🔧 Local Development
npm run dev                       # Start with hot reload
npm run build                     # Compile TypeScript
npm start                         # Production mode

# ⚡ Dapr Development
./run.sh                          # Linux/Mac
.\run.ps1                         # Windows

# 🧪 Testing
npm test                          # Run all tests
npm run test:coverage             # With coverage report

# 🔍 Health Check
curl http://localhost:8013/health
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Write** tests for your changes
4. **Run** the test suite
   ```bash
   npm test && npm run lint
   ```
5. **Commit** your changes
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. **Push** to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open** a Pull Request

Please ensure your PR:

- ✅ Passes all existing tests
- ✅ Includes tests for new functionality
- ✅ Follows the existing code style
- ✅ Updates documentation as needed

---

## 🆘 Support

| Resource         | Link                                                                      |
| :--------------- | :------------------------------------------------------------------------ |
| 🐛 Bug Reports   | [GitHub Issues](https://github.com/xshopai/chat-service/issues)           |
| 📖 Documentation | [docs/](docs/)                                                            |
| 💬 Discussions   | [GitHub Discussions](https://github.com/xshopai/chat-service/discussions) |

---

## 📄 License

This project is part of the **xshopai** e-commerce platform.
Licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[⬆ Back to Top](#-chat-service)**

Made with ❤️ by the xshopai team

</div>
