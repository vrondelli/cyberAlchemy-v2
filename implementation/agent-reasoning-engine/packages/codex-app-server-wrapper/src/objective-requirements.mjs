import {
  assessRequirementChange, assessRequirementOperationFastPathExpanded,
  materializeRequirementSnapshot,
  verifyObjectiveState, verifyRequirementSnapshot,
} from '../../request-intent-runtime/index.mjs';
import {canonicalJson, digestValue, freezeResult, isRecord} from './canonical.mjs';

const SCHEMA = 'are.objective-requirement-continuity/v1';
const MAX_BYTES = 32768;
const closed = (value, keys) => isRecord(value) && Object.keys(value).every(key => keys.includes(key));
const failure = reason => ({ok: false, disposition: 'block', reason_codes: [reason], authority_effect: 'none'});
const retainedObjectives = state => [state.active_objective, ...state.suspended_objectives].filter(Boolean);
const sorted = snapshots => [...snapshots].sort((a, b) => a.objective_id.localeCompare(b.objective_id));
const fields = snapshot => {
  const {schema_version, authority_effect, snapshot_digest, ...input} = snapshot;
  return input;
};
const bound = (snapshot, state, objectiveId) => verifyRequirementSnapshot(snapshot)
  && snapshot.consumer_ref === state.consumer_ref && snapshot.scope_ref === state.scope_ref
  && snapshot.objective_id === objectiveId && snapshot.objective_state_digest === state.state_digest;

export function verifyRequirementContinuity(record, state) {
  try {
    if (!verifyObjectiveState(state) || !closed(record, ['schema_version', 'objective_state_digest', 'previous_continuity_digest',
      'resolution_digest', 'seed_snapshot', 'snapshots', 'authority_effect', 'continuity_digest'])
      || record.schema_version !== SCHEMA || record.authority_effect !== 'none'
      || record.objective_state_digest !== state.state_digest || !Array.isArray(record.snapshots)
      || record.snapshots.length > 17 || Buffer.byteLength(canonicalJson(record)) > MAX_BYTES) return false;
    const {continuity_digest, ...material} = record;
    if (digestValue(material) !== continuity_digest) return false;
    const ids = retainedObjectives(state).map(o => o.objective_id).sort();
    return canonicalJson(record.snapshots.map(s => s.objective_id)) === canonicalJson(ids)
      && record.snapshots.every(s => bound(s, state, s.objective_id))
      && (record.seed_snapshot === null || bound(record.seed_snapshot, state, state.active_objective?.objective_id));
  } catch { return false; }
}

// Derive every next snapshot from the previous set and the verified requirement
// change, or one explicit new-objective seed. The same derivation runs on replay.
export function materializeRequirementContinuity({previous = null, resolution, seed_snapshot = null}) {
  const state = resolution.next_state;
  if (resolution.disposition !== 'resolved' || !verifyObjectiveState(state)) throw Error('requirements.resolution-invalid');
  const {resolution_digest, ...resolutionMaterial} = resolution;
  if (digestValue(resolutionMaterial) !== resolution_digest) throw Error('requirements.resolution-digest-invalid');
  if (previous && previous.objective_state_digest !== resolution.previous_state_digest) throw Error('requirements.predecessor-state-mismatch');
  const before = new Map((previous?.snapshots ?? []).map(s => [s.objective_id, s]));
  const activeId = state.active_objective.objective_id;
  const oldActive = before.get(activeId);
  if (seed_snapshot !== null && (oldActive || !bound(seed_snapshot, state, activeId)
    || !seed_snapshot.source_refs.includes(resolution.request_ref))) throw Error('requirements.seed-binding-invalid');
  if (!oldActive && !seed_snapshot) throw Error('requirements.explicit-seed-required');
  let changedSnapshot = null;
  if (resolution.requirement_change !== undefined) {
    const change = resolution.requirement_change;
    if (!isRecord(change)) throw Error('requirements.replay-change-invalid');
    if (!oldActive || !['continue', 'refine'].includes(resolution.transition)) throw Error('requirements.change-predecessor-missing');
    // Re-evaluate set accounting. The raw request is already bound by resolution;
    // compare all remaining assessed fields and its exact request digest below.
    const assessed = assessRequirementChange({snapshot: oldActive, transition: resolution.transition,
      request: 'replay validation', request_ref: resolution.request_ref,
      delta: {retained: change.retained, added: change.added, removed: change.removed}});
    if (!assessed.ok) throw Error('requirements.replay-change-invalid');
    const {change_digest, request_digest, ...actual} = change;
    const {change_digest: ignoredDigest, request_digest: ignoredRequest, ...expected} = assessed.value;
    if (canonicalJson(actual) !== canonicalJson(expected) || request_digest !== resolution.request_digest
      || digestValue({...actual, request_digest}) !== change_digest) throw Error('requirements.replay-change-invalid');
    changedSnapshot = materializeRequirementSnapshot({...fields(oldActive), objective_state_digest: state.state_digest,
      requirements: change.resulting_requirements, source_refs: [...new Set([...oldActive.source_refs, resolution.request_ref])]});
    if (canonicalJson(changedSnapshot) !== canonicalJson(resolution.requirement_snapshot)) throw Error('requirements.change-snapshot-mismatch');
  } else if (resolution.transition === 'refine' && oldActive) throw Error('requirements.refinement-delta-required');
  else if (resolution.requirement_snapshot !== undefined) throw Error('requirements.unexplained-snapshot');
  const snapshots = sorted(retainedObjectives(state).map(objective => {
    if (objective.objective_id === activeId && changedSnapshot) return changedSnapshot;
    if (objective.objective_id === activeId && seed_snapshot) return seed_snapshot;
    const prior = before.get(objective.objective_id);
    if (!prior) throw Error('requirements.retained-objective-snapshot-missing');
    return materializeRequirementSnapshot({...fields(prior), objective_state_digest: state.state_digest});
  }));
  const material = {schema_version: SCHEMA, objective_state_digest: state.state_digest,
    previous_continuity_digest: previous?.continuity_digest ?? null, resolution_digest,
    seed_snapshot, snapshots, authority_effect: 'none'};
  const record = freezeResult({...material, continuity_digest: digestValue(material)});
  if (!verifyRequirementContinuity(record, state)) throw Error('requirements.continuity-invalid-or-over-budget');
  return record;
}

