import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  appendFile,
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";

const RECEIPT_SCHEMA = "define-isolation-rehearsal-receipt@1";
const EVENT_SCHEMA = "define-runtime-event@1";
const CONDITIONS = Object.freeze([
  "ticket_only",
  "equivalent_notes",
  "definition_pack",
  "definition_pack_evidence_gate",
]);

function now() {
  return new Date().toISOString();
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalBytes(value) {
  return Buffer.from(`${JSON.stringify(value)}\n`, "utf8");
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readJsonLines(path) {
  const text = await readFile(path, "utf8");
  if (!text.trim()) return [];
  return text.split("\n").filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`INVALID_JSONL:${path}:${index + 1}:${error.message}`);
    }
  });
}

async function atomicJson(path, value) {
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await rename(temporary, path);
}

function runPaths(runDirectory) {
  if (!runDirectory) throw new Error("RUN_REQUIRED");
  const root = resolve(runDirectory);
  return {
    root,
    lock: join(root, "run.lock"),
    events: join(root, "events.jsonl"),
    questions: join(root, "questions.jsonl"),
    answers: join(root, "answers.jsonl"),
    state: join(root, "state.json"),
    manifest: join(root, "manifest", "experiment-manifest.draft.json"),
    selection: join(root, "manifest", "task-selection.json"),
    attempts: join(root, "isolation", "attempts"),
  };
}

async function assertRunInitialized(paths) {
  for (const path of [paths.events, paths.questions, paths.answers, paths.state, paths.manifest, paths.selection]) {
    if (!(await exists(path))) throw new Error(`RUN_NOT_INITIALIZED:${paths.root}`);
  }
}

async function withRunLock(paths, operation) {
  let handle;
  try {
    handle = await open(paths.lock, "wx", 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error(`RUN_LOCKED:${paths.root}`);
    throw error;
  }
  try {
    await handle.writeFile(`${JSON.stringify({ pid: process.pid, acquired_at: now(), operation: "isolation_build" })}\n`);
    return await operation();
  } finally {
    await handle.close();
    await rm(paths.lock, { force: true });
  }
}

function safeAttemptId(attemptId) {
  if (typeof attemptId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(attemptId)) {
    throw new Error("ATTEMPT_ID_INVALID");
  }
  return attemptId;
}

function safeRepositoryPath(value, label) {
  if (typeof value !== "string" || !value || value.includes("\\") || isAbsolute(value)) {
    throw new Error(`${label}_INVALID:${value}`);
  }
  const normalized = posix.normalize(value);
  if (normalized === "." || normalized === ".." || normalized.startsWith("../") || normalized !== value) {
    throw new Error(`${label}_INVALID:${value}`);
  }
  return value;
}

function contained(root, path, label) {
  const rootPath = resolve(root);
  const candidate = resolve(path);
  const rel = relative(rootPath, candidate);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`${label}_ESCAPES_ROOT:${candidate}`);
  }
  return candidate;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: options.binary ? null : "utf8",
    input: options.input,
    maxBuffer: 256 * 1024 * 1024,
    stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });
  if (result.error) throw new Error(`TOOL_UNAVAILABLE:${command}:${result.error.message}`);
  if (result.status !== 0) {
    const stdout = Buffer.isBuffer(result.stdout) ? result.stdout.toString("utf8") : result.stdout;
    const stderr = Buffer.isBuffer(result.stderr) ? result.stderr.toString("utf8") : result.stderr;
    throw new Error(`COMMAND_FAILED:${command}:${result.status}:${[stdout, stderr].filter(Boolean).join("\n").trim()}`);
  }
  return result.stdout;
}

function toolVersion(command, args) {
  return String(run(command, args)).split("\n")[0].trim();
}

