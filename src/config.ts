import { z } from "zod";

const ConfigSchema = z.object({
  langfuse: z.object({
    publicKey: z.string().min(1, "LANGFUSE_PUBLIC_KEY is required"),
    secretKey: z.string().min(1, "LANGFUSE_SECRET_KEY is required"),
    baseUrl: z.string().url().default("https://cloud.langfuse.com"),
  }),
  server: z.object({
    enablePrompts: z.boolean().default(false),
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const result = ConfigSchema.safeParse({
    langfuse: {
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
    },
    server: {
      enablePrompts: process.env.MCP_ENABLE_PROMPTS === "true",
      logLevel: process.env.LOG_LEVEL || "info",
    },
  });

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    throw new Error(`Configuration error:\n${errors.join("\n")}`);
  }

  return result.data;
}

export function createLogger(config: Config) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[config.server.logLevel];

  return {
    debug: (msg: string, ...args: unknown[]) => {
      if (currentLevel <= 0) console.error(`[DEBUG] ${msg}`, ...args);
    },
    info: (msg: string, ...args: unknown[]) => {
      if (currentLevel <= 1) console.error(`[INFO] ${msg}`, ...args);
    },
    warn: (msg: string, ...args: unknown[]) => {
      if (currentLevel <= 2) console.error(`[WARN] ${msg}`, ...args);
    },
    error: (msg: string, ...args: unknown[]) => {
      if (currentLevel <= 3) console.error(`[ERROR] ${msg}`, ...args);
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
