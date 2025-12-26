import type { ToolDefinition } from "./registry.js";

// Import all tools
import { listTraces, getTrace, deleteTrace } from "./traces/index.js";

// Export registry
export { ToolRegistry, defineTool, type ToolDefinition } from "./registry.js";

/**
 * All available tools grouped by category
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allTools: Record<string, ToolDefinition<any>[]> = {
  traces: [listTraces, getTrace, deleteTrace],
  // observations: [],  // TODO: Phase 2
  // scores: [],        // TODO: Phase 2
  // scoreConfigs: [],  // TODO: Phase 2
  // datasets: [],      // TODO: Phase 3
  // sessions: [],      // TODO: Phase 4
  // prompts: [],       // TODO: Phase 5 (optional)
};

/**
 * Get all tools as a flat array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllTools(): ToolDefinition<any>[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(allTools).flat() as ToolDefinition<any>[];
}

/**
 * Get tools by category
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getToolsByCategory(category: string): ToolDefinition<any>[] {
  return allTools[category] ?? [];
}
