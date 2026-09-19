import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Read-only selected-source audit. Output is a new observation, never a receipt repair.
const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(here, '../../..');
const umbrella = path.resolve(project, '../..');
const read = p => JSON.parse(fs.readFileSync(path.join(umbrella, p), 'utf8'));
const prefix = 'projects/domainspec-v2/';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function inspect(ref) {
  if (!ref?.path) return {status: 'unmapped'};
  const absolute = path.resolve(umbrella, ref.path);
  if (!absolute.startsWith(umbrella + path.sep)) throw new Error('uncontained reference');
  if (!fs.existsSync(absolute)) return {...ref, status: 'missing', observed_sha256: null};
  const observed = digest(fs.readFileSync(absolute));
  return {...ref, observed_sha256: observed, status: ref.sha256 ? observed === ref.sha256 ? 'current' : 'stale' : 'present-unbound'};
}
const baselinePath = prefix + 'development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v10.json';
const baseline = read(baselinePath);
const candidateDir = prefix + 'development/remaining-meta-types/candidates';
const candidates = fs.readdirSync(path.join(umbrella, candidateDir)).filter(p => p.endsWith('.json')).map(p => ({path: candidateDir + '/' + p, value: read(candidateDir + '/' + p)}));
const profileDir = prefix + 'development/implementation-conformance/ontology-experiment/profiles/';
const cells = baseline.realization_rows.map(row => {
  const candidate = candidates.find(c => c.value.meta_type?.id === row.meta_type_id);
  const target = candidate?.value.targets?.find(t => t.language === row.language);
  const profilePath = profileDir + row.language + '-strict.profile.json';
  const profile = read(profilePath);
  const key = row.meta_type_label.toLowerCase().replaceAll(' ', '-');
  const overlay = profile.representation_overlays.find(o => o.contract_id.split('.')[0] === key);
  const binding = row.binding.path.endsWith('.json') ? read(row.binding.path) : {};
  return {
    meta_type_id: row.meta_type_id, meta_type_label: row.meta_type_label, language: row.language,
    baseline_state: 'baseline-admitted', source: inspect(row.source), provider: inspect(row.provider), binding: inspect(row.binding),
    candidate: inspect(candidate ? {path: candidate.path} : null), work_pack_id: candidate?.value.work_pack_id ?? null,
    historical_target_status: {registered: target?.registered ?? null, form_id: target?.form_id ?? null},
    profile: {...inspect({path: profilePath}), profile_id: profile.profile_id, document_status: profile.status,
      overlay_selector: overlay?.contract_id ?? null, forms: overlay?.admitted_forms ?? [],
      protocols: overlay?.candidate_protocols?.map(p => ({protocol_id: p.protocol_id, form_id: p.form_id, status: p.status, implementation_status: p.implementation_status ?? null})) ?? [],
      constraints: profile.constraints.filter(c => c.applies_to?.some(t => t === 'architecture.' + row.meta_type_label.replaceAll(' ', '') + 'Implementation' || t === 'architecture.DomainConceptImplementation'))},
    protocol_id: binding.protocol_id ?? target?.protocol_id ?? null,
    observer: inspect(binding.observer_ref ?? binding.refs?.observer_source ?? binding.refs?.observer ?? binding.w3_observer ?? binding.w4_observer ?? binding.supervisor_ref ?? target?.observer_ref),
    observer_extensions: Object.entries(binding).filter(([key,value]) => /_extension$|_decoder$/.test(key) && value?.path).map(([role,ref]) => ({role,...inspect(ref)})),
    generator: {...inspect({path: prefix + 'impl/cli/src/generation/generators.ts'}), selector: 'renderImplementation', evidence: 'shared renderer; generated conformance not established by baseline admission'},
  };
});
const axes = new Set(cells.map(c => c.meta_type_id + '/' + c.language));
if (cells.length !== 39 || axes.size !== 39 || new Set(cells.map(c => c.meta_type_id)).size !== 13) throw new Error('39-cell denominator drift');
const refs = cells.flatMap(c => [c.source, c.provider, c.binding]);
const report = {
  schema_version: 'domainspec.profile-source-crosswalk/v1-candidate', task: 'PCR-01', authority_effect: 'none',
  baseline: {...inspect({path: baselinePath}), id: baseline.baseline_id, digest: baseline.baseline_digest},
  denominator: {types: 13, languages: 3, cells: 39, core_refs: 117},
  counts: {current_core_refs: refs.filter(r => r.status === 'current').length, observer_statuses: Object.fromEntries(['current','stale','missing','unmapped'].map(s => [s, cells.filter(c => c.observer.status === s).length]))},
  cells,
  preserved_inputs: ['development/reconciliation-v1/PLAN.md','development/reconciliation-v1/WORK-ITEMS.json','development/reconciliation-v1/evidence/l0/REPORT.md','impl/cli/src/generation/project-build.ts','impl/cli/src/generation/generators.ts'].map(p => inspect({path: prefix + p})),
  limitations: ['Selected reference hashes only, not a baseline-wide verification or proof replay.', 'Candidate profile and historical registration status remain distinct from baseline admission.', 'Unmapped observer/protocol fields remain explicit; no paths fabricated.'],
  open_questions_ref: '../PLAN.md#9-open-questions-and-proposed-decisions',
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (report.counts.current_core_refs !== 117) process.exitCode = 1;
