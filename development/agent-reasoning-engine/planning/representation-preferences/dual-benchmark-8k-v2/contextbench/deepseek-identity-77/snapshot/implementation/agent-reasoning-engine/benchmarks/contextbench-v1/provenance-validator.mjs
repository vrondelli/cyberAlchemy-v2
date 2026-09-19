// Candidate R3-V diagnostics. Open questions: research/contextbench-v1/PLAN-round3.md.
// No scoring, gold access, read substitution or automatic removal of source evidence.
import {diagnoseFinalSelection} from './terminal-schema.mjs';
import {projectObservationsToBase} from './source-map.mjs';
import {DIAGNOSTIC_LIMITS} from '../../packages/coding-agent-runtime/patch-schema.mjs';

export function diagnoseSourceSelection({raw, reads, snapshots, repoRoot}) {
  const diagnostic = diagnoseFinalSelection(raw, reads.map(r => r.id));
  const issues = [...diagnostic.issues];
  let truncated = diagnostic.truncated, instrument_error = false;
  const add = issue => {
    if (issues.length >= DIAGNOSTIC_LIMITS.issues ||
        Buffer.byteLength(JSON.stringify([...issues, issue])) > DIAGNOSTIC_LIMITS.render_bytes) truncated = true;
    else issues.push(issue);
  };
  const ids = diagnostic.value?.context_read_ids;
  if (Array.isArray(ids)) {
    const known = new Map(reads.map(r => [r.id, r])), checked = new Map();
    for (const [i, id] of ids.entries()) {
      if (typeof id !== 'string' || !known.has(id)) continue;
      let check = checked.get(id);
      if (!check) {
        try {
          const p = projectObservationsToBase([known.get(id)], snapshots, repoRoot).projections[0];
          check = {projection: p};
        } catch (error) {
          check = {instrument_error: true, reason: String(error.message)};
        }
        checked.set(id, check);
      }
      const common = {instance_path: `/context_read_ids/${i}`, schema_path: '/bindings/base_source_provenance', keyword: 'provenance'};
      if (check.instrument_error) {
        instrument_error = true;
        add({...common, code: 'final-selection.source-integrity-failure', read_id: id});
      } else if (check.projection.unmapped_current_lines.length) {
        add({...common, code: 'final-selection.changed-source-lines', read_id: id,
          path: known.get(id).path, changed_line_count: check.projection.unmapped_current_lines.length,
          recovery: 'This read includes edited lines absent from the pinned base. Retrieve relevant base-revision evidence or recover a previously delivered base read before selecting its ID. Do not invent IDs or silently substitute versions.'});
      } else if (!check.projection.event_ids.length) {
        add({...common, code: 'final-selection.no-projectable-source', read_id: id});
      }
    }
  }
  return {...diagnostic, ok: issues.length === 0 && !truncated && !instrument_error,
    issues, truncated, instrument_error,
    category: instrument_error ? 'source-integrity-failure' :
      issues.some(i => i.keyword === 'provenance') ? 'invalid-source-provenance' : diagnostic.category};
}
