import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(fileURLToPath(new URL('../../../../', import.meta.url)));
const caseDir = 'auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001';
const clarificationPath = `${caseDir}/AUTH-MEANING-CLARIFICATION.v1-candidate.json`;
const meaningPath = `${caseDir}/BUSINESS-MEANING.v1-clarified-candidate.json`;
const tracePath = `${caseDir}/AUTH-V2-MEANING-TRACE.v1-candidate.json`;
const candidatePins = Object.freeze({
  clarification: '5a861a927ac8c9b95f21bc01d89effd04175290b4ce71e34b8121906f9095ac9',
  meaning: '81c7e1620bea64bf75f3da8bedc79ac795e896c7050c58ab098f54f737194019',
});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = reason => { throw new Error(`AUTH_MEANING_CLARIFICATION:${reason}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const expectedRefs = Object.freeze({
  product_admission: ['auth-foundation/implementation/decisions/command-boundary-product-ontology-admission-001.json', '61bcc2b22bda6c405c17d6dfa612e77fdbaae1cc2d5b36f98f9dc53820da8b65'],
  definitions: ['auth-foundation/implementation/command-boundary-definitions.json', 'ca51af7f45733ca63ed2b21dbb73e8f6a30860f3d58e1c2301c21f8415524374'],
  capability: ['auth-foundation/implementation/command-boundary-product-capability.json', '3651e737efabe338b409fc4094cb0da25cc6274be619bec8889f6b4b1ae5f222'],
  ontology: ['auth-foundation/implementation/command-boundary-business-ontology.json', 'aa57d9cdacb8e874fdb61cd726b1f5ea6fe4600f8a21802e9fb084ccfe2e2210'],
  predecessor_meaning: [`${caseDir}/BUSINESS-MEANING.v1-candidate.json`, '3cd0b2d4d59815e212ea601ca95c49929b5036f459fef8b6ed0e63b70c20724e'],
  v2_auth_rule: ['auth-foundation/implementation/command-boundary-source-v2/specs/auth-command-boundary/nodes/unique-trusted-authentication-evidence.json', 'eada37d662b8d31737c2c00d118f629a03e250a1742bb137231bd7996e1e6608'],
  v2_route_rule: ['auth-foundation/implementation/command-boundary-source-v2/specs/auth-command-boundary/nodes/unique-complete-route-binding.json', 'd6a56c77c2c00937ee6526cfe423b37fc31b4a9940795c840e276cd6b3e322b4'],
  v2_provenance_rule: ['auth-foundation/implementation/command-boundary-source-v2/specs/auth-command-boundary/nodes/candidate-command-provenance.json', '102b60b8da13f51273b4bafe6fb6522cdc68c923597f10dee02772bd8836937c'],
  v2_aggregate_rule: ['auth-foundation/implementation/command-boundary-source-v2/specs/auth-command-boundary/nodes/command-boundary-admissible.json', '91899b41f928554b796ce4446d06e7ed1836fcbcf20deac814430010a9a320ed'],
  v2_operation: ['auth-foundation/implementation/command-boundary-source-v2/specs/auth-command-boundary/nodes/admit-authorization-command.json', 'fbace90ffca46b51fd286d3bf733b39b803f739c69bf5d2c9a1a1daeb5df9ac1'],
});
const expectedAuth = [
  'row.evidence_ref equals request.authentication_evidence_ref',
  'row.evidence_ref is not the empty string',
  'row.trusted is true',
  'row.session_id is not the empty string',
];
const expectedRoute = [
  'row.route_id equals request.route_id',
  'row.route_id is not the empty string',
  'row.complete is true',
  'row.scope_evidence_ref is not the empty string',
  'row.required_permission.resource is not the empty string',
  'row.required_permission.action is not the empty string',
  'row.required_permission.scope is not the empty string',
];
const expectedRule = 'For a representable, fully supplied CommandBoundaryContext evaluated normally, return READY if and only if the inbound request_id is nonempty; exactly one authentication list entry has evidence_ref equal to the requested authentication_evidence_ref, nonempty evidence_ref and session_id, and trusted true; exactly one route list entry has route_id equal to the requested route_id, nonempty route_id and scope_evidence_ref, complete true, and nonempty required_permission resource, action and scope; and the candidate request_id equals the inbound request_id while its session_id, required_permission resource, action and scope, and scope_evidence_ref equal the values of those same unique qualifying rows. Exactly one counts list entries, including equal duplicates. Every other normally evaluated in-scope context returns DENY without a downstream authorization call.';

function selectedBytes(path) {
  if (typeof path !== 'string' || path.startsWith('/') || path.includes('\\') || path.split('/').some(part => !part || part === '.' || part === '..')) fail('path-scope');
  let target = root;
  for (const part of path.split('/')) {
    target = join(target, part);
    if (lstatSync(target).isSymbolicLink()) fail(`symlink:${path}`);
  }
  if (relative(root, target).startsWith('..') || realpathSync(target) !== target || !statSync(target).isFile()) fail(`path-scope:${path}`);
  return readFileSync(target);
}

export function validateCandidate(clarification, meaning) {
  if (!clarification || clarification.schema_version !== 'auth-foundation.command-boundary-meaning-clarification/v1-candidate' ||
      clarification.clarification_id !== 'AUTH-CB-MEANING-CLARIFICATION-001' || clarification.status !== 'draft' ||
      clarification.authority_effect !== 'none' || clarification.owner_decision_status !== 'not-requested') fail('clarification-lifecycle');
  if (!same(Object.keys(clarification.source_refs ?? {}).sort(), Object.keys(expectedRefs).sort())) fail('source-domain');
  for (const [key, [path, pin]] of Object.entries(expectedRefs)) {
    const ref = clarification.source_refs[key];
    const bytes = selectedBytes(path);
    if (!ref || ref.path !== path || ref.sha256 !== pin || ref.size_bytes !== bytes.length || ref.current !== true || digest(bytes) !== pin) fail(`source-ref:${key}`);
  }
  const admission = JSON.parse(selectedBytes(expectedRefs.product_admission[0]));
  for (const [key, admitted] of Object.entries({definitions:'definitions', capability:'product_capability', ontology:'business_ontology'})) {
    if (admission.admitted_artifacts?.[admitted]?.sha256 !== expectedRefs[key][1]) fail(`admission:${key}`);
  }
  if (admission.authority_effect !== 'accepts the exact command-boundary definitions, adopts the exact Product Capability, and admits the exact capability-local business ontology as Auth Foundation product meaning only') fail('admission-scope');
  const trace = JSON.parse(selectedBytes(tracePath));
  for (const [key, traceKey] of Object.entries({v2_auth_rule:'auth', v2_route_rule:'route', v2_provenance_rule:'provenance', v2_aggregate_rule:'aggregate', v2_operation:'operation'})) {
    if (trace.selected_sha256?.[traceKey] !== expectedRefs[key][1]) fail(`trace-ref:${key}`);
  }
  if (trace.meaning_sha256 !== expectedRefs.predecessor_meaning[1] || trace.prose_alignment_status !== 'unresolved' || trace.all_context_preservation_proven !== false) fail('trace-ceiling');
  const predicate = clarification.proposed_ready_predicate;
  if (!predicate || predicate.request_id !== 'The inbound request_id is not the empty string, and the candidate request_id equals it.' ||
      !same(predicate.authentication_qualifier, expectedAuth) || !same(predicate.route_qualifier, expectedRoute) ||
      predicate.uniqueness !== 'Exactly one list entry satisfies each qualifier; duplicate equal entries count separately.' ||
      predicate.same_row_provenance !== 'Candidate session_id equals the unique qualifying authentication row session_id; candidate required_permission resource, action and scope and scope_evidence_ref equal the unique qualifying route row values.') fail('predicate');
  if (!same(clarification.separating_examples?.map(row => [row.case_id, row.expected]), [
    ['READY-UNIQUE-SAME-ROW','READY'], ['DENY-BLANK-REQUEST-ID','DENY'],
    ['DENY-NONQUALIFYING-PROVENANCE','DENY'], ['DENY-DUPLICATE-QUALIFYING-ROWS','DENY'],
  ]) || clarification.owner_questions?.length !== 2 || clarification.open_questions?.length !== 2 ||
      !clarification.claim_ceiling?.includes('Neither the admitted Auth product decision')) fail('clarification-scope');
  const expectedKeys = ['schema_version','meaning_id','version','owner','status','supersedes','domain_context','rule','applies_when','actors','inputs','outcomes','examples','counterexamples','boundaries','acceptance','claim_ceiling','authority_effect'];
  if (!meaning || !same(Object.keys(meaning).sort(), expectedKeys.sort()) ||
      meaning.schema_version !== 'domainspec-v2.business-meaning/v1-candidate' ||
      meaning.meaning_id !== 'BusinessMeaning:auth-foundation.admit-authorization-command-boundary' ||
      meaning.version !== '1-clarified-candidate' || meaning.owner !== 'projects/auth-foundation/formalization' ||
      meaning.status !== 'draft' || meaning.supersedes !== `${meaning.meaning_id}@1-candidate` ||
      meaning.rule !== expectedRule || meaning.authority_effect !== 'none' ||
      !same(meaning.acceptance, {status:'not-requested',owner_ref:meaning.owner,acceptance_ref:null,acceptance_digest:null})) fail('meaning-identity-or-rule');
  for (const key of ['applies_when','actors','inputs','outcomes','boundaries']) {
    if (!Array.isArray(meaning[key]) || !meaning[key].length || meaning[key].some(row => typeof row !== 'string' || !row.trim()) || new Set(meaning[key]).size !== meaning[key].length) fail(`meaning-field:${key}`);
  }
  for (const key of ['examples','counterexamples']) {
    if (!Array.isArray(meaning[key]) || meaning[key].length < 2 || meaning[key].some(row => !same(Object.keys(row).sort(), ['case_id','given','when','then','why'].sort()) || Object.values(row).some(v => typeof v !== 'string' || !v.trim()))) fail(`meaning-field:${key}`);
  }
  if (!meaning.examples.some(row => row.case_id === 'AUTH-CB-DENY-BLANK-REQUEST-ID') ||
      !meaning.counterexamples.some(row => row.case_id === 'AUTH-CB-NONQUALIFYING-PROVENANCE-REJECT') ||
      !meaning.counterexamples.some(row => row.case_id === 'AUTH-CB-DUPLICATE-COLLAPSE-REJECT') ||
      !meaning.claim_ceiling.includes('does not accept this DomainSpec BusinessMeaning')) fail('meaning-scope');
  // This fixed candidate's examples and prose are part of the reviewed subject.
  // An object passed by a caller cannot borrow a receipt for different disk bytes.
  const clarificationBytes = selectedBytes(clarificationPath);
  const meaningBytes = selectedBytes(meaningPath);
  if (digest(clarificationBytes) !== candidatePins.clarification ||
      digest(meaningBytes) !== candidatePins.meaning ||
      !same(clarification, JSON.parse(clarificationBytes)) ||
      !same(meaning, JSON.parse(meaningBytes))) fail('candidate-subject-drift');
  return {status:'candidate-valid', clarification_sha256:digest(clarificationBytes), meaning_sha256:digest(meaningBytes), acceptance:'not-requested', all_context_preservation_proven:false};
}

export function currentCandidate() {
  return validateCandidate(JSON.parse(selectedBytes(clarificationPath)), JSON.parse(selectedBytes(meaningPath)));
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(currentCandidate(), null, 2));
}
