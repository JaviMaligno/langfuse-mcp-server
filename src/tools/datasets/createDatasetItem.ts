import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  datasetName: z.string().min(1).describe("Name of the dataset to add the item to"),
  input: z.unknown().describe("The input for this dataset item (any JSON value)"),
  expectedOutput: z.unknown().optional().describe("The expected output for evaluation"),
  metadata: z.record(z.unknown()).optional().describe("Additional metadata"),
  sourceTraceId: z.string().optional().describe("Link to source trace that generated this item"),
  sourceObservationId: z
    .string()
    .optional()
    .describe("Link to source observation (requires sourceTraceId)"),
  id: z.string().optional().describe("Custom ID for idempotent upsert"),
  status: z
    .enum(["ACTIVE", "ARCHIVED"])
    .optional()
    .describe("Item status (defaults to ACTIVE)"),
});

interface DatasetItemCreateResponse {
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

export const createDatasetItem = defineTool({
  name: "createDatasetItem",
  description:
    "Create or upsert a dataset item. Use id parameter for idempotent updates.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("createDatasetItem called with:", input);

    const response = await client.apiRequest<DatasetItemCreateResponse>(
      "POST",
      "/api/public/dataset-items",
      {
        datasetName: input.datasetName,
        input: input.input,
        expectedOutput: input.expectedOutput,
        metadata: input.metadata,
        sourceTraceId: input.sourceTraceId,
        sourceObservationId: input.sourceObservationId,
        id: input.id,
        status: input.status,
      }
    );

    const summary = `Created dataset item ${response.id} in "${input.datasetName}"`;

    return formatSuccess(response, summary);
  },
});
