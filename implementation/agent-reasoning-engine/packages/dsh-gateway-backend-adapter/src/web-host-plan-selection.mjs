import {constants, openSync, closeSync, fstatSync, readSync, realpathSync} from "node:fs";
import {isAbsolute, relative, resolve, sep} from "node:path";
import {createHash} from "node:crypto";
import {digestValue, freezeResult} from "../../codex-app-server-wrapper/src/canonical.mjs";
import {materializeReasoningPlanContext} from "../../reasoning-state-runtime/plan-context.mjs";
import {normalizePlanMigrationAccounting} from "../../codex-app-server-wrapper/src/objective-requirements.mjs";

const KEYS = ["schema_version", "parent_plan_ref", "parent_plan_digest", "active_slice_id",
  "source_refs", "feature_obligations", "unresolved_decisions"];
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const fail = () => {throw new Error("dsh-web.host-plan-selection-invalid-or-drifted");};

// Bounded regular-file reads; neither ambient repository discovery nor Markdown parsing.
function readRegular(path, limit) {
  let fd;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = fstatSync(fd);
    if (!before.isFile() || before.size < 1 || before.size > limit) fail();
    const bytes = Buffer.alloc(before.size + 1);
    let count = 0, n;
    while ((n = readSync(fd, bytes, count, bytes.length - count, null)) > 0) {
      count += n;
      if (count > before.size) fail();
    }
    const after = fstatSync(fd);
    if (count !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs
      || after.ctimeMs !== before.ctimeMs) fail();
    return bytes.subarray(0, count);
  } catch {fail();} finally {if (fd !== undefined) closeSync(fd);}
}

/** Reverify the exact bounded source set of a retained typed plan, not a source scan. */
export function loadDshPlanSourceDigests(workspace, source_refs) {
  try {
    if (!isAbsolute(workspace) || !Array.isArray(source_refs) || source_refs.length < 1 || source_refs.length > 16) fail();
    const root = realpathSync(workspace);
    const sourceDigests = Object.create(null);
    let totalBytes = 0;
    for (const source of source_refs) {
      const ref = source?.source_ref;
      if (!source || Object.keys(source).sort().join(',') !== 'source_digest,source_ref'
        || typeof ref !== 'string' || !ref || ref.includes('\\') || isAbsolute(ref)
        || ref.split('/').some(part => !part || part === '.' || part === '..')
        || Object.hasOwn(sourceDigests, ref)) fail();
      const path = resolve(root, ref), real = realpathSync(path), rel = relative(root, real);
      if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel) || real !== path) fail();
      const content = readRegular(path, 1024 * 1024);
      totalBytes += content.length;
      if (totalBytes > 4 * 1024 * 1024) fail();
      const hash = sha256(content);
      if (hash !== source.source_digest) fail();
      sourceDigests[ref] = hash;
    }
    return freezeResult({...sourceDigests});
  } catch { fail(); }
}

/** Private Host startup descriptor. It must never be accepted from browser input. */
export function loadDshHostPlanSelection({workspace, selection_path, selection_digest = null}) {
  try {
    if (!isAbsolute(workspace) || !isAbsolute(selection_path)) fail();
    const root = realpathSync(workspace);
    const bytes = readRegular(selection_path, 16384);
    const selectedDigest = sha256(bytes);
    if (selection_digest !== null && selection_digest !== selectedDigest) fail();
    const selection = JSON.parse(bytes.toString("utf8"));
    const advancing = selection?.schema_version === "are.dsh-host-plan-selection/v2";
    const replacing = selection?.schema_version === "are.dsh-host-plan-selection/v3";
    const transitioning = advancing || replacing;
    if (!selection || Array.isArray(selection) || Object.keys(selection).sort().join(",")
      !== [...KEYS, ...(transitioning ? ["plan_transition"] : [])].sort().join(",")
      || !["are.dsh-host-plan-selection/v1", "are.dsh-host-plan-selection/v2", "are.dsh-host-plan-selection/v3"].includes(selection.schema_version)
      || !Array.isArray(selection.source_refs)
      || selection.source_refs.length < 1 || selection.source_refs.length > 16) fail();
    const transition = transitioning ? selection.plan_transition : null;
    if (transitioning && (!transition || Array.isArray(transition)
      || Object.keys(transition).sort().join(",") !== "kind,predecessors"
      || transition.kind !== (replacing ? "replace" : "advance") || !Array.isArray(transition.predecessors)
      || transition.predecessors.length < 1 || transition.predecessors.length > 32
      || transition.predecessors.some(row => !row || Array.isArray(row)
        || Object.keys(row).sort().join(",") !== (replacing ? "accounting,continuity_digest,plan_context_digest,thread_ref" : "plan_context_digest,thread_ref")
        || typeof row.thread_ref !== "string" || typeof row.plan_context_digest !== "string"
        || !/^backend-thread:[0-9a-f]{64}$/u.test(row.thread_ref ?? "")
        || !/^[0-9a-f]{64}$/u.test(row.plan_context_digest ?? ""))
      || new Set(transition.predecessors.map(row => row.thread_ref)).size !== transition.predecessors.length)) fail();
    if (replacing) for (const row of transition.predecessors) {
      const normalized = normalizePlanMigrationAccounting(row.accounting);
      if (typeof row.continuity_digest !== 'string' || !/^[a-f0-9]{64}$/.test(row.continuity_digest)
        || !normalized.compact || !normalized.rows.length) fail();
      row.accounting = normalized.rows;
    }
    const sourceDigests = loadDshPlanSourceDigests(root, selection.source_refs);
    const {schema_version: _schema, plan_transition: _transition, ...template} = selection;
    const checked = materializeReasoningPlanContext({...template,
      thread_ref: "host-plan-selection:shape-check", previous_plan_context_digest: null},
    {expected_thread_ref: "host-plan-selection:shape-check", source_digests: sourceDigests});
    if (!checked.ok) fail();
    // Requirements include every obligation, not just the active slice. Declared
    // status is retained context, never proof that an obligation is completed.
    const requirements = selection.feature_obligations.map(item => item.summary);
    if (new Set(requirements).size !== requirements.length) fail();
    return freezeResult({descriptor: {workspace: root, selection_path,
      selection_digest: selectedDigest}, template, source_digests: {...sourceDigests},
      selection_digest: selectedDigest,
      transition,
      requirement_seed: {requirements, source_ref: `host-plan-selection:${selectedDigest}`},
      template_digest: digestValue(template)});
  } catch {fail();}
}
