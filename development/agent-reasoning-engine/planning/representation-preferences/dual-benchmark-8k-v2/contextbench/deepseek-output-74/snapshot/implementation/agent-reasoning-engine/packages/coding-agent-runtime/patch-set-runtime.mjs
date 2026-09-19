import {diagnosePatch} from './patch-schema.mjs';
import {constants, closeSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, writeSync} from "node:fs";
import {createHash, timingSafeEqual} from "node:crypto";
import {isAbsolute, resolve, sep} from "node:path";

import {runSandboxCommand} from "./sandbox.mjs";
import {snapshotTree} from "./verifier.mjs";

const SHA = /^[a-f0-9]{64}$/u;

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function result(status, fields = {}) { const material = {schema_version: "are.patch-set-runtime-result/v1", status, ...fields, authority_effect: "none"}; return freeze({...material, result_digest: sha256(stable(material))}); }

export function parsePatchSetCandidate(raw) {
  const diagnostic = diagnosePatch(raw);
  if (!diagnostic.ok) return {ok:false, reason_codes:diagnostic.reason_codes, issues:diagnostic.issues, truncated:diagnostic.truncated};
  const value=diagnostic.value;
  return {ok:true, value:freeze(structuredClone(value)), candidate_digest:sha256(stable(value))};
}

function resolveFile(root, path) {
  const absolute = resolve(root, path);
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) throw new Error("PATH_ESCAPE");
  let cursor = root;
  for (const segment of path.split(/[\\/]/u)) { cursor = resolve(cursor, segment); if (lstatSync(cursor).isSymbolicLink()) throw new Error("SYMLINK_FORBIDDEN"); }
  if (!lstatSync(absolute).isFile()) throw new Error("REGULAR_FILE_REQUIRED");
  return absolute;
}

function replaceNoFollow(path, bytes) {
  const descriptor = openSync(path, constants.O_WRONLY | constants.O_TRUNC | constants.O_NOFOLLOW);
  try { writeSync(descriptor, bytes, null, "utf8"); fsyncSync(descriptor); } finally { closeSync(descriptor); }
}

