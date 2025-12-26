import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  scoreId: z.string().min(1).describe("The unique score identifier"),
});

interface ScoreResponse {
  id: string;
  traceId: string;
  observationId?: string;
  name: string;
  value: number | string;
  dataType: string;
  source: string;
  comment?: string;
  configId?: string;
  timestamp: string;
  stringValue?: string;
  authorUserId?: string;
  queueId?: string;
}

export const getScore = defineTool({
  name: "getScore",
  description: "Get a specific score by ID.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("getScore called with:", input);

    const response = await client.apiRequest<ScoreResponse>(
      "GET",
      `/api/public/v2/scores/${encodeURIComponent(input.scoreId)}`
    );

    const summary = `Score "${response.name}" = ${response.value} (${response.dataType})`;

    return formatSuccess(response, summary);
  },
});