function validateProfile(profile) {
  const requiredStrings = [
    "schema_version", "task_id", "repository_commit", "evaluator_source_root",
    "target_path", "stub_fixture_path", "stub_fixture_sha256",
    "dependency_closure_digest", "agent_runtime_image_or_toolchain_digest",
    "evaluator_runtime_image_or_toolchain_digest", "expected_action",
    "baseline_receipt_path", "baseline_receipt_digest", "network_policy",
    "runtime_identity", "runtime_authority",
  ];
  for (const field of requiredStrings) {
    if (typeof profile[field] !== "string" || !profile[field]) throw new Error(`PROFILE_FIELD_INVALID:${field}`);
  }
  if (!/^[0-9a-f]{40}$/.test(profile.repository_commit)) throw new Error("PROFILE_COMMIT_INVALID");
  for (const field of [
    "stub_fixture_sha256", "dependency_closure_digest",
    "agent_runtime_image_or_toolchain_digest", "evaluator_runtime_image_or_toolchain_digest",
    "baseline_receipt_digest",
  ]) {
    if (!/^[0-9a-f]{64}$/.test(profile[field])) throw new Error(`PROFILE_DIGEST_INVALID:${field}`);
  }
  if (profile.schema_version !== "define-task-runtime-profile@1") throw new Error("PROFILE_SCHEMA_VERSION_INVALID");
  if (profile.network_policy !== "none") throw new Error("PROFILE_NETWORK_POLICY_MUST_BE_NONE");
  for (const field of [
    "visible_source_paths", "withheld_target_paths", "hidden_test_paths", "allowed_write_paths",
    "forbidden_paths", "visible_validation_commands", "hidden_validation_commands",
    "original_implementation_markers",
  ]) {
    if (!Array.isArray(profile[field])) throw new Error(`PROFILE_FIELD_INVALID:${field}`);
  }
  if (!profile.resource_limits || typeof profile.resource_limits.timeout_seconds !== "number") {
    throw new Error("PROFILE_FIELD_INVALID:resource_limits");
  }
  const pathFields = [
    "evaluator_source_root", "target_path", "stub_fixture_path", "baseline_receipt_path",
    ...profile.visible_source_paths, ...profile.withheld_target_paths, ...profile.hidden_test_paths,
    ...profile.allowed_write_paths, ...profile.forbidden_paths,
  ];
  for (const value of pathFields) safeRepositoryPath(value, "PROFILE_PATH");
  if (!profile.visible_source_paths.includes(profile.target_path)) throw new Error("PROFILE_TARGET_NOT_VISIBLE");
  if (!profile.withheld_target_paths.includes(profile.target_path)) throw new Error("PROFILE_TARGET_NOT_WITHHELD");
  if (JSON.stringify(profile.allowed_write_paths) !== JSON.stringify([profile.target_path])) {
    throw new Error("PROFILE_ALLOWED_WRITE_MUST_EQUAL_TARGET");
  }
  for (const hidden of profile.hidden_test_paths) {
    if (profile.visible_source_paths.includes(hidden)) throw new Error(`PROFILE_HIDDEN_PATH_VISIBLE:${hidden}`);
  }
}

function commitBlob(repositoryDirectory, commit, path) {
  return run("git", ["-c", `safe.directory=${repositoryDirectory}`, "-c", "core.autocrlf=false", "show", `${commit}:${path}`], {
    cwd: repositoryDirectory,
    binary: true,
  });
}

async function validateBaselineReceipt({ repository, profile }) {
  const receiptPath = contained(
    repository,
    join(repository, ...profile.baseline_receipt_path.split("/")),
    "BASELINE_RECEIPT",
  );
  const bytes = await readFile(receiptPath);
  const digest = sha256(bytes);
  if (digest !== profile.baseline_receipt_digest) {
    throw new Error(`BASELINE_RECEIPT_DIGEST_DRIFT:${digest}`);
  }
  const receipt = JSON.parse(bytes.toString("utf8"));
  if (receipt.schema_version !== "define-task-baseline-receipt@1") throw new Error("BASELINE_RECEIPT_SCHEMA_INVALID");
  if (receipt.task_id !== profile.task_id) throw new Error("BASELINE_RECEIPT_TASK_DRIFT");
  if (receipt.repository_commit !== profile.repository_commit) throw new Error("BASELINE_RECEIPT_COMMIT_DRIFT");
  if (receipt.worktree_bytes_used !== false) throw new Error("BASELINE_RECEIPT_WORKTREE_INVALID");
  if (receipt.dependency_closure_digest !== profile.dependency_closure_digest) {
    throw new Error("BASELINE_RECEIPT_DEPENDENCY_DRIFT");
  }
  const rows = receipt.visible_source_files;
  if (!Array.isArray(rows)) throw new Error("BASELINE_RECEIPT_FILES_INVALID");
  const expectedPaths = [...profile.visible_source_paths].sort((a, b) => Buffer.from(a).compare(Buffer.from(b)));
  const actualPaths = rows.map((row) => row.path).sort((a, b) => Buffer.from(a).compare(Buffer.from(b)));
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) throw new Error("BASELINE_RECEIPT_ALLOWLIST_DRIFT");
  for (const row of rows) {
    if (!/^[0-9a-f]{64}$/.test(row.sha256) || sha256(commitBlob(repository, profile.repository_commit, row.path)) !== row.sha256) {
      throw new Error(`BASELINE_RECEIPT_FILE_DRIFT:${row.path}`);
    }
  }
  if (!profile.hidden_test_paths.includes(receipt.hidden_test_path)) throw new Error("BASELINE_RECEIPT_HIDDEN_PATH_DRIFT");
  if (sha256(commitBlob(repository, profile.repository_commit, receipt.hidden_test_path)) !== receipt.hidden_test_sha256) {
    throw new Error("BASELINE_RECEIPT_HIDDEN_DIGEST_DRIFT");
  }
  return { path: receiptPath, sha256: digest };
}