function sameDigest(left, right) { return SHA.test(left) && SHA.test(right) && timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex")); }

export function runTransactionalPatchSet(input = {}) {
  const runId = typeof input.run_id === "string" && input.run_id ? input.run_id : `patch-set-${Date.now()}`;
  const parsed = parsePatchSetCandidate(input.raw_candidate);
  if (!parsed.ok) return result("BLOCK", {run_id: runId, reason_codes: parsed.reason_codes, effect_applied: false});
  const candidate = parsed.value;
  let before;
  let root;
  try { root = realpathSync(input.fixture_root); before = snapshotTree(root); } catch (error) { return result("BLOCK", {run_id: runId, reason_codes: [`patch-set.repository-invalid:${error.message}`], effect_applied: false}); }
  const allowlist = [...new Set(input.mutation_allowlist ?? [])].sort();
  const reasons = [];
  if (!sameDigest(before.tree_sha256, candidate.expected_base_tree_sha256)) reasons.push("patch-set.base-tree-drift");
  const targets = [];
  for (const change of candidate.changes) {
    if (!allowlist.includes(change.path)) reasons.push("patch-set.path-not-allowlisted");
    if (change.path.startsWith("test/") || change.path === "package.json") reasons.push("patch-set.protected-file");
    try {
      const absolute = resolveFile(root, change.path);
      const original = readFileSync(absolute);
      const originalUtf8 = new TextDecoder("utf-8", {fatal: true}).decode(original);
      if (!sameDigest(sha256(original), change.expected_file_sha256)) reasons.push("patch-set.file-drift");
      if (sha256(original) === sha256(change.utf8)) reasons.push("patch-set.change-empty");
      targets.push({change, absolute, original, originalUtf8});
    } catch (error) { reasons.push(`patch-set.target-invalid:${error.message}`); }
  }
  if (reasons.length) return result("BLOCK", {run_id: runId, candidate_digest: parsed.candidate_digest, reason_codes: [...new Set(reasons)].sort(), effect_applied: false});
  const actionId = sha256(stable({run_id: runId, candidate_digest: parsed.candidate_digest, base_tree_sha256: before.tree_sha256, paths: candidate.changes.map((change) => change.path).sort()}));
  if (input.approve !== true) return result("AWAITING_APPROVAL", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["action.explicit-approval-required"], effect_applied: false});
  if (input.approval_digest !== undefined && !sameDigest(input.approval_digest, parsed.candidate_digest)) return result("BLOCK", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["action.approval-digest-mismatch"], effect_applied: false});
  if (!input.verification_sandbox || typeof input.verification_sandbox.run !== "function") return result("BLOCK", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["sandbox.required"], effect_applied: false});
  if (!Array.isArray(input.verification_command) || input.verification_command.length === 0) return result("BLOCK", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["patch-set.verification-command-required"], effect_applied: false});
  if (snapshotTree(root).tree_sha256 !== before.tree_sha256) return result("BLOCK", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["patch-set.pre-effect-tree-drift"], effect_applied: false});

  const writer = input.writer ?? replaceNoFollow;
  const touched = [];
  function rollback() {
    const failures = [];
    for (const target of [...touched].reverse()) { try { writer(target.absolute, target.originalUtf8, {rollback: true, path: target.change.path}); } catch { failures.push(target.change.path); } }
    let restored = false;
    try { restored = snapshotTree(root).tree_sha256 === before.tree_sha256; } catch { restored = false; }
    return {restored: restored && failures.length === 0, failures};
  }
  try {
    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      touched.push(target);
      writer(target.absolute, target.change.utf8, {rollback: false, path: target.change.path, index});
      if (input.fault_injection === `after-write:${index + 1}`) throw new Error("FAULT_AFTER_WRITE");
    }
  } catch (error) {
    const rolled = rollback();
    return rolled.restored
      ? result("BLOCK", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["patch-set.write-failed-rolled-back"], effect_applied: "rolled-back"})
      : result("EFFECT_AMBIGUOUS", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["patch-set.rollback-failed"], rollback_failures: rolled.failures, effect_applied: "unknown-to-runtime", automatic_retry_permitted: false});
  }
  if (input.fault_injection === "after-effect-before-observation") return result("EFFECT_AMBIGUOUS", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["patch-set.after-effect-before-observation"], effect_applied: "unknown-to-runtime", automatic_retry_permitted: false});
  const after = snapshotTree(root);
  const changed = [...new Set([...Object.keys(before.files), ...Object.keys(after.files)])].filter((path) => before.files[path] !== after.files[path]).sort();
  const expected = candidate.changes.map((change) => change.path).sort();
  if (stable(changed) !== stable(expected)) {
    const rolled = rollback();
    return rolled.restored ? result("BLOCK", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["patch-set.postimage-scope-invalid"], effect_applied: "rolled-back"}) : result("EFFECT_AMBIGUOUS", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["patch-set.rollback-failed"], effect_applied: "unknown-to-runtime", automatic_retry_permitted: false});
  }
  const verification = runSandboxCommand({sandbox: input.verification_sandbox, command: input.verification_command});
  if (!verification.ok) {
    const rolled = rollback();
    return rolled.restored ? result("BLOCK", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: verification.reason_codes, verification, effect_applied: "rolled-back"}) : result("EFFECT_AMBIGUOUS", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: ["patch-set.rollback-failed"], verification, effect_applied: "unknown-to-runtime", automatic_retry_permitted: false});
  }
  return result("PATCH_CANDIDATE", {run_id: runId, action_id: actionId, candidate_digest: parsed.candidate_digest, reason_codes: [], effect_applied: true, automatic_retry_permitted: false, verification, before_tree_sha256: before.tree_sha256, after_tree_sha256: after.tree_sha256, changed_paths: changed});
}
