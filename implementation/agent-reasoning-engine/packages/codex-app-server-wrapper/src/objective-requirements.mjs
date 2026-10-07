import {
  assessRequirementChange, assessRequirementOperationFastPathExpanded,
  materializeRequirementSnapshot,
  verifyObjectiveState, verifyRequirementSnapshot,
} from '../../request-intent-runtime/index.mjs';
import {canonicalJson, digestValue, freezeResult, isRecord} from './canonical.mjs';
import {verifyReasoningPlanContext} from '../../reasoning-state-runtime/plan-context.mjs';

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

// A Host plan replacement is not a user prompt or an objective transition.
// This pure primitive accounts for EVERY retained objective, including suspended
// ones. The caller must separately bind the thread and checkpoint the successor
// plan and this receipt together before publishing next_continuity.
export function normalizePlanMigrationAccounting(accounting) {
  if (!Array.isArray(accounting) || accounting.length > 17) throw Error('requirements.migration-accounting-invalid');
  const compact = accounting.some(row => isRecord(row) && Object.hasOwn(row, 'retained_indices'));
  const keys = compact ? ['objective_id', 'snapshot_digest', 'retained_indices', 'removed_indices', 'added_obligation_ids', 'added_requirements']
    : ['objective_id', 'snapshot_digest', 'retained', 'added', 'removed'];
  const normalize = (values, indices = false, limit = 2048) => {
    if (!Array.isArray(values) || values.length > 64 || new Set(values).size !== values.length
      || values.some(value => indices ? !Number.isSafeInteger(value) || value < 0 || value >= 64
        : typeof value !== 'string' || !value.length || value.trim() !== value || Buffer.byteLength(value) > limit)) {
      throw Error('requirements.migration-set-invalid');
    }
    return [...values].sort(indices ? (a, b) => a - b : undefined);
  };
  const rows = accounting.map(row => {
    if (!closed(row, keys) || Object.keys(row).length !== keys.length
      || typeof row.objective_id !== 'string' || !row.objective_id.length
      || !/^[a-f0-9]{64}$/.test(row.snapshot_digest ?? '')) throw Error('requirements.migration-accounting-invalid');
    return compact ? {objective_id: row.objective_id, snapshot_digest: row.snapshot_digest,
      retained_indices: normalize(row.retained_indices, true), removed_indices: normalize(row.removed_indices, true),
      added_obligation_ids: normalize(row.added_obligation_ids, false, 128), added_requirements: normalize(row.added_requirements)}
      : {objective_id: row.objective_id, snapshot_digest: row.snapshot_digest,
        retained: normalize(row.retained), added: normalize(row.added), removed: normalize(row.removed)};
  });
  if (new Set(rows.map(row => row.objective_id)).size !== rows.length) throw Error('requirements.migration-accounting-invalid');
  return {compact, rows: sorted(rows)};
}

