import { describe, it, expect, vi, beforeEach } from "vitest";
import { listSessions } from "../../../src/tools/sessions/listSessions.js";
import { getSession } from "../../../src/tools/sessions/getSession.js";
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

describe("Session Tools", () => {
  let mockClient: LangfuseClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockClient = createMockClient();
    mockLogger = createMockLogger();
    vi.clearAllMocks();
  });

  describe("listSessions", () => {
    it("should list sessions with default pagination", async () => {
      const mockResponse = {
        data: [
          { id: "session-1", createdAt: "2025-01-01T00:00:00Z", projectId: "proj-1" },
          { id: "session-2", createdAt: "2025-01-01T00:01:00Z", projectId: "proj-1" },
        ],
        meta: { page: 1, limit: 50, totalItems: 2, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listSessions.handler({}, mockClient, mockLogger);

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toContain("Showing 2 of 2 items");
    });

    it("should filter by time range", async () => {
      const mockResponse = {
        data: [{ id: "session-1" }],
        meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      await listSessions.handler(
        {
          fromTimestamp: "2025-01-01T00:00:00Z",
          toTimestamp: "2025-01-02T00:00:00Z",
        },
        mockClient,
        mockLogger
      );

      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("fromTimestamp=")
      );
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        expect.stringContaining("toTimestamp=")
      );
    });

    it("should include nextCursor when more pages exist", async () => {
      const mockResponse = {
        data: [{ id: "session-1" }],
        meta: { page: 1, limit: 10, totalItems: 25, totalPages: 3 },
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await listSessions.handler({ limit: 10 }, mockClient, mockLogger);

      const responseData = JSON.parse(result.content[1].text as string);
      expect(responseData.nextCursor).toBe("2");
    });

    it("should validate input schema", () => {
      expect(listSessions.inputSchema.safeParse({}).success).toBe(true);
      expect(listSessions.inputSchema.safeParse({ page: 1 }).success).toBe(true);
      expect(listSessions.inputSchema.safeParse({ page: 0 }).success).toBe(false);
      expect(listSessions.inputSchema.safeParse({ limit: 200 }).success).toBe(false);
    });
  });

  describe("getSession", () => {
    it("should get a session by ID", async () => {
      const mockResponse = {
        id: "session-123",
        createdAt: "2025-01-01T00:00:00Z",
        projectId: "proj-1",
        traces: [
          { id: "trace-1", timestamp: "2025-01-01T00:00:00Z", name: "chat" },
          { id: "trace-2", timestamp: "2025-01-01T00:01:00Z", name: "chat" },
          { id: "trace-3", timestamp: "2025-01-01T00:02:00Z", name: "search" },
        ],
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getSession.handler(
        { sessionId: "session-123" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(mockClient.apiRequest).toHaveBeenCalledWith(
        "GET",
        "/api/public/sessions/session-123"
      );
      expect(result.content[0].text).toContain("3 traces");
    });

    it("should handle session with no traces", async () => {
      const mockResponse = {
        id: "session-456",
        createdAt: "2025-01-01T00:00:00Z",
        projectId: "proj-1",
        traces: [],
      };

      vi.mocked(mockClient.apiRequest).mockResolvedValue(mockResponse);

      const result = await getSession.handler(
        { sessionId: "session-456" },
        mockClient,
        mockLogger
      );

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("0 traces");
    });

    it("should require sessionId", () => {
      expect(getSession.inputSchema.safeParse({}).success).toBe(false);
      expect(getSession.inputSchema.safeParse({ sessionId: "" }).success).toBe(false);
      expect(getSession.inputSchema.safeParse({ sessionId: "abc" }).success).toBe(true);
    });
  });
});
