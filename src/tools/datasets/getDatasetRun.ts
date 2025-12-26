import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  datasetName: z.string().min(1).describe("Name of the dataset"),
  runName: z.string().min(1).describe("Name of the run to retrieve"),
});

interface DatasetRunResponse {
  id: string;
  name: string;
  description?: string;
  datasetId: string;
  datasetName: string;
  metadata?: Record<string, unknown>;
  datasetRunItems: Array<{
    id: string;
    datasetItemId: string;
    traceId: string;
    observationId?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const getDatasetRun = defineTool({
  name: "getDatasetRun",
  description: "Get a specific dataset run by name including its run items.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("getDatasetRun called with:", input);

    const response = await client.apiRequest<DatasetRunResponse>(
      "GET",
      `/api/public/datasets/${encodeURIComponent(input.datasetName)}/runs/${encodeURIComponent(input.runName)}`
    );

    const itemCount = response.datasetRunItems?.length ?? 0;
    const summary = `Run "${response.name}" with ${itemCount} items`;

    return formatSuccess(response, summary);
  },
});
