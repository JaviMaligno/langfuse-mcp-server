import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  observationId: z.string().min(1).describe("The unique observation identifier"),
  includeIO: z.coerce
    .boolean()
    .optional()
    .default(false)
    .describe("Include input/output fields (can be very large, disabled by default)"),
});

interface ObservationResponse {
  id: string;
  traceId: string;
  type: string;
  name?: string;
  startTime: string;
  endTime?: string;
  completionStartTime?: string;
  model?: string;
  modelParameters?: Record<string, unknown>;
  input?: unknown;
  output?: unknown;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    input?: number;
    output?: number;
    total?: number;
    unit?: string;
  };
  level?: string;
  statusMessage?: string;
  parentObservationId?: string;
  promptId?: string;
  promptName?: string;
  promptVersion?: number;
  metadata?: Record<string, unknown>;
  calculatedTotalCost?: number;
  calculatedInputCost?: number;
  calculatedOutputCost?: number;
  latency?: number;
  timeToFirstToken?: number;
}

export const getObservation = defineTool({
  name: "getObservation",
  description:
    "Get a specific observation with all details including input/output, usage, costs, and timing.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("getObservation called with:", input);

    const response = await client.apiRequest<ObservationResponse>(
      "GET",
      `/api/public/observations/${encodeURIComponent(input.observationId)}`
    );

    // Optionally strip input/output fields to reduce response size
    let result = response;
    if (!input.includeIO) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { input: _i, output: _o, ...rest } = response;
      result = rest as ObservationResponse;
    }

    const typeLabel = response.type.toLowerCase();
    const modelInfo = response.model ? ` using ${response.model}` : "";
    const summary = `${typeLabel} "${response.name || response.id}"${modelInfo}`;

    return formatSuccess(result, summary);
  },
});
