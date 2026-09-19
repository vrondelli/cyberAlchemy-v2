import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";

const repositoryRoot = process.cwd();
const evidenceRelative =
  "projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000-REPAIR-A";
const evidenceRoot = resolve(repositoryRoot, evidenceRelative);
const commandsRoot = resolve(evidenceRoot, "commands");
const runsRoot = resolve(evidenceRoot, "runs");
const probesRoot = resolve(evidenceRoot, "probes");
const implementationRoot = resolve(repositoryRoot, "projects/domainspec-v2/impl");
const architectureRoot = resolve(implementationRoot, "architecture-conformance");
const expectedPostApplyPath = resolve(evidenceRoot, "producer/EXPECTED-POST-APPLY.json");
const baselineInventoryPath = resolve(
  repositoryRoot,
  "projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000/commands/pre-product-inventory.json",
);
const claimAuditPath = resolve(
  repositoryRoot,
  "projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000-REPAIR-CANDIDATE/probes/existing-claim-ceiling-audit.json",
);
const referenceRequest = "architecture-conformance/factory/fixtures/reference-suite.request.json";
const w3Request = "architecture-conformance/factory/fixtures/w3-effects-connections.request.json";
const materialTargets = Object.freeze([
  "projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/execute-factory-run.ts",
  "projects/domainspec-v2/impl/architecture-conformance/factory/evidence/normalize-semantic-receipt.ts",
  "projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/reproduce-reference-suite.ts",
  "projects/domainspec-v2/impl/architecture-conformance/factory/tests/proof-accounting.test.ts",
  "projects/domainspec-v2/impl/architecture-conformance/factory/tests/reproduction.test.ts",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/reference-suite.request.json",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-calculation.request.json",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-entity.request.json",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-enum-semantic-slice.request.json",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-policy.request.json",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-query.request.json",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-value-object.request.json",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/w3-effects-connections.request.json",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/w4-orchestration-lifecycle.request.json",
]);
const guardFiles = Object.freeze([
  Object.freeze({
    path: "projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/plan-factory-run.ts",
    sha256: "db2f03096de552af29448db70b247f76c8d9a4d95c1b71e692860307f5d09560",
    size_bytes: 5939,
  }),
  Object.freeze({
    path: "projects/domainspec-v2/impl/architecture-conformance/factory/replay/run-locked-child.ts",
    sha256: "3b0589865e0523a1fa60bdf941be0f24cc4f997869e08e4f178133d0e928ea26",
    size_bytes: 15969,
  }),
]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const compareUtf8 = (left, right) => Buffer.from(left).compare(Buffer.from(right));
const canonicalValue = (value) => {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => compareUtf8(left, right))
      .map(([key, child]) => [key, canonicalValue(child)]));
  }
  return value;
};
const canonicalJson = (value) => JSON.stringify(canonicalValue(value));
const exists = async (path) => lstat(path).then(() => true, () => false);
const relativeEvidence = (path) => relative(repositoryRoot, path).replaceAll("\\", "/");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJsonExclusive = async (path, value) => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
};
const fail = (code, detail) => {
  const error = new Error(detail === undefined ? code : `${code}:${detail}`);
  error.code = code;
  error.detail = detail ?? null;
  throw error;
};
const errorShape = (error) => ({
  code: error?.code ?? "SIC_FAC_VALIDATION_UNEXPECTED",
  detail: error?.detail ?? error?.message ?? String(error),
  command_id: error?.command_id ?? null,
});

const parseLastJson = (text) => {
  const lines = text.trim().split(/\r?\n/u).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      // Continue to the prior line. npm output may precede the one JSON payload.
    }
  }
  return null;
};

const terminateChild = (child, signal) => {
  if (child.pid === undefined) return;
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch {
    try { child.kill(signal); } catch { /* already terminal */ }
  }
};

