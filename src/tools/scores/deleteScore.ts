import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  scoreId: z.string().min(1).describe("The unique score identifier to delete"),
});

export const deleteScore = defineTool({
  name: "deleteScore",
  description: "Delete a specific score. This action is irreversible.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("deleteScore called with:", input);

    await client.apiRequest("DELETE", `/api/public/scores/${encodeURIComponent(input.scoreId)}`);

    return formatSuccess(
      { deleted: true, scoreId: input.scoreId },
      `Successfully deleted score: ${input.scoreId}`
    );
  },
});
