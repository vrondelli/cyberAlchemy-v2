import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const sourceRoot = new URL("../upstream/overlay/packages/dashboard/src/oew/", import.meta.url);
const keyboardSource = await readFile(new URL("keyboard.ts", sourceRoot));
const {buildDeepLink, keyboardCommand, parseDeepLink} = await import(
  `data:text/javascript;base64,${keyboardSource.toString("base64")}`
);

test("documented keyboard commands map to the evidence-only UI", () => {
  assert.equal(keyboardCommand({key: "/", metaKey: false, ctrlKey: false, shiftKey: false}), "open-search");
  assert.equal(keyboardCommand({key: "k", metaKey: true}), "open-search");
  assert.equal(keyboardCommand({key: "I", shiftKey: true}), "toggle-inspector");
  assert.equal(keyboardCommand({key: "r"}), "toggle-receipts");
  assert.equal(keyboardCommand({key: "g"}), "view-graph");
  assert.equal(keyboardCommand({key: "o"}), "view-outline");
  assert.equal(keyboardCommand({key: "t"}), "view-table");
  assert.equal(keyboardCommand({key: "c"}), null);
});

test("deep links encode handles, not raw private content, and recover safely", () => {
  const url = buildDeepLink({
    runId: "SWU-OCGP-008",
    selectedSourceRef: "C-SPECIALIZES-D2-D1",
    surface: "table",
    filters: {text: "owner unbound"},
  });
  assert.match(url, /run=SWU-OCGP-008/);
  assert.match(url, /selected=C-SPECIALIZES-D2-D1/);
  assert.doesNotMatch(url, /validation%2Fpoker-team/);
  assert.deepEqual(
    parseDeepLink("?selected=unknown&surface=code&q=O13", ["F1", "R1"]),
    {
      runId: null,
      selectedSourceRef: "F1",
      recoveredInvalidSelection: true,
      surface: "graph",
      filters: {text: "O13"},
    },
  );
});

test("search and filters expose exact contract dimensions", async () => {
  const [palette, filters] = await Promise.all([
    readFile(new URL("CommandPalette.tsx", sourceRoot), "utf8"),
    readFile(new URL("EvidenceFilters.tsx", sourceRoot), "utf8"),
  ]);
  assert.match(palette, /Search exact evidence, relation, path, diagnostic/);
  for (const dimension of ["Kind", "Relation", "Disposition", "Diagnostic"]) {
    assert.match(filters, new RegExp(dimension));
  }
});
