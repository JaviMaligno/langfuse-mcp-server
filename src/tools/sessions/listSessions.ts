import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";
import { buildQueryString, formatPaginationSummary } from "../../utils/pagination.js";

const inputSchema = z.object({
  page: z.coerce.number().int().min(1).optional().describe("Page number (1-indexed)"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10).describe("Items per page"),
  fromTimestamp: z.string().optional().describe("Start of time range (ISO 8601)"),
  toTimestamp: z.string().optional().describe("End of time range (ISO 8601)"),
});

interface SessionListResponse {
  data: Array<{
    id: string;
    createdAt: string;
    projectId: string;
  }>;
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export const listSessions = defineTool({
  name: "listSessions",
  description: "List all sessions. Sessions group multiple traces from the same user interaction.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("listSessions called with:", input);

    const queryParams: Record<string, string | number | undefined> = {
      page: input.page,
      limit: input.limit,
      fromTimestamp: input.fromTimestamp,
      toTimestamp: input.toTimestamp,
    };

    const query = buildQueryString(queryParams);
    const response = await client.apiRequest<SessionListResponse>(
      "GET",
      `/api/public/sessions${query}`
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
