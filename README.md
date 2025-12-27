# Langfuse MCP Server (Extended)

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [Langfuse](https://langfuse.com), providing AI assistants with full access to traces, observations, scores, datasets, and sessions.

> **Note**: This server is designed to complement the [official Langfuse MCP server](https://github.com/langfuse/mcp-server-langfuse) which focuses on prompt management. Use both together for complete Langfuse integration.

## Features

- **Traces**: List, get, and delete traces with filtering and pagination
- **Observations**: Query generations, spans, and events with usage metrics
- **Scores**: Full CRUD operations for evaluation scores (numeric, categorical, boolean)
- **Score Configs**: Manage score configuration templates
- **Datasets**: Complete dataset management including items and evaluation runs
- **Sessions**: Access session data with associated traces
- **Cloud & Self-hosted**: Works with Langfuse Cloud and self-hosted instances

## Installation

### Claude Desktop

Add to your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "langfuse": {
      "command": "npx",
      "args": ["-y", "langfuse-mcp-extended"],
      "env": {
        "LANGFUSE_PUBLIC_KEY": "pk-lf-...",
        "LANGFUSE_SECRET_KEY": "sk-lf-..."
      }
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add langfuse -- npx -y langfuse-mcp-extended
```

Then set your environment variables in your shell or `.env` file:

```bash
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."
```

Or add directly to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "langfuse": {
      "command": "npx",
      "args": ["-y", "langfuse-mcp-extended"],
      "env": {
        "LANGFUSE_PUBLIC_KEY": "pk-lf-...",
        "LANGFUSE_SECRET_KEY": "sk-lf-..."
      }
    }
  }
}
```

### VS Code / Cursor

Add to your MCP settings (`.vscode/mcp.json` or Cursor equivalent):

```json
{
  "servers": {
    "langfuse": {
      "command": "npx",
      "args": ["-y", "langfuse-mcp-extended"],
      "env": {
        "LANGFUSE_PUBLIC_KEY": "pk-lf-...",
        "LANGFUSE_SECRET_KEY": "sk-lf-..."
      }
    }
  }
}
```

### Global Installation

```bash
npm install -g langfuse-mcp-extended
```

Then use `langfuse-mcp-extended` as the command instead of `npx -y langfuse-mcp-extended`.

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `LANGFUSE_PUBLIC_KEY` | Your Langfuse public key (`pk-lf-...`) |
| `LANGFUSE_SECRET_KEY` | Your Langfuse secret key (`sk-lf-...`) |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LANGFUSE_BASE_URL` | `https://cloud.langfuse.com` | Langfuse instance URL |
| `LOG_LEVEL` | `info` | Logging level: `debug`, `info`, `warn`, `error` |

### Langfuse Instance URLs

| Instance | URL |
|----------|-----|
| **US Cloud** | `https://cloud.langfuse.com` (default) |
| **EU Cloud** | `https://eu.cloud.langfuse.com` |
| **Self-hosted** | Your instance URL (e.g., `http://localhost:3000`) |

## API Reference

### Pagination

All list operations use **page-based pagination** with a default limit of **10 items** per page:

- `page` (number, optional): Page number, 1-indexed. Default: 1
- `limit` (number, optional): Items per page, max 100. Default: 10

### Response Size Control

Get operations (`getTrace`, `getSession`, `getObservation`) support an `includeIO` parameter to control response size:

- `includeIO` (boolean, optional): Include input/output fields. Default: `false`

When `includeIO` is `false` (default), large `input` and `output` fields are stripped from responses to prevent exceeding LLM context limits. Set to `true` when you need the full payload.

---

### Traces

#### `listTraces`
List traces with filtering and pagination.

**Inputs:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `name` (string, optional): Filter by trace name
- `userId` (string, optional): Filter by user ID
- `sessionId` (string, optional): Filter by session ID
- `tags` (string[], optional): Filter by tags (AND logic)
- `fromTimestamp` (string, optional): Start of time range (ISO 8601)
- `toTimestamp` (string, optional): End of time range (ISO 8601)
- `environment` (string, optional): Filter by environment
- `orderBy` (string, optional): Sort by `timestamp`, `latency`, or `totalCost`

#### `getTrace`
Get a specific trace with full details.

**Inputs:**
- `traceId` (string, required): The trace ID
- `includeIO` (boolean, optional): Include input/output fields. Default: `false`

**Returns:** Trace with observations and scores.

#### `deleteTrace`
Delete a trace.

**Inputs:**
- `traceId` (string, required): The trace ID to delete

---

### Observations

#### `listObservations`
List observations (generations, spans, events) with cursor-based pagination.

**Inputs:**
- `cursor` (string, optional): Pagination cursor
- `limit` (number, optional): Items per page
- `traceId` (string, optional): Filter by trace ID
- `name` (string, optional): Filter by observation name
- `type` (string, optional): Filter by type: `GENERATION`, `SPAN`, `EVENT`
- `parentObservationId` (string, optional): Filter by parent
- `fromStartTime` (string, optional): Start of time range (ISO 8601)
- `toStartTime` (string, optional): End of time range (ISO 8601)
- `userId` (string, optional): Filter by user ID
- `version` (string, optional): Filter by version

#### `getObservation`
Get a specific observation with all details.

**Inputs:**
- `observationId` (string, required): The observation ID
- `includeIO` (boolean, optional): Include input/output fields. Default: `false`

**Returns:** Observation with usage, costs, and timing.

---

### Scores

#### `createScore`
Create a score for a trace or observation.

**Inputs:**
- `traceId` (string, required): ID of the trace to score
- `name` (string, required): Score name (e.g., `accuracy`, `relevance`)
- `value` (number | string, required): Score value
- `observationId` (string, optional): ID of specific observation to score
- `dataType` (string, optional): `NUMERIC`, `CATEGORICAL`, or `BOOLEAN`
- `comment` (string, optional): Explanation of the score
- `configId` (string, optional): Score config ID for validation
- `id` (string, optional): Custom ID for idempotency

#### `listScores`
List scores with filtering.

**Inputs:**
- `page`, `limit` (pagination)
- `traceId` (string, optional): Filter by trace ID
- `observationId` (string, optional): Filter by observation ID
- `name` (string, optional): Filter by score name
- `source` (string, optional): Filter by source: `API`, `ANNOTATION`, `EVAL`
- `dataType` (string, optional): Filter by data type
- `configId` (string, optional): Filter by config ID
- `fromTimestamp`, `toTimestamp` (string, optional): Time range
- `userId` (string, optional): Filter by user ID
- `operator` (string, optional): Comparison operator: `<`, `>`, `<=`, `>=`, `!=`, `=`
- `value` (number, optional): Value to compare (requires operator)

#### `getScore`
Get a specific score.

**Inputs:**
- `scoreId` (string, required): The score ID

#### `deleteScore`
Delete a score.

**Inputs:**
- `scoreId` (string, required): The score ID to delete

---

### Score Configs

#### `createScoreConfig`
Create a score configuration template.

**Inputs:**
- `name` (string, required): Unique config name
- `dataType` (string, required): `NUMERIC`, `CATEGORICAL`, or `BOOLEAN`
- `minValue` (number, optional): Minimum value (NUMERIC only)
- `maxValue` (number, optional): Maximum value (NUMERIC only)
- `categories` (array, optional): Category definitions (CATEGORICAL only)
- `description` (string, optional): Description

#### `listScoreConfigs`
List all score configurations.

**Inputs:**
- `page`, `limit` (pagination)

#### `getScoreConfig`
Get a specific score configuration.

**Inputs:**
- `configId` (string, required): The config ID

---

### Datasets

#### `createDataset`
Create a new dataset.

**Inputs:**
- `name` (string, required): Dataset name
- `description` (string, optional): Description
- `metadata` (object, optional): Additional metadata

#### `listDatasets`
List all datasets.

**Inputs:**
- `page`, `limit` (pagination)

#### `getDataset`
Get a dataset by name.

**Inputs:**
- `datasetName` (string, required): The dataset name

#### `createDatasetItem`
Create or update a dataset item.

**Inputs:**
- `datasetName` (string, required): Target dataset name
- `input` (any, required): Item input data
- `expectedOutput` (any, optional): Expected output
- `metadata` (object, optional): Item metadata
- `sourceTraceId` (string, optional): Source trace ID
- `sourceObservationId` (string, optional): Source observation ID
- `id` (string, optional): Custom ID for upsert

#### `listDatasetItems`
List items in a dataset.

**Inputs:**
- `datasetName` (string, required): Dataset name
- `page`, `limit` (pagination)
- `sourceTraceId` (string, optional): Filter by source trace
- `sourceObservationId` (string, optional): Filter by source observation

#### `getDatasetItem`
Get a specific dataset item.

**Inputs:**
- `datasetItemId` (string, required): The item ID

#### `deleteDatasetItem`
Delete a dataset item.

**Inputs:**
- `datasetItemId` (string, required): The item ID to delete

#### `createDatasetRunItem`
Link a trace/observation to a dataset item for evaluation.

**Inputs:**
- `runName` (string, required): Name of the dataset run
- `datasetItemId` (string, required): Dataset item ID
- `traceId` (string, required): Trace ID
- `runDescription` (string, optional): Run description
- `observationId` (string, optional): Observation ID
- `metadata` (object, optional): Run item metadata

#### `listDatasetRuns`
List runs for a dataset.

**Inputs:**
- `datasetName` (string, required): Dataset name
- `page`, `limit` (pagination)

#### `getDatasetRun`
Get a specific dataset run.

**Inputs:**
- `datasetName` (string, required): Dataset name
- `runName` (string, required): Run name

---

### Sessions

#### `listSessions`
List all sessions.

**Inputs:**
- `page`, `limit` (pagination)
- `fromTimestamp` (string, optional): Start of time range (ISO 8601)
- `toTimestamp` (string, optional): End of time range (ISO 8601)

#### `getSession`
Get a specific session with its traces.

**Inputs:**
- `sessionId` (string, required): The session ID
- `includeIO` (boolean, optional): Include input/output in traces. Default: `false`

**Returns:** Session with associated traces.

---

## Using with Official Langfuse MCP (Prompts)

This server focuses on observability data (traces, scores, datasets). For **prompt management**, use the [official Langfuse MCP server](https://github.com/langfuse/mcp-server-langfuse) alongside this one:

```json
{
  "mcpServers": {
    "langfuse-prompts": {
      "command": "npx",
      "args": ["-y", "@langfuse/mcp-server-langfuse"],
      "env": {
        "LANGFUSE_PUBLIC_KEY": "pk-lf-...",
        "LANGFUSE_SECRET_KEY": "sk-lf-...",
        "LANGFUSE_BASEURL": "https://cloud.langfuse.com"
      }
    },
    "langfuse-observability": {
      "command": "npx",
      "args": ["-y", "langfuse-mcp-extended"],
      "env": {
        "LANGFUSE_PUBLIC_KEY": "pk-lf-...",
        "LANGFUSE_SECRET_KEY": "sk-lf-..."
      }
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Run tests
npm test              # Unit tests
npm run test:integration  # Integration tests (requires credentials)
npm run test:all      # All tests

# Quality checks
npm run lint          # Lint code
npm run typecheck     # Type check
```

## Test Coverage

- **59 unit tests** covering all tools with mocked API responses
- **18 integration tests** validating real API interactions

## Contributing

Contributions are welcome! This project aims to be contributed to the official Langfuse ecosystem.

- **Discussion**: [langfuse/langfuse#5646](https://github.com/langfuse/langfuse/discussions/5646)
- **Issue**: [langfuse/mcp-server-langfuse#14](https://github.com/langfuse/mcp-server-langfuse/issues/14)

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Langfuse](https://langfuse.com) - Open source LLM observability
- [Official Langfuse MCP Server](https://github.com/langfuse/mcp-server-langfuse) - Prompt management MCP
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification
- [MCP Servers Registry](https://github.com/modelcontextprotocol/servers) - Official MCP servers
