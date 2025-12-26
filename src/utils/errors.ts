import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { LangfuseApiError } from "../client.js";

/**
 * Format a successful tool result with optional summary
 */
export function formatSuccess<T>(data: T, summary?: string): CallToolResult {
  const content: CallToolResult["content"] = [];

  if (summary) {
    content.push({ type: "text", text: summary });
  }

  content.push({
    type: "text",
    text: JSON.stringify(data, null, 2),
  });

  return { content };
}

/**
 * Format an error tool result
 */
export function formatError(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

/**
 * Handle errors from tool handlers and format appropriately
 */
export function handleToolError(error: unknown): CallToolResult {
  // Langfuse API errors
  if (error instanceof LangfuseApiError) {
    if (error.isNotFound) {
      return formatError(`Resource not found: ${error.path}`);
    }
    if (error.isUnauthorized) {
      return formatError("Authentication failed. Check your API keys.");
    }
    if (error.isRateLimited) {
      return formatError("Rate limited. Please try again later.");
    }
    return formatError(`API Error (${error.statusCode}): ${error.body}`);
  }

  // Zod validation errors
  if (error instanceof Error && error.name === "ZodError") {
    return formatError(`Validation error: ${error.message}`);
  }

  // Generic errors
  if (error instanceof Error) {
    return formatError(error.message);
  }

  // Unknown errors
  console.error("Unexpected error:", error);
  return formatError("An unexpected error occurred");
}

/**
 * Wrapper to handle errors in tool handlers
 */
export function withErrorHandling<TInput, TOutput>(
  handler: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<CallToolResult> {
  return async (input: TInput): Promise<CallToolResult> => {
    try {
      const result = await handler(input);
      return result as unknown as CallToolResult;
    } catch (error) {
      return handleToolError(error);
    }
  };
}
