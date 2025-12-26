import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";
import { buildQueryString, formatPaginationSummary } from "../../utils/pagination.js";

const inputSchema = z.object({
  datasetName: z.string().min(1).describe("Name of the dataset to list runs from"),
  page: z.number().int().min(1).optional().describe("Page number (1-indexed)"),
  limit: z.number().int().min(1).max(100).optional().default(50).describe("Items per page"),
});

interface DatasetRunListResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    datasetId: string;
    datasetName: string;
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

export const listDatasetRuns = defineTool({
  name: "listDatasetRuns",
  description: "List all runs for a specific dataset.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("listDatasetRuns called with:", input);

    const queryParams: Record<string, string | number | undefined> = {
      page: input.page,
      limit: input.limit,
    };

    const query = buildQueryString(queryParams);
    const response = await client.apiRequest<DatasetRunListResponse>(
      "GET",
      `/api/public/datasets/${encodeURIComponent(input.datasetName)}/runs${query}`
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
