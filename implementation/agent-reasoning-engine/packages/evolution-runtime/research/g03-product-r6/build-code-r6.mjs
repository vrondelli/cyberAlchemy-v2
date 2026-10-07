// Mechanically derive a separate forty-question code root before r6 dispatch.
import {cpSync, existsSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";

const base = "/opt/are/evolution-runtime/g03-product-replication-code-r7";
const target = "/opt/are/evolution-runtime/g03-product-replication-code-r8";
const relative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1";
const hash = text => createHash("sha256").update(text).digest("hex");
if (existsSync(target)) throw Error("fresh-code-root-required");

const edits = [
  ["replication-cohort-adapter-v1.mjs", "replication-cohort-adapter-v1.mjs"],
  ["replication-cohort-paired-r5.mjs", "replication-cohort-paired-r6.mjs"],
  ["replication-cohort-score-r5.mjs", "replication-cohort-score-r6.mjs"],
  ["replication-cohort-reference-project-r5-fix1.py", "replication-cohort-reference-project-r6.py"],
];
const outputs = [];
for (const [from, to] of edits) {
  let text = readFileSync(join(base, relative, from), "utf8");
  const numeric = (text.match(/\b50\b/g) ?? []).length;
  if (numeric < 2) throw Error(`source-shape-drift:${from}:50:${numeric}`);
  text = text.replace(/\b50\b/g, "40").replaceAll("product50", "product40");
  if (from === "replication-cohort-score-r5.mjs") {
    const before = `const yesNo = typeof reply.output === "string" ? reply.output.trim().toLowerCase() : "";
    const valid = ["yes", "no"].includes(yesNo);`;
    const after = `const yesNo = typeof reply.output === "string" ? reply.output.trim().toLowerCase() : "";
    const parsed = /^(yes|no)\\.?$/.exec(yesNo);
    const valid = parsed !== null;`;
    if (text.split(before).length !== 2) throw Error("judge-parser-source-shape-drift");
    text = text.replace(before, after);
    text = text.replace("correct: valid && yesNo === \"yes\"", "correct: valid && parsed[1] === \"yes\"");
    if (!text.includes("correct: valid && parsed[1] === \"yes\"")) throw Error("judge-result-source-shape-drift");
    const judgmentTail = "valid, usage: reply.usage, elapsed_ms:";
    if (text.split(judgmentTail).length !== 2) throw Error("judge-receipt-source-shape-drift");
    text = text.replace(judgmentTail, "valid, judge_response_sha256: reply.response_sha256, parser_version: 'yes-no-optional-period/v1', usage: reply.usage, elapsed_ms:");
  }
  if (from.endsWith(".py")) text = text.replaceAll("r5.py", "r6.py");
  outputs.push({from, to, text, sha256: hash(text)});
}
cpSync(base, target, {recursive: true, errorOnExist: true, force: false});
for (const {from, to, text} of outputs) {
  writeFileSync(join(target, relative, to), text, {flag: from === to ? "w" : "wx", mode: 0o600});
}
process.stdout.write(`${JSON.stringify({base, target, files: outputs.map(({to, sha256}) => ({path: to, sha256}))})}\n`);
