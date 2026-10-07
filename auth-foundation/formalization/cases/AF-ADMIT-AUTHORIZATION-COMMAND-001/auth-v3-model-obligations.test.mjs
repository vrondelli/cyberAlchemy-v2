import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkAuthV3TypedMeaningShape, checkCurrentAuthV3TypedMeaning } from './auth-v3-typed-meaning.mjs';
import { renderFolTheoryV3 } from './auth-v3-fol-lean-theory.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const read = name => readFileSync(join(here, name));
const json = name => JSON.parse(read(name));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lean = process.env.AUTH_LEAN_BIN;
const pins = Object.freeze({
  'AuthGeneratedSubject.lean': 'c3b5186734c6b7fa50198cc7ded4769ee1e342ea6f27fbde9fb7e7092d438512',
  'AuthExprInterpreter.lean': 'f036d15a3afc94e387d91c6b5bdaa3f14c1dfdd533f9853bd6b482704c4e8c70',
  'AuthTypedPreservation.lean': '1c8a136a4fcf95bd5f4078f4585a02731c6c4ca29fd676982873aa0de441d47b',
  'AuthFolOccurrenceBridge.lean': '5bdfa375d01a56ef9cf55bfa37ca3485a74ce397907ac3130549c77605df0673',
  'AuthFolModel.lean': 'c15dde95d14dd71125124278ffd7c7eb85e585b8de90d79fb7505a51ce4e0ce1',
  'AuthFolGeneratedTheory.lean': 'abbc4dd274598cc09f6a1489352299516986a65d12ec508465328c131cfb4f0b',
  'AuthFolTheoryProof.lean': '3320ece8c80a813fad639e1a33a9a7d1ecd30ebf474db39f8db80f106b4055fe',
});
const modules = ['AuthGeneratedSubject', 'AuthExprInterpreter', 'AuthTypedPreservation',
  'AuthFolOccurrenceBridge', 'AuthFolModel', 'AuthFolGeneratedTheory',
  'AuthFolTheoryProof', 'AuthFolGeneratedTheoryV3', 'AuthFolTheoryProofV3',
  'AuthFolModelObligationsV3'];

test('all four V3 model exports bind to the pinned selected Lean carrier and occurrence constructors', () => {
  const checked = checkCurrentAuthV3TypedMeaning();
  assert.equal(checked.model_export_count, 4);
  assert.equal(checked.exact_file_refs_checked, true);
  const model = json('BUSINESS-MEANING.v3-typed-definitions-candidate.json').typed_model_ir;
  assert.deepEqual(model.context, { sort: 'Context', carrier: 'full-typed-record-with-finite-lists',
    fields: [
      { name: 'request', kind: 'record', type: 'Request' },
      { name: 'candidate', kind: 'record', type: 'Command' },
      { name: 'authRows', kind: 'list', type: 'Evidence' },
      { name: 'routeRows', kind: 'list', type: 'RouteBinding' },
    ] });
  assert.deepEqual(model.scope, { kind: 'entire-context-carrier',
    normal_completion: 'separate-correspondence-obligation' });
  assert.deepEqual(model.occurrences, [
    { sort: 'AuthOccurrence', list_field: 'authRows', row_type: 'Evidence',
      carrier: 'context-row-position-product', identity: 'context-and-zero-based-position',
      membership: { kind: 'tagged-zip-index', predicate: 'AuthMember', start: 0,
        nonmembers: 'ghost-and-foreign-excluded' }, projection: 'total-tuple-row',
      qualifier_definition_id: 'AUTH-CB-DEF-QUALIFYING-AUTH-V2' },
    { sort: 'RouteOccurrence', list_field: 'routeRows', row_type: 'RouteBinding',
      carrier: 'context-row-position-product', identity: 'context-and-zero-based-position',
      membership: { kind: 'tagged-zip-index', predicate: 'RouteMember', start: 0,
        nonmembers: 'ghost-and-foreign-excluded' }, projection: 'total-tuple-row',
      qualifier_definition_id: 'AUTH-CB-DEF-QUALIFYING-ROUTE-V2' },
  ]);
  for (const [name, digest] of Object.entries(pins))
    assert.equal(sha(read(name)), digest, `selected ${name} drifted`);
  const carrier = read('AuthGeneratedSubject.lean').toString('utf8');
  const occurrence = read('AuthFolOccurrenceBridge.lean').toString('utf8');
  const modelLean = read('AuthFolModel.lean').toString('utf8');
  assert.match(carrier, /structure Context where\n  request : Request\n  candidate : Command\n  authRows : List Evidence\n  routeRows : List RouteBinding/);
  for (const [sort, row, list, member] of [
    ['AuthOccurrence', 'Evidence', 'authRows', 'authMember'],
    ['RouteOccurrence', 'RouteBinding', 'routeRows', 'routeMember'],
  ]) {
    assert.ok(occurrence.includes(`abbrev ${sort} := Context × (${row} × Nat)`));
    assert.ok(occurrence.includes(`(c.${list}.zipIdx).map (fun pos => (c, pos))`));
    assert.ok(occurrence.includes(`def ${member} (c : Context)`));
    assert.ok(modelLean.includes(`def ${member} (c : Context)`));
  }
});