function parseLsTree(text) {
  if (!text) return [];
  return String(text).split("\0").filter(Boolean).map((record) => {
    const match = /^(\d+) ([^ ]+) ([0-9a-f]+)\t([\s\S]+)$/.exec(record);
    if (!match) throw new Error(`GIT_LS_TREE_UNPARSEABLE:${record}`);
    return { mode: match[1], type: match[2], object: match[3], path: match[4] };
  });
}

function inspectCommitPaths(repositoryDirectory, commit, paths) {
  const output = run("git", ["-c", `safe.directory=${repositoryDirectory}`, "-c", "core.autocrlf=false", "ls-tree", "-rz", commit, "--", ...paths], {
    cwd: repositoryDirectory,
  });
  const entries = parseLsTree(output);
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  for (const path of paths) {
    const entry = byPath.get(path);
    if (!entry) throw new Error(`COMMIT_PATH_MISSING:${path}`);
    if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
      throw new Error(`COMMIT_PATH_MODE_REJECTED:${path}:${entry.mode}:${entry.type}`);
    }
  }
  return entries;
}

function inspectCommitTree(repositoryDirectory, commit, root) {
  const output = run("git", ["-c", `safe.directory=${repositoryDirectory}`, "-c", "core.autocrlf=false", "ls-tree", "-rz", "-r", commit, "--", root], {
    cwd: repositoryDirectory,
  });
  const entries = parseLsTree(output);
  if (!entries.length) throw new Error(`COMMIT_TREE_MISSING:${root}`);
  for (const entry of entries) {
    safeRepositoryPath(entry.path, "COMMIT_TREE_PATH");
    if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
      throw new Error(`COMMIT_TREE_MODE_REJECTED:${entry.path}:${entry.mode}:${entry.type}`);
    }
  }
  return entries;
}

async function extractArchive(repositoryDirectory, commit, paths, destination) {
  await mkdir(destination, { recursive: true });
  const archive = run(
    "git",
    ["-c", `safe.directory=${repositoryDirectory}`, "-c", "core.autocrlf=false", "archive", "--format=tar", commit, "--", ...paths],
    { cwd: repositoryDirectory, binary: true },
  );
  run("tar", ["--extract", "--file=-", "--directory", destination, "--no-same-owner", "--no-same-permissions"], {
    input: archive,
  });
}

async function installStub({ tree, profile, stubBytes }) {
  const target = contained(tree, join(tree, ...profile.target_path.split("/")), "TARGET");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, stubBytes, { flag: "w" });
}

async function inventory(root) {
  const rows = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => Buffer.from(left.name).compare(Buffer.from(right.name)));
    for (const entry of entries) {
      const path = join(directory, entry.name);
      const rel = relative(root, path).split(sep).join("/");
      const info = await lstat(path);
      if (info.isSymbolicLink()) throw new Error(`MATERIALIZED_SYMLINK_REJECTED:${rel}`);
      if (info.isDirectory()) {
        await walk(path);
      } else if (info.isFile()) {
        const bytes = await readFile(path);
        rows.push({ path: rel, size_bytes: bytes.length, sha256: sha256(bytes) });
      } else {
        throw new Error(`MATERIALIZED_ENTRY_REJECTED:${rel}`);
      }
    }
  }
  await walk(root);
  rows.sort((left, right) => Buffer.from(left.path).compare(Buffer.from(right.path)));
  return { rows, digest: sha256(canonicalBytes(rows)) };
}

