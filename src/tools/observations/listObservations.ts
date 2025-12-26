import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";
import { buildQueryString, formatPaginationSummary } from "../../utils/pagination.js";

const inputSchema = z.object({
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
  limit: z.number().int().min(1).max(100).optional().default(50).describe("Items per page"),
  traceId: z.string().optional().describe("Filter by trace ID"),
  name: z.string().optional().describe("Filter by observation name"),
  type: z
    .enum(["GENERATION", "SPAN", "EVENT"])
    .optional()
    .describe("Filter by observation type"),
  parentObservationId: z.string().optional().describe("Filter by parent observation"),
  fromStartTime: z.string().optional().describe("Start of time range (ISO 8601)"),
  toStartTime: z.string().optional().describe("End of time range (ISO 8601)"),
  userId: z.string().optional().describe("Filter by user ID"),
  version: z.string().optional().describe("Filter by version"),
});

interface ObservationListResponse {
  data: Array<{
    id: string;
    traceId: string;
    type: string;
    name?: string;
    startTime: string;
    endTime?: string;
    model?: string;
    modelParameters?: Record<string, unknown>;
    input?: unknown;
    output?: unknown;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    level?: string;
    statusMessage?: string;
    parentObservationId?: string;
    promptId?: string;
    promptName?: string;
    promptVersion?: number;
    metadata?: Record<string, unknown>;
    calculatedTotalCost?: number;
    calculatedInputCost?: number;
    calculatedOutputCost?: number;
    latency?: number;
  }>;
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export const listObservations = defineTool({
  name: "listObservations",
  description:
    "List observations (generations, spans, events) with cursor-based pagination. Includes usage metrics, costs, and latency.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("listObservations called with:", input);

    const queryParams: Record<string, string | number | undefined> = {
      page: input.cursor ? parseInt(input.cursor, 10) : 1,
      limit: input.limit,
      traceId: input.traceId,
      name: input.name,
      type: input.type,
      parentObservationId: input.parentObservationId,
      fromStartTime: input.fromStartTime,
      toStartTime: input.toStartTime,
      userId: input.userId,
      version: input.version,
    };

    const query = buildQueryString(queryParams);
    const response = await client.apiRequest<ObservationListResponse>(
      "GET",
      `/api/public/observations${query}`
    );

    const summary = formatPaginationSummary(
      response.data.length,
      response.meta.totalItems,
      response.meta.page,
      response.meta.page < response.meta.totalPages
    );

    // Add next cursor if there are more pages
    const result = {
      ...response,
      nextCursor:
        response.meta.page < response.meta.totalPages
          ? String(response.meta.page + 1)
          : undefined,
    };

    return formatSuccess(result, summary);
  },
});
