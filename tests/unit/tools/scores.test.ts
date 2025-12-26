import { describe, it, expect, vi, beforeEach } from "vitest";
import { createScore } from "../../../src/tools/scores/createScore.js";
import { listScores } from "../../../src/tools/scores/listScores.js";
import { getScore } from "../../../src/tools/scores/getScore.js";
import { deleteScore } from "../../../src/tools/scores/deleteScore.js";
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

describe("Score Tools", () => {
  let mockClient: LangfuseClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockClient = createMockClient();
    mockLogger = createMockLogger();
    vi.clearAllMocks();
  });

  describe("createScore", () => {
    it("should create a numeric score for a trace", async () => {
      const mockResponse = {
        id: "score-123",
        traceId: "trace-456",
        name: "accuracy",
        value: 0.95,
        dataType: "NUMERIC",
        source: "API",
        timestamp: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await createScore.handler(
        { traceId: "trace-456", name: "accuracy", value: 0.95 },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith("POST", "/api/public/scores", {
        traceId: "trace-456",
        name: "accuracy",
        value: 0.95,
        observationId: undefined,
        dataType: undefined,
        comment: undefined,
        configId: undefined,
        id: undefined,
      });
      expect(result.content[0].text).toContain('Created score "accuracy"');
      expect(result.content[0].text).toContain("trace trace-456");
    });

    it("should create a score for an observation", async () => {
      const mockResponse = {
        id: "score-789",
        traceId: "trace-456",
        observationId: "obs-123",
        name: "relevance",
        value: "high",
        dataType: "CATEGORICAL",
        source: "API",
        timestamp: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await createScore.handler(
        {
          traceId: "trace-456",
          observationId: "obs-123",
          name: "relevance",
          value: "high",
          dataType: "CATEGORICAL",
        },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("observation obs-123");
    });

    it("should validate input schema", () => {
      expect(createScore.inputSchema.safeParse({}).success).toBe(false);
      expect(createScore.inputSchema.safeParse({ traceId: "t", name: "n", value: 1 }).success).toBe(
        true
      );
      expect(
        createScore.inputSchema.safeParse({ traceId: "t", name: "n", value: "pass" }).success
      ).toBe(true);
      expect(
        createScore.inputSchema.safeParse({
          traceId: "t",
          name: "n",
          value: 1,
          dataType: "BOOLEAN",
        }).success
      ).toBe(true);
      expect(
        createScore.inputSchema.safeParse({
          traceId: "t",
          name: "n",
          value: 1,
          dataType: "INVALID",
        }).success
      ).toBe(false);
    });
  });

  describe("listScores", () => {
    it("should list scores with default pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: "score-1",
            traceId: "trace-1",
            name: "accuracy",
            value: 0.9,
            dataType: "NUMERIC",
            source: "API",
            timestamp: "2025-01-01T00:00:00Z",
          },
          {
            id: "score-2",
            traceId: "trace-2",
            name: "relevance",
            value: "high",
            dataType: "CATEGORICAL",
            source: "ANNOTATION",
            timestamp: "2025-01-01T00:00:01Z",
          },
        ],
        meta: { page: 1, limit: 50, totalItems: 2, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listScores.handler({}, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toContain("Showing 2 of 2 items");
    });

    it("should filter by source and name", async () => {
      const mockResponse = {
        data: [{ id: "score-1", name: "accuracy", source: "EVAL" }],
        meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      await listScores.handler({ source: "EVAL", name: "accuracy" }, mockClient, mockLogger);

      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("source=EVAL")
      );
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("name=accuracy")
      );
    });

    it("should filter by value and operator", async () => {
      const mockResponse = {
        data: [{ id: "score-1", name: "accuracy", value: 0.95 }],
        meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      await listScores.handler({ operator: ">=", value: 0.9 }, mockClient, mockLogger);

      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("operator=%3E%3D")
      );
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("value=0.9")
      );
    });

    it("should validate input schema", () => {
      expect(listScores.inputSchema.safeParse({}).success).toBe(true);
      expect(listScores.inputSchema.safeParse({ source: "API" }).success).toBe(true);
      expect(listScores.inputSchema.safeParse({ source: "INVALID" }).success).toBe(false);
      expect(listScores.inputSchema.safeParse({ dataType: "NUMERIC" }).success).toBe(true);
      expect(listScores.inputSchema.safeParse({ operator: ">" }).success).toBe(true);
      expect(listScores.inputSchema.safeParse({ operator: "!!" }).success).toBe(false);
    });
  });

  describe("getScore", () => {
    it("should get a score by ID", async () => {
      const mockResponse = {
        id: "score-123",
        traceId: "trace-456",
        name: "accuracy",
        value: 0.95,
        dataType: "NUMERIC",
        source: "API",
        timestamp: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getScore.handler({ scoreId: "score-123" }, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        "/api/public/v2/scores/score-123"
      );
      expect(result.content[0].text).toContain('Score "accuracy" = 0.95');
    });

    it("should require scoreId", () => {
      expect(getScore.inputSchema.safeParse({}).success).toBe(false);
      expect(getScore.inputSchema.safeParse({ scoreId: "" }).success).toBe(false);
      expect(getScore.inputSchema.safeParse({ scoreId: "abc" }).success).toBe(true);
    });
  });

  describe("deleteScore", () => {
    it("should delete a score", async () => {
      vi.mocked(mockClient.apiRequest).mockResolvedValue(undefined);

      const result = await deleteScore.handler({ scoreId: "score-123" }, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "DELETE",
        "/api/public/scores/score-123"
      );
      expect(result.content[0].text).toContain("Successfully deleted score");
    });

    it("should require scoreId", () => {
      expect(deleteScore.inputSchema.safeParse({}).success).toBe(false);
      expect(deleteScore.inputSchema.safeParse({ scoreId: "" }).success).toBe(false);
      expect(deleteScore.inputSchema.safeParse({ scoreId: "abc" }).success).toBe(true);
    });
  });
});
