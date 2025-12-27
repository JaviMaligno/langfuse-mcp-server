import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";
import { buildQueryString, formatPaginationSummary } from "../../utils/pagination.js";

const inputSchema = z.object({
  datasetName: z.string().min(1).describe("Name of the dataset to list items from"),
  page: z.coerce.number().int().min(1).optional().describe("Page number (1-indexed)"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10).describe("Items per page"),
  sourceTraceId: z.string().optional().describe("Filter by source trace ID"),
  sourceObservationId: z.string().optional().describe("Filter by source observation ID"),
});

interface DatasetItemListResponse {
  data: Array<{
    id: string;
    datasetId: string;
    datasetName: string;
    input: unknown;
    expectedOutput?: unknown;
    metadata?: Record<string, unknown>;
    sourceTraceId?: string;
    sourceObservationId?: string;
    status: string;
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

export const listDatasetItems = defineTool({
  name: "listDatasetItems",
  description: "List items in a dataset with optional filtering.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("listDatasetItems called with:", input);

    const queryParams: Record<string, string | number | undefined> = {
      datasetName: input.datasetName,
      page: input.page,
      limit: input.limit,
      sourceTraceId: input.sourceTraceId,
      sourceObservationId: input.sourceObservationId,
    };

    const query = buildQueryString(queryParams);
    const response = await client.apiRequest<DatasetItemListResponse>(
      "GET",
      `/api/public/dataset-items${query}`
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
