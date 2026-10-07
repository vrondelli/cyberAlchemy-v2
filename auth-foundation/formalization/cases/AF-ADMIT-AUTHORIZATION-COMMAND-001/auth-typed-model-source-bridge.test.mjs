import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { assertLeanContextDeclaration, checkCurrentAuthTypedModelSourceBridge } from './auth-typed-model-source-bridge.mjs';
import { readTypedRecordNodes, validateTypedRecordClosure } from './auth-v2-typed-subject.mjs';

const variable = name => ({ kind: 'variable', name });
const predicate = (name, ...arguments_) => ({ kind: 'predicate', name, arguments: arguments_ });
const logical = () => ({
  schema_version: 'domainspec-v2.typed-definition-logic-ir/v1-candidate',
  signature: { sorts: ['Context', 'AuthOccurrence', 'RouteOccurrence'], functions: [], constants: [],
    predicates: [
      { name: 'AuthMember', parameter_sorts: ['Context', 'AuthOccurrence'] },
      { name: 'RouteMember', parameter_sorts: ['Context', 'RouteOccurrence'] },
    ] },
  definitions: [
    { definition_id: 'DEF-QA', symbol: 'QA',
      parameters: [{ name: 'c', sort: 'Context' }, { name: 'a', sort: 'AuthOccurrence' }],
      depends_on: [], body: { kind: 'and',
        left: predicate('AuthMember', variable('c'), variable('a')), right: { kind: 'true' } } },
    { definition_id: 'DEF-QR', symbol: 'QR',
      parameters: [{ name: 'c', sort: 'Context' }, { name: 'r', sort: 'RouteOccurrence' }],
      depends_on: [], body: { kind: 'and',
        left: predicate('RouteMember', variable('c'), variable('r')), right: { kind: 'true' } } },
  ], roots: ['DEF-QA', 'DEF-QR'], authority_effect: 'none',
});
const model = () => ({
  schema_version: 'domainspec-v2.typed-definition-model-ir/v1-candidate',
  context: { sort: 'Context', carrier: 'full-typed-record-with-finite-lists', fields: [
    { name: 'request', kind: 'record', type: 'Request' },
    { name: 'candidate', kind: 'record', type: 'Command' },
    { name: 'authRows', kind: 'list', type: 'Evidence' },
    { name: 'routeRows', kind: 'list', type: 'RouteBinding' },
  ] },
  scope: { kind: 'entire-context-carrier', normal_completion: 'separate-correspondence-obligation' },
  occurrences: [
    { sort: 'AuthOccurrence', list_field: 'authRows', row_type: 'Evidence',
      qualifier_definition_id: 'DEF-QA', carrier: 'context-row-position-product',
      identity: 'context-and-zero-based-position',
      membership: { kind: 'tagged-zip-index', predicate: 'AuthMember', start: 0,
        nonmembers: 'ghost-and-foreign-excluded' }, projection: 'total-tuple-row' },
    { sort: 'RouteOccurrence', list_field: 'routeRows', row_type: 'RouteBinding',
      qualifier_definition_id: 'DEF-QR', carrier: 'context-row-position-product',
      identity: 'context-and-zero-based-position',
      membership: { kind: 'tagged-zip-index', predicate: 'RouteMember', start: 0,
        nonmembers: 'ghost-and-foreign-excluded' }, projection: 'total-tuple-row' },
  ], authority_effect: 'none',
});

test('current pinned typed Context fields and rendered Lean subject bind to model shape', () => {
  const result = checkCurrentAuthTypedModelSourceBridge(model(), logical());
  assert.equal(result.status, 'checked-auth-context-field-shape-and-qualifier-membership');
  assert.equal(result.selected_typed_context_field_shape_bound, true);
  assert.equal(result.logical_qualifier_membership_binding_checked, true);
  assert.equal(result.logical_qualifier_full_definition_checked, false);
  assert.equal(result.typed_context_carrier_correspondence_proved, false);
  assert.equal(result.lean_obligations_proved, false);
  assert.equal(result.model_obligations_checked, false);
  assert.equal(result.selected_typed_context_source_ref.typed_record_node_count, 7);
  const lean = readFileSync(new URL('./AuthGeneratedSubject.lean', import.meta.url));
  assert.equal(result.selected_typed_context_source_ref.generated_lean_sha256,
    createHash('sha256').update(lean).digest('hex'));
});

