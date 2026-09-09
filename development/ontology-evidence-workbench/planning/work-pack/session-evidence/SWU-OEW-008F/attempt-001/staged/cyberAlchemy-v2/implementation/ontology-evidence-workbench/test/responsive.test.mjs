import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const cssPath = new URL("../upstream/overlay/packages/dashboard/src/oew/oew.css", import.meta.url);
const appPath = new URL("../upstream/overlay/packages/dashboard/src/oew/OewApp.tsx", import.meta.url);

test("wide, tablet, and mobile layouts preserve evidence access", async () => {
  const css = await readFile(cssPath, "utf8");
  assert.match(css, /grid-template-columns: 15\.5rem minmax\(0, 1fr\) minmax\(17rem, 21rem\)/);
  assert.match(css, /@media \(max-width: 1050px\)/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /\.oew-inspector \{[\s\S]*position: fixed/);
  assert.match(css, /\.oew-navigator \{ display: none; \}/);
});

test("reduced motion and keyboard focus are explicit", async () => {
  const css = await readFile(cssPath, "utf8");
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /transition-duration: \.001ms/);
  assert.match(css, /animation-duration: \.001ms/);
});

test("critical trust, exact inspector, receipt, and fail-closed states stay mounted", async () => {
  const source = await readFile(appPath, "utf8");
  for (const token of [
    "<TrustRail",
    "<EvidenceInspector",
    "<ReceiptDrawer",
    'className="oew-failure"',
    "No graph was rendered behind this error.",
  ]) assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(source, />\s*(Accept|Promote|Publish)\s*</i);
});