export function materializePlanRequirementMigration({previous, state, previous_plan_context,
  plan_context, accounting, source_ref}) {
  if (!verifyRequirementContinuity(previous, state)) throw Error('requirements.migration-predecessor-invalid');
  if (!verifyReasoningPlanContext(previous_plan_context).ok || !verifyReasoningPlanContext(plan_context).ok
    || previous_plan_context.thread_ref !== plan_context.thread_ref
    || plan_context.previous_plan_context_digest !== previous_plan_context.plan_context_digest
    || plan_context.plan_context_digest === previous_plan_context.plan_context_digest) {
    throw Error('requirements.migration-plan-predecessor-invalid');
  }
  if (typeof source_ref !== 'string' || !source_ref.length || source_ref.trim() !== source_ref
    || Buffer.byteLength(source_ref) > 512) throw Error('requirements.migration-source-invalid');
  if (!Array.isArray(accounting) || accounting.length !== previous.snapshots.length
    || Buffer.byteLength(canonicalJson(accounting)) > MAX_BYTES) throw Error('requirements.migration-accounting-invalid');
  const rows = new Map();
  const normalized = [];
  const encoded = normalizePlanMigrationAccounting(accounting);
  const normalizeSet = values => {
    if (!Array.isArray(values) || values.length > 64 || values.some(value => typeof value !== 'string'
      || !value.length || value.trim() !== value || Buffer.byteLength(value) > 2048)
      || new Set(values).size !== values.length) throw Error('requirements.migration-set-invalid');
    return [...values].sort();
  };
  for (const encodedRow of encoded.rows) {
    let row = encodedRow;
    if (encoded.compact) {
      const snapshot = previous.snapshots.find(value => value.objective_id === row.objective_id);
      if (!snapshot || snapshot.snapshot_digest !== row.snapshot_digest) throw Error('requirements.migration-snapshot-mismatch');
      const indices = [...row.retained_indices, ...row.removed_indices];
      if (indices.length !== snapshot.requirements.length || new Set(indices).size !== indices.length
        || indices.some(index => index >= snapshot.requirements.length)) throw Error('requirements.migration-unaccounted-change');
      const obligations = new Map(plan_context.feature_obligations.map(value => [value.obligation_id, value.summary]));
      if (row.added_obligation_ids.some(id => !obligations.has(id))
        || row.added_requirements.some(value => [...obligations.values()].includes(value))) {
        throw Error('requirements.migration-obligation-reference-invalid');
      }
      row = {objective_id: row.objective_id, snapshot_digest: row.snapshot_digest,
        retained: row.retained_indices.map(index => snapshot.requirements[index]),
        removed: row.removed_indices.map(index => snapshot.requirements[index]),
        added: [...row.added_obligation_ids.map(id => obligations.get(id)), ...row.added_requirements]};
    }
    const keys = ['objective_id', 'snapshot_digest', 'retained', 'added', 'removed'];
    if (!closed(row, keys) || Object.keys(row).length !== keys.length
      || rows.has(row.objective_id)) throw Error('requirements.migration-accounting-invalid');
    const before = previous.snapshots.find(snapshot => snapshot.objective_id === row.objective_id);
    if (!before || before.snapshot_digest !== row.snapshot_digest) throw Error('requirements.migration-snapshot-mismatch');
    const retained = normalizeSet(row.retained), added = normalizeSet(row.added), removed = normalizeSet(row.removed);
    if (added.some(value => before.requirements.includes(value))
      || removed.some(value => !before.requirements.includes(value))
      || canonicalJson(retained) !== canonicalJson(before.requirements.filter(value => !removed.includes(value)))) {
      throw Error('requirements.migration-unaccounted-change');
    }
    const resulting = normalizeSet([...retained, ...added]);
    if (plan_context.feature_obligations.some(obligation => !resulting.includes(obligation.summary))) {
      throw Error('requirements.migration-plan-obligation-missing');
    }
    const next = materializeRequirementSnapshot({...fields(before), requirements: resulting,
      source_refs: [...new Set([...before.source_refs, source_ref])]});
    rows.set(row.objective_id, next);
    normalized.push({objective_id: row.objective_id, snapshot_digest: row.snapshot_digest, retained, added, removed});
  }
  const continuityMaterial = {schema_version: SCHEMA, objective_state_digest: state.state_digest,
    previous_continuity_digest: previous.continuity_digest, resolution_digest: previous.resolution_digest,
    seed_snapshot: null, snapshots: sorted([...rows.values()]), authority_effect: 'none'};
  const next_continuity = {...continuityMaterial, continuity_digest: digestValue(continuityMaterial)};
  if (!verifyRequirementContinuity(next_continuity, state)) throw Error('requirements.migration-continuity-invalid-or-over-budget');
  const material = {schema_version: encoded.compact ? 'are.plan-requirement-migration/v2' : 'are.plan-requirement-migration/v1',
    previous_continuity_digest: previous.continuity_digest, objective_state_digest: state.state_digest,
    previous_plan_context_digest: previous_plan_context.plan_context_digest,
    plan_context_digest: plan_context.plan_context_digest, thread_ref: plan_context.thread_ref,
    source_ref, accounting: encoded.compact ? encoded.rows : sorted(normalized), next_continuity, authority_effect: 'none'};
  const result = {...material, migration_digest: digestValue(material)};
  if (Buffer.byteLength(canonicalJson(result)) > MAX_BYTES) throw Error('requirements.migration-budget-exceeded');
  return freezeResult(result);
}

export function verifyPlanRequirementMigrationReplay(record, input) {
  try { return canonicalJson(record) === canonicalJson(materializePlanRequirementMigration(input)); }
  catch { return false; }
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
