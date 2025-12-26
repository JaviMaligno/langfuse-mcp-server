import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";
import { buildQueryString, formatPaginationSummary } from "../../utils/pagination.js";

const inputSchema = z.object({
  page: z.number().int().min(1).optional().describe("Page number (1-indexed)"),
  limit: z.number().int().min(1).max(100).optional().default(50).describe("Items per page"),
});

interface DatasetListResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    metadata?: Record<string, unknown>;
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

export const listDatasets = defineTool({
  name: "listDatasets",
  description: "List all datasets in the project.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("listDatasets called with:", input);

    const queryParams: Record<string, string | number | undefined> = {
      page: input.page,
      limit: input.limit,
    };

    const query = buildQueryString(queryParams);
    const response = await client.apiRequest<DatasetListResponse>(
      "GET",
      `/api/public/v2/datasets${query}`
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
