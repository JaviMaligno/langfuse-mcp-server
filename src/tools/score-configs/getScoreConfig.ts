import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const inputSchema = z.object({
  configId: z.string().min(1).describe("The unique score config identifier"),
});

interface ScoreConfigResponse {
  id: string;
  name: string;
  dataType: string;
  minValue?: number;
  maxValue?: number;
  categories?: Array<{ value: number; label: string }>;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const getScoreConfig = defineTool({
  name: "getScoreConfig",
  description: "Get a specific score configuration by ID.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("getScoreConfig called with:", input);

    const response = await client.apiRequest<ScoreConfigResponse>(
      "GET",
      `/api/public/score-configs/${encodeURIComponent(input.configId)}`
    );

    let summary = `Score config "${response.name}" (${response.dataType})`;
    if (response.dataType === "NUMERIC") {
      const min = response.minValue ?? "-∞";
      const max = response.maxValue ?? "∞";
      summary += ` [${min}, ${max}]`;
    } else if (response.dataType === "CATEGORICAL" && response.categories) {
      summary += ` with ${response.categories.length} categories`;
    }

    return formatSuccess(response, summary);
  },
});