test('model export drift rejects before Lean proof can be claimed', () => {
  const candidate = json('BUSINESS-MEANING.v3-typed-definitions-candidate.json');
  const translation = json('AUTH-V3-FOL-TRANSLATION.v1-candidate.json');
  candidate.typed_model_ir.occurrences[0].membership.start = 1;
  assert.throws(() => checkAuthV3TypedMeaningShape(candidate, translation), /MODEL_CONSTRUCTOR/);
});

test('pinned Lean proves the selected V3 model and normal-completion obligations', () => {
  checkCurrentAuthV3TypedMeaning();
  assert.ok(lean, 'AUTH_LEAN_BIN must name pinned Lean 4.32.0');
  assert.equal(sha(readFileSync(lean)),
    'e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550');
  const owned = mkdtempSync(join(process.env.AUTH_PROOF_TMPDIR ?? '/var/tmp', 'auth-v3-model-'));
  try {
    const translation = json('AUTH-V3-FOL-TRANSLATION.v1-candidate.json');
    assert.equal(renderFolTheoryV3(translation), read('AuthFolGeneratedTheoryV3.lean').toString('utf8'));
    for (const name of modules) {
      const filename = `${name}.lean`;
      const bytes = name === 'AuthFolGeneratedTheoryV3'
        ? renderFolTheoryV3(translation) : read(filename);
      if (Object.hasOwn(pins, filename))
        assert.equal(sha(bytes), pins[filename], `historical ${filename} drifted`);
      writeFileSync(join(owned, filename), bytes, { flag: 'wx' });
    }
    const run = (name, emit = true) => spawnSync(lean,
      [...(emit ? ['-o', join(owned, `${name}.olean`)] : []), `${name}.lean`],
      { cwd: owned, env: { ...process.env, LEAN_PATH: owned }, encoding: 'utf8',
        timeout: 45000, maxBuffer: 2 * 1024 * 1024 });
    for (const name of modules) {
      const result = run(name);
      assert.equal(result.status, 0, `${name}: ${result.stdout}${result.stderr}`);
    }
    const verification = `import AuthFolModelObligationsV3
example (c : AuthGeneratedSubject.Context) :
    AuthFolModelObligationsV3.selectedScope c :=
  AuthFolModelObligationsV3.entire_context_carrier_in_scope c
example (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.rule 8 AuthGeneratedSubject.operationGuard c = some value :=
  AuthFolModelObligationsV3.selected_evaluator_normal_completion c
example : AuthExprInterpreter.operation AuthFolModelObligationsV3.readyContext = "Ready" :=
  AuthFolModelObligationsV3.ready_witness
example : AuthExprInterpreter.operation AuthFolModelObligationsV3.emptyContext = "Deny" :=
  AuthFolModelObligationsV3.empty_list_deny_witness
example : AuthExprInterpreter.operation AuthFolModelObligationsV3.duplicateAuthContext = "Deny" :=
  AuthFolModelObligationsV3.equal_duplicate_deny_witness
example : AuthExprInterpreter.operation AuthFolModelObligationsV3.wrongProvenanceContext = "Deny" :=
  AuthFolModelObligationsV3.wrong_provenance_deny_witness
#print axioms AuthFolModelObligationsV3.auth_member_iff_position
#print axioms AuthFolModelObligationsV3.route_member_iff_position
#print axioms AuthFolModelObligationsV3.context_inhabited
#print axioms AuthFolModelObligationsV3.auth_occurrence_inhabited
#print axioms AuthFolModelObligationsV3.route_occurrence_inhabited
#print axioms AuthFolModelObligationsV3.full_context_carrier
#print axioms AuthFolModelObligationsV3.auth_positions_distinct
#print axioms AuthFolModelObligationsV3.route_positions_distinct
#print axioms AuthFolModelObligationsV3.auth_projection_total
#print axioms AuthFolModelObligationsV3.route_projection_total
#print axioms AuthFolModelObligationsV3.auth_qualifier_selected
#print axioms AuthFolModelObligationsV3.route_qualifier_selected
#print axioms AuthFolModelObligationsV3.entire_context_carrier_in_scope
#print axioms AuthFolModelObligationsV3.selected_evaluator_normal_completion
#print axioms AuthFolModelObligationsV3.all_witnesses_in_scope
#print axioms AuthFolModelObligationsV3.ready_witness
#print axioms AuthFolModelObligationsV3.empty_list_deny_witness
#print axioms AuthFolModelObligationsV3.equal_duplicate_deny_witness
#print axioms AuthFolModelObligationsV3.wrong_provenance_deny_witness
`;
    writeFileSync(join(owned, 'VerifyModelV3.lean'), verification, { flag: 'wx' });
    const result = run('VerifyModelV3', false);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const axiomSets = [...result.stdout.matchAll(/depends on axioms: \[([^\]]+)\]/g)];
    for (const [, set] of axiomSets)
      for (const axiom of set.split(',').map(item => item.trim()))
        assert.ok(['propext', 'Classical.choice', 'Quot.sound'].includes(axiom),
          `unexpected proof axiom ${axiom}`);
    assert.doesNotMatch(result.stdout + result.stderr, /sorryAx|\.axiom/);
  } finally {
    rmSync(owned, { recursive: true, force: true });
  }
});
