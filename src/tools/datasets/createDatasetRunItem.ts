import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  runName: z.string().min(1).describe("Name of the dataset run"),
  runDescription: z.string().optional().describe("Description of the run"),
  datasetItemId: z.string().min(1).describe("ID of the dataset item being evaluated"),
  traceId: z.string().min(1).describe("ID of the trace that processed this item"),
  observationId: z.string().optional().describe("ID of specific observation (if applicable)"),
  metadata: z.record(z.unknown()).optional().describe("Additional run item metadata"),
});

interface DatasetRunItemCreateResponse {
  id: string;
  datasetRunId: string;
  datasetRunName: string;
  datasetItemId: string;
  traceId: string;
  observationId?: string;
  createdAt: string;
  updatedAt: string;
}

export const createDatasetRunItem = defineTool({
  name: "createDatasetRunItem",
  description:
    "Create a dataset run item linking a trace/observation to a dataset item for evaluation.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("createDatasetRunItem called with:", input);

    const response = await client.apiRequest<DatasetRunItemCreateResponse>(
      "POST",
      "/api/public/dataset-run-items",
      {
        runName: input.runName,
        runDescription: input.runDescription,
        datasetItemId: input.datasetItemId,
        traceId: input.traceId,
        observationId: input.observationId,
        metadata: input.metadata,
      }
    );

    const summary = `Created run item in "${input.runName}" linking trace ${input.traceId} to item ${input.datasetItemId}`;

    return formatSuccess(response, summary);
  },
});
