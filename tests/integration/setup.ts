/**
 * Integration test setup
 *
 * These tests run against a real Langfuse API.
 * Required environment variables:
 * - LANGFUSE_PUBLIC_KEY
 * - LANGFUSE_SECRET_KEY
 * - LANGFUSE_BASE_URL
 */

import { LangfuseClient } from "../../src/client.js";
import type { Config, Logger } from "../../src/config.js";

export function getTestConfig(): Config {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com";

  if (!publicKey || !secretKey) {
    throw new Error(
      "Integration tests require LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY environment variables"
    );
  }

  return {
    langfuse: {
      publicKey,
      secretKey,
      baseUrl,
    },
    server: {
      enablePrompts: false,
      logLevel: "error", // Quiet during tests
    },
  };
}

export function createTestLogger(): Logger {
  return {
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error,
  };
}

export function createTestClient(): LangfuseClient {
  const config = getTestConfig();
  const logger = createTestLogger();
  return new LangfuseClient(config, logger);
}

/**
 * Skip integration tests if credentials are not available
 */
export function skipIfNoCredentials(): boolean {
  return !process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY;
}

/**
 * Test data cleanup helper
 */
export async function cleanupTestData(
  client: LangfuseClient,
  resources: { type: string; id: string }[]
): Promise<void> {
  for (const resource of resources) {
    try {
      switch (resource.type) {
        case "trace":
          await client.apiRequest("DELETE", `/api/public/traces/${resource.id}`);
          break;
        case "score":
          await client.apiRequest("DELETE", `/api/public/scores/${resource.id}`);
          break;
        case "datasetItem":
          await client.apiRequest("DELETE", `/api/public/dataset-items/${resource.id}`);
          break;
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}
