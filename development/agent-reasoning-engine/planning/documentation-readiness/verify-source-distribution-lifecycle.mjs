#!/usr/bin/env node

import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, relative, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {materializeStandaloneDistribution} from "../../../../implementation/agent-reasoning-engine/src/distribution.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../../..");
const productRelative = "cyberAlchemy-v2/implementation/agent-reasoning-engine";
const defaultCandidatePath = resolve(repositoryRoot, "implementation/agent-reasoning-engine/evidence/product-candidate.018.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fail(message, detail = "") {
  throw new Error(detail ? `${message}: ${detail}` : message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    timeout: options.timeout ?? 120_000,
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });
  if (result.error) fail(`command.failed:${command}`, result.error.message);
  if (result.status !== 0) fail(`command.nonzero:${command}`, `${result.status}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return result;
}

function createArchive(sourceRoot, archivePath) {
  const tarPath = archivePath.replace(/\.gz$/u, "");
  run("tar", [
    "--sort=name",
    "--mtime=@0",
    "--owner=0",
    "--group=0",
    "--numeric-owner",
    "--format=posix",
    "--pax-option=delete=atime,delete=ctime",
    "-cf",
    tarPath,
    "-C",
    sourceRoot,
    "cyberAlchemy-v2",
  ]);
  run("gzip", ["-n", "-9", tarPath]);
  if (!existsSync(archivePath)) fail("archive.missing", archivePath);
  return Object.freeze({bytes: readFileSync(archivePath).byteLength, sha256: sha256(readFileSync(archivePath))});
}

function walk(root, current = root, output = []) {
  for (const name of readdirSync(current).sort()) {
    const path = resolve(current, name);
    const stat = lstatSync(path);
    if (stat.isDirectory()) walk(root, path, output);
    else output.push(relative(root, path).replaceAll("\\", "/"));
  }
  return output;
}

function verifyClosure(root, candidate) {
  const expectedPaths = candidate.source_closure.files.map((entry) => entry.path).sort();
  const observedPaths = walk(root).sort();
  if (JSON.stringify(observedPaths) !== JSON.stringify(expectedPaths)) fail("install.inventory-mismatch");
  for (const entry of candidate.source_closure.files) {
    const path = resolve(root, entry.path);
    const stat = lstatSync(path);
    if (entry.kind === "symlink") {
      if (!stat.isSymbolicLink()) fail("install.symlink-mismatch", entry.path);
    } else {
      if (!stat.isFile()) fail("install.file-mismatch", entry.path);
      if (sha256(readFileSync(path)) !== entry.sha256) fail("install.digest-mismatch", entry.path);
      if ((stat.mode & 0o777) !== entry.mode) fail("install.mode-mismatch", entry.path);
    }
  }
  return Object.freeze({file_count: observedPaths.length, closure_digest: candidate.source_closure.closure_digest});
}

function doctor(launcher, cwd, expectSuccess) {
  const result = spawnSync(process.execPath, [launcher, "doctor", "--json"], {cwd, encoding: "utf8", timeout: 30_000});
  if (result.error) fail("doctor.command-failed", result.error.message);
  if (expectSuccess && result.status !== 0) fail("doctor.expected-pass", `${result.status}\n${result.stdout}\n${result.stderr}`);
  if (!expectSuccess && result.status === 0) fail("doctor.expected-failure");
  if (!expectSuccess) return Object.freeze({status: "EXPECTED_FAILURE", exit_code: result.status});
  const parsed = JSON.parse(result.stdout);
  if (parsed.status !== "PASS") fail("doctor.health-not-pass", result.stdout);
  return Object.freeze({status: parsed.status, product_version: parsed.product_version, closure_digest: parsed.source_closure.closure_digest});
}

function gatewayLifecycle(productRoot) {
  const testPath = resolve(productRoot, "packages/codex-app-server-wrapper/test/gateway-session-store.test.mjs");
  const result = run(process.execPath, ["--test", testPath], {cwd: productRoot, timeout: 120_000});
  const match = result.stdout.match(/tests (\d+)/u);
  return Object.freeze({status: "PASS", test_file: relative(productRoot, testPath), test_cases: match ? Number(match[1]) : null});
}

async function durableStoreRecovery(productRoot, workingRoot, candidateId) {
  const gatewayApi = await import(pathToFileURL(resolve(productRoot, "packages/codex-app-server-wrapper/index.mjs")));
  const reasoningApi = await import(pathToFileURL(resolve(productRoot, "packages/reasoning-state-runtime/index.mjs")));
  const stateRoot = resolve(workingRoot, "state");
  const backupRoot = resolve(workingRoot, "backup");
  mkdirSync(stateRoot, {recursive: true, mode: 0o700});
  mkdirSync(backupRoot, {recursive: true, mode: 0o700});

  const gatewayPath = resolve(stateRoot, "gateway-sessions.jsonl");
  const gatewayStoreId = "gateway-store:distribution-recovery";
  const gatewayStore = gatewayApi.createFileGatewaySessionStore({path: gatewayPath, store_id: gatewayStoreId});
  for (const event of [
    {event_kind: "session-started", consumer_id: "codex:recovery", content: {lane: "plan-bound", resume_token_digest: "fixture-token-digest"}},
    {event_kind: "dispatch-intent", consumer_id: "codex:recovery", content: {request_key: "turn:recovery", method: "turn/start", binding_digest: "fixture-binding"}},
    {event_kind: "dispatch-outcome", consumer_id: "codex:recovery", content: {request_key: "turn:recovery", response: {result: "complete"}}},
  ]) {
    if (!gatewayStore.append(event).ok) fail("durable.gateway-append-failed");
  }
  const gatewayBefore = gatewayStore.inspect();
  gatewayStore.close();

  const reasoningPath = resolve(stateRoot, "reasoning-state.jsonl");
  const reasoningLedgerId = "reasoning:distribution-recovery";
  const sink = reasoningApi.createAppendOnlyFileReasoningStateSink({path: reasoningPath});
  const ledger = reasoningApi.createReasoningStateLedger({ledger_id: reasoningLedgerId, sink});
  const request = ledger.append({event_kind: "request-interpreted", content: {request_id: "request:recovery", route_id: "CA2-ROUTE-IMPLEMENT"}});
  const context = ledger.append({event_kind: "context-projected", content: {context_envelope_digest: "context:recovery", selected_dependencies: [candidateId]}});
  if (!request.ok || !context.ok) fail("durable.reasoning-append-failed");
  const epoch = ledger.seal({
    event_digests: [request.event.event_digest, context.event.event_digest],
    consumer_ref: "codex:recovery",
    request_ref: "request:recovery",
    context_envelope_digest: "context:recovery",
    selected_dependencies: [candidateId],
    frontier: {continuation: "complete"},
  });
  if (!epoch.ok) fail("durable.reasoning-seal-failed");
  const checkpoint = ledger.checkpoint({checkpoint_kind: "manual", epoch: epoch.value, subject_digest: "distribution-recovery"});
  if (!checkpoint.ok) fail("durable.reasoning-checkpoint-failed");
  const reasoningBefore = ledger.inspect();
  ledger.close();

  const gatewayBackup = resolve(backupRoot, "gateway-sessions.jsonl");
  const reasoningBackup = resolve(backupRoot, "reasoning-state.jsonl");
  for (const [source, backup] of [[gatewayPath, gatewayBackup], [reasoningPath, reasoningBackup]]) {
    copyFileSync(source, backup);
    chmodSync(backup, 0o600);
  }
  const backupManifest = [
    {store: "gateway-session-store", bytes: readFileSync(gatewayBackup).byteLength, sha256: sha256(readFileSync(gatewayBackup)), mode: lstatSync(gatewayBackup).mode & 0o777},
    {store: "reasoning-state-ledger", bytes: readFileSync(reasoningBackup).byteLength, sha256: sha256(readFileSync(reasoningBackup)), mode: lstatSync(reasoningBackup).mode & 0o777},
  ];

  appendFileSync(gatewayPath, "{}\n");
  appendFileSync(reasoningPath, "{}\n");
  let gatewayCorruptionDetected = false;
  try { gatewayApi.createFileGatewaySessionStore({path: gatewayPath, store_id: gatewayStoreId}); }
  catch { gatewayCorruptionDetected = true; }
  const corruptReasoning = reasoningApi.recoverReasoningStateLedger({path: reasoningPath, ledger_id: reasoningLedgerId, create_if_missing: false});
  if (!gatewayCorruptionDetected || corruptReasoning.ok) fail("durable.corruption-not-detected");

  for (const [backup, target] of [[gatewayBackup, gatewayPath], [reasoningBackup, reasoningPath]]) {
    copyFileSync(backup, target);
    chmodSync(target, 0o600);
  }
  const restoredGateway = gatewayApi.createFileGatewaySessionStore({path: gatewayPath, store_id: gatewayStoreId});
  const gatewayAfter = restoredGateway.inspect();
  restoredGateway.close();
  const restoredReasoning = reasoningApi.recoverReasoningStateLedger({path: reasoningPath, ledger_id: reasoningLedgerId, create_if_missing: false});
  if (!restoredReasoning.ok) fail("durable.reasoning-restore-failed", JSON.stringify(restoredReasoning.reason_codes));
  const reasoningAfter = restoredReasoning.ledger.inspect();
  restoredReasoning.ledger.close();
  if (gatewayAfter.event_count !== gatewayBefore.event_count || gatewayAfter.head_event_digest !== gatewayBefore.head_event_digest) fail("durable.gateway-restore-mismatch");
  if (reasoningAfter.event_count !== reasoningBefore.event_count || reasoningAfter.checkpoint_count !== reasoningBefore.checkpoint_count) fail("durable.reasoning-restore-mismatch");

  return Object.freeze({
    status: "PASS",
    stores: backupManifest,
    backup_manifest_sha256: sha256(JSON.stringify(backupManifest)),
    corruption_detection: {gateway_session_store: "PASS", reasoning_state_ledger: "PASS"},
    restore: {
      gateway_session_store: {status: "PASS", event_count: gatewayAfter.event_count, head_event_digest: gatewayAfter.head_event_digest},
      reasoning_state_ledger: {status: "PASS", event_count: reasoningAfter.event_count, checkpoint_count: reasoningAfter.checkpoint_count, recovered_checkpoint_digest: restoredReasoning.assessment.recovered_checkpoint_digest},
    },
    scope: `disposable local ${candidateId} state paths`,
  });
}

function parseArguments() {
  const args = process.argv.slice(2);
  const parsed = {output: null, artifact: null, candidate: null};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!value || !["--output", "--artifact", "--candidate"].includes(flag)) {
      fail("usage", "verify-source-distribution-lifecycle.mjs [--candidate <candidate.json>] [--output <receipt.json>] [--artifact <artifact.tar.gz>]");
    }
    const key = flag.slice(2);
    if (parsed[key]) fail("argument.duplicate", flag);
    parsed[key] = resolve(value);
  }
  if (parsed.artifact && !parsed.artifact.endsWith(".tar.gz")) fail("artifact.extension-required", ".tar.gz");
  return {...parsed, candidate: parsed.candidate ?? defaultCandidatePath};
}

const {output, artifact: requestedArtifact, candidate: candidatePath} = parseArguments();
const temporary = mkdtempSync(resolve(tmpdir(), "are-distribution-lifecycle-"));

try {
  const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
  const candidateNumber = candidate.candidate_id.match(/(\d+)$/u)?.[1];
  if (!candidateNumber) fail("candidate.identity-invalid");
  const firstSource = resolve(temporary, "source-a");
  const secondSource = resolve(temporary, "source-b");
  const firstMaterialization = materializeStandaloneDistribution(firstSource);
  const secondMaterialization = materializeStandaloneDistribution(secondSource);
  if (firstMaterialization.closure_digest !== candidate.source_closure.closure_digest) fail("candidate.closure-mismatch");
  if (secondMaterialization.closure_digest !== firstMaterialization.closure_digest) fail("materialization.nondeterministic");

  const firstArchivePath = resolve(temporary, `are-candidate-${candidateNumber}-a.tar.gz`);
  const secondArchivePath = resolve(temporary, `are-candidate-${candidateNumber}-b.tar.gz`);
  const firstArchive = createArchive(firstSource, firstArchivePath);
  const secondArchive = createArchive(secondSource, secondArchivePath);
  if (firstArchive.sha256 !== secondArchive.sha256 || firstArchive.bytes !== secondArchive.bytes) fail("archive.nondeterministic");
  if (requestedArtifact) {
    mkdirSync(dirname(requestedArtifact), {recursive: true});
    copyFileSync(firstArchivePath, requestedArtifact);
    writeFileSync(`${requestedArtifact}.sha256`, `${firstArchive.sha256}  ${requestedArtifact.split("/").at(-1)}\n`);
  }

  const prefix = resolve(temporary, "prefix");
  const installRoot = resolve(prefix, "share", "are");
  mkdirSync(installRoot, {recursive: true});
  run("tar", ["-xzf", firstArchivePath, "-C", installRoot]);
  const installedClosure = verifyClosure(installRoot, candidate);
  const installedProduct = resolve(installRoot, productRelative);
  const launcher = resolve(prefix, "bin", "are");
  mkdirSync(dirname(launcher), {recursive: true});
  symlinkSync(resolve(installedProduct, "bin/are.mjs"), launcher);

  const installedHealth = doctor(launcher, installedProduct, true);
  const gateway = gatewayLifecycle(installedProduct);
  const durableStore = await durableStoreRecovery(installedProduct, resolve(prefix, "durable-recovery-drill"), candidate.candidate_id);

  const injectedPath = resolve(installedProduct, "bin/are.mjs");
  appendFileSync(injectedPath, "\nthis is an injected invalid recovery fixture !!!\n");
  const injectedFailure = doctor(launcher, installedProduct, false);

  rmSync(installRoot, {recursive: true, force: true});
  mkdirSync(installRoot, {recursive: true});
  run("tar", ["-xzf", firstArchivePath, "-C", installRoot]);
  const rollbackClosure = verifyClosure(installRoot, candidate);
  const rollbackHealth = doctor(launcher, installedProduct, true);

  rmSync(launcher, {force: true});
  rmSync(installRoot, {recursive: true, force: true});
  const uninstall = {status: !existsSync(launcher) && !existsSync(installRoot) ? "PASS" : "FAIL"};
  if (uninstall.status !== "PASS") fail("uninstall.incomplete");

  const receipt = {
    schema_version: "are.source-distribution-lifecycle-receipt/v2",
    status: "PASS",
    candidate: {
      candidate_id: candidate.candidate_id,
      candidate_digest: candidate.candidate_digest,
      product_version: candidate.product.version,
      closure_digest: candidate.source_closure.closure_digest,
      file_count: candidate.source_closure.files.length,
    },
    artifact: {
      format: "tar+gzip",
      filename: requestedArtifact ? requestedArtifact.split("/").at(-1) : `are-${candidate.product.version}.tar.gz`,
      bytes: firstArchive.bytes,
      sha256: firstArchive.sha256,
      reproducibility_runs: 2,
      normalized_metadata: ["path-order", "mtime", "uid", "gid", "gzip-header"],
      signature_status: "NOT_RUN",
      signature_reason: "No release signing identity or trusted public key has been selected.",
      emitted: Boolean(requestedArtifact),
    },
    lifecycle: {
      install: {status: "PASS", closure: installedClosure},
      start_and_health: installedHealth,
      reconnect_stop_restart: gateway,
      failure_injection: injectedFailure,
      rollback_and_restore: {status: "PASS", closure: rollbackClosure, health: rollbackHealth},
      uninstall,
      durable_store_backup_restore: durableStore,
    },
    environment: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      archive_tools: {
        tar: run("tar", ["--version"]).stdout.split("\n")[0],
        gzip: run("gzip", ["--version"]).stdout.split("\n")[0],
      },
    },
    retention: {
      storage_class: requestedArtifact ? "repository-local-compressed-canonical" : "not-retained",
      artifact_path: requestedArtifact ? relative(repositoryRoot, requestedArtifact).replaceAll("\\", "/") : null,
      duplicate_builds: "discarded-after-byte-and-digest-comparison",
      retain_until: "explicit product-owner decision after a verified successor archive and rollback horizon",
      deletion_authority: "product-owner",
      external_replication: "NOT_RUN",
    },
    open_questions_ref: "docs/releases/0.10.0-rc.1.md#open-questions",
    authority_effect: "none",
    claim_limit: `This receipt proves a disposable local source-package and two-store recovery lifecycle for ${candidate.candidate_id}. It is not product approval, publication, deployment, a trusted signature, external archival custody, or production recovery evidence.`,
  };
  receipt.receipt_digest = sha256(JSON.stringify(receipt));
  const encoded = `${JSON.stringify(receipt, null, 2)}\n`;
  if (output) {
    mkdirSync(dirname(output), {recursive: true});
    writeFileSync(output, encoded);
  }
  process.stdout.write(encoded);
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
