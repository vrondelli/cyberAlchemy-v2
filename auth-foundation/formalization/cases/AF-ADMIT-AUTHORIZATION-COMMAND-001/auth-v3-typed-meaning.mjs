import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { checkTypedDefinitionFolBridge } from '../../../../craft/projects/domainspec-v2/formalization/typed-definition-fol-bridge.mjs';
import { checkCurrentAuthTypedModelSourceBridge } from './auth-typed-model-source-bridge.mjs';

const repo = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const here = dirname(fileURLToPath(import.meta.url));
const read = name => JSON.parse(readFileSync(resolve(here, name)));
const oldDraft = read('BUSINESS-MEANING.v2-definitions-candidate.json');
const accepted = read('BUSINESS-MEANING.v1-clarified-accepted.json');
const fail = (code, message) => { throw new Error(`${code}: ${message}`); };
const same = (a, b) => isDeepStrictEqual(a, b);
const businessKeys = ['domain_context', 'rule', 'applies_when', 'actors', 'inputs',
  'outcomes', 'examples', 'counterexamples', 'boundaries'];
const traceKeys = ['definition_id', 'term', 'definition_kind', 'plain_language',
  'domain_context', 'depends_on', 'business_fact_refs', 'interpretation_refs',
  'source_concept_refs', 'forbidden_collapses', 'status'];
const logicIds = [
  'AUTH-CB-DEF-QUALIFYING-AUTH-V2',
  'AUTH-CB-DEF-QUALIFYING-ROUTE-V2',
  'AUTH-CB-DEF-EXACT-ONE-AUTH-V3',
  'AUTH-CB-DEF-EXACT-ONE-ROUTE-V3',
  'AUTH-CB-DEF-SAME-ROW-PROVENANCE-V2',
  'AUTH-CB-DEF-READY-CONDITION-V2',
  'AUTH-CB-DEF-DECISION-DISTINCT-V3',
  'AUTH-CB-DEF-DECISION-EXHAUSTIVE-V3',
  'AUTH-CB-DEF-DECISION-BICONDITIONALS-V3',
];
const exportGroups = [
  [{ domain: 'model', selector: '#/typed_model_ir/context' }],
  [{ domain: 'model', selector: '#/typed_model_ir/scope' }],
  [{ domain: 'model', selector: '#/typed_model_ir/occurrences/0' }],
  [{ domain: 'model', selector: '#/typed_model_ir/occurrences/1' }],
  [{ domain: 'logic', definition_id: logicIds[0] }],
  [{ domain: 'logic', definition_id: logicIds[1] }],
  [{ domain: 'logic', definition_id: logicIds[2] }, { domain: 'logic', definition_id: logicIds[3] }],
  [{ domain: 'logic', definition_id: logicIds[4] }],
  [{ domain: 'logic', definition_id: logicIds[5] }],
  [{ domain: 'logic', definition_id: logicIds[6] }, { domain: 'logic', definition_id: logicIds[7] },
    { domain: 'logic', definition_id: logicIds[8] }],
];

export function verifyExactRef(ref, expectedPath) {
  if (!ref || typeof ref !== 'object' || Array.isArray(ref) ||
      Object.keys(ref).sort().join('|') !== 'current|path|sha256|size_bytes' ||
      ref.path !== expectedPath || ref.current !== true)
    fail('AUTH_V3_REF', `unexpected exact reference for ${expectedPath}`);
  const absolute = resolve(repo, ref.path);
  const real = realpathSync(absolute);
  if (relative(repo, real).startsWith('..') || relative(repo, real) === '')
    fail('AUTH_V3_REF', 'reference leaves the repository or names its root');
  const bytes = readFileSync(real);
  if (bytes.length !== ref.size_bytes || createHash('sha256').update(bytes).digest('hex') !== ref.sha256)
    fail('AUTH_V3_REF', `stale exact reference for ${expectedPath}`);
  return expectedPath.endsWith('.json') ? JSON.parse(bytes) : bytes.toString('utf8');
}

