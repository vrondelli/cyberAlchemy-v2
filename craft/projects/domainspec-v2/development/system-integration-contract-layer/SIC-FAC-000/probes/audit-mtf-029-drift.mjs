import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const receiptPath = "projects/domainspec-v2/development/meta-type-realization-factory/receipts/MTF-029.json";
const receipt = JSON.parse(await readFile(resolve(root, receiptPath), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const entries = [];
for (const expected of receipt.outputs) {
  try {
    const bytes = await readFile(resolve(root, expected.path));
    const live = sha256(bytes);
    entries.push({
      path: expected.path,
      expected_sha256: expected.sha256,
      live_sha256: live,
      status: live === expected.sha256 ? "match" : "drift",
    });
  } catch {
    entries.push({
      path: expected.path,
      expected_sha256: expected.sha256,
      live_sha256: null,
      status: "missing",
    });
  }
}
process.stdout.write(`${JSON.stringify({
  schema_version: "SicFacMtf029DriftAudit/v1",
  historical_receipt: receiptPath,
  output_count: entries.length,
  match_count: entries.filter(({ status }) => status === "match").length,
  drift_count: entries.filter(({ status }) => status === "drift").length,
  missing_count: entries.filter(({ status }) => status === "missing").length,
  entries,
  authority_effect: "none",
})}\n`);
