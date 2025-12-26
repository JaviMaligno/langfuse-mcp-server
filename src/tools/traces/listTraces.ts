import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";
import { buildQueryString, formatPaginationSummary } from "../../utils/pagination.js";

const inputSchema = z.object({
  page: z.number().int().min(1).optional().describe("Page number (1-indexed)"),
  limit: z.number().int().min(1).max(100).optional().default(50).describe("Items per page"),
  name: z.string().optional().describe("Filter by trace name"),
  userId: z.string().optional().describe("Filter by user ID"),
  sessionId: z.string().optional().describe("Filter by session ID"),
  tags: z.array(z.string()).optional().describe("Filter by tags (AND logic)"),
  fromTimestamp: z.string().optional().describe("Start of time range (ISO 8601)"),
  toTimestamp: z.string().optional().describe("End of time range (ISO 8601)"),
  environment: z.string().optional().describe("Filter by environment"),
  orderBy: z
    .enum(["timestamp", "latency", "totalCost"])
    .optional()
    .describe("Sort field"),
});

interface TraceListResponse {
  data: Array<{
    id: string;
    name?: string;
    timestamp: string;
    userId?: string;
    sessionId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    latency?: number;
    totalCost?: number;
    observationCount?: number;
    scoreCount?: number;
  }>;
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export const listTraces = defineTool({
  name: "listTraces",
  description:
    "List traces with filtering and pagination. Returns trace metadata including latency, cost, and observation/score counts.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("listTraces called with:", input);

    // Build query parameters
    const queryParams: Record<string, string | number | string[] | undefined> = {
      page: input.page,
      limit: input.limit,
      name: input.name,
      userId: input.userId,
      sessionId: input.sessionId,
      tags: input.tags,
      fromTimestamp: input.fromTimestamp,
      toTimestamp: input.toTimestamp,
      environment: input.environment,
      orderBy: input.orderBy,
    };

    const query = buildQueryString(queryParams);
    const response = await client.apiRequest<TraceListResponse>("GET", `/api/public/traces${query}`);

    const summary = formatPaginationSummary(
      response.data.length,
      response.meta.totalItems,
      response.meta.page,
      response.meta.page < response.meta.totalPages
    );

    return formatSuccess(response, summary);
  },
});
