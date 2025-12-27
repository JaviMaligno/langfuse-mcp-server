import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";
import { buildQueryString, formatPaginationSummary } from "../../utils/pagination.js";

const inputSchema = z.object({
  page: z.coerce.number().int().min(1).optional().describe("Page number (1-indexed)"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10).describe("Items per page"),
  traceId: z.string().optional().describe("Filter by trace ID"),
  observationId: z.string().optional().describe("Filter by observation ID"),
  name: z.string().optional().describe("Filter by score name"),
  source: z
    .enum(["API", "ANNOTATION", "EVAL"])
    .optional()
    .describe("Filter by score source"),
  dataType: z
    .enum(["NUMERIC", "CATEGORICAL", "BOOLEAN"])
    .optional()
    .describe("Filter by data type"),
  configId: z.string().optional().describe("Filter by score config ID"),
  fromTimestamp: z.string().optional().describe("Start of time range (ISO 8601)"),
  toTimestamp: z.string().optional().describe("End of time range (ISO 8601)"),
  userId: z.string().optional().describe("Filter by user ID who created the trace"),
  operator: z
    .enum(["<", ">", "<=", ">=", "!=", "="])
    .optional()
    .describe("Comparison operator for value filter"),
  value: z.coerce.number().optional().describe("Value to compare against (requires operator)"),
});

interface ScoreListResponse {
  data: Array<{
    id: string;
    traceId: string;
    observationId?: string;
    name: string;
    value: number | string;
    dataType: string;
    source: string;
    comment?: string;
    configId?: string;
    timestamp: string;
    stringValue?: string;
  }>;
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export const listScores = defineTool({
  name: "listScores",
  description: "List scores with filtering. Supports both trace and observation scores.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("listScores called with:", input);

    const queryParams: Record<string, string | number | undefined> = {
      page: input.page,
      limit: input.limit,
      traceId: input.traceId,
      observationId: input.observationId,
      name: input.name,
      source: input.source,
      dataType: input.dataType,
      configId: input.configId,
      fromTimestamp: input.fromTimestamp,
      toTimestamp: input.toTimestamp,
      userId: input.userId,
      operator: input.operator,
      value: input.value,
    };

    const query = buildQueryString(queryParams);
    const response = await client.apiRequest<ScoreListResponse>(
      "GET",
      `/api/public/v2/scores${query}`
    );

    const summary = formatPaginationSummary(
      response.data.length,
      response.meta.totalItems,
      response.meta.page,
      response.meta.page < response.meta.totalPages
    );

    return formatSuccess(response, summary);
  },
});
