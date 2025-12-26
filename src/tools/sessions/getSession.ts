import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  sessionId: z.string().min(1).describe("The unique session identifier"),
});

interface SessionResponse {
  id: string;
  createdAt: string;
  projectId: string;
  traces: Array<{
    id: string;
    timestamp: string;
    name?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    release?: string;
    version?: string;
    input?: unknown;
    output?: unknown;
    tags?: string[];
  }>;
}

export const getSession = defineTool({
  name: "getSession",
  description: "Get a specific session by ID including its traces.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("getSession called with:", input);

    const response = await client.apiRequest<SessionResponse>(
      "GET",
      `/api/public/sessions/${encodeURIComponent(input.sessionId)}`
    );

    const traceCount = response.traces?.length ?? 0;
    const summary = `Session ${response.id} with ${traceCount} traces`;

    return formatSuccess(response, summary);
  },
});
