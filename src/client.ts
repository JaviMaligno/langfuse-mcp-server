import Langfuse from "langfuse";
import type { Config, Logger } from "./config.js";

/**
 * Wrapper around the Langfuse SDK that provides access to the API.
 * Uses Basic Auth with publicKey:secretKey for authentication.
 */
export class LangfuseClient {
  private langfuse: Langfuse;
  private logger: Logger;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: Config, logger: Logger) {
    this.logger = logger;
    this.baseUrl = config.langfuse.baseUrl;

    // Create Basic Auth header
    const credentials = `${config.langfuse.publicKey}:${config.langfuse.secretKey}`;
    this.authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;

    // Initialize Langfuse SDK
    this.langfuse = new Langfuse({
      publicKey: config.langfuse.publicKey,
      secretKey: config.langfuse.secretKey,
      baseUrl: config.langfuse.baseUrl,
    });

    this.logger.debug(`LangfuseClient initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Access the Langfuse SDK instance
   */
  get sdk(): Langfuse {
    return this.langfuse;
  }

  /**
   * Make a direct API request to Langfuse
   */
  async apiRequest<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    this.logger.debug(`API Request: ${method} ${path}`);

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`API Error: ${response.status} - ${errorText}`);
      throw new LangfuseApiError(response.status, errorText, path);
    }

    // Handle empty responses (e.g., DELETE)
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  /**
   * Shutdown the client and flush any pending data
   */
  async shutdown(): Promise<void> {
    await this.langfuse.shutdownAsync();
    this.logger.debug("LangfuseClient shutdown complete");
  }
}

/**
 * Custom error for Langfuse API errors
 */
export class LangfuseApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: string,
    public readonly path: string
  ) {
    super(`Langfuse API Error (${statusCode}) at ${path}: ${body}`);
    this.name = "LangfuseApiError";
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }
}
