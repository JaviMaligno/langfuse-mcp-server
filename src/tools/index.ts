import type { ToolDefinition } from "./registry.js";

// Import all tools
import { listTraces, getTrace, deleteTrace } from "./traces/index.js";
import { listObservations, getObservation } from "./observations/index.js";
import { createScore, listScores, getScore, deleteScore } from "./scores/index.js";
import { createScoreConfig, listScoreConfigs, getScoreConfig } from "./score-configs/index.js";
import {
  createDataset,
  listDatasets,
  getDataset,
  createDatasetItem,
  listDatasetItems,
  getDatasetItem,
  deleteDatasetItem,
  createDatasetRunItem,
  listDatasetRuns,
  getDatasetRun,
} from "./datasets/index.js";
import { listSessions, getSession } from "./sessions/index.js";

// Export registry
export { ToolRegistry, defineTool, type ToolDefinition } from "./registry.js";

/**
 * All available tools grouped by category
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allTools: Record<string, ToolDefinition<any>[]> = {
  traces: [listTraces, getTrace, deleteTrace],
  observations: [listObservations, getObservation],
  scores: [createScore, listScores, getScore, deleteScore],
  scoreConfigs: [createScoreConfig, listScoreConfigs, getScoreConfig],
  datasets: [
    createDataset,
    listDatasets,
    getDataset,
    createDatasetItem,
    listDatasetItems,
    getDatasetItem,
    deleteDatasetItem,
    createDatasetRunItem,
    listDatasetRuns,
    getDatasetRun,
  ],
  sessions: [listSessions, getSession],
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