export function checkAuthV3TypedMeaningShape(candidate, translation) {
  if (candidate.schema_version !== 'domainspec-v2.business-meaning/v3-typed-definitions-candidate' ||
      candidate.status !== 'draft' || candidate.acceptance?.status !== 'not-requested' ||
      candidate.authority_effect !== 'none' || candidate.supersession_effect !== 'lineage-only-until-accepted')
    fail('AUTH_V3_AUTHORITY', 'candidate must remain unaccepted and non-effectful');
  if (!same(candidate.definitions.map(row => row.definition_id), oldDraft.definitions.map(row => row.definition_id)))
    fail('AUTH_V3_DEFINITIONS', 'ten source definition IDs and order differ from reviewed draft');
  for (const key of ['meaning_id', 'owner', 'supersedes'])
    if (!same(candidate[key], oldDraft[key])) fail('AUTH_V3_LINEAGE', `identity or owner drift at ${key}`);
  for (const key of businessKeys) if (!same(candidate[key], accepted[key]))
    fail('AUTH_V3_BUSINESS', `accepted business fact drift at ${key}`);
  if (!same(candidate.base_accepted_meaning_ref, oldDraft.base_accepted_meaning_ref) ||
      !same(candidate.draft_provenance_ref, translation.prior_draft_definitions_ref) ||
      !same(candidate.definition_source_ref, oldDraft.definition_source_ref) ||
      !same(candidate.interpretation_model_ref, oldDraft.interpretation_model_ref))
    fail('AUTH_V3_LINEAGE', 'exact accepted or draft provenance differs');
  if (!same(candidate.definition_policy, {
    canonical_location: 'inline-in-this-business-meaning', normative_voice: 'typed_ir',
    explanatory_voices: ['formal.definition', 'formal.operational_interpretation', 'plain_language', 'domain_context'],
    conflict_rule: 'typed-ir-prevails',
  })) fail('AUTH_V3_POLICY', 'typed IR must be the sole normative formal voice');
  for (const [index, definition] of candidate.definitions.entries()) {
    for (const key of traceKeys) if (!same(definition[key], oldDraft.definitions[index][key]))
      fail('AUTH_V3_TRACE', `definition ${definition.definition_id} trace drift at ${key}`);
    if (Object.hasOwn(definition.formal, 'expression') ||
        !same(definition.formal.typed_ir_exports, exportGroups[index]))
      fail('AUTH_V3_EXPORT', `definition ${definition.definition_id} has missing, extra, or wrong typed exports`);
  }
  const effect = candidate.effect_obligations;
  if (!Array.isArray(effect) || effect.length !== 1 ||
      effect[0].obligation_id !== 'AUTH-CB-NO-DOWNSTREAM-CALL-ALL-NATIVE' ||
      !same(effect[0].accepted_fact_refs, ['#/rule', '#/outcomes/1']) ||
      effect[0].formal_representation !== 'absent-from-six-pure-decision-clauses' ||
      effect[0].discharge_status !== 'open' ||
      effect[0].claim_boundary !==
        'A full preservation or current runtime claim requires separate all-native-entrypoint evidence; zero calls at one adapter is insufficient.')
    fail('AUTH_V3_EFFECT', 'accepted all-native no-call fact must remain an explicit open effect obligation');
  if (!same(candidate.typed_logic_ir.definitions.map(row => row.definition_id), logicIds))
    fail('AUTH_V3_EXPORT', 'logical IR definitions differ from exact export coverage');
  if (!same(candidate.typed_model_ir.occurrences.map(row => row.sort), ['AuthOccurrence', 'RouteOccurrence']))
    fail('AUTH_V3_EXPORT', 'model occurrence exports differ');
  const model = checkCurrentAuthTypedModelSourceBridge(candidate.typed_model_ir, candidate.typed_logic_ir);
  const fol = checkTypedDefinitionFolBridge(candidate.typed_logic_ir, candidate.typed_fol_lowering, translation);
  if (!same(translation.accepted_meaning_ref, candidate.base_accepted_meaning_ref) ||
      translation.status !== 'draft-typed-translation-not-current-claim' ||
      translation.authority_effect !== 'none')
    fail('AUTH_V3_TRANSLATION', 'translation lineage or authority posture differs');
  return { status: 'checked-auth-v3-typed-candidate-shape-and-fol-ast', definition_count: 10,
    logical_export_count: logicIds.length, model_export_count: 4, fol_clause_count: fol.clause_ids.length,
    accepted_business_facts_preserved: true, logical_ir_to_fol_ast_checked: fol.fol_core_comparison_checked,
    selected_typed_context_field_shape_bound: model.selected_typed_context_field_shape_bound,
    full_model_correspondence_proved: false, lean_model_obligations_proved: false,
    normal_completion_checked: false, all_native_no_call_proved: false,
    exact_file_refs_checked: false, authority_effect: 'none' };
}

export function checkCurrentAuthV3TypedMeaning() {
  const candidateName = 'BUSINESS-MEANING.v3-typed-definitions-candidate.json';
  const translationName = 'AUTH-V3-FOL-TRANSLATION.v1-candidate.json';
  const candidate = read(candidateName), translation = read(translationName);
  const prefix = 'auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/';
  verifyExactRef(candidate.base_accepted_meaning_ref, prefix + 'BUSINESS-MEANING.v1-clarified-accepted.json');
  verifyExactRef(candidate.draft_provenance_ref, prefix + 'BUSINESS-MEANING.v2-definitions-candidate.json');
  verifyExactRef(candidate.definition_source_ref, 'auth-foundation/implementation/command-boundary-business-ontology.json');
  verifyExactRef(candidate.interpretation_model_ref, prefix + 'INTERPRETATION-MODEL.v1-occurrences-candidate.json');
  verifyExactRef(candidate.effect_obligations[0].scope_decision_ref,
    prefix + 'AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md');
  verifyExactRef(translation.typed_definitions_ref, prefix + candidateName);
  verifyExactRef(translation.accepted_meaning_ref, prefix + 'BUSINESS-MEANING.v1-clarified-accepted.json');
  verifyExactRef(translation.prior_draft_definitions_ref, prefix + 'BUSINESS-MEANING.v2-definitions-candidate.json');
  verifyExactRef(translation.prior_interpretation_ref, prefix + 'INTERPRETATION-MODEL.v1-occurrences-candidate.json');
  return { ...checkAuthV3TypedMeaningShape(candidate, translation), exact_file_refs_checked: true };
}
