import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { candidateMeaning, evaluateSubject, readSubjectNodes, readTypedRecordNodes, renderLeanSubject, translateSubject, validateSelectedRuleGraph, validateTypedRecordClosure } from './auth-v2-typed-subject.mjs';

const baseRows = readSubjectNodes();
const subject = translateSubject(baseRows);
test('generated Lean subject replays exactly from pinned AST', () => {
  const path = fileURLToPath(new URL('./AuthGeneratedSubject.lean', import.meta.url));
  assert.equal(readFileSync(path, 'utf8'), renderLeanSubject(subject));
  assert.match(renderLeanSubject(subject), /AuthExpr\.ruleRef/);
  assert.match(renderLeanSubject(subject), /AuthExpr\.exactlyOne/);
  assert.match(renderLeanSubject(subject), /AuthExpr\.existsOne/);
});
test('all seven typed data nodes are pinned and match the Lean record closure', () => {
  const rows = readTypedRecordNodes();
  assert.equal(Object.keys(rows).length, 7);
  assert.equal(validateTypedRecordClosure(rows), rows);
  const changed = structuredClone(rows);
  changed.context.body.typed_contract.properties[1].type.element.selector = 'auth-command-boundary:boundary-request';
  assert.throws(() => validateTypedRecordClosure(changed, { fixture: true }), /strictly deep-equal/);
  const renamed = structuredClone(rows);
  renamed.permission.body.typed_contract.properties[1].name = 'operation';
  assert.throws(() => renderLeanSubject(subject, { recordRows: renamed, fixture: true }), /strictly deep-equal/);
  const decision = structuredClone(rows);
  decision.decision.body.typed_contract.variants[1].name = 'Allow';
  assert.throws(() => validateTypedRecordClosure(decision, { fixture: true }), /strictly deep-equal/);
});
test('selected Rule graph fits interpreter fuel independent of resolver-list length', () => {
  assert.deepEqual(validateSelectedRuleGraph(subject.rules), { auth: 4, route: 4, provenance: 5, aggregate: 7 });
  const cyclic = structuredClone(baseRows);
  cyclic.auth.body.typed_contract.expression = {
    op: 'rule_ref', selector: 'auth-command-boundary:unique-trusted-authentication-evidence',
    arguments: [{ parameter: 'context', value: { op: 'path', root: 'context', properties: [] } }],
  };
  assert.throws(() => translateSubject(cyclic, { fixture: true }), /leaf Rule auth cannot reference/);
  const deep = structuredClone(baseRows);
  for (let i = 0; i < 8; i++) deep.auth.body.typed_contract.expression = { op: 'not', term: deep.auth.body.typed_contract.expression };
  assert.throws(() => translateSubject(deep, { fixture: true }), /exceeds Lean fuel 8/);
});
const good = () => ({
  request: { request_id: 'R', authentication_evidence_ref: 'E', route_id: 'route' },
  candidate_command: { request_id: 'R', session_id: 'S', required_permission: { resource: 'res', action: 'act', scope: 'sc' }, scope_evidence_ref: 'scope' },
  resolved_authentication_evidence: [{ evidence_ref: 'E', session_id: 'S', trusted: true }],
  resolved_route_bindings: [{ route_id: 'route', complete: true, scope_evidence_ref: 'scope', required_permission: { resource: 'res', action: 'act', scope: 'sc' } }],
});
const variant = (edit, context) => {
  const rows = structuredClone(baseRows);
  edit(rows);
  const changed = translateSubject(rows, { fixture: true }); // Grammar applies; only byte pins are bypassed.
  assert.notDeepEqual(changed, subject);
  assert.notEqual(evaluateSubject(changed, context), candidateMeaning(context));
};

test('exact pinned source translates and representative contexts agree with fixed candidate meaning', () => {
  const cases = [good()];
  const blank = good(); blank.request.request_id = ''; blank.candidate_command.request_id = ''; cases.push(blank);
  const duplicate = good(); duplicate.resolved_authentication_evidence.push(structuredClone(duplicate.resolved_authentication_evidence[0])); cases.push(duplicate);
  const invalid = good(); invalid.resolved_route_bindings[0].required_permission.action = ''; invalid.candidate_command.required_permission.action = ''; cases.push(invalid);
  const nonqualifying = good(); nonqualifying.resolved_authentication_evidence.push({ evidence_ref: 'E', session_id: '', trusted: true }); nonqualifying.candidate_command.session_id = ''; cases.push(nonqualifying);
  assert.deepEqual(cases.map(c => evaluateSubject(subject, c)), cases.map(c => candidateMeaning(c)));
  assert.deepEqual(cases.map(c => candidateMeaning(c)), ['Ready', 'Deny', 'Deny', 'Deny', 'Deny']);
});

test('request-ID guard omission has a semantic counterexample', () => {
  const c = good(); c.request.request_id = ''; c.candidate_command.request_id = '';
  variant(rows => rows.provenance.body.typed_contract.expression.terms.shift(), c);
});
test('permission qualifier omission has a semantic counterexample', () => {
  const c = good(); c.resolved_route_bindings[0].required_permission.action = ''; c.candidate_command.required_permission.action = '';
  variant(rows => {
    for (const key of ['route', 'provenance']) {
      const terms = key === 'route' ? rows.route.body.typed_contract.expression.where.terms : rows.provenance.body.typed_contract.expression.terms[3].where.terms;
      const i = terms.findIndex(t => t.op === 'not' && t.term?.left?.properties?.at(-1) === 'AUTH-CB-PERMISSION#action');
      assert.ok(i >= 0); terms.splice(i, 1);
    }
  }, c);
});
test('exactly_one to exists admits duplicate equal rows', () => {
  const c = good(); c.resolved_authentication_evidence.push(structuredClone(c.resolved_authentication_evidence[0]));
  variant(rows => { rows.auth.body.typed_contract.expression.op = 'exists'; }, c);
});
test('nonqualifying-row provenance admits the wrong candidate', () => {
  const c = good(); c.resolved_authentication_evidence.push({ evidence_ref: 'E', session_id: '', trusted: true }); c.candidate_command.session_id = '';
  variant(rows => {
    const where = rows.provenance.body.typed_contract.expression.terms[2].where.terms;
    where.splice(1, 3); // Discard nonempty ref, trusted, and nonempty session qualifiers only in provenance.
  }, c);
});
test('swapped Operation branches denies a valid request', () => {
  variant(rows => {
    const op = rows.operation.body.typed_contract;
    [op.success_result, op.failure_result] = [op.failure_result, op.success_result];
  }, good());
});
test('redirected Operation guard admits a request with invalid route evidence', () => {
  const c = good(); c.resolved_route_bindings[0].required_permission.action = '';
  variant(rows => {
    rows.operation.body.typed_contract.guard = 'auth-command-boundary:unique-trusted-authentication-evidence';
  }, c);
});
test('unrecognized expression fails closed even in fixture mode', () => {
  const rows = structuredClone(baseRows);
  rows.auth.body.typed_contract.expression.op = 'plausible_only';
  assert.throws(() => translateSubject(rows, { fixture: true }), /unsupported expression/);
});
test('typed Lean projection fails closed on an unrecognized property path', () => {
  const rows = structuredClone(baseRows);
  rows.auth.body.typed_contract.expression.where.terms[0].left.properties = [
    'AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#unknown_field',
  ];
  const changed = translateSubject(rows, { fixture: true });
  assert.throws(() => renderLeanSubject(changed), /unsupported typed Lean path/);
});
