/**
 * Standard pagination parameters for list operations
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Cursor-based pagination parameters
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

/**
 * Build query string from pagination params
 */
export function buildPaginationQuery(params: PaginationParams): string {
  const query = new URLSearchParams();

  if (params.page !== undefined) {
    query.set("page", String(params.page));
  }
  if (params.limit !== undefined) {
    query.set("limit", String(params.limit));
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Build query string including any additional filters
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | string[] | undefined>
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      // Handle arrays (e.g., tags)
      for (const item of value) {
        query.append(key, item);
      }
    } else if (typeof value === "boolean") {
      query.set(key, value ? "true" : "false");
    } else {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Format pagination info for response summary
 */
export function formatPaginationSummary(
  count: number,
  total?: number,
  page?: number,
  hasMore?: boolean
): string {
  const parts: string[] = [];

  if (total !== undefined) {
    parts.push(`Showing ${count} of ${total} items`);
  } else {
    parts.push(`Found ${count} items`);
  }

  if (page !== undefined) {
    parts.push(`(page ${page})`);
  }

  if (hasMore) {
    parts.push("- more available");
  }

  return parts.join(" ");
}
