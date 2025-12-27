import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  traceId: z.string().min(1).describe("The unique trace identifier"),
  includeIO: z.coerce
    .boolean()
    .optional()
    .default(false)
    .describe("Include input/output fields (can be very large, disabled by default)"),
});

interface TraceResponse {
  id: string;
  name?: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  input?: unknown;
  output?: unknown;
  latency?: number;
  totalCost?: number;
  observations?: Array<{
    id: string;
    type: string;
    name?: string;
    startTime: string;
    endTime?: string;
    model?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  }>;
  scores?: Array<{
    id: string;
    name: string;
    value: number | string;
    dataType: string;
  }>;
}

export const getTrace = defineTool({
  name: "getTrace",
  description: "Get a specific trace with full details including all observations and scores.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("getTrace called with:", input);

    const response = await client.apiRequest<TraceResponse>(
      "GET",
      `/api/public/traces/${encodeURIComponent(input.traceId)}`
    );

    // Optionally strip input/output fields to reduce response size
    let result = response;
    if (!input.includeIO) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { input: _i, output: _o, ...rest } = response;
      result = rest as TraceResponse;
    }

    const observationCount = response.observations?.length ?? 0;
    const scoreCount = response.scores?.length ?? 0;
    const summary = `Trace "${response.name || response.id}" with ${observationCount} observations and ${scoreCount} scores`;

    return formatSuccess(result, summary);
  },
});