export function verifyRequirementContinuityReplay(record, previous, resolution) {
  try {
    return verifyRequirementContinuity(record, resolution.next_state)
      && canonicalJson(record) === canonicalJson(materializeRequirementContinuity({previous, resolution, seed_snapshot: record.seed_snapshot}));
  } catch { return false; }
}

// The optional model remains behind the existing resolver's deadline and
// schema checks. Local requirement operations and explicit continuation need it
// zero times. No raw _are field can supply a trusted requirement seed.
export async function prepareObjectiveRequirements(input, {previous = null, resolve, resolveLocal = resolve, seedProvider}) {
  try {
    if (previous && !verifyRequirementContinuity(previous, input.state)) return failure('requirements.current-state-invalid');
    const snapshot = previous?.snapshots.find(s => s.objective_id === input.state?.active_objective?.objective_id);
    let resolution;
    if (snapshot) {
      const operation = assessRequirementOperationFastPathExpanded({snapshot, request: input.request, request_ref: input.request_ref});
      if (!operation.ok) return operation;
      if (operation.value.disposition === 'fast-path') {
        const change = operation.value.change;
        const candidate = {transition: change.transition, evidence_span: {start: 0, end: input.request.length},
          ...(change.transition === 'continue' ? {referent_objective_id: snapshot.objective_id}
            : {objective: {description: input.state.active_objective.description}}),
          requirement_delta: {retained: change.retained, added: change.added, removed: change.removed}};
        resolution = await resolveLocal({...input, requirement_snapshot: snapshot, candidate});
      } else {
        const local = await resolveLocal(input);
        if (local.disposition === 'resolved' && local.transition === 'continue'
          && local.next_state.active_objective.objective_id === snapshot.objective_id) {
          resolution = await resolveLocal({...input, requirement_snapshot: snapshot, candidate: {
            transition: 'continue', referent_objective_id: snapshot.objective_id,
            evidence_span: {start: 0, end: input.request.length},
            requirement_delta: {retained: snapshot.requirements, added: [], removed: []}}});
        } else if (local.disposition === 'resolved' && local.transition !== 'refine') resolution = local;
        else resolution = await resolve({...input, requirement_snapshot: snapshot});
      }
    } else resolution = await resolve(input);
    if (resolution.disposition !== 'resolved') return {ok: false, disposition: resolution.disposition, reason_codes: resolution.reason_codes, resolution};
    let seed = null;
    if (!(previous?.snapshots ?? []).some(s => s.objective_id === resolution.next_state.active_objective.objective_id)) {
      if (typeof seedProvider !== 'function') return failure('requirements.explicit-seed-required');
      // Host-only synchronous input materialization. It must not schedule model
      // work; external interpretation belongs to the bounded resolver instead.
      seed = seedProvider(freezeResult({request: input.request, request_ref: input.request_ref, state: resolution.next_state}));
      if (seed && typeof seed.then === 'function') {
        Promise.resolve(seed).catch(() => {});
        return failure('requirements.seed-must-be-synchronous');
      }
      if (!verifyRequirementSnapshot(seed)) return failure('requirements.seed-invalid');
    }
    const continuity = materializeRequirementContinuity({previous, resolution, seed_snapshot: seed});
    return {ok: true, resolution, continuity};
  } catch (error) { return failure(error.message); }
}
