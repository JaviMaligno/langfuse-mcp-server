import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type { Config, Logger } from "./config.js";
import { LangfuseClient } from "./client.js";
import { ToolRegistry, getAllTools } from "./tools/index.js";

const SERVER_NAME = "langfuse-mcp-server";
const SERVER_VERSION = "0.1.0";

/**
 * Create and configure the MCP server
 */
export function createServer(config: Config, logger: Logger) {
  // Initialize Langfuse client
  const langfuseClient = new LangfuseClient(config, logger);

  // Initialize tool registry
  const toolRegistry = new ToolRegistry(langfuseClient, config, logger);

  // Register all tools
  toolRegistry.registerAll(getAllTools());

  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug("Received list tools request");
    return {
      tools: toolRegistry.getTools(),
    };
  });

  // Handle call tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`Tool called: ${name}`);

    const result = await toolRegistry.execute(name, args ?? {});
    return result;
  });

  // Handle server errors
  server.onerror = (error) => {
    logger.error("Server error:", error);
  };

  return {
    server,
    langfuseClient,
    toolRegistry,
  };
}

/**
 * Run the MCP server with stdio transport
 */
export async function runServer(config: Config, logger: Logger): Promise<void> {
  logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);
  logger.info(`Langfuse URL: ${config.langfuse.baseUrl}`);

  const { server, langfuseClient } = createServer(config, logger);

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Handle shutdown
  const shutdown = async () => {
    logger.info("Shutting down server...");
    await langfuseClient.shutdown();
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Connect and run
  await server.connect(transport);
  logger.info("Server connected and ready");
}
