// Mechanically derive a separate 28-question code root from the frozen r6 source.
import {cpSync, existsSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";

const base = "/opt/are/evolution-runtime/g03-product-replication-code-r8";
const target = "/opt/are/evolution-runtime/g03-product-replication-code-r9";
const relative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1";
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
if (existsSync(target)) throw Error("fresh-code-root-required");

const edits = [
  ["replication-cohort-adapter-v1.mjs", "replication-cohort-adapter-v1.mjs"],
  ["replication-cohort-paired-r6.mjs", "replication-cohort-paired-r7.mjs"],
  ["replication-cohort-score-r6.mjs", "replication-cohort-score-r7.mjs"],
  ["replication-cohort-reference-project-r6.py", "replication-cohort-reference-project-r7.py"],
];
const outputs = [];
for (const [from, to] of edits) {
  const source = readFileSync(join(base, relative, from), "utf8");
  const numeric = (source.match(/\b40\b/g) ?? []).length;
  if (numeric < 2) throw Error(`source-shape-drift:${from}:40:${numeric}`);
  const text = source.replace(/\b40\b/g, "28").replaceAll("five-type", "four-type")
    .replaceAll("product40", "product28").replaceAll("r6.py", "r7.py");
  if (/\b40\b|five-type|product40|r6\.py/.test(text)) throw Error(`unconverted-source:${from}`);
  outputs.push({from, to, text, sha256: hash(text)});
}
cpSync(base, target, {recursive: true, errorOnExist: true, force: false});
for (const {from, to, text} of outputs) {
  writeFileSync(join(target, relative, to), text, {flag: from === to ? "w" : "wx", mode: 0o600});
}
process.stdout.write(`${JSON.stringify({base, target, files: outputs.map(({to, sha256}) => ({path: to, sha256}))})}\n`);
