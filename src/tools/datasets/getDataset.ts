import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  datasetName: z.string().min(1).describe("The name of the dataset to retrieve"),
});

interface DatasetResponse {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  items: Array<{
    id: string;
    input: unknown;
    expectedOutput?: unknown;
    metadata?: Record<string, unknown>;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  runs: string[];
  createdAt: string;
  updatedAt: string;
}

export const getDataset = defineTool({
  name: "getDataset",
  description: "Get a dataset by name including its items and run names.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("getDataset called with:", input);

    const response = await client.apiRequest<DatasetResponse>(
      "GET",
      `/api/public/v2/datasets/${encodeURIComponent(input.datasetName)}`
    );

    const itemCount = response.items?.length ?? 0;
    const runCount = response.runs?.length ?? 0;
    const summary = `Dataset "${response.name}" with ${itemCount} items and ${runCount} runs`;

    return formatSuccess(response, summary);
  },
});
