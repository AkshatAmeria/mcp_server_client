# MCP User Management System

A practical implementation of the Model Context Protocol (MCP) demonstrating a client-server architecture for user management with AI-powered query capabilities.

## 📖 What is MCP?

The **Model Context Protocol (MCP)** is an open protocol that standardizes how applications provide context to Large Language Models (LLMs). Think of it as a universal connector between your AI models and various data sources or tools.

**Key Concepts:**
- **MCP Server**: Exposes resources (data), tools (actions), and prompts to clients
- **MCP Client**: Connects to servers and uses their capabilities
- **Resources**: Read-only data sources (like database queries)
- **Tools**: Executable functions that can modify state
- **Prompts**: Reusable prompt templates

This project demonstrates all these concepts through a simple user management system.

## 🎯 What This Project Does

This repository contains:

1. **MCP Server** (`server.ts`): Manages a user database with:
   - Resources to read user data
   - Tools to create users (manually or with AI-generated fake data)
   - Prompts for generating fake user profiles

2. **MCP Client** (`client.ts`): Interactive CLI that lets you:
   - Query the system using natural language (AI-powered)
   - Call tools directly
   - Read resources
   - Use prompts
   - Everything integrated with Google's Gemini AI model

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### Running the Application

1. **Start the client**
   ```bash
   node build/client.js
   ```

2. **Choose an option from the menu:**
   - **Query (AI-powered)**: Ask questions in natural language (e.g., "Create a user named John with email john@example.com")
   - **Call a Tool**: Manually execute tools like creating users
   - **Read a Resource**: View all users or specific user details
   - **Use a Prompt**: Generate fake user data based on templates
   - **Exit**: Close the application

## 📁 Project Structure

```
├── src/
│   ├── client.ts          # MCP client implementation
│   ├── server.ts          # MCP server implementation
│   └── data/
│       └── users.json     # User database (auto-created)
├── build/                 # Compiled JavaScript files
├── .env                   # Environment variables
├── package.json
└── README.md
```

## 🔧 Available Features

### Resources
- **Get All Users** (`users://all`): Retrieve all users from the database
- **Get User Details** (`users://{userId}/profile`): Get specific user information

### Tools
- **create-user**: Add a new user with name, email, address, and phone
- **create-random-user**: Generate and save a fake user using AI

### Prompts
- **generate-fake-user**: Template for creating fake user data based on a name

## 💡 Example Usage

### Using AI Query
```
What would you like to do? > Query (AI-powered)
Enter your query: > Create a new user named Alice with email alice@example.com
```

### Reading All Users
```
What would you like to do? > Read a Resource
Select a resource: > Users (users://all)
```

### Creating a Random User
```
What would you like to do? > Call a Tool
Select a tool: > Create Random User
```

## 🛠️ Development

### Build the project
```bash
npm run build
```

### Watch mode (auto-rebuild on changes)
```bash
npm run build -- --watch
```

## 📦 Dependencies

- `@ai-sdk/google`: Google Gemini AI integration
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `ai`: Vercel AI SDK for unified AI interactions
- `@inquirer/prompts`: Interactive CLI prompts
- `zod`: Schema validation
- `dotenv`: Environment variable management

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

[Add your license here]

## 🔗 Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Google Gemini API](https://ai.google.dev)
- [Vercel AI SDK](https://sdk.vercel.ai)

## ⚠️ Notes

- The user database is stored in `src/data/users.json` and persists between sessions
- User IDs are auto-incremented
- The server uses stdio transport for communication
- All AI operations use Google's Gemini 2.0 Flash model
