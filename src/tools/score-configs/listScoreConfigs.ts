import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";
import { buildQueryString, formatPaginationSummary } from "../../utils/pagination.js";

const inputSchema = z.object({
  page: z.coerce.number().int().min(1).optional().describe("Page number (1-indexed)"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10).describe("Items per page"),
});

interface ScoreConfigListResponse {
  data: Array<{
    id: string;
    name: string;
    dataType: string;
    minValue?: number;
    maxValue?: number;
    categories?: Array<{ value: number; label: string }>;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export const listScoreConfigs = defineTool({
  name: "listScoreConfigs",
  description: "List all score configurations in the project.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("listScoreConfigs called with:", input);

    const queryParams: Record<string, string | number | undefined> = {
      page: input.page,
      limit: input.limit,
    };

    const query = buildQueryString(queryParams);
    const response = await client.apiRequest<ScoreConfigListResponse>(
      "GET",
      `/api/public/score-configs${query}`
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
