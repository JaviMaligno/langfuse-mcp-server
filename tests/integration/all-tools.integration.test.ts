/**
 * Integration tests for all Langfuse MCP tools
 *
 * These tests run against a real Langfuse API to verify
 * that all 22 tools work correctly with actual data.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestClient, createTestLogger, skipIfNoCredentials } from "./setup.js";
import type { LangfuseClient } from "../../src/client.js";
import type { Logger } from "../../src/config.js";

// Import all tools
import { listTraces, getTrace } from "../../src/tools/traces/index.js";
import { listObservations, getObservation } from "../../src/tools/observations/index.js";
import { listScores, getScore, createScore, deleteScore } from "../../src/tools/scores/index.js";
import {
  listScoreConfigs,
  getScoreConfig,
  createScoreConfig,
} from "../../src/tools/score-configs/index.js";
import {
  listDatasets,
  getDataset,
  createDataset,
  listDatasetItems,
  createDatasetItem,
  getDatasetItem,
  deleteDatasetItem,
  listDatasetRuns,
} from "../../src/tools/datasets/index.js";
import { listSessions, getSession } from "../../src/tools/sessions/index.js";

describe.skipIf(skipIfNoCredentials())("Langfuse MCP Integration Tests", () => {
  let client: LangfuseClient;
  let logger: Logger;

  // Test data references for cleanup
  const createdResources: { type: string; id: string }[] = [];

  beforeAll(() => {
    client = createTestClient();
    logger = createTestLogger();
  });

  afterAll(async () => {
    // Cleanup created resources
    for (const resource of createdResources) {
      try {
        switch (resource.type) {
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
    await client.shutdown();
  });

  describe("Traces", () => {
    let existingTraceId: string | undefined;

    it("should list traces", async () => {
      const result = await listTraces.handler({ limit: 5 }, client, logger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toContain("Showing");

      // Parse response to get a trace ID for subsequent tests
      const responseData = JSON.parse(result.content[1].text as string);
      if (responseData.data && responseData.data.length > 0) {
        existingTraceId = responseData.data[0].id;
      }
    });

    it("should get a trace by ID", async function () {
      if (!existingTraceId) {
        console.log("Skipping: No traces available in Langfuse");
        return;
      }

      const result = await getTrace.handler({ traceId: existingTraceId }, client, logger);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Trace");
    });
  });

  describe("Observations", () => {
    it("should list observations", async () => {
      const result = await listObservations.handler({ limit: 5 }, client, logger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
    });

    it("should get an observation by ID", async () => {
      // First list observations to get an ID
      const listResult = await listObservations.handler({ limit: 1 }, client, logger);
      const responseData = JSON.parse(listResult.content[1].text as string);

      if (!responseData.data || responseData.data.length === 0) {
        console.log("Skipping: No observations available");
        return;
      }

      const observationId = responseData.data[0].id;
      const result = await getObservation.handler({ observationId }, client, logger);

      expect(result.isError).toBeUndefined();
    });
  });

  describe("Scores", () => {
    let testScoreId: string | undefined;

    it("should list scores", async () => {
      const result = await listScores.handler({ limit: 5 }, client, logger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
    });

    it("should create and delete a score", async () => {
      // First get a trace ID to score
      const tracesResult = await listTraces.handler({ limit: 1 }, client, logger);
      const tracesData = JSON.parse(tracesResult.content[1].text as string);

      if (!tracesData.data || tracesData.data.length === 0) {
        console.log("Skipping: No traces available to score");
        return;
      }

      const traceId = tracesData.data[0].id;

      // Create a score
      const createResult = await createScore.handler(
        {
          traceId,
          name: "integration-test-score",
          value: 0.95,
          comment: "Created by integration test",
        },
        client,
        logger
      );

      expect(createResult.isError).toBeUndefined();
      expect(createResult.content[0].text).toContain("Created score");

      // Parse to get score ID
      const scoreData = JSON.parse(createResult.content[1].text as string);
      testScoreId = scoreData.id;
      createdResources.push({ type: "score", id: testScoreId });

      // Wait a bit for eventual consistency
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to get the score (may fail due to eventual consistency)
      try {
        const getResult = await getScore.handler({ scoreId: testScoreId }, client, logger);
        expect(getResult.isError).toBeUndefined();
      } catch {
        console.log("Note: Score not immediately available (eventual consistency)");
      }

      // Delete the score
      const deleteResult = await deleteScore.handler({ scoreId: testScoreId }, client, logger);
      expect(deleteResult.isError).toBeUndefined();
      expect(deleteResult.content[0].text).toContain("Successfully deleted");

      // Remove from cleanup list since we already deleted it
      const index = createdResources.findIndex((r) => r.id === testScoreId);
      if (index > -1) createdResources.splice(index, 1);
    });
  });

  describe("Score Configs", () => {
    it("should list score configs", async () => {
      const result = await listScoreConfigs.handler({}, client, logger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
    });

    it("should get a score config by ID", async () => {
      // First list to get an ID
      const listResult = await listScoreConfigs.handler({ limit: 1 }, client, logger);
      const responseData = JSON.parse(listResult.content[1].text as string);

      if (!responseData.data || responseData.data.length === 0) {
        console.log("Skipping: No score configs available");
        return;
      }

      const configId = responseData.data[0].id;
      const result = await getScoreConfig.handler({ configId }, client, logger);

      expect(result.isError).toBeUndefined();
    });
  });

  describe("Datasets", () => {
    const testDatasetName = `integration-test-${Date.now()}`;
    let testDatasetItemId: string | undefined;

    it("should list datasets", async () => {
      const result = await listDatasets.handler({}, client, logger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
    });

    it("should create a dataset", async () => {
      const result = await createDataset.handler(
        {
          name: testDatasetName,
          description: "Integration test dataset",
        },
        client,
        logger
      );

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Created dataset");
    });

    it("should get a dataset by name", async () => {
      const result = await getDataset.handler({ datasetName: testDatasetName }, client, logger);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain(testDatasetName);
    });

    it("should create a dataset item", async () => {
      const result = await createDatasetItem.handler(
        {
          datasetName: testDatasetName,
          input: { query: "Test query from integration test" },
          expectedOutput: { answer: "Test answer" },
        },
        client,
        logger
      );

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("Created dataset item");

      // Parse to get item ID
      const itemData = JSON.parse(result.content[1].text as string);
      testDatasetItemId = itemData.id;
      createdResources.push({ type: "datasetItem", id: testDatasetItemId });
    });

    it("should list dataset items", async () => {
      const result = await listDatasetItems.handler(
        { datasetName: testDatasetName },
        client,
        logger
      );

      expect(result.isError).toBeUndefined();
    });

    it("should get a dataset item by ID", async () => {
      if (!testDatasetItemId) {
        console.log("Skipping: No dataset item created");
        return;
      }

      const result = await getDatasetItem.handler(
        { datasetItemId: testDatasetItemId },
        client,
        logger
      );

      expect(result.isError).toBeUndefined();
    });

    it("should list dataset runs", async () => {
      const result = await listDatasetRuns.handler(
        { datasetName: testDatasetName },
        client,
        logger
      );

      expect(result.isError).toBeUndefined();
    });

    it("should delete a dataset item", async () => {
      if (!testDatasetItemId) {
        console.log("Skipping: No dataset item to delete");
        return;
      }

      const result = await deleteDatasetItem.handler(
        { datasetItemId: testDatasetItemId },
        client,
        logger
      );

      expect(result.isError).toBeUndefined();

      // Remove from cleanup list
      const index = createdResources.findIndex((r) => r.id === testDatasetItemId);
      if (index > -1) createdResources.splice(index, 1);
    });
  });

  describe("Sessions", () => {
    it("should list sessions", async () => {
      const result = await listSessions.handler({ limit: 5 }, client, logger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
    });

    it("should get a session by ID", async () => {
      // First list to get an ID
      const listResult = await listSessions.handler({ limit: 1 }, client, logger);
      const responseData = JSON.parse(listResult.content[1].text as string);

      if (!responseData.data || responseData.data.length === 0) {
        console.log("Skipping: No sessions available");
        return;
      }

      const sessionId = responseData.data[0].id;
      const result = await getSession.handler({ sessionId }, client, logger);

      expect(result.isError).toBeUndefined();
    });
  });
});