test('missing, extra, renamed, and mistyped selected Context fields reject', () => {
  const missing = model(); missing.context.fields.pop(); missing.occurrences.pop();
  assert.throws(() => checkCurrentAuthTypedModelSourceBridge(missing, logical()), /model Context fields differ/);
  const extra = model(); extra.context.fields.push({ name: 'outcome', kind: 'scalar', type: 'DecisionValue' });
  assert.throws(() => checkCurrentAuthTypedModelSourceBridge(extra, logical()), /model Context fields differ/);
  const renamed = model(); renamed.context.fields[1].name = 'candidate_command';
  assert.throws(() => checkCurrentAuthTypedModelSourceBridge(renamed, logical()), /model Context fields differ/);
  const wrongType = model(); wrongType.context.fields[1].type = 'Candidate';
  assert.throws(() => checkCurrentAuthTypedModelSourceBridge(wrongType, logical()), /model Context fields differ/);
  const wrongKind = model(); wrongKind.context.fields[2].kind = 'record';
  assert.throws(() => checkCurrentAuthTypedModelSourceBridge(wrongKind, logical()), /MODEL_COVERAGE|model Context fields differ/);
});

test('a missing direct membership conjunct rejects before source-shape success', () => {
  const changed = logical(); changed.definitions[0].body = { kind: 'or',
    left: predicate('AuthMember', variable('c'), variable('a')), right: { kind: 'true' } };
  assert.throws(() => checkCurrentAuthTypedModelSourceBridge(model(), changed), /MODEL_QUALIFIER/);
  const nested = logical(); nested.definitions[0].body = { kind: 'forall',
    variable: 'a2', sort: 'AuthOccurrence',
    body: predicate('AuthMember', variable('c'), variable('a2')) };
  assert.throws(() => checkCurrentAuthTypedModelSourceBridge(model(), nested), /MODEL_QUALIFIER/);
});

test('coherent generated-Lean drift still conflicts with source-derived Context mapping', () => {
  const lean = readFileSync(new URL('./AuthGeneratedSubject.lean', import.meta.url), 'utf8');
  const selectedFields = model().context.fields;
  assert.doesNotThrow(() => assertLeanContextDeclaration(lean, selectedFields));
  const renamed = lean.replace('  candidate : Command\n', '  outcome : Command\n');
  assert.notEqual(renamed, lean);
  assert.throws(() => assertLeanContextDeclaration(renamed, selectedFields),
    /declaration differs from pinned typed source field mapping/);
  const mistyped = lean.replace('  authRows : List Evidence\n', '  authRows : List RouteBinding\n');
  assert.notEqual(mistyped, lean);
  assert.throws(() => assertLeanContextDeclaration(mistyped, selectedFields),
    /declaration differs from pinned typed source field mapping/);
});

test('selected typed-record source mutation fails in memory without modifying pinned files', () => {
  const changed = readTypedRecordNodes();
  changed.context.body.typed_contract.properties[1].type.element.selector =
    'auth-command-boundary:route-authorization-binding';
  assert.throws(() => validateTypedRecordClosure(changed, { fixture: true }),
    /strictly deep-equal/);
  const added = readTypedRecordNodes();
  added.context.body.typed_contract.properties.push(structuredClone(
    added.context.body.typed_contract.properties[0]));
  assert.throws(() => validateTypedRecordClosure(added, { fixture: true }),
    /strictly deep-equal/);
});
