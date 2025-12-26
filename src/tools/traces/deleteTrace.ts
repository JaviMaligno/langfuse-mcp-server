import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  traceId: z.string().min(1).describe("The unique trace identifier to delete"),
});

export const deleteTrace = defineTool({
  name: "deleteTrace",
  description: "Delete a specific trace. This action is irreversible.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("deleteTrace called with:", input);

    await client.apiRequest("DELETE", `/api/public/traces/${encodeURIComponent(input.traceId)}`);

    return formatSuccess(
      { deleted: true, traceId: input.traceId },
      `Successfully deleted trace: ${input.traceId}`
    );
  },
});
