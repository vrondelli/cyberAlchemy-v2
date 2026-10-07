// Supersede the unrun r4 pre-dispatch candidate with self-contained shallow
// source checkouts. The task cohort, arms, scorer, and decision rule stay fixed.
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => { if (!condition) throw Error(`g01-r4s.${reason}`); };
const prefix = "/opt/are/evolution-runtime";
const priorPath = join(prefix, "g01-product-replication-input-r6/DEFINITION.json");
const priorBytes = readFileSync(priorPath);
need(sha(priorBytes) === "53da752b356270fe4bec4a856f8ac1ddcd997b1c1e4e45b06666764a040f9b75", "prior-definition-drift");
const prior = JSON.parse(priorBytes);
need(prior.schema_version === "are.g01-campaign-definition/v1" && prior.status === "pre-dispatch" && prior.ordered_tasks?.length === 24 &&
  prior.root === join(prefix, "g01-product-replication-r4") && prior.source_root === join(prefix, "g01-shared-reliability-source-r4"), "prior-shape");
const sourceRoot = join(prefix, "g01-shared-reliability-source-r4-shallow-r1");
const relative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench";
need(sha(readFileSync(join(sourceRoot, relative, "intent-anchor-episode-r3.mjs"))) ===
  "15e9c6feddf1a1d16865054123fb38ac246b74447732be5eb76c3190957032f0", "episode-drift");
need(sha(readFileSync(join(sourceRoot, relative, "discovery-v1/orchestrate-intent-anchor-r3.mjs"))) ===
  "dc683ddaceb941e05e1ea94aadca5fac6077b5c2d58502c6717878def5873f8e", "shallow-orchestrator-drift");
const definition = {
  ...prior,
  hypothesis: "With the prospective retained-reasoning repair and storage-only self-contained shallow source checkouts, ARE improves paired native ContextBench source-context quality and efficiency on the unchanged fresh five-repository 8K cohort while all failures remain visible.",
  root: join(prefix, "g01-product-replication-r4s"),
  source_root: sourceRoot,
  claim_ceiling: "Prospective G01 r4s 8K jq/cli/svelte/clap/fd paired comparison only; not full ContextBench or general product superiority proof.",
  protocol_ref: "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/G01-R4S-PROTOCOL-CANDIDATE.md",
  open_questions: [...prior.open_questions, "Do shallow source clones remain independent of their caches through archival and restore?"]
};
const input = join(prefix, "g01-product-replication-input-r7");
mkdirSync(input, {recursive: false, mode: 0o700});
const path = join(input, "DEFINITION.json"), bytes = Buffer.from(`${JSON.stringify(definition, null, 2)}\n`);
writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({definition_path: path, definition_sha256: sha(bytes), task_count: definition.ordered_tasks.length,
  prior_definition_sha256: sha(priorBytes), source_root: sourceRoot}));
