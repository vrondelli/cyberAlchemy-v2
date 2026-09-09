// @ts-nocheck
import {describe, expect, it} from "vitest";
import {buildDeepLink, keyboardCommand, parseDeepLink} from "./keyboard.ts";

describe("navigation contracts", () => {
  it("maps documented keys and recovers invalid deep links", () => {
    expect(keyboardCommand({key: "i", shiftKey: true})).toBe("toggle-inspector");
    const url = buildDeepLink({runId: "run", selectedSourceRef: "F1", surface: "table", filters: {text: "O13"}});
    expect(parseDeepLink(url, ["F1", "R1"])).toMatchObject({selectedSourceRef: "F1", surface: "table"});
    expect(parseDeepLink("?selected=private-content", ["F1"])).toMatchObject({
      selectedSourceRef: "F1",
      recoveredInvalidSelection: true,
    });
  });
});