async function auditTrees({ agentTrees, evaluatorTree, profile, expected, profileDigest, stubDigest }) {
  const checks = [];
  const blockers = [];
  const agentInventories = {};
  const expectedAgentPaths = [...profile.visible_source_paths].sort((a, b) => Buffer.from(a).compare(Buffer.from(b)));
  const record = (check, passed, details = {}) => {
    checks.push({ check, status: passed ? "pass" : "fail", ...details });
    if (!passed) blockers.push({ code: check, ...details });
  };

  for (const condition of CONDITIONS) {
    const tree = agentTrees[condition];
    const result = await inventory(tree);
    agentInventories[condition] = result;
    const actualPaths = result.rows.map((row) => row.path);
    record(`agent_allowlist:${condition}`, JSON.stringify(actualPaths) === JSON.stringify(expectedAgentPaths), {
      expected_paths: expectedAgentPaths,
      actual_paths: actualPaths,
    });
    const target = result.rows.find((row) => row.path === profile.target_path);
    record(`agent_stub:${condition}`, target?.sha256 === stubDigest, {
      expected_sha256: stubDigest,
      actual_sha256: target?.sha256 ?? null,
    });
    for (const hidden of profile.hidden_test_paths) {
      record(`agent_hidden_absent:${condition}:${hidden}`, !actualPaths.includes(hidden));
    }
    const targetBytes = await readFile(join(tree, ...profile.target_path.split("/")), "utf8");
    for (const marker of profile.original_implementation_markers) {
      record(`agent_original_marker_absent:${condition}:${sha256(marker).slice(0, 12)}`, !targetBytes.includes(marker));
    }
  }

  const agentDigests = Object.values(agentInventories).map((item) => item.digest);
  record("agent_visible_digest_equality", new Set(agentDigests).size === 1, { digests: agentDigests });

  const evaluatorInventory = await inventory(evaluatorTree);
  const evaluatorPaths = new Set(evaluatorInventory.rows.map((row) => row.path));
  for (const hidden of profile.hidden_test_paths) {
    record(`evaluator_hidden_present:${hidden}`, evaluatorPaths.has(hidden));
  }
  const evaluatorTarget = evaluatorInventory.rows.find((row) => row.path === profile.target_path);
  record("evaluator_stub", evaluatorTarget?.sha256 === stubDigest, {
    expected_sha256: stubDigest,
    actual_sha256: evaluatorTarget?.sha256 ?? null,
  });
  record("profile_digest_bound", /^[0-9a-f]{64}$/.test(profileDigest), { profile_sha256: profileDigest });
  record("commit_archive_only", expected.worktree_bytes_used === false, { worktree_bytes_used: false });

  return { checks, blockers, agentInventories, evaluatorInventory };
}

async function sealTree(root) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) await sealTree(path);
    else await chmod(path, 0o444);
  }
  await chmod(root, 0o555);
}

async function appendEvent(paths, { experimentId, taskId, eventType, actor, status, receiptDigest, blockers }) {
  const events = await readJsonLines(paths.events);
  await appendFile(paths.events, `${JSON.stringify({
    schema_version: EVENT_SCHEMA,
    sequence: events.length + 1,
    recorded_at: now(),
    experiment_id: experimentId,
    task_id: taskId ?? null,
    condition: null,
    cell_id: null,
    event_type: eventType,
    actor_or_adapter: actor,
    prior_state: "prepared",
    result_state: "prepared",
    input_digests: {},
    output_digests: receiptDigest ? { isolation_receipt: receiptDigest } : {},
    session_id: null,
    status,
    deviation_codes: blockers.map((blocker) => blocker.code),
  })}\n`, "utf8");
}

