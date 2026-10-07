// Mechanical one-file overlay builder against the immutable full-cycle-80 source.
// The emitted file is generated benchmark code, not a canonical source edit.
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const base = resolve(here, '../full-cycle-80/snapshot/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/terminal-evidence.mjs');
const destination = resolve(here, 'terminal-evidence.mjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = readFileSync(base, 'utf8');
if (sha(source) !== 'a1729f1c5ff8ed79c284523e6113a29677b967464f26efa428b948e7426c8ecd') throw Error('closure.frozen-source-drift');

const anchor = '/** Explicit wide-handle receipt-bound acceptance; existing native H72 rejects>3bindings. */';
const closure = `/** Source-only, bounded closure over base reads already in the terminal packet. */
export function adjacentTestClosure(selectedReadIds, bindings) {
  const selected = new Set(selectedReadIds);
  const selectedPaths = new Set(bindings.filter(row => selected.has(row.read_id)).map(row => row.path));
  const candidates = bindings.filter(row => {
    if (selected.has(row.read_id)) return false;
    const match = /^(.*?)(?:_test|\\.test|\\.spec)\\.([a-z0-9]+)$/i.exec(row.path.split('/').at(-1));
    if (!match) return false;
    const parent = row.path.slice(0, row.path.lastIndexOf('/') + 1);
    return selectedPaths.has(parent + match[1] + '.' + match[2]);
  }).sort((a,b) => (b.end_line-b.start_line)-(a.end_line-a.start_line) || a.path.localeCompare(b.path) || a.read_id.localeCompare(b.read_id));
  const added = [], paths = new Set();
  for (const row of candidates) {
    if (paths.has(row.path)) continue;
    added.push(row.read_id); paths.add(row.path);
    if (added.length === 1) break;
  }
  return {read_ids: [...selectedReadIds, ...added], added_read_ids: added};
}

`;
const selectionAnchor = '  return {final_read_ids:native.value.context_read_ids,summary:native.value.summary,model_context_handles:diagnostic.value.context_handles,response_capture_sha256:c.capture_sha256,terminal_submission_call_id:calls[0].id};';
const selectionReplacement = `  const closure=adjacentTestClosure(native.value.context_read_ids,bindings);
  const expanded=diagnoseSourceSelection({raw:stable({summary:native.value.summary,context_read_ids:closure.read_ids}),reads:binding.read_observations,snapshots,repoRoot});
  if(!expanded.ok)throw Object.assign(Error('terminal-evidence.closure-'+expanded.category),{diagnostic:expanded});
  return {final_read_ids:expanded.value.context_read_ids,summary:expanded.value.summary,model_context_handles:diagnostic.value.context_handles,runtime_added_read_ids:closure.added_read_ids,response_capture_sha256:c.capture_sha256,terminal_submission_call_id:calls[0].id};`;
const postureAnchor = "selection_posture:'Explicit terminal handles bound to exact successful request/response, then unchanged native source projection and export; not archive union.'";
const postureReplacement = "selection_posture:'Explicit terminal handles plus at most one presented, provenance-valid adjacent test read for a selected same-stem implementation source; native source projection and export unchanged.'";
for (const [needle] of [[anchor], [selectionAnchor], [postureAnchor]]) if (source.split(needle).length !== 2) throw Error('closure.patch-anchor');
const candidate = source.replace(anchor, closure + anchor).replace(selectionAnchor, selectionReplacement).replace(postureAnchor, postureReplacement);
if (candidate === source) throw Error('closure.no-change');
writeFileSync(destination, candidate, {flag:'wx',mode:0o600});
console.log(JSON.stringify({base_sha256:sha(source),candidate_sha256:sha(candidate),destination}));
