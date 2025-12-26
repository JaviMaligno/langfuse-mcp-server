import type { z } from "zod";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { LangfuseClient } from "../client.js";
import type { Config, Logger } from "../config.js";
import { handleToolError } from "../utils/errors.js";

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
      inputSchema: this.zodToJsonSchema(tool.inputSchema) as Tool["inputSchema"],
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

  /**
   * Convert Zod schema to JSON Schema for MCP
   */
  private zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
    // Use zod-to-json-schema or manual conversion
    // For now, we extract the shape from Zod objects
    const jsonSchema: Record<string, unknown> = {
      type: "object",
      properties: {},
      required: [] as string[],
    };

    // Handle ZodObject
    if ("shape" in schema && typeof schema.shape === "object") {
      const shape = schema.shape as Record<string, z.ZodTypeAny>;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        properties[key] = this.zodTypeToJsonSchema(value);

        // Check if required (not optional)
        if (!value.isOptional()) {
          required.push(key);
        }
      }

      jsonSchema.properties = properties;
      if (required.length > 0) {
        jsonSchema.required = required;
      }
    }

    return jsonSchema;
  }

  /**
   * Convert individual Zod type to JSON Schema
   */
  private zodTypeToJsonSchema(zodType: z.ZodTypeAny): Record<string, unknown> {
    const schema: Record<string, unknown> = {};

    // Get description if available
    if (zodType.description) {
      schema.description = zodType.description;
    }

    // Handle optional wrapper
    let innerType = zodType;
    if ("unwrap" in zodType && typeof zodType.unwrap === "function") {
      innerType = zodType.unwrap() as z.ZodTypeAny;
    }

    // Determine type
    const typeName = innerType._def?.typeName;

    switch (typeName) {
      case "ZodString":
        schema.type = "string";
        break;
      case "ZodNumber":
        schema.type = "number";
        break;
      case "ZodBoolean":
        schema.type = "boolean";
        break;
      case "ZodArray":
        schema.type = "array";
        if (innerType._def?.type) {
          schema.items = this.zodTypeToJsonSchema(innerType._def.type as z.ZodTypeAny);
        }
        break;
      case "ZodObject":
        schema.type = "object";
        break;
      case "ZodEnum":
        schema.type = "string";
        if (innerType._def?.values) {
          schema.enum = innerType._def.values;
        }
        break;
      default:
        schema.type = "string"; // Default fallback
    }

    return schema;
  }
}