async function updateIsolationState(paths, status, attemptId) {
  const state = await readJson(paths.state);
  if (state.phase !== "prepared" || state.live_authorized !== false || state.model_calls !== 0) {
    throw new Error("RUN_STATE_CHANGED_DURING_ISOLATION");
  }
  await atomicJson(paths.state, {
    ...state,
    isolation_rehearsal: status,
    isolation_attempt_id: attemptId,
    live_authorized: false,
    model_calls: 0,
    derived_at: now(),
  });
}

function failureBlocker(error) {
  const message = error instanceof Error ? error.message : String(error);
  return { code: message.split(":")[0] || "ISOLATION_BUILD_FAILED", message };
}

export async function buildIsolation({ runDirectory, repositoryDirectory, profilePath, attemptId, actor = "local-operator" }) {
  const paths = runPaths(runDirectory);
  await assertRunInitialized(paths);
  const attempt = safeAttemptId(attemptId);
  const repository = resolve(repositoryDirectory || "");
  if (!repositoryDirectory) throw new Error("REPOSITORY_DIRECTORY_REQUIRED");
  if (!profilePath) throw new Error("PROFILE_REQUIRED");

  return withRunLock(paths, async () => {
    const state = await readJson(paths.state);
    if (state.phase !== "prepared") throw new Error(`ISOLATION_REQUIRES_PREPARED:${state.phase}`);
    if (state.live_authorized !== false || state.model_calls !== 0) throw new Error("ISOLATION_ZERO_AUTHORITY_INVARIANT_FAILED");
    if (state.open_question_count !== 0) throw new Error(`ISOLATION_OPEN_QUESTIONS:${state.open_question_count}`);

    const attemptDirectory = contained(paths.attempts, join(paths.attempts, attempt), "ATTEMPT");
    await mkdir(paths.attempts, { recursive: true });
    if (await exists(attemptDirectory)) throw new Error(`ISOLATION_ATTEMPT_EXISTS:${attempt}`);
    await mkdir(attemptDirectory);

    let experimentId = state.experiment_id;
    let profile = null;
    let profileDigest = null;
    let tools = null;
    let audit = { checks: [], blockers: [], agentInventories: {}, evaluatorInventory: null };
    try {
      const [profileBytes, selection, manifest] = await Promise.all([
        readFile(resolve(profilePath)), readJson(paths.selection), readJson(paths.manifest),
      ]);
      profileDigest = sha256(profileBytes);
      profile = JSON.parse(profileBytes.toString("utf8"));
      validateProfile(profile);
      experimentId = manifest.experiment_id;

      const selected = selection.candidates?.find((candidate) => candidate.candidate_id === profile.task_id && candidate.selected);
      if (!selected) throw new Error(`PROFILE_TASK_NOT_SELECTED:${profile.task_id}`);
      if (selected.repository_commit !== profile.repository_commit) throw new Error("PROFILE_SELECTION_COMMIT_DRIFT");

      const resolvedCommit = String(run("git", ["-c", `safe.directory=${repository}`, "rev-parse", `${profile.repository_commit}^{commit}`], { cwd: repository })).trim();
      if (resolvedCommit !== profile.repository_commit) throw new Error(`PROFILE_COMMIT_NOT_EXACT:${resolvedCommit}`);
      inspectCommitPaths(repository, profile.repository_commit, profile.visible_source_paths);
      inspectCommitTree(repository, profile.repository_commit, profile.evaluator_source_root);

      const baselineReceipt = await validateBaselineReceipt({ repository, profile });
      const stubPath = contained(repository, join(repository, ...profile.stub_fixture_path.split("/")), "STUB_FIXTURE");
      const stubBytes = await readFile(stubPath);
      const stubDigest = sha256(stubBytes);
      if (stubDigest !== profile.stub_fixture_sha256) throw new Error(`STUB_FIXTURE_DIGEST_DRIFT:${stubDigest}`);

      tools = {
        node: process.version,
        git: toolVersion("git", ["--version"]),
        tar: toolVersion("tar", ["--version"]),
        controller_image_id: process.env.DEFINE_CONTROLLER_IMAGE_ID || null,
      };
      const profileSnapshot = join(attemptDirectory, "profile.json");
      await writeFile(profileSnapshot, profileBytes, { flag: "wx" });

      const agentTrees = {};
      for (const condition of CONDITIONS) {
        const tree = join(attemptDirectory, "agent-bases", condition);
        await extractArchive(repository, profile.repository_commit, profile.visible_source_paths, tree);
        await installStub({ tree, profile, stubBytes });
        agentTrees[condition] = tree;
      }
      const evaluatorTree = join(attemptDirectory, "evaluator-base");
      await extractArchive(repository, profile.repository_commit, [profile.evaluator_source_root], evaluatorTree);
      await installStub({ tree: evaluatorTree, profile, stubBytes });

      audit = await auditTrees({
        agentTrees,
        evaluatorTree,
        profile,
        expected: { worktree_bytes_used: false },
        profileDigest,
        stubDigest,
      });
      if (audit.blockers.length) throw new Error(`ISOLATION_AUDIT_FAILED:${audit.blockers.map((item) => item.code).join(",")}`);

      const receipt = {
        schema_version: RECEIPT_SCHEMA,
        protocol_id: manifest.protocol_id,
        evidence_kind: "zero-model-isolation-rehearsal",
        status: "ready",
        recorded_at: now(),
        experiment_id: experimentId,
        task_id: profile.task_id,
        attempt_id: attempt,
        actor,
        authority_effect: "none",
        live_authorized: false,
        model_calls: 0,
        network_policy: "none",
        source: {
          repository_commit: profile.repository_commit,
          materialization: "git -c core.autocrlf=false archive --format=tar <commit> -- <paths>",
          extraction: "tar --extract --file=- --directory <base> --no-same-owner --no-same-permissions",
          worktree_bytes_used: false,
        },
        profile: { source_path: resolve(profilePath), sha256: profileDigest },
        baseline_receipt: baselineReceipt,
        runtime: {
          tools,
          agent_toolchain_digest: profile.agent_runtime_image_or_toolchain_digest,
          evaluator_toolchain_digest: profile.evaluator_runtime_image_or_toolchain_digest,
        },
        trees: {
          agents: Object.fromEntries(CONDITIONS.map((condition) => [condition, audit.agentInventories[condition]])),
          evaluator: audit.evaluatorInventory,
        },
        checks: audit.checks,
        blockers: [],
      };
      const receiptPath = join(attemptDirectory, "isolation-rehearsal-receipt.json");
      await atomicJson(receiptPath, receipt);
      const receiptDigest = sha256(await readFile(receiptPath));
      await appendEvent(paths, {
        experimentId,
        taskId: profile.task_id,
        eventType: "isolation_rehearsal_ready",
        actor,
        status: "success",
        receiptDigest,
        blockers: [],
      });
      await updateIsolationState(paths, "ready", attempt);
      await sealTree(join(attemptDirectory, "agent-bases"));
      await sealTree(join(attemptDirectory, "evaluator-base"));
      await chmod(profileSnapshot, 0o444);
      await chmod(receiptPath, 0o444);
      return { ...receipt, receipt_path: receiptPath, receipt_sha256: receiptDigest };
    } catch (error) {
      const blocker = failureBlocker(error);
      const blockers = audit.blockers.length ? audit.blockers : [blocker];
      const receiptPath = join(attemptDirectory, "isolation-rehearsal-receipt.json");
      if (!(await exists(receiptPath))) {
        const failed = {
          schema_version: RECEIPT_SCHEMA,
          evidence_kind: "zero-model-isolation-rehearsal",
          status: "failed",
          recorded_at: now(),
          experiment_id: experimentId,
          task_id: profile?.task_id ?? null,
          attempt_id: attempt,
          actor,
          authority_effect: "none",
          live_authorized: false,
          model_calls: 0,
          profile: { source_path: resolve(profilePath), sha256: profileDigest },
          runtime: { tools },
          checks: audit.checks,
          blockers,
        };
        await atomicJson(receiptPath, failed);
        const receiptDigest = sha256(await readFile(receiptPath));
        await appendEvent(paths, {
          experimentId,
          taskId: profile?.task_id ?? null,
          eventType: "isolation_rehearsal_failed",
          actor,
          status: "failure",
          receiptDigest,
          blockers,
        });
        await updateIsolationState(paths, "failed", attempt);
        await sealTree(attemptDirectory);
      }
      const wrapped = new Error(`ISOLATION_BUILD_FAILED:${blocker.message}`);
      wrapped.cause = error;
      wrapped.receipt_path = receiptPath;
      throw wrapped;
    }
  });
}

