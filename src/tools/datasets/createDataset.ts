import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  name: z.string().min(1).describe("Unique name for the dataset"),
  description: z.string().optional().describe("Description of the dataset"),
  metadata: z.record(z.unknown()).optional().describe("Additional metadata as key-value pairs"),
});

interface DatasetCreateResponse {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const createDataset = defineTool({
  name: "createDataset",
  description:
    "Create a new dataset for evaluation. Datasets contain items with expected inputs/outputs for testing LLM applications.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("createDataset called with:", input);

    const response = await client.apiRequest<DatasetCreateResponse>(
      "POST",
      "/api/public/v2/datasets",
      {
        name: input.name,
        description: input.description,
        metadata: input.metadata,
      }
    );

    const summary = `Created dataset "${input.name}"${input.description ? `: ${input.description}` : ""}`;

    return formatSuccess(response, summary);
  },
});
