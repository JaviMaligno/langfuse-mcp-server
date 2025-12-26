import { describe, it, expect, vi, beforeEach } from "vitest";
import { listObservations } from "../../../src/tools/observations/listObservations.js";
import { getObservation } from "../../../src/tools/observations/getObservation.js";
import type { LangfuseClient } from "../../../src/client.js";
import type { Logger } from "../../../src/config.js";

const createMockClient = () =>
  ({
    apiRequest: vi.fn(),
    sdk: {},
    shutdown: vi.fn(),
  }) as unknown as LangfuseClient;

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("Observation Tools", () => {
  let mockClient: LangfuseClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockClient = createMockClient();
    mockLogger = createMockLogger();
    vi.clearAllMocks();
  });

  describe("listObservations", () => {
    it("should list observations with default pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: "obs-1",
            traceId: "trace-1",
            type: "GENERATION",
            name: "chat-completion",
            startTime: "2025-01-01T00:00:00Z",
            model: "gpt-4",
          },
          {
            id: "obs-2",
            traceId: "trace-1",
            type: "SPAN",
            name: "preprocessing",
            startTime: "2025-01-01T00:00:01Z",
          },
        ],
        meta: { page: 1, limit: 50, totalItems: 2, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listObservations.handler({}, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toContain("Showing 2 of 2 items");
    });

    it("should filter by type", async () => {
      const mockResponse = {
        data: [{ id: "obs-1", traceId: "trace-1", type: "GENERATION" }],
        meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      await listObservations.handler(
        { type: "GENERATION", traceId: "trace-1" },
        mockClient,
        mockLogger
      );

      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("type=GENERATION")
      );
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("traceId=trace-1")
      );
    });

    it("should include nextCursor when more pages exist", async () => {
      const mockResponse = {
        data: [{ id: "obs-1" }],
        meta: { page: 1, limit: 10, totalItems: 25, totalPages: 3 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listObservations.handler({ limit: 10 }, mockClient, mockLogger);

      const responseData = JSON.parse(result.content[1].text as string);
      expect(responseData.nextCursor).toBe("2");
    });

    it("should validate input schema", () => {
      expect(listObservations.inputSchema.safeParse({}).success).toBe(true);
      expect(listObservations.inputSchema.safeParse({ type: "GENERATION" }).success).toBe(true);
      expect(listObservations.inputSchema.safeParse({ type: "INVALID" }).success).toBe(false);
      expect(listObservations.inputSchema.safeParse({ limit: 200 }).success).toBe(false);
    });
  });

  describe("getObservation", () => {
    it("should get an observation by ID", async () => {
      const mockResponse = {
        id: "obs-123",
        traceId: "trace-456",
        type: "GENERATION",
        name: "llm-call",
        model: "claude-3-sonnet",
        startTime: "2025-01-01T00:00:00Z",
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        calculatedTotalCost: 0.003,
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getObservation.handler(
        { observationId: "obs-123" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        "/api/public/observations/obs-123"
      );
      expect(result.content[0].text).toContain("generation");
      expect(result.content[0].text).toContain("claude-3-sonnet");
    });

    it("should require observationId", () => {
      expect(getObservation.inputSchema.safeParse({}).success).toBe(false);
      expect(getObservation.inputSchema.safeParse({ observationId: "" }).success).toBe(false);
      expect(getObservation.inputSchema.safeParse({ observationId: "abc" }).success).toBe(true);
    });
  });
});