export async function getIsolationStatus({ runDirectory, attemptId }) {
  const paths = runPaths(runDirectory);
  await assertRunInitialized(paths);
  if (attemptId) {
    const attempt = safeAttemptId(attemptId);
    const receiptPath = join(paths.attempts, attempt, "isolation-rehearsal-receipt.json");
    if (!(await exists(receiptPath))) return { attempt_id: attempt, status: "absent" };
    const receipt = await readJson(receiptPath);
    return {
      attempt_id: attempt,
      status: receipt.status,
      task_id: receipt.task_id,
      recorded_at: receipt.recorded_at,
      receipt_path: receiptPath,
      live_authorized: false,
      model_calls: 0,
      blockers: receipt.blockers ?? [],
    };
  }
  if (!(await exists(paths.attempts))) return { status: "absent", attempts: [] };
  const names = (await readdir(paths.attempts)).sort((a, b) => Buffer.from(a).compare(Buffer.from(b)));
  const attempts = [];
  for (const name of names) attempts.push(await getIsolationStatus({ runDirectory, attemptId: name }));
  return { status: attempts.length ? attempts.at(-1).status : "absent", attempts };
}

export async function verifyIsolation({ runDirectory, attemptId }) {
  const paths = runPaths(runDirectory);
  await assertRunInitialized(paths);
  const attempt = safeAttemptId(attemptId);
  const attemptDirectory = join(paths.attempts, attempt);
  const receiptPath = join(attemptDirectory, "isolation-rehearsal-receipt.json");
  if (!(await exists(receiptPath))) throw new Error(`ISOLATION_ATTEMPT_NOT_FOUND:${attempt}`);
  const receipt = await readJson(receiptPath);
  if (receipt.status !== "ready") throw new Error(`ISOLATION_ATTEMPT_NOT_READY:${receipt.status}`);

  const blockers = [];
  const current = {};
  for (const condition of CONDITIONS) {
    try {
      current[condition] = await inventory(join(attemptDirectory, "agent-bases", condition));
      if (current[condition].digest !== receipt.trees.agents[condition].digest) {
        blockers.push({ code: "AGENT_TREE_DRIFT", condition, expected: receipt.trees.agents[condition].digest, actual: current[condition].digest });
      }
    } catch (error) {
      blockers.push({ code: "AGENT_TREE_UNREADABLE", condition, message: String(error.message || error) });
    }
  }
  try {
    current.evaluator = await inventory(join(attemptDirectory, "evaluator-base"));
    if (current.evaluator.digest !== receipt.trees.evaluator.digest) {
      blockers.push({ code: "EVALUATOR_TREE_DRIFT", expected: receipt.trees.evaluator.digest, actual: current.evaluator.digest });
    }
  } catch (error) {
    blockers.push({ code: "EVALUATOR_TREE_UNREADABLE", message: String(error.message || error) });
  }
  const digests = CONDITIONS.map((condition) => current[condition]?.digest).filter(Boolean);
  if (new Set(digests).size !== 1 || digests.length !== CONDITIONS.length) {
    blockers.push({ code: "AGENT_VISIBLE_DIGEST_MISMATCH", digests });
  }
  const state = await readJson(paths.state);
  if (state.live_authorized !== false || state.model_calls !== 0 || state.phase !== "prepared") {
    blockers.push({ code: "ZERO_AUTHORITY_STATE_DRIFT", phase: state.phase, live_authorized: state.live_authorized, model_calls: state.model_calls });
  }
  if (blockers.length) {
    const error = new Error(`ISOLATION_VERIFY_FAILED:${blockers.map((item) => item.code).join(",")}`);
    error.blockers = blockers;
    throw error;
  }
  return {
    schema_version: "define-isolation-verification@1",
    status: "pass",
    verified_at: now(),
    attempt_id: attempt,
    task_id: receipt.task_id,
    receipt_path: receiptPath,
    agent_visible_digest: digests[0],
    evaluator_digest: current.evaluator.digest,
    authority_effect: "none",
    live_authorized: false,
    model_calls: 0,
  };
}

export function isolationConstants() {
  return { CONDITIONS, RECEIPT_SCHEMA };
}
