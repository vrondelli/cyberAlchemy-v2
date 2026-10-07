// Prospective G01 fallback for a delivered base read that was not bound at
// tool-production time. The frozen r15 source and receipts are unchanged.
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {isAbsolute} from "node:path";
import {confirmBaseRead, verifyIntentAnchorState} from "./intent-anchor-convergence-r3.mjs";
import {bindConfirmedBaseRead} from "./intent-anchor-integration-r3.mjs";

const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const safePath = path => typeof path === "string" && path.length > 0 &&
  !path.startsWith("/") && !path.includes("\\") && !path.includes(":") &&
  !/[\x00-\x1f\x7f]/.test(path) && path.split("/").every(part => part && part !== "." && part !== "..");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const fail = reason => { throw new Error(`late-bind-delivered-base.${reason}`); };

export function lateBindDeliveredBaseReads({state, origin_bindings, native_reads, repoRoot, base_commit} = {}) {
  if (!verifyIntentAnchorState(state).ok || !Array.isArray(origin_bindings) ||
      !Array.isArray(native_reads) || !isAbsolute(repoRoot ?? "") || !COMMIT.test(base_commit ?? ""))
    fail("inputs-invalid");
  let next = state;
  const bindings = [...origin_bindings];
  const seen = new Set();
  const counts = {delivered: native_reads.length, support_covered: 0, base_hash_matched: 0,
    newly_bound: 0, replaced_undelivered_binding: 0};
  for (const read of native_reads) {
    if (!read || !HASH.test(read.id ?? "") || !HASH.test(read.source_sha256 ?? "") ||
        !safePath(read.path) || !Number.isSafeInteger(read.start_line) ||
        !Number.isSafeInteger(read.end_line) || read.start_line < 1 ||
        read.end_line < read.start_line || seen.has(read.id)) continue;
    seen.add(read.id);
    if (!next.support.some(item => item.path === read.path &&
        item.content_sha256 === read.source_sha256 && item.start_line <= read.start_line &&
        item.end_line >= read.end_line)) continue;
    counts.support_covered++;
    let source;
    try {
      source = execFileSync("git", ["-C", repoRoot, "show", `${base_commit}:${read.path}`],
        {maxBuffer: 8 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"]});
    } catch { continue; }
    if (sha(source) !== read.source_sha256) continue;
    counts.base_hash_matched++;
    next = confirmBaseRead(next, {path: read.path, start_line: read.start_line,
      end_line: read.end_line, content_sha256: read.source_sha256,
      base_revision_confirmed: true});
    const confirmed = next.confirmed_base_reads.find(item => item.path === read.path &&
      item.start_line === read.start_line && item.end_line === read.end_line &&
      item.content_sha256 === read.source_sha256);
    if (!confirmed) fail("confirmed-read-missing");
    const binding = bindConfirmedBaseRead(next, {convergence_read_id: confirmed.read_id,
      native_read_id: read.id, source_revision: "base", path: read.path,
      start_line: read.start_line, end_line: read.end_line,
      source_sha256: read.source_sha256});
    const index = bindings.findIndex(item => item?.convergence_read_id === confirmed.read_id);
    if (index < 0) { bindings.push(binding); counts.newly_bound++; }
    else if (!native_reads.some(item => item.id === bindings[index].native_read_id)) {
      bindings[index] = binding; counts.replaced_undelivered_binding++;
    }
  }
  return {state: next, origin_bindings: bindings, counts, authority_effect: "none"};
}
