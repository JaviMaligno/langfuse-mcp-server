import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  datasetItemId: z.string().min(1).describe("The unique dataset item identifier to delete"),
});

export const deleteDatasetItem = defineTool({
  name: "deleteDatasetItem",
  description: "Delete a specific dataset item. This action is irreversible.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("deleteDatasetItem called with:", input);

    await client.apiRequest(
      "DELETE",
      `/api/public/dataset-items/${encodeURIComponent(input.datasetItemId)}`
    );

    return formatSuccess(
      { deleted: true, datasetItemId: input.datasetItemId },
      `Successfully deleted dataset item: ${input.datasetItemId}`
    );
  },
});
