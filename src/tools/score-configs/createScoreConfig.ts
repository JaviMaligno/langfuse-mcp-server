import { z } from "zod";
import { defineTool } from "../registry.js";
import { formatSuccess } from "../../utils/errors.js";

const categorySchema = z.object({
  value: z.number().describe("Numeric value for this category"),
  label: z.string().describe("Display label for this category"),
});

const inputSchema = z.object({
  name: z.string().min(1).describe("Unique name for the score configuration"),
  dataType: z
    .enum(["NUMERIC", "CATEGORICAL", "BOOLEAN"])
    .describe("Type of score values this config accepts"),
  minValue: z
    .number()
    .optional()
    .describe("Minimum allowed value (NUMERIC only)"),
  maxValue: z
    .number()
    .optional()
    .describe("Maximum allowed value (NUMERIC only)"),
  categories: z
    .array(categorySchema)
    .optional()
    .describe("Category definitions (CATEGORICAL only)"),
  description: z.string().optional().describe("Description of what this score measures"),
});

interface ScoreConfigCreateResponse {
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

export const createScoreConfig = defineTool({
  name: "createScoreConfig",
  description:
    "Create a score configuration that defines validation rules for scores. Supports numeric ranges, categorical values, and boolean types.",
  inputSchema,
  handler: async (input, client, logger) => {
    logger.debug("createScoreConfig called with:", input);

    const response = await client.apiRequest<ScoreConfigCreateResponse>(
      "POST",
      "/api/public/score-configs",
      {
        name: input.name,
        dataType: input.dataType,
        minValue: input.minValue,
        maxValue: input.maxValue,
        categories: input.categories,
        description: input.description,
      }
    );

    let summary = `Created score config "${input.name}" (${input.dataType})`;
    if (input.dataType === "NUMERIC" && (input.minValue !== undefined || input.maxValue !== undefined)) {
      summary += ` with range [${input.minValue ?? "-∞"}, ${input.maxValue ?? "∞"}]`;
    } else if (input.dataType === "CATEGORICAL" && input.categories) {
      summary += ` with ${input.categories.length} categories`;
    }

    return formatSuccess(response, summary);
  },
});
