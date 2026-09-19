import { describe, expect, it } from "vitest";
import {
  buildMakeupHistoryPage,
  DEFAULT_MAKEUP_HISTORY_LIMIT,
} from "./makeup-history.service";

describe("makeup-history.service", () => {
  it("validates default limit and returns newest-first makeup entries", () => {
    const result = buildMakeupHistoryPage({
      allTransactions: [
        {
          id: "t1",
          type: "MAKEUP_APPLIED",
          amount: 10,
          date: "2026-04-07",
          createdAt: new Date("2026-04-07T11:00:00.000Z"),
        },
        {
          id: "t2",
          type: "MAKEUP_ADJUSTMENT",
          amount: 20,
          date: "2026-04-08",
          createdAt: new Date("2026-04-08T11:00:00.000Z"),
        },
        {
          id: "x",
          type: "PAYOUT",
          amount: 99,
          date: "2026-04-09",
          createdAt: new Date("2026-04-09T11:00:00.000Z"),
        },
      ],
      limit: DEFAULT_MAKEUP_HISTORY_LIMIT,
    });

    expect(result.entries.map((item) => item.id)).toEqual(["t2", "t1"]);
    expect(result.nextCursor).toBeNull();
  });

  it("supports cursor paging and validates invalid cursor", () => {
    const firstPage = buildMakeupHistoryPage({
      allTransactions: [
        {
          id: "t2",
          type: "MAKEUP_ADJUSTMENT",
          amount: 20,
          date: "2026-04-08",
          createdAt: new Date("2026-04-08T11:00:00.000Z"),
        },
        {
          id: "t1",
          type: "MAKEUP_APPLIED",
          amount: 10,
          date: "2026-04-07",
          createdAt: new Date("2026-04-07T11:00:00.000Z"),
        },
      ],
      limit: 1,
    });

    expect(firstPage.entries).toHaveLength(1);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = buildMakeupHistoryPage({
      allTransactions: [
        {
          id: "t2",
          type: "MAKEUP_ADJUSTMENT",
          amount: 20,
          date: "2026-04-08",
          createdAt: new Date("2026-04-08T11:00:00.000Z"),
        },
        {
          id: "t1",
          type: "MAKEUP_APPLIED",
          amount: 10,
          date: "2026-04-07",
          createdAt: new Date("2026-04-07T11:00:00.000Z"),
        },
      ],
      limit: 1,
      cursor: firstPage.nextCursor ?? undefined,
    });

    expect(secondPage.entries.map((item) => item.id)).toEqual(["t1"]);

    expect(() =>
      buildMakeupHistoryPage({
        allTransactions: [],
        limit: 1,
        cursor: "bad-cursor",
      }),
    ).toThrow("Invalid cursor");
  });
});
