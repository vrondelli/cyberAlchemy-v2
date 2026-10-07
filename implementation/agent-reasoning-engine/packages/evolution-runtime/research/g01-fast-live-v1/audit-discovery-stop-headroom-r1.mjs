// Read-only, post-hoc discovery-stop diagnostic over already exposed G01 pairs.
// Final selections are used only to locate where their source reads first arose.
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const base = "/opt/are/evolution-runtime";
const rows = [
  ["g01-r28-openlibrary-import-validation-r1", "73f44da969097d15b8708b8d5e04da964179eb1a2a1892179e6268130f4d1735"],
  ["g01-r29-ansible-import-validation-r1", "b429fd079978822cd9e577ccc4aa34a4e6641df6530739b718c63f878851a956"],
  ["g01-r30-keras-import-validation-r1", "a726c624000be7d1bd8ce61934f1320ddc4487be46d610b17b36177a65fab21d"],
  ["g01-r33-django-heading-pair-r1", "1acc77c2a7044d6056054fcf1b479089cdde57b210f93411e9cd6770793f4dec"],
  ["g01-r34-keras-heading-transfer-r1", "8f897616213842b98be20b6cdb186ba519847a94aa1944eada92e747733ac146"],
];
const need = (v, reason) => {if (!v) throw Error(`g01-stop-headroom.${reason}`);};
const mode = process.argv[2] ?? "--check";
need(["--check", "--write"].includes(mode) && process.argv.length <= 3, "arguments");
const read = path => readFileSync(path);
const json = path => JSON.parse(read(path));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const sumTokens = receipts => receipts.filter(x => x.kind === "model" && x.dispatched !== false)
  .reduce((sum, x) => {
    need(Number.isSafeInteger(x.input_tokens) && Number.isSafeInteger(x.output_tokens), "unknown-usage");
    return sum + x.input_tokens + x.output_tokens;
  }, 0);
const output = [];
for (const [id, auditSha] of rows) {
  need(sha(read(join(base, id, "INDEPENDENT-AUDIT.json"))) === auditSha, `${id}.audit-drift`);
  const out = `/tmp/are-${id}`;
  const candidate = json(join(out, "candidate/runs/00/result.json"));
  const control = json(join(out, "control/runs/00/result.json"));
  const events = read(join(out, "candidate/runs/00/events.jsonl")).toString("utf8").trim().split("\n").map(JSON.parse);
  const selected = candidate.exported?.selection?.final_read_ids;
  need(candidate.status === "final_context_selected" && control.status === "final_context_selected" &&
    Array.isArray(selected) && selected.length > 0, `${id}.result-shape`);
  const reads = [];
  let discoveryCalls = 0;
  for (const event of events) {
    if (event.kind === "response-capture" && event.phase === "discover") discoveryCalls++;
    if (event.kind === "source-tool-result" && event.call?.function?.name === "read_file" && event.output?.ok === true) {
      const x = event.output.output;
      reads.push({call: discoveryCalls, id: x.read_id, path: x.path, start: x.start_line, end: x.end_line});
    }
  }
  const selectedReads = selected.map(id => reads.find(x => x.id === id));
  need(selectedReads.every(Boolean), `${id}.selected-read-missing`);
  const lastSelectedCall = Math.max(...selectedReads.map(x => x.call));
  const models = candidate.receipts.filter(x => x.kind === "model" && x.dispatched !== false);
  need(models.length === discoveryCalls + 1, `${id}.call-count-mismatch`);
  const deliveryCall = Math.min(discoveryCalls, lastSelectedCall + 1);
  const retained = [...models.slice(0, deliveryCall), models.at(-1)];
  const candidateTokens = sumTokens(models), controlTokens = sumTokens(control.receipts);
  const naiveRetainedTokens = sumTokens(retained);
  let firstAdjacent = null;
  for (let i = 1; i < reads.length; i++) {
    const a = reads[i - 1], b = reads[i];
    if (a.path === b.path && a.end - a.start >= 7 && b.end - b.start >= 7 &&
      Math.max(a.start, b.start) <= Math.min(a.end, b.end) + 1) {
      firstAdjacent = {acquired_after_call: b.call, path: b.path,
        both_finally_selected: selected.includes(a.id) && selected.includes(b.id)};
      break;
    }
  }
  output.push({study_id: id, audit_sha256: auditSha, candidate_discovery_calls: discoveryCalls,
    final_selected_ranges: selected.length, last_final_selected_range_acquired_after_call: lastSelectedCall,
    earliest_next_call_that_could_receive_it: deliveryCall,
    actual_candidate_known_tokens: candidateTokens, actual_control_known_tokens: controlTokens,
    posthoc_retain_prefix_and_original_join_tokens: naiveRetainedTokens,
    posthoc_omitted_discovery_calls: discoveryCalls - deliveryCall,
    first_adjacent_wide_read_pair: firstAdjacent});
}
const receipt = {schema_version: "are.g01-posthoc-discovery-stop-headroom/v1",
  script_sha256: sha(read(fileURLToPath(import.meta.url))),
  posture: "diagnostic-only; final selections are retrospective and the retained join request would change in a real run",
  gold_loaded: false, new_model_calls: 0,
  claim_ceiling: "No early-stop qualification, causal efficiency claim, fresh holdout, or superiority claim",
  rows: output};
const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
if (mode === "--write") {
  const root = join(base, "g01-discovery-stop-headroom-r1");
  mkdirSync(root, {mode: 0o700});
  writeFileSync(join(root, "RESULT.json"), bytes, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--write" ? "sealed" : "read-only-ready",
  receipt_sha256: sha(bytes), rows: output.length, new_model_calls: 0, claim_ceiling: receipt.claim_ceiling}));
