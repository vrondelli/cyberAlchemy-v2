type HistoryEntry = {
  id: string;
  type: string;
  amount: number;
  date: string;
  createdAt: Date;
};

type CursorPayload = {
  date: string;
  createdAt: string;
  id: string;
};

export const DEFAULT_MAKEUP_HISTORY_LIMIT = 50;
export const MAX_MAKEUP_HISTORY_LIMIT = 200;

export const ensureValidHistoryLimit = (limit: number): void => {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_MAKEUP_HISTORY_LIMIT
  ) {
    throw new Error("Invalid limit");
  }
};

const encodeCursor = (payload: CursorPayload): string => {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
};

const decodeCursor = (cursor: string): CursorPayload | null => {
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Partial<CursorPayload>;

    if (
      typeof decoded.date !== "string" ||
      typeof decoded.createdAt !== "string" ||
      typeof decoded.id !== "string"
    ) {
      return null;
    }

    return {
      date: decoded.date,
      createdAt: decoded.createdAt,
      id: decoded.id,
    };
  } catch {
    return null;
  }
};

const compareEntriesDesc = (
  a: { date: string; createdAt: Date; id: string },
  b: { date: string; createdAt: Date; id: string },
): number => {
  if (a.date !== b.date) {
    return b.date.localeCompare(a.date);
  }

  const createdAtDiff = b.createdAt.getTime() - a.createdAt.getTime();
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return b.id.localeCompare(a.id);
};

export type BuildMakeupHistoryPageInput = {
  allTransactions: HistoryEntry[];
  limit: number;
  cursor?: string;
};

export type MakeupHistoryPage = {
  entries: HistoryEntry[];
  nextCursor: string | null;
};

export const buildMakeupHistoryPage = (
  input: BuildMakeupHistoryPageInput,
): MakeupHistoryPage => {
  ensureValidHistoryLimit(input.limit);

  const cursorPayload = input.cursor ? decodeCursor(input.cursor) : null;
  if (input.cursor && !cursorPayload) {
    throw new Error("Invalid cursor");
  }

  const makeupTransactions = input.allTransactions.filter(
    (item) =>
      item.type === "MAKEUP_ADJUSTMENT" || item.type === "MAKEUP_APPLIED",
  );

  const sortedEntries = [...makeupTransactions].sort(compareEntriesDesc);
  const startIndex = cursorPayload
    ? sortedEntries.findIndex((item) => {
        return (
          item.date === cursorPayload.date &&
          item.createdAt.toISOString() === cursorPayload.createdAt &&
          item.id === cursorPayload.id
        );
      }) + 1
    : 0;

  const safeStartIndex = Math.max(0, startIndex);
  const pagedEntries = sortedEntries.slice(
    safeStartIndex,
    safeStartIndex + input.limit,
  );
  const hasMore = safeStartIndex + input.limit < sortedEntries.length;
  const cursorEntry = hasMore ? pagedEntries[pagedEntries.length - 1] : null;

  return {
    entries: pagedEntries,
    nextCursor: cursorEntry
      ? encodeCursor({
          date: cursorEntry.date,
          createdAt: cursorEntry.createdAt.toISOString(),
          id: cursorEntry.id,
        })
      : null,
  };
};
