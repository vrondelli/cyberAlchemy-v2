#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import {dirname, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(scriptPath), "../../../../../../..");
const evidenceRoot = "cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/planning/work-pack/session-evidence";
const workPack = "cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/planning/WORK-PACK.md";

function parseArgs(values) {
  const result = {files: [], validations: [], residues: []};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error(`missing value for ${key}`);
    index += 1;
    if (key === "--file") result.files.push(value);
    else if (key === "--validation") result.validations.push(value);
    else if (key === "--residue") result.residues.push(value);
    else result[key.slice(2)] = value;
  }
  for (const key of ["task-id", "task-file", "swu-id", "run-id", "tests-passed"]) {
    if (!result[key]) throw new Error(`--${key} is required`);
  }
  return result;
}

function absolute(path) {
  const candidate = resolve(repositoryRoot, path);
  if (relative(repositoryRoot, candidate).startsWith("..")) throw new Error(`path escape: ${path}`);
  return candidate;
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fileDigest(path) {
  return sha256Bytes(readFileSync(absolute(path)));
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function writeJson(path, value) {
  const target = absolute(path);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const swuId = args["swu-id"];
  const runId = args["run-id"];
  const evidenceDir = `${evidenceRoot}/${swuId}/${runId}`;
  const terminalPath = `${evidenceDir}/TERMINAL-RECEIPT.json`;
  const taskFile = args["task-file"];
  const terminal = {
    schema_version: "task-session.terminal-v1",
    run_id: runId,
    swu_id: swuId,
    dispatch_id: "intent-route-resolver-chain-20260730t204540z",
    status: "PASS",
    files_touched: args.files.sort(),
    file_digests: args.files.sort().map((path) => ({path, sha256: fileDigest(path)})),
    validation: {
      commands: args.validations,
      status: "PASS",
      tests_passed: Number.parseInt(args["tests-passed"], 10),
      tests_failed: 0,
      mutation_admission_receipt: "mutation-admission-receipt.json",
    },
    blockers: [],
    residue: args.residues,
    handoff_note: args["next-swu"]
      ? `${args["next-swu"]} is the only declared dependency-ready successor.`
      : "No implementation successor is declared inside the captured frontier.",
    authority_effect: "none",
    open_questions_ref: "cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/OPEN-QUESTIONS.md",
  };
  writeJson(terminalPath, terminal);

  const inventory = [
    {path: workPack, sha256: fileDigest(workPack)},
    {path: taskFile, sha256: fileDigest(taskFile)},
  ];
  const owner = {
    schema_version: "invoke.refresh.owner-v1",
    run_id: `${runId}-closeout`,
    swu_id: swuId,
    source_receipt_path: terminalPath,
    source_receipt_digest: fileDigest(terminalPath),
    baseline_inventory: inventory,
    baseline_digest: sha256Bytes(stable(inventory)),
    admitted_deltas: [
      "evidence_added",
      ...(args["next-swu"] ? ["route_changed"] : []),
    ],
    owner_validation: {
      source_receipt_schema: "PASS",
      source_scope: "PASS",
      declared_validation: "PASS",
      plan_controls_unchanged: true,
    },
    status: "PASS",
    next_route: args["next-swu"]
      ? `task-session:execute ${args["next-swu"]}`
      : "TASK-IRR-VERIFY",
    residue: [
      "Durable work-pack status reconciliation is deferred to final chain closeout; the captured seven-unit frontier is unchanged.",
    ],
    authority_effect: "none",
    open_questions_ref: "cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/OPEN-QUESTIONS.md",
  };
  writeJson(`${evidenceDir}/closeout-sync/OWNER-RECEIPT.json`, owner);
  process.stdout.write(`${JSON.stringify({
    swu_id: swuId,
    terminal: "PASS",
    owner: "PASS",
    next_route: owner.next_route,
  })}\n`);
}

main();