const runCommand = async ({
  commandId,
  argv,
  timeoutMs,
  expectedExitStatuses = [0],
  parsedOutput = "none",
}) => {
  const startedAt = new Date();
  process.stdout.write(`[validation] ${commandId} started\n`);
  const outcome = await new Promise((resolveOutcome, rejectOutcome) => {
    const child = spawn(argv[0], argv.slice(1), {
      cwd: repositoryRoot,
      env: process.env,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    let outputLimitExceeded = false;
    const maxOutputBytes = 16 * 1024 * 1024;
    const collect = (chunks, chunk, stream) => {
      const bytes = Buffer.from(chunk);
      if (stream === "stdout") stdoutBytes += bytes.byteLength;
      else stderrBytes += bytes.byteLength;
      if (stdoutBytes + stderrBytes > maxOutputBytes) {
        outputLimitExceeded = true;
        terminateChild(child, "SIGTERM");
        return;
      }
      chunks.push(bytes);
    };
    child.stdout.on("data", (chunk) => collect(stdout, chunk, "stdout"));
    child.stderr.on("data", (chunk) => collect(stderr, chunk, "stderr"));
    child.on("error", rejectOutcome);
    const heartbeat = setInterval(() => {
      const seconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
      process.stdout.write(`[validation] ${commandId} active ${seconds}s\n`);
    }, 30_000);
    const timer = setTimeout(() => {
      timedOut = true;
      terminateChild(child, "SIGTERM");
      setTimeout(() => terminateChild(child, "SIGKILL"), 5_000).unref();
    }, timeoutMs);
    child.on("close", (exitStatus, signal) => {
      clearInterval(heartbeat);
      clearTimeout(timer);
      resolveOutcome({
        exitStatus,
        signal,
        timedOut,
        outputLimitExceeded,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
      });
    });
  });
  const finishedAt = new Date();
  const stdoutPath = resolve(commandsRoot, `${commandId}.stdout.log`);
  const stderrPath = resolve(commandsRoot, `${commandId}.stderr.log`);
  await writeFile(stdoutPath, outcome.stdout, { flag: "wx" });
  await writeFile(stderrPath, outcome.stderr, { flag: "wx" });
  const stdoutText = outcome.stdout.toString("utf8");
  const stderrText = outcome.stderr.toString("utf8");
  const parsed = parsedOutput === "stdout" ? parseLastJson(stdoutText)
    : parsedOutput === "stderr" ? parseLastJson(stderrText)
      : null;
  const receipt = {
    schema_version: "SicFacRepairCommandReceipt/v1",
    command_id: commandId,
    argv,
    cwd: repositoryRoot,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_ms: finishedAt.getTime() - startedAt.getTime(),
    timeout_ms: timeoutMs,
    timed_out: outcome.timedOut,
    output_limit_exceeded: outcome.outputLimitExceeded,
    exit_status: outcome.exitStatus,
    signal: outcome.signal,
    expected_exit_statuses: expectedExitStatuses,
    stdout: {
      path: relativeEvidence(stdoutPath),
      sha256: sha256(outcome.stdout),
      size_bytes: outcome.stdout.byteLength,
    },
    stderr: {
      path: relativeEvidence(stderrPath),
      sha256: sha256(outcome.stderr),
      size_bytes: outcome.stderr.byteLength,
    },
    parsed_output: parsed,
    acceptance_critical: true,
  };
  const receiptPath = resolve(commandsRoot, `${commandId}.json`);
  await writeJsonExclusive(receiptPath, receipt);
  process.stdout.write(
    `[validation] ${commandId} exit=${outcome.exitStatus} duration_ms=${receipt.duration_ms}\n`,
  );
  if (outcome.timedOut) {
    const error = Object.assign(new Error(`${commandId} timed out`), {
      code: "SIC_FAC_COMMAND_TIMEOUT",
      detail: commandId,
      command_id: commandId,
    });
    throw error;
  }
  if (outcome.outputLimitExceeded) {
    const error = Object.assign(new Error(`${commandId} exceeded output limit`), {
      code: "SIC_FAC_COMMAND_OUTPUT_LIMIT",
      detail: commandId,
      command_id: commandId,
    });
    throw error;
  }
  if (!expectedExitStatuses.includes(outcome.exitStatus)) {
    const error = Object.assign(new Error(`${commandId} unexpected exit ${outcome.exitStatus}`), {
      code: "SIC_FAC_COMMAND_FAILED",
      detail: `${commandId}:${outcome.exitStatus}`,
      command_id: commandId,
    });
    throw error;
  }
  if (parsedOutput !== "none" && parsed === null) {
    const error = Object.assign(new Error(`${commandId} emitted no parseable JSON`), {
      code: "SIC_FAC_COMMAND_JSON_MISSING",
      detail: commandId,
      command_id: commandId,
    });
    throw error;
  }
  return Object.freeze({ ...outcome, stdoutText, stderrText, parsed, receiptPath });
};

const walkArchitecture = async (current, paths) => {
  for (const name of await readdir(current)) {
    if (name === "target" || name === "__pycache__") continue;
    const path = resolve(current, name);
    const stat = await lstat(path);
    if (stat.isDirectory()) await walkArchitecture(path, paths);
    else if (stat.isFile()) paths.add(relative(repositoryRoot, path).replaceAll("\\", "/"));
  }
};

const productInventory = async (baseline) => {
  const paths = new Set(baseline.entries.map(({ path }) => path));
  paths.add("projects/domainspec-v2/impl/package.json");
  paths.add("projects/domainspec-v2/impl/package-lock.json");
  await walkArchitecture(architectureRoot, paths);
  const entries = [];
  const missing = [];
  for (const path of [...paths].sort(compareUtf8)) {
    const absolute = resolve(repositoryRoot, path);
    if (!await exists(absolute)) {
      missing.push(path);
      continue;
    }
    const bytes = await readFile(absolute);
    entries.push({ path, sha256: sha256(bytes), byte_length: bytes.byteLength });
  }
  return {
    schema_version: "SicFacProductByteInventory/v1",
    scope: baseline.scope,
    exclusions: baseline.exclusions,
    entry_count: entries.length,
    entries,
    missing,
    inventory_sha256: sha256(JSON.stringify(entries)),
    authority_effect: "none",
  };
};

const compareToBaseline = (baseline, observed) => {
  const before = new Map(baseline.entries.map((entry) => [entry.path, entry]));
  const after = new Map(observed.entries.map((entry) => [entry.path, entry]));
  const added = [...after.keys()].filter((path) => !before.has(path)).sort(compareUtf8);
  const removed = [...before.keys()].filter((path) => !after.has(path)).sort(compareUtf8);
  const changed = [...before.keys()].filter((path) => {
    const next = after.get(path);
    const prior = before.get(path);
    return next !== undefined &&
      (next.sha256 !== prior.sha256 || next.byte_length !== prior.byte_length);
  }).sort(compareUtf8);
  return { added, removed, changed };
};

const verifyExactFiles = async () => {
  const expected = await readJson(expectedPostApplyPath);
  const failures = [];
  const observed = [];
  for (const target of expected.targets) {
    const bytes = await readFile(resolve(repositoryRoot, target.path));
    const row = { path: target.path, sha256: sha256(bytes), size_bytes: bytes.byteLength };
    observed.push(row);
    if (row.sha256 !== target.sha256 || row.size_bytes !== target.size_bytes) {
      failures.push(target.path);
    }
  }
  for (const guard of guardFiles) {
    const bytes = await readFile(resolve(repositoryRoot, guard.path));
    if (sha256(bytes) !== guard.sha256 || bytes.byteLength !== guard.size_bytes) {
      failures.push(guard.path);
    }
  }
  const result = {
    schema_version: "SicFacPostApplyTargetCheck/v1",
    result: failures.length === 0 ? "PASS" : "BLOCK",
    target_count: observed.length,
    guard_count: guardFiles.length,
    observed,
    failures,
    authority_effect: "none",
  };
  await writeJsonExclusive(resolve(probesRoot, "post-apply-target-check.json"), result);
  if (failures.length > 0) fail("SIC_FAC_POST_APPLY_TARGET_MISMATCH", failures.join(","));
};

const verifyClaimEquality = async () => {
  const audit = await readJson(claimAuditPath);
  const rows = [];
  const failures = [];
  for (const observation of audit.observations) {
    if (observation.mismatch_count === 0) continue;
    const fixturePath = resolve(
      implementationRoot,
      "architecture-conformance/factory/fixtures",
      observation.fixture,
    );
    const fixture = await readJson(fixturePath);
    const nodes = new Map(fixture.nodes.map((node) => [node.node_id, node]));
    for (const mismatch of observation.mismatches) {
      const node = nodes.get(mismatch.node_id);
      const equal = node?.provider_id === mismatch.provider_id &&
        node?.claim_ceiling === mismatch.provider_claim_ceiling;
      rows.push({
        fixture: observation.fixture,
        node_id: mismatch.node_id,
        provider_id: mismatch.provider_id,
        locked_claim_ceiling: node?.claim_ceiling ?? null,
        provider_claim_ceiling: mismatch.provider_claim_ceiling,
        equal,
      });
      if (!equal) failures.push(`${observation.fixture}:${mismatch.node_id}`);
    }
  }
  const result = {
    schema_version: "SicFacLiveClaimEqualityCheck/v1",
    result: rows.length === 31 && failures.length === 0 ? "PASS" : "BLOCK",
    fixture_count: new Set(rows.map(({ fixture }) => fixture)).size,
    equality_count: rows.filter(({ equal }) => equal).length,
    expected_count: 31,
    rows,
    failures,
    authority_effect: "none",
  };
  await writeJsonExclusive(resolve(probesRoot, "live-claim-equality-check.json"), result);
  if (result.result !== "PASS") fail("SIC_FAC_LIVE_CLAIM_EQUALITY_FAILED", failures.join(","));
};

const npmFactory = (...args) => Object.freeze([
  "npm", "--silent", "--prefix", "projects/domainspec-v2/impl",
  "run", "factory", "--", ...args,
]);

const validateReproductionReceipt = async ({ commandOutput, expectedNodes, label }) => {
  if (commandOutput.result !== "pass") fail("SIC_FAC_REPRODUCE_RESULT", label);
  const receipt = await readJson(commandOutput.reproduction_receipt);
  const processDigests = receipt.process_observation_sha256 ?? [];
  const result = {
    schema_version: "SicFacReproductionInspection/v1",
    label,
    result: receipt.result === "pass" &&
      receipt.runs?.length === 2 &&
      receipt.runs.every(({ replayed_nodes }) => replayed_nodes === expectedNodes) &&
      processDigests.length === 2 &&
      new Set(processDigests).size === 2 ? "PASS" : "BLOCK",
    receipt_path: commandOutput.reproduction_receipt,
    semantic_receipt_sha256: receipt.semantic_receipt_sha256,
    run_count: receipt.runs?.length ?? 0,
    expected_nodes_per_run: expectedNodes,
    runs: receipt.runs ?? [],
    process_observation_sha256: processDigests,
    product_tree_inventory_sha256: receipt.product_tree_inventory_sha256,
    authority_effect: "none",
  };
  await writeJsonExclusive(resolve(probesRoot, `${label}-reproduction-inspection.json`), result);
  if (result.result !== "PASS") fail("SIC_FAC_REPRODUCTION_INSPECTION_FAILED", label);
};

const executeLifecycle = async ({ label, request, expectedNodes }) => {
  const plan = await runCommand({
    commandId: `${label}-plan`,
    argv: npmFactory("plan", "--request", request),
    timeoutMs: 300_000,
    parsedOutput: "stdout",
  });
  if (plan.parsed.run_id === undefined || plan.parsed.lock?.ordered_node_ids?.length !== expectedNodes) {
    fail("SIC_FAC_PLAN_SHAPE_INVALID", label);
  }
  await writeJsonExclusive(resolve(commandsRoot, `${label}-plan-output.json`), plan.parsed);
  const executionParent = resolve(runsRoot, label, "execution");
  const run = await runCommand({
    commandId: `${label}-run`,
    argv: npmFactory("run", "--request", request, "--output", executionParent),
    timeoutMs: 2_400_000,
    parsedOutput: "stdout",
  });
  if (run.parsed.result !== "pass" || run.parsed.run_id !== plan.parsed.run_id ||
      resolve(run.parsed.run_path) !== resolve(executionParent, plan.parsed.run_id)) {
    fail("SIC_FAC_RUN_BINDING_INVALID", label);
  }
  const replay = await runCommand({
    commandId: `${label}-replay`,
    argv: npmFactory("replay", "--run", run.parsed.run_path),
    timeoutMs: 2_400_000,
    parsedOutput: "stdout",
  });
  if (replay.parsed.result !== "pass" || replay.parsed.replayed_nodes !== expectedNodes) {
    fail("SIC_FAC_REPLAY_SHAPE_INVALID", label);
  }
  const verify = await runCommand({
    commandId: `${label}-verify`,
    argv: npmFactory("verify", "--run", run.parsed.run_path),
    timeoutMs: 300_000,
    parsedOutput: "stdout",
  });
  if (verify.parsed.result !== "pass" || verify.parsed.run_id !== plan.parsed.run_id ||
      verify.parsed.lock_sha256 !== plan.parsed.lock.lock_sha256 ||
      verify.parsed.semantic_receipt_sha256 !== run.parsed.semantic_receipt_sha256) {
    fail("SIC_FAC_VERIFY_BINDING_INVALID", label);
  }
  const reproduce = await runCommand({
    commandId: `${label}-reproduce`,
    argv: npmFactory(
      "reproduce", "--request", request,
      "--output", resolve(runsRoot, label, "reproduction"),
    ),
    timeoutMs: 3_600_000,
    parsedOutput: "stdout",
  });
  await validateReproductionReceipt({
    commandOutput: reproduce.parsed,
    expectedNodes,
    label,
  });
  return Object.freeze({
    label,
    plan: plan.parsed,
    run: run.parsed,
    replay: replay.parsed,
    verify: verify.parsed,
    reproduce: reproduce.parsed,
  });
};

const runHostileClaimProbe = async () => {
  const sourcePath = resolve(implementationRoot, w3Request);
  const hostile = await readJson(sourcePath);
  if (hostile.nodes.length !== 1) fail("SIC_FAC_HOSTILE_SOURCE_SHAPE");
  hostile.request_id = `${hostile.request_id}-hostile-claim-mismatch`;
  hostile.nodes[0].claim_ceiling = "hostile provider-expanded claim must be rejected";
  const hostilePath = resolve(probesRoot, "hostile-claim.request.json");
  await writeJsonExclusive(hostilePath, hostile);
  const hostileOutputParent = resolve(runsRoot, "hostile", "execution");
  const command = await runCommand({
    commandId: "hostile-claim-run",
    argv: npmFactory(
      "run", "--request", hostilePath,
      "--output", hostileOutputParent,
    ),
    timeoutMs: 900_000,
    expectedExitStatuses: [1],
    parsedOutput: "stderr",
  });
  const remainingEntries = await exists(hostileOutputParent)
    ? await readdir(hostileOutputParent)
    : [];
  const exactError = command.parsed?.code === "FACTORY_CLAIM_CEILING_MISMATCH" &&
    command.parsed?.detail === "typescript-w3-effects-connections";
  const result = {
    schema_version: "SicFacHostileClaimProbe/v1",
    result: exactError && remainingEntries.length === 0 ? "PASS" : "BLOCK",
    expected_code: "FACTORY_CLAIM_CEILING_MISMATCH",
    expected_detail: "typescript-w3-effects-connections",
    observed: command.parsed,
    published_run_count: remainingEntries.filter((name) => name.startsWith("factory-")).length,
    output_parent_entries: remainingEntries.sort(compareUtf8),
    fail_closed_before_publication: exactError && remainingEntries.length === 0,
    authority_effect: "none",
  };
  await writeJsonExclusive(resolve(probesRoot, "hostile-claim-probe.json"), result);
  if (result.result !== "PASS") fail("SIC_FAC_HOSTILE_CLAIM_PROBE_FAILED");
};

const auditSemanticHashes = async (lifecycles) => {
  const audits = [];
  for (const lifecycle of lifecycles) {
    const runRoot = resolve(lifecycle.run.run_path);
    const [receipt, lock] = await Promise.all([
      readJson(resolve(runRoot, "semantic-receipt.json")),
      readJson(resolve(runRoot, "lock.json")),
    ]);
    const nodes = [];
    for (const node of receipt.ordered_nodes) {
      const semantic = await readJson(resolve(runRoot, "nodes", node.node_id, "semantic.json"));
      const observed = sha256(canonicalJson(semantic));
      const locked = lock.nodes.find(({ node_id }) => node_id === node.node_id);
      nodes.push({
        node_id: node.node_id,
        expected_semantic_sha256: node.semantic_sha256,
        observed_semantic_sha256: observed,
        equal: observed === node.semantic_sha256,
        locked_claim_ceiling: locked?.claim_ceiling ?? null,
        provider_claim_ceiling: semantic.claim_ceiling,
        claim_equal: locked?.claim_ceiling === semantic.claim_ceiling,
      });
    }
    audits.push({
      label: lifecycle.label,
      run_path: relativeEvidence(runRoot),
      run_id: receipt.run_id,
      node_count: nodes.length,
      all_semantic_hashes_equal: nodes.every(({ equal }) => equal),
      all_claim_ceilings_equal: nodes.every(({ claim_equal }) => claim_equal),
      nodes,
    });
  }
  const result = {
    schema_version: "SicFacRepairSemanticHashAudit/v1",
    result: audits.reduce((count, audit) => count + audit.node_count, 0) === 10 &&
      audits.every(({ all_semantic_hashes_equal, all_claim_ceilings_equal }) =>
        all_semantic_hashes_equal && all_claim_ceilings_equal) ? "PASS" : "BLOCK",
    total_node_count: audits.reduce((count, audit) => count + audit.node_count, 0),
    audits,
    authority_effect: "none",
  };
  await writeJsonExclusive(resolve(probesRoot, "semantic-hash-audit.json"), result);
  if (result.result !== "PASS") fail("SIC_FAC_SEMANTIC_HASH_AUDIT_FAILED");
};

const initializeOutputRoots = async () => {
  const terminalPath = resolve(evidenceRoot, "VALIDATION-RESULT.json");
  for (const path of [commandsRoot, runsRoot, probesRoot, terminalPath]) {
    if (await exists(path)) fail("SIC_FAC_VALIDATION_OUTPUT_EXISTS", relativeEvidence(path));
  }
  await mkdir(commandsRoot);
  await mkdir(runsRoot);
  await mkdir(probesRoot);
};

const main = async () => {
  await initializeOutputRoots();
  const startedAt = new Date().toISOString();
  let terminal;
  try {
    await verifyExactFiles();
    await verifyClaimEquality();
    const baseline = await readJson(baselineInventoryPath);
    const preValidation = await productInventory(baseline);
    const baselineDelta = compareToBaseline(baseline, preValidation);
    await writeJsonExclusive(
      resolve(probesRoot, "pre-validation-product-inventory.json"),
      { ...preValidation, baseline_delta: baselineDelta },
    );
    if (preValidation.missing.length > 0 || baselineDelta.added.length > 0 ||
        baselineDelta.removed.length > 0 ||
        JSON.stringify(baselineDelta.changed) !== JSON.stringify([...materialTargets].sort(compareUtf8))) {
      fail("SIC_FAC_PRODUCT_DELTA_SCOPE_MISMATCH", JSON.stringify(baselineDelta));
    }

    await runCommand({
      commandId: "factory-typecheck",
      argv: ["npm", "--prefix", "projects/domainspec-v2/impl", "run", "factory:typecheck"],
      timeoutMs: 600_000,
    });
    await runHostileClaimProbe();
    await runCommand({
      commandId: "factory-test",
      argv: ["npm", "--prefix", "projects/domainspec-v2/impl", "run", "factory:test"],
      timeoutMs: 2_400_000,
    });
    const reference = await executeLifecycle({
      label: "reference",
      request: referenceRequest,
      expectedNodes: 9,
    });
    const w3 = await executeLifecycle({ label: "w3", request: w3Request, expectedNodes: 1 });
    await auditSemanticHashes([reference, w3]);

    const postValidation = await productInventory(baseline);
    const postDelta = compareToBaseline(baseline, postValidation);
    await writeJsonExclusive(
      resolve(probesRoot, "post-validation-product-inventory.json"),
      { ...postValidation, baseline_delta: postDelta },
    );
    if (postValidation.inventory_sha256 !== preValidation.inventory_sha256 ||
        JSON.stringify(postValidation.entries) !== JSON.stringify(preValidation.entries) ||
        JSON.stringify(postDelta) !== JSON.stringify(baselineDelta)) {
      fail("SIC_FAC_VALIDATION_MUTATED_PRODUCT_TREE");
    }

    terminal = {
      schema_version: "SicFacRepairValidationResult/v1",
      task_id: "SIC-FAC-000-R2",
      result: "PASS",
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      acceptance_critical_checks: {
        exact_post_apply_targets: "14/14 pass",
        claim_ceiling_equality: "31/31 pass",
        fixed_timeout_guards: "2/2 unchanged",
        typecheck: "pass",
        hostile_claim_mismatch: "pass before publication",
        factory_tests: "pass",
        reference_lifecycle: "plan/run/replay/verify/reproduce pass",
        w3_lifecycle: "plan/run/replay/verify/reproduce pass",
        semantic_hashes: "10/10 pass",
        product_inventory: "exactly 14 admitted deltas; validation drift 0",
      },
      reference: {
        run_id: reference.run.run_id,
        semantic_receipt_sha256: reference.run.semantic_receipt_sha256,
        lock_sha256: reference.run.lock_sha256,
        reproduction_receipt: relativeEvidence(reference.reproduce.reproduction_receipt),
      },
      w3: {
        run_id: w3.run.run_id,
        semantic_receipt_sha256: w3.run.semantic_receipt_sha256,
        lock_sha256: w3.run.lock_sha256,
        reproduction_receipt: relativeEvidence(w3.reproduce.reproduction_receipt),
      },
      product_inventory: {
        baseline_inventory_sha256: baseline.inventory_sha256,
        candidate_inventory_sha256: postValidation.inventory_sha256,
        changed_paths: postDelta.changed,
        validation_product_drift_count: 0,
      },
      blockers: [],
      authority_effect: "none",
      claim_ceiling: "Bounded candidate validation only; no integration profile, Revision 2 acceptance, promotion, publication, release, deployment, or production claim.",
    };
  } catch (error) {
    terminal = {
      schema_version: "SicFacRepairValidationResult/v1",
      task_id: "SIC-FAC-000-R2",
      result: "BLOCK",
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      first_failure: errorShape(error),
      blockers: [errorShape(error)],
      later_checks: "not run after the first acceptance-critical failure",
      authority_effect: "none",
      claim_ceiling: "Failure receipt only; no repair acceptance or downstream readiness claim.",
    };
    process.exitCode = 1;
  }
  await writeJsonExclusive(resolve(evidenceRoot, "VALIDATION-RESULT.json"), terminal);
  process.stdout.write(`[validation] terminal=${terminal.result}\n`);
};

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? error?.message ?? String(error)}\n`);
  process.exitCode = 1;
});
