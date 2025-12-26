import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  datasetItemId: z.string().min(1).describe("The unique dataset item identifier"),
});

interface DatasetItemResponse {
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
}

export const getDatasetItem = defineTool({
  name: "getDatasetItem",
  description: "Get a specific dataset item by ID.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("getDatasetItem called with:", input);

    const response = await client.apiRequest<DatasetItemResponse>(
      "GET",
      `/api/public/dataset-items/${encodeURIComponent(input.datasetItemId)}`
    );

    const summary = `Dataset item ${response.id} from "${response.datasetName}" (${response.status})`;

    return formatSuccess(response, summary);
  },
});
