import { describe, it, expect, vi, beforeEach } from "vitest";
import { createScoreConfig } from "../../../src/tools/score-configs/createScoreConfig.js";
import { listScoreConfigs } from "../../../src/tools/score-configs/listScoreConfigs.js";
import { getScoreConfig } from "../../../src/tools/score-configs/getScoreConfig.js";
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

describe("Score Config Tools", () => {
  let mockClient: LangfuseClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockClient = createMockClient();
    mockLogger = createMockLogger();
    vi.clearAllMocks();
  });

  describe("createScoreConfig", () => {
    it("should create a numeric score config", async () => {
      const mockResponse = {
        id: "config-123",
        name: "accuracy",
        dataType: "NUMERIC",
        minValue: 0,
        maxValue: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await createScoreConfig.handler(
        { name: "accuracy", dataType: "NUMERIC", minValue: 0, maxValue: 1 },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith("POST", "/api/public/score-configs", {
        name: "accuracy",
        dataType: "NUMERIC",
        minValue: 0,
        maxValue: 1,
        categories: undefined,
        description: undefined,
      });
      expect(result.content[0].text).toContain('Created score config "accuracy"');
      expect(result.content[0].text).toContain("[0, 1]");
    });

    it("should create a categorical score config", async () => {
      const mockResponse = {
        id: "config-456",
        name: "sentiment",
        dataType: "CATEGORICAL",
        categories: [
          { value: 0, label: "negative" },
          { value: 1, label: "neutral" },
          { value: 2, label: "positive" },
        ],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await createScoreConfig.handler(
        {
          name: "sentiment",
          dataType: "CATEGORICAL",
          categories: [
            { value: 0, label: "negative" },
            { value: 1, label: "neutral" },
            { value: 2, label: "positive" },
          ],
        },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("3 categories");
    });

    it("should create a boolean score config", async () => {
      const mockResponse = {
        id: "config-789",
        name: "is_relevant",
        dataType: "BOOLEAN",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await createScoreConfig.handler(
        { name: "is_relevant", dataType: "BOOLEAN" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("BOOLEAN");
    });

    it("should validate input schema", () => {
      expect(createScoreConfig.inputSchema.safeParse({}).success).toBe(false);
      expect(
        createScoreConfig.inputSchema.safeParse({ name: "test", dataType: "NUMERIC" }).success
      ).toBe(true);
      expect(
        createScoreConfig.inputSchema.safeParse({ name: "test", dataType: "INVALID" }).success
      ).toBe(false);
      expect(
        createScoreConfig.inputSchema.safeParse({
          name: "test",
          dataType: "CATEGORICAL",
          categories: [{ value: 0, label: "a" }],
        }).success
      ).toBe(true);
    });
  });

  describe("listScoreConfigs", () => {
    it("should list score configs with default pagination", async () => {
      const mockResponse = {
        data: [
          { id: "config-1", name: "accuracy", dataType: "NUMERIC" },
          { id: "config-2", name: "sentiment", dataType: "CATEGORICAL" },
        ],
        meta: { page: 1, limit: 50, totalItems: 2, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listScoreConfigs.handler({}, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toContain("Showing 2 of 2 items");
    });

    it("should support pagination", async () => {
      const mockResponse = {
        data: [{ id: "config-1", name: "test" }],
        meta: { page: 2, limit: 10, totalItems: 15, totalPages: 2 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      await listScoreConfigs.handler({ page: 2, limit: 10 }, mockClient, mockLogger);

      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("page=2")
      );
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("limit=10")
      );
    });

    it("should validate input schema", () => {
      expect(listScoreConfigs.inputSchema.safeParse({}).success).toBe(true);
      expect(listScoreConfigs.inputSchema.safeParse({ page: 1 }).success).toBe(true);
      expect(listScoreConfigs.inputSchema.safeParse({ page: 0 }).success).toBe(false);
      expect(listScoreConfigs.inputSchema.safeParse({ limit: 200 }).success).toBe(false);
    });
  });

  describe("getScoreConfig", () => {
    it("should get a numeric score config by ID", async () => {
      const mockResponse = {
        id: "config-123",
        name: "accuracy",
        dataType: "NUMERIC",
        minValue: 0,
        maxValue: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getScoreConfig.handler(
        { configId: "config-123" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        "/api/public/score-configs/config-123"
      );
      expect(result.content[0].text).toContain('Score config "accuracy"');
      expect(result.content[0].text).toContain("[0, 1]");
    });

    it("should get a categorical score config by ID", async () => {
      const mockResponse = {
        id: "config-456",
        name: "sentiment",
        dataType: "CATEGORICAL",
        categories: [
          { value: 0, label: "negative" },
          { value: 1, label: "positive" },
        ],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getScoreConfig.handler(
        { configId: "config-456" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("2 categories");
    });

    it("should require configId", () => {
      expect(getScoreConfig.inputSchema.safeParse({}).success).toBe(false);
      expect(getScoreConfig.inputSchema.safeParse({ configId: "" }).success).toBe(false);
      expect(getScoreConfig.inputSchema.safeParse({ configId: "abc" }).success).toBe(true);
    });
  });
});
