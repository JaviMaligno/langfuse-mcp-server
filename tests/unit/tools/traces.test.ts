import { describe, it, expect, vi, beforeEach } from "vitest";
import { listTraces } from "../../../src/tools/traces/listTraces.js";
import { getTrace } from "../../../src/tools/traces/getTrace.js";
import { deleteTrace } from "../../../src/tools/traces/deleteTrace.js";
import type { LangfuseClient } from "../../../src/client.js";
import type { Logger } from "../../../src/config.js";

// Mock client
const createMockClient = () =>
  ({
    apiRequest: vi.fn(),
    sdk: {},
    shutdown: vi.fn(),
  }) as unknown as LangfuseClient;

// Mock logger
const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("Trace Tools", () => {
  let mockClient: LangfuseClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockClient = createMockClient();
    mockLogger = createMockLogger();
    vi.clearAllMocks();
  });

  describe("listTraces", () => {
    it("should list traces with default pagination", async () => {
      const mockResponse = {
        data: [
          { id: "trace-1", name: "Test Trace 1", timestamp: "2025-01-01T00:00:00Z" },
          { id: "trace-2", name: "Test Trace 2", timestamp: "2025-01-01T01:00:00Z" },
        ],
        meta: { page: 1, limit: 50, totalItems: 2, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listTraces.handler({}, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Showing 2 of 2 items");
    });

    it("should apply filters correctly", async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      await listTraces.handler(
        { name: "test", userId: "user-123", limit: 10 },
        mockClient,
        mockLogger
      );

      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("name=test")
      );
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("userId=user-123")
      );
    });

    it("should validate input schema", () => {
      // Valid input
      expect(listTraces.inputSchema.safeParse({}).success).toBe(true);
      expect(listTraces.inputSchema.safeParse({ page: 1 }).success).toBe(true);

      // Invalid input
      expect(listTraces.inputSchema.safeParse({ page: 0 }).success).toBe(false);
      expect(listTraces.inputSchema.safeParse({ limit: 200 }).success).toBe(false);
    });
  });

  describe("getTrace", () => {
    it("should get a trace by ID", async () => {
      const mockResponse = {
        id: "trace-123",
        name: "Test Trace",
        timestamp: "2025-01-01T00:00:00Z",
        observations: [{ id: "obs-1" }],
        scores: [{ id: "score-1", name: "accuracy", value: 0.9 }],
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getTrace.handler({ traceId: "trace-123" }, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith("GET", "/api/public/traces/trace-123");
    });

    it("should require traceId", () => {
      expect(getTrace.inputSchema.safeParse({}).success).toBe(false);
      expect(getTrace.inputSchema.safeParse({ traceId: "" }).success).toBe(false);
      expect(getTrace.inputSchema.safeParse({ traceId: "abc" }).success).toBe(true);
    });
  });

  describe("deleteTrace", () => {
    it("should delete a trace", async () => {
      vi.mocked(mockClient.apiRequest).mockResolvedValue({});

      const result = await deleteTrace.handler({ traceId: "trace-123" }, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith("DELETE", "/api/public/traces/trace-123");
      expect(result.content[0].text).toContain("Successfully deleted");
    });
  });
});
