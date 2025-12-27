import type { z } from "zod";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { LangfuseClient } from "../client.js";
import type { Config, Logger } from "../config.js";
import { handleToolError } from "../utils/errors.js";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Definition of an MCP tool with typed input schema
 */
export interface ToolDefinition<TInput = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  handler: (
    input: TInput,
    client: LangfuseClient,
    logger: Logger
  ) => Promise<CallToolResult>;
  /**
   * Optional function to determine if tool should be enabled
   */
  enabled?: (config: Config) => boolean;
}

/**
 * Create a type-safe tool definition
 */
export function defineTool<TInput>(
  definition: ToolDefinition<TInput>
): ToolDefinition<TInput> {
  return definition;
}

/**
 * Registry of all available tools
 */
export class ToolRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tools: Map<string, ToolDefinition<any>> = new Map();
  private client: LangfuseClient;
  private config: Config;
  private logger: Logger;

  constructor(client: LangfuseClient, config: Config, logger: Logger) {
    this.client = client;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Register a tool in the registry
   */
  register<TInput>(tool: ToolDefinition<TInput>): void {
    // Check if tool should be enabled
    if (tool.enabled && !tool.enabled(this.config)) {
      this.logger.debug(`Tool ${tool.name} is disabled by configuration`);
      return;
    }

    this.tools.set(tool.name, tool);
    this.logger.debug(`Registered tool: ${tool.name}`);
  }

  /**
   * Register multiple tools
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerAll(tools: ToolDefinition<any>[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * Get all registered tools in MCP format
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema, { target: "openApi3" }) as Tool["inputSchema"],
    }));
  }

  /**
   * Execute a tool by name
   */
  async execute(name: string, args: unknown): Promise<CallToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      // Validate input
      const parseResult = tool.inputSchema.safeParse(args);
      if (!parseResult.success) {
        const errors = parseResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        return {
          content: [{ type: "text", text: `Invalid input: ${errors}` }],
          isError: true,
        };
      }

      // Execute handler
      this.logger.debug(`Executing tool: ${name}`);
      return await tool.handler(parseResult.data, this.client, this.logger);
    } catch (error) {
      this.logger.error(`Error executing tool ${name}:`, error);
      return handleToolError(error);
    }
  }

}
