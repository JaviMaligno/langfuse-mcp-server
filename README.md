# Langfuse MCP Server

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [Langfuse](https://langfuse.com), providing AI assistants with access to traces, scores, datasets, and more.

## Features

- **Traces**: List, get, and delete traces with full filtering
- **Observations**: Query generations, spans, and events
- **Scores**: Full CRUD operations for evaluation scores
- **Score Configs**: Manage score configurations
- **Datasets**: Complete dataset management including items and runs
- **Sessions**: Access session data
- **Prompts**: (Optional) Extended prompt management

## Installation

```bash
npm install langfuse-mcp-server
```

Or run directly with npx:

```bash
npx langfuse-mcp-server
```

## Configuration

Set the following environment variables:

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # or your self-hosted URL
```

### Optional Configuration

```bash
MCP_ENABLE_PROMPTS=false  # Enable prompt tools (default: false, use official MCP for prompts)
LOG_LEVEL=info            # debug, info, warn, error
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "langfuse": {
      "command": "npx",
      "args": ["langfuse-mcp-server"],
      "env": {
        "LANGFUSE_PUBLIC_KEY": "pk-lf-...",
        "LANGFUSE_SECRET_KEY": "sk-lf-...",
        "LANGFUSE_BASE_URL": "https://cloud.langfuse.com"
      }
    }
  }
}
```

## Usage with Cursor

Add to your Cursor MCP settings:

```json
{
  "mcp": {
    "servers": {
      "langfuse": {
        "command": "npx",
        "args": ["langfuse-mcp-server"],
        "env": {
          "LANGFUSE_PUBLIC_KEY": "pk-lf-...",
          "LANGFUSE_SECRET_KEY": "sk-lf-...",
          "LANGFUSE_BASE_URL": "https://cloud.langfuse.com"
        }
      }
    }
  }
}
```

## Available Tools

### Traces
- `listTraces` - List traces with filtering and pagination
- `getTrace` - Get a specific trace with full details
- `deleteTrace` - Delete a trace

### Observations
- `listObservations` - List observations (generations, spans, events)
- `getObservation` - Get a specific observation

### Scores
- `createScore` - Create a score for a trace or observation
- `listScores` - List scores with filtering
- `getScore` - Get a specific score
- `deleteScore` - Delete a score

### Score Configs
- `createScoreConfig` - Create a score configuration
- `listScoreConfigs` - List all score configurations
- `getScoreConfig` - Get a specific score configuration

### Datasets
- `createDataset` - Create a new dataset
- `listDatasets` - List all datasets
- `getDataset` - Get a dataset by name
- `createDatasetItem` - Create or update a dataset item
- `listDatasetItems` - List items in a dataset
- `getDatasetItem` - Get a specific dataset item
- `deleteDatasetItem` - Delete a dataset item
- `createDatasetRunItem` - Link a trace to a dataset item
- `listDatasetRuns` - List runs for a dataset
- `getDatasetRun` - Get a specific dataset run

### Sessions
- `listSessions` - List sessions
- `getSession` - Get a specific session

### Prompts (Optional)
- `getPrompt` - Get a prompt by name
- `listPrompts` - List all prompts
- `createTextPrompt` - Create a text prompt
- `createChatPrompt` - Create a chat prompt
- `updatePromptLabels` - Update prompt labels

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Contributing

Contributions are welcome! This project is designed to potentially be contributed upstream to the official Langfuse MCP server.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Langfuse](https://langfuse.com) - Open source LLM observability
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification
- [Official Langfuse MCP Server](https://github.com/langfuse/mcp-server-langfuse) - Prompts-focused MCP server
