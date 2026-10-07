// Provider-free qualification of a separately versioned r46 template-heading fix.
// Open questions: evidence/G01-R14-TERMINAL-NOTE.md in the evolution runtime.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, relative} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const parent = join(base, "g01-source-r13-prospective-r45");
const candidate = join(base, "g01-r14-r46-source-qualification-r1");
const evidence = join(base, "g01-r14-r46-source-evidence-r1");
const taskPath = join(base, "g01-product-replication-input-r17/tasks/SWE-Bench-Verified__python__maintenance__bugfix__765e5e14.json");
const resultPath = join(base, "g01-product-replication-r14/python-sphinx-765e5e14/candidate/runs/00/result.json");
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const relativeModule = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-convergence-r3.mjs";
const relativeTest = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-convergence-r3.test.mjs";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path);
const need = (value, reason) => {if (!value) throw Error(`g01-r46-source.${reason}`);};

async function main() {
  need(process.argv.length === 3 && process.argv[2] === "--verify", "arguments");
  const {bindSourceTree} = await import(pathToFileURL(join(candidate,
    "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
  const before = bindSourceTree(parent), after = bindSourceTree(candidate);
  need(before.file_count === 412 && before.tree_sha256 === "f4a9a90677ccc71cc2353e056b2af56ee470013579015d34eb3578bdfd374173" &&
    after.file_count === 412 && after.tree_sha256 === "b97b3718c55c9ffb19cd6c8d140d8147580f8c6db1d6d2c98476a99e38aa54df", "source-tree");
  const previous = new Map(before.sources.map(row => [relative(parent, row.path), row.sha256]));
  const changed = after.sources.filter(row => previous.get(relative(candidate, row.path)) !== row.sha256)
    .map(row => relative(candidate, row.path)).sort();
  need(changed.join() === [relativeModule, relativeTest].sort().join(), "exact-two-file-delta");

  const tests = after.sources.filter(row => row.path.endsWith(".test.mjs")).map(row => row.path).sort();
  const nodeRun = spawnSync(node, ["--test", ...tests], {cwd: candidate, encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024});
  const count = label => Number(nodeRun.stdout?.match(new RegExp(`(?:^|\\n)(?:#|ℹ)\\s+${label}\\s+(\\d+)(?:\\n|$)`))?.[1]);
  need(!nodeRun.error && nodeRun.status === 0 && nodeRun.signal === null &&
    tests.length === 19 && count("tests") === 106 && count("pass") === 106 && count("fail") === 0, "node-tests");
  const pyRoot = join(candidate, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench");
  const pyRun = spawnSync("/usr/bin/python3", ["-m", "unittest", "-v", "test_ranked_source_worker_r2", "test_ranked_source_hints_r3"],
    {cwd: pyRoot, encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024,
      env: {...process.env, PATH: `/opt/cyberalchemy-are-tools/node-24.10.0:${process.env.PATH ?? ""}`}});
  need(!pyRun.error && pyRun.status === 0 && pyRun.signal === null &&
    /Ran 27 tests/.test(pyRun.stderr) && /\nOK\n/.test(pyRun.stderr), "python-tests");

  const taskBytes = read(taskPath), resultBytes = read(resultPath);
  need(sha(taskBytes) === "377056d8d89efd06c6a35c4e2eb956a2b67ed0372a82bf3d0fd0b42a6e13c823" &&
    sha(resultBytes) === "3f868495ba077cb1b14c30d5de5a22174a10866ba3ee2b05387dcad64c55b2bd", "exposed-inputs");
  const issue = JSON.parse(taskBytes).problem_statement;
  const old = JSON.parse(resultBytes).convergence_state;
  const convergence = await import(pathToFileURL(join(candidate, relativeModule)).href);
  const oldReadiness = convergence.convergenceReadiness(old, {substantive_read_gate: true});
  need(!oldReadiness.ready && oldReadiness.reason === "substantive-base-read-required" &&
    oldReadiness.supported_base_reads === 6 && oldReadiness.substantive_base_reads === 0 &&
    old.anchors[1].terms.join(" ") === "describe the bug" && old.queries.length === 2 &&
    old.queries[0].anchor_id === old.anchors[0].anchor_id && old.queries[1].anchor_id === old.anchors[2].anchor_id, "old-mechanism");
  let state = convergence.createIntentAnchorState(issue, {issue_template_aware: true});
  need(state.anchors[1].terms.includes("autodoc") && !state.anchors[1].terms.includes("describe"), "new-substantive-anchor");
  const remap = new Map([[old.anchors[0].anchor_id, state.anchors[0].anchor_id],
    [old.anchors[2].anchor_id, state.anchors[1].anchor_id]]);
  for (const row of old.queries) {
    const next = convergence.admitRankQuery(state, {anchor_id: remap.get(row.anchor_id), query: row.normalized_query});
    need(next.accepted, "query-replay"); state = next.state;
  }
  for (const row of old.support) state = convergence.recordHintSupport(state,
    {anchor_id: remap.get(row.anchor_id), query_sha256: row.query_sha256,
      path: row.path, start_line: row.start_line, end_line: row.end_line, content_sha256: row.content_sha256});
  for (const row of old.confirmed_base_reads) state = convergence.confirmBaseRead(state,
    {path: row.path, start_line: row.start_line, end_line: row.end_line,
      content_sha256: row.content_sha256, base_revision_confirmed: true});
  const repairedReadiness = convergence.convergenceReadiness(state, {substantive_read_gate: true});
  need(repairedReadiness.ready && repairedReadiness.supported_base_reads === 6 &&
    repairedReadiness.substantive_base_reads === 6, "replayed-readiness");

  const receipt = {schema_version: "are.g01-r14-r46-source-qualification/v1",
    status: "source-qualified-not-campaign-frozen", parent_source_tree_sha256: before.tree_sha256,
    source_tree_sha256: after.tree_sha256, source_root: candidate, file_count: after.file_count,
    changed_relative_paths: changed, node_version: process.version, node_test_files: tests.length,
    node_tests: count("tests"), node_pass: count("pass"), node_fail: count("fail"),
    node_stdout_sha256: sha(nodeRun.stdout), node_stderr_sha256: sha(nodeRun.stderr),
    python_tests: 27, python_pass: 27, python_stderr_sha256: sha(pyRun.stderr),
    exposed_task_sha256: sha(taskBytes), exposed_result_sha256: sha(resultBytes),
    old_readiness: oldReadiness, replayed_readiness: repairedReadiness,
    replay_posture: "metadata-only deterministic remap; not a new provider episode or score",
    script_sha256: sha(read(import.meta.filename)), model_calls: 0, gold_loaded: false,
    claim_ceiling: "Prospective source reliability only; r14 remains terminal, no new campaign, score, or superiority.",
    open_questions: ["Does a new 24-task cohort finish validly with r46?", "Does the fix preserve quality and efficiency across a fresh population?"]};
  mkdirSync(evidence, {recursive: true, mode: 0o700});
  const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(join(evidence, "SOURCE-QUALIFICATION.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, source_tree_sha256: receipt.source_tree_sha256,
    node_tests: receipt.node_tests, python_tests: receipt.python_tests,
    substantive_base_reads: repairedReadiness.substantive_base_reads, receipt_sha256: sha(bytes)}));
}
main().catch(error => {console.error(JSON.stringify({status: "verify-error", error: String(error.message)})); process.exitCode = 2;});
