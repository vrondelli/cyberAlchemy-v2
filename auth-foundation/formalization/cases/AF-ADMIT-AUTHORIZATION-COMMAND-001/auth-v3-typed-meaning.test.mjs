import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkAuthV3TypedMeaningShape, checkCurrentAuthV3TypedMeaning, verifyExactRef } from './auth-v3-typed-meaning.mjs';

const load = name => JSON.parse(readFileSync(new URL(name, import.meta.url)));
const fixture = () => ({ candidate: load('./BUSINESS-MEANING.v3-typed-definitions-candidate.json'),
  translation: load('./AUTH-V3-FOL-TRANSLATION.v1-candidate.json') });
const check = value => checkAuthV3TypedMeaningShape(value.candidate, value.translation);
const rejects = (value, code) => assert.throws(() => check(value), error =>
  String(error).includes(code), code);
const schema = name => fileURLToPath(new URL(`../../../../craft/projects/domainspec-v2/formalization/schemas/${name}`, import.meta.url));
const validate = (value, name) => {
  const run = spawnSync('python3', ['-c',
    'import json,sys,jsonschema; jsonschema.Draft202012Validator(json.load(open(sys.argv[1]))).validate(json.load(sys.stdin))',
    schema(name)], { input: JSON.stringify(value), encoding: 'utf8', timeout: 10000 });
  assert.equal(run.status, 0, run.stderr || String(run.error));
};

test('candidate and all three inline IRs conform to closed candidate schemas', () => {
  const { candidate } = fixture();
  validate(candidate, 'business-meaning.v3-typed-definitions-candidate.schema.json');
  validate(candidate.typed_logic_ir, 'typed-definition-logic-ir.v1-candidate.schema.json');
  validate(candidate.typed_model_ir, 'typed-definition-model-ir.v1-candidate.schema.json');
  validate(candidate.typed_fol_lowering, 'typed-definition-fol-bridge.v1-candidate.schema.json');
});

test('current exact sources bind ten typed definitions to six parsed FOL clauses', () => {
  const result = checkCurrentAuthV3TypedMeaning();
  assert.equal(result.definition_count, 10);
  assert.equal(result.logical_export_count, 9);
  assert.equal(result.model_export_count, 4);
  assert.equal(result.fol_clause_count, 6);
  assert.equal(result.accepted_business_facts_preserved, true);
  assert.equal(result.logical_ir_to_fol_ast_checked, true);
  assert.equal(result.exact_file_refs_checked, true);
  assert.equal(result.full_model_correspondence_proved, false);
  assert.equal(result.all_native_no_call_proved, false);
});

test('accepted business drift and omitted or extra definition identities reject', () => {
  const business = fixture(); business.candidate.rule += ' unless convenient';
  rejects(business, 'AUTH_V3_BUSINESS');
  const missing = fixture(); missing.candidate.definitions.splice(6, 1);
  rejects(missing, 'AUTH_V3_DEFINITIONS');
  const extra = fixture(); extra.candidate.definitions.push({ ...extra.candidate.definitions[0], definition_id: 'EXTRA-DEF' });
  rejects(extra, 'AUTH_V3_DEFINITIONS');
});

test('every model and logical export is owned once by its definition record', () => {
  const missingD7 = fixture(); missingD7.candidate.definitions[6].formal.typed_ir_exports.pop();
  rejects(missingD7, 'AUTH_V3_EXPORT');
  const changedD10 = fixture(); changedD10.candidate.definitions[9].formal.typed_ir_exports[1].definition_id =
    'AUTH-CB-DEF-QUALIFYING-AUTH-V2';
  rejects(changedD10, 'AUTH_V3_EXPORT');
  const proseFormal = fixture(); proseFormal.candidate.definitions[4].formal.expression = 'QA(c,a) or true';
  rejects(proseFormal, 'AUTH_V3_EXPORT');
});

test('owner, trace metadata, and open all-native no-call effect cannot silently drift', () => {
  const owner = fixture(); owner.candidate.owner = 'someone else';
  rejects(owner, 'AUTH_V3_LINEAGE');
  const trace = fixture(); trace.candidate.definitions[6].depends_on = [];
  rejects(trace, 'AUTH_V3_TRACE');
  const factRef = fixture(); factRef.candidate.definitions[5].business_fact_refs = ['#/rule'];
  rejects(factRef, 'AUTH_V3_TRACE');
  const missingEffect = fixture(); missingEffect.candidate.effect_obligations = [];
  rejects(missingEffect, 'AUTH_V3_EFFECT');
  const represented = fixture(); represented.candidate.effect_obligations[0].formal_representation = 'proved';
  rejects(represented, 'AUTH_V3_EFFECT');
  const narrowed = fixture(); narrowed.candidate.effect_obligations[0].claim_boundary = 'one adapter is sufficient';
  rejects(narrowed, 'AUTH_V3_EFFECT');
});

test('weakened qualifier, row-value uniqueness, and wrong-row provenance reject the FOL postimage', () => {
  const qualifier = fixture();
  const qa = qualifier.candidate.typed_logic_ir.definitions[0].body;
  qa.right = { kind: 'not', operand: qa.right };
  rejects(qualifier, 'BRIDGE_AST_MISMATCH');
  const uniqueness = fixture();
  const authUnique = uniqueness.candidate.typed_logic_ir.definitions[2].body.right.body.right;
  authUnique.left = { kind: 'function', name: 'EvidenceRef', arguments: [{ kind: 'variable', name: 'a2' }] };
  authUnique.right = { kind: 'function', name: 'EvidenceRef', arguments: [{ kind: 'variable', name: 'a' }] };
  rejects(uniqueness, 'BRIDGE_AST_MISMATCH');
  const provenance = fixture();
  const source = provenance.candidate.typed_logic_ir.definitions[4].body;
  source.left.left.left.left.right.right = { kind: 'function', name: 'RequestID',
    arguments: [{ kind: 'variable', name: 'c' }] };
  rejects(provenance, 'BRIDGE_AST_MISMATCH');
});

test('model scope and translation outcome drift reject', () => {
  const scope = fixture(); scope.candidate.typed_model_ir.scope.kind = 'post-outcome-filter';
  rejects(scope, 'MODEL_CONSTRUCTOR');
  const outcome = fixture();
  outcome.translation.clauses[5].source = outcome.translation.clauses[5].source.replace(
    'Decision(c)=READY iff ReadyCondition(c)', 'Decision(c)=DENY iff ReadyCondition(c)');
  rejects(outcome, 'BRIDGE_AST_MISMATCH');
});

test('exact source reference rejects a changed digest before claiming a source binding', () => {
  const ref = fixture().translation.typed_definitions_ref;
  assert.doesNotThrow(() => verifyExactRef(ref, ref.path));
  assert.throws(() => verifyExactRef({ ...ref, sha256: '0'.repeat(64) }, ref.path), /AUTH_V3_REF/);
});
