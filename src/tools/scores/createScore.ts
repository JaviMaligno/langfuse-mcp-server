import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  traceId: z.string().min(1).describe("ID of the trace to score"),
  observationId: z.string().optional().describe("Optional: ID of specific observation to score"),
  name: z.string().min(1).describe("Name of the score (e.g., 'accuracy', 'relevance')"),
  value: z
    .union([z.number(), z.string()])
    .describe("Score value - numeric for NUMERIC type, string for CATEGORICAL/BOOLEAN"),
  dataType: z
    .enum(["NUMERIC", "CATEGORICAL", "BOOLEAN"])
    .optional()
    .describe("Type of score value"),
  comment: z.string().optional().describe("Optional comment explaining the score"),
  configId: z.string().optional().describe("Optional score config ID for validation"),
  id: z.string().optional().describe("Optional custom ID for idempotency"),
});

interface ScoreCreateResponse {
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
}

export const createScore = defineTool({
  name: "createScore",
  description:
    "Create a score for a trace or observation. Supports numeric, boolean, and categorical score types.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("createScore called with:", input);

    const response = await client.apiRequest<ScoreCreateResponse>("POST", "/api/public/scores", {
      traceId: input.traceId,
      observationId: input.observationId,
      name: input.name,
      value: input.value,
      dataType: input.dataType,
      comment: input.comment,
      configId: input.configId,
      id: input.id,
    });

    const targetDesc = input.observationId
      ? `observation ${input.observationId}`
      : `trace ${input.traceId}`;
    const summary = `Created score "${input.name}" = ${input.value} for ${targetDesc}`;

    return formatSuccess(response, summary);
  },
});
