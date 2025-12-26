import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDataset } from "../../../src/tools/datasets/createDataset.js";
import { listDatasets } from "../../../src/tools/datasets/listDatasets.js";
import { getDataset } from "../../../src/tools/datasets/getDataset.js";
import { createDatasetItem } from "../../../src/tools/datasets/createDatasetItem.js";
import { listDatasetItems } from "../../../src/tools/datasets/listDatasetItems.js";
import { getDatasetItem } from "../../../src/tools/datasets/getDatasetItem.js";
import { deleteDatasetItem } from "../../../src/tools/datasets/deleteDatasetItem.js";
import { createDatasetRunItem } from "../../../src/tools/datasets/createDatasetRunItem.js";
import { listDatasetRuns } from "../../../src/tools/datasets/listDatasetRuns.js";
import { getDatasetRun } from "../../../src/tools/datasets/getDatasetRun.js";
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

describe("Dataset Tools", () => {
  let mockClient: LangfuseClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockClient = createMockClient();
    mockLogger = createMockLogger();
    vi.clearAllMocks();
  });

  describe("createDataset", () => {
    it("should create a dataset", async () => {
      const mockResponse = {
        id: "dataset-123",
        name: "test-dataset",
        description: "A test dataset",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await createDataset.handler(
        { name: "test-dataset", description: "A test dataset" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith("POST", "/api/public/v2/datasets", {
        name: "test-dataset",
        description: "A test dataset",
        metadata: undefined,
      });
      expect(result.content[0].text).toContain('Created dataset "test-dataset"');
    });

    it("should validate input schema", () => {
      expect(createDataset.inputSchema.safeParse({}).success).toBe(false);
      expect(createDataset.inputSchema.safeParse({ name: "test" }).success).toBe(true);
      expect(createDataset.inputSchema.safeParse({ name: "" }).success).toBe(false);
    });
  });

  describe("listDatasets", () => {
    it("should list datasets with default pagination", async () => {
      const mockResponse = {
        data: [
          { id: "ds-1", name: "dataset-1" },
          { id: "ds-2", name: "dataset-2" },
        ],
        meta: { page: 1, limit: 50, totalItems: 2, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listDatasets.handler({}, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Showing 2 of 2 items");
    });
  });

  describe("getDataset", () => {
    it("should get a dataset by name", async () => {
      const mockResponse = {
        id: "dataset-123",
        name: "my-dataset",
        items: [{ id: "item-1" }, { id: "item-2" }],
        runs: ["run-1", "run-2", "run-3"],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getDataset.handler(
        { datasetName: "my-dataset" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        "/api/public/v2/datasets/my-dataset"
      );
      expect(result.content[0].text).toContain("2 items");
      expect(result.content[0].text).toContain("3 runs");
    });

    it("should require datasetName", () => {
      expect(getDataset.inputSchema.safeParse({}).success).toBe(false);
      expect(getDataset.inputSchema.safeParse({ datasetName: "" }).success).toBe(false);
      expect(getDataset.inputSchema.safeParse({ datasetName: "test" }).success).toBe(true);
    });
  });

  describe("createDatasetItem", () => {
    it("should create a dataset item", async () => {
      const mockResponse = {
        id: "item-123",
        datasetId: "ds-456",
        datasetName: "my-dataset",
        input: { query: "test" },
        expectedOutput: { answer: "test answer" },
        status: "ACTIVE",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await createDatasetItem.handler(
        {
          datasetName: "my-dataset",
          input: { query: "test" },
          expectedOutput: { answer: "test answer" },
        },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith("POST", "/api/public/dataset-items", {
        datasetName: "my-dataset",
        input: { query: "test" },
        expectedOutput: { answer: "test answer" },
        metadata: undefined,
        sourceTraceId: undefined,
        sourceObservationId: undefined,
        id: undefined,
        status: undefined,
      });
      expect(result.content[0].text).toContain("Created dataset item");
    });

    it("should validate input schema", () => {
      expect(createDatasetItem.inputSchema.safeParse({}).success).toBe(false);
      expect(
        createDatasetItem.inputSchema.safeParse({ datasetName: "ds", input: "test" }).success
      ).toBe(true);
      expect(
        createDatasetItem.inputSchema.safeParse({
          datasetName: "ds",
          input: { foo: "bar" },
          status: "ACTIVE",
        }).success
      ).toBe(true);
      expect(
        createDatasetItem.inputSchema.safeParse({
          datasetName: "ds",
          input: "test",
          status: "INVALID",
        }).success
      ).toBe(false);
    });
  });

  describe("listDatasetItems", () => {
    it("should list dataset items", async () => {
      const mockResponse = {
        data: [
          { id: "item-1", datasetName: "my-dataset", input: "test1" },
          { id: "item-2", datasetName: "my-dataset", input: "test2" },
        ],
        meta: { page: 1, limit: 50, totalItems: 2, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listDatasetItems.handler(
        { datasetName: "my-dataset" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("datasetName=my-dataset")
      );
    });

    it("should require datasetName", () => {
      expect(listDatasetItems.inputSchema.safeParse({}).success).toBe(false);
      expect(listDatasetItems.inputSchema.safeParse({ datasetName: "test" }).success).toBe(true);
    });
  });

  describe("getDatasetItem", () => {
    it("should get a dataset item by ID", async () => {
      const mockResponse = {
        id: "item-123",
        datasetId: "ds-456",
        datasetName: "my-dataset",
        input: { query: "test" },
        status: "ACTIVE",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getDatasetItem.handler(
        { datasetItemId: "item-123" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        "/api/public/dataset-items/item-123"
      );
      expect(result.content[0].text).toContain("ACTIVE");
    });

    it("should require datasetItemId", () => {
      expect(getDatasetItem.inputSchema.safeParse({}).success).toBe(false);
      expect(getDatasetItem.inputSchema.safeParse({ datasetItemId: "" }).success).toBe(false);
      expect(getDatasetItem.inputSchema.safeParse({ datasetItemId: "abc" }).success).toBe(true);
    });
  });

  describe("deleteDatasetItem", () => {
    it("should delete a dataset item", async () => {
      vi.mocked(mockClient.apiRequest).mockResolvedValue(undefined);

      const result = await deleteDatasetItem.handler(
        { datasetItemId: "item-123" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "DELETE",
        "/api/public/dataset-items/item-123"
      );
      expect(result.content[0].text).toContain("Successfully deleted");
    });

    it("should require datasetItemId", () => {
      expect(deleteDatasetItem.inputSchema.safeParse({}).success).toBe(false);
      expect(deleteDatasetItem.inputSchema.safeParse({ datasetItemId: "abc" }).success).toBe(true);
    });
  });

  describe("createDatasetRunItem", () => {
    it("should create a dataset run item", async () => {
      const mockResponse = {
        id: "run-item-123",
        datasetRunId: "run-456",
        datasetRunName: "eval-run-1",
        datasetItemId: "item-789",
        traceId: "trace-abc",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await createDatasetRunItem.handler(
        {
          runName: "eval-run-1",
          datasetItemId: "item-789",
          traceId: "trace-abc",
        },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith("POST", "/api/public/dataset-run-items", {
        runName: "eval-run-1",
        runDescription: undefined,
        datasetItemId: "item-789",
        traceId: "trace-abc",
        observationId: undefined,
        metadata: undefined,
      });
      expect(result.content[0].text).toContain('Created run item in "eval-run-1"');
    });

    it("should validate input schema", () => {
      expect(createDatasetRunItem.inputSchema.safeParse({}).success).toBe(false);
      expect(
        createDatasetRunItem.inputSchema.safeParse({
          runName: "run",
          datasetItemId: "item",
          traceId: "trace",
        }).success
      ).toBe(true);
    });
  });

  describe("listDatasetRuns", () => {
    it("should list dataset runs", async () => {
      const mockResponse = {
        data: [
          { id: "run-1", name: "run-v1", datasetName: "my-dataset" },
          { id: "run-2", name: "run-v2", datasetName: "my-dataset" },
        ],
        meta: { page: 1, limit: 50, totalItems: 2, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listDatasetRuns.handler(
        { datasetName: "my-dataset" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        "/api/public/datasets/my-dataset/runs"
      );
    });

    it("should require datasetName", () => {
      expect(listDatasetRuns.inputSchema.safeParse({}).success).toBe(false);
      expect(listDatasetRuns.inputSchema.safeParse({ datasetName: "test" }).success).toBe(true);
    });
  });

  describe("getDatasetRun", () => {
    it("should get a dataset run by name", async () => {
      const mockResponse = {
        id: "run-123",
        name: "eval-run-1",
        datasetId: "ds-456",
        datasetName: "my-dataset",
        datasetRunItems: [
          { id: "item-1", traceId: "trace-1" },
          { id: "item-2", traceId: "trace-2" },
        ],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getDatasetRun.handler(
        { datasetName: "my-dataset", runName: "eval-run-1" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        "/api/public/datasets/my-dataset/runs/eval-run-1"
      );
      expect(result.content[0].text).toContain("2 items");
    });

    it("should require both datasetName and runName", () => {
      expect(getDatasetRun.inputSchema.safeParse({}).success).toBe(false);
      expect(getDatasetRun.inputSchema.safeParse({ datasetName: "ds" }).success).toBe(false);
      expect(getDatasetRun.inputSchema.safeParse({ runName: "run" }).success).toBe(false);
      expect(
        getDatasetRun.inputSchema.safeParse({ datasetName: "ds", runName: "run" }).success
      ).toBe(true);
    });
  });
});
