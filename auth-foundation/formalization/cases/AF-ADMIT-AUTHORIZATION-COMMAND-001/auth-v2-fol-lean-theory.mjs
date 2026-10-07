import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseFormalProposition } from '../../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim.ts';

const sorts = Object.freeze({
  Context: 'AuthFolModel.Context',
  AuthOccurrence: 'AuthFolModel.AuthOccurrence',
  RouteOccurrence: 'AuthFolModel.RouteOccurrence',
  String: 'String',
  DecisionValue: 'AuthFolModel.DecisionValue',
});
const functions = Object.freeze({
  RequestID: ['AuthFolModel.requestID', ['Context'], 'String'],
  RequestedEvidenceRef: ['AuthFolModel.requestedEvidenceRef', ['Context'], 'String'],
  RequestedRouteID: ['AuthFolModel.requestedRouteID', ['Context'], 'String'],
  EvidenceRef: ['AuthFolModel.evidenceRef', ['AuthOccurrence'], 'String'],
  SessionID: ['AuthFolModel.sessionID', ['AuthOccurrence'], 'String'],
  RouteID: ['AuthFolModel.routeID', ['RouteOccurrence'], 'String'],
  ScopeEvidenceRef: ['AuthFolModel.scopeEvidenceRef', ['RouteOccurrence'], 'String'],
  PermissionResource: ['AuthFolModel.permissionResource', ['RouteOccurrence'], 'String'],
  PermissionAction: ['AuthFolModel.permissionAction', ['RouteOccurrence'], 'String'],
  PermissionScope: ['AuthFolModel.permissionScope', ['RouteOccurrence'], 'String'],
  CandidateRequestID: ['AuthFolModel.candidateRequestID', ['Context'], 'String'],
  CandidateSessionID: ['AuthFolModel.candidateSessionID', ['Context'], 'String'],
  CandidateResource: ['AuthFolModel.candidateResource', ['Context'], 'String'],
  CandidateAction: ['AuthFolModel.candidateAction', ['Context'], 'String'],
  CandidateScope: ['AuthFolModel.candidateScope', ['Context'], 'String'],
  CandidateScopeEvidenceRef: ['AuthFolModel.candidateScopeEvidenceRef', ['Context'], 'String'],
  Decision: ['decision', ['Context'], 'DecisionValue'],
});
const predicates = Object.freeze({
  AuthMember: ['AuthFolModel.authMember', ['Context', 'AuthOccurrence']],
  RouteMember: ['AuthFolModel.routeMember', ['Context', 'RouteOccurrence']],
  Trusted: ['AuthFolModel.trusted', ['AuthOccurrence']],
  Complete: ['AuthFolModel.complete', ['RouteOccurrence']],
  QA: ['AuthFolModel.qa', ['Context', 'AuthOccurrence']],
  QR: ['AuthFolModel.qr', ['Context', 'RouteOccurrence']],
  ReadyCondition: ['AuthFolModel.readyCondition', ['Context']],
});
const constants = Object.freeze({
  empty: ['""', 'String'],
  READY: ['AuthFolModel.DecisionValue.ready', 'DecisionValue'],
  DENY: ['AuthFolModel.DecisionValue.deny', 'DecisionValue'],
});
const clauseIds = Object.freeze([
  'outcomes-distinct', 'outcomes-exhaustive', 'qualifying-authentication',
  'qualifying-route', 'ready-condition', 'decision-biconditionals',
]);

function exactSignature(signature) {
  assert.deepEqual(signature.sorts.map(row => row.name), Object.keys(sorts));
  assert.deepEqual(signature.functions.map(row => row.name), Object.keys(functions));
  assert.deepEqual(signature.predicates.map(row => row.name), Object.keys(predicates));
  assert.deepEqual(signature.constants.map(row => row.name), Object.keys(constants));
  for (const row of signature.functions) {
    const [, args, result] = functions[row.name];
    assert.deepEqual(row.parameter_sorts, args, row.name);
    assert.equal(row.result_sort, result, row.name);
  }
  for (const row of signature.predicates)
    assert.deepEqual(row.parameter_sorts, predicates[row.name][1], row.name);
  for (const row of signature.constants)
    assert.equal(row.sort, constants[row.name][1], row.name);
}

function topLevelClauses(ast) {
  const clauses = [];
  let cursor = ast;
  while (cursor.kind === 'and') {
    clauses.unshift(cursor.right);
    cursor = cursor.left;
  }
  clauses.unshift(cursor);
  assert.equal(clauses.length, clauseIds.length, 'theory must contain exactly six top-level clauses');
  return clauses;
}

function emitTerm(node, bindings) {
  if (node.kind === 'variable') {
    const bound = bindings.get(node.name);
    assert.ok(bound, `unbound variable ${node.name}`);
    assert.equal(node.sort, bound.sort);
    return bound.lean;
  }
  if (node.kind === 'constant') {
    const entry = constants[node.name];
    assert.ok(entry, `unknown constant ${node.name}`);
    assert.equal(node.sort, entry[1]);
    return entry[0];
  }
  assert.equal(node.kind, 'function', `unsupported term ${node.kind}`);
  const entry = functions[node.name];
  assert.ok(entry, `unknown function ${node.name}`);
  assert.equal(node.sort, entry[2]);
  assert.equal(node.arguments.length, entry[1].length);
  for (let i = 0; i < node.arguments.length; i++)
    assert.equal(node.arguments[i].sort, entry[1][i]);
  return `(${entry[0]} ${node.arguments.map(arg => emitTerm(arg, bindings)).join(' ')})`;
}

function emitProp(node, bindings, serial) {
  if (node.kind === 'predicate') {
    const entry = predicates[node.name];
    assert.ok(entry, `unknown predicate ${node.name}`);
    assert.equal(node.arguments.length, entry[1].length);
    for (let i = 0; i < node.arguments.length; i++)
      assert.equal(node.arguments[i].sort, entry[1][i]);
    return `(${entry[0]} ${node.arguments.map(arg => emitTerm(arg, bindings)).join(' ')})`;
  }
  if (node.kind === 'equal') {
    assert.equal(node.left.sort, node.right.sort);
    assert.ok(sorts[node.left.sort]);
    return `(${emitTerm(node.left, bindings)} = ${emitTerm(node.right, bindings)})`;
  }
  if (node.kind === 'not') return `(¬ ${emitProp(node.operand, bindings, serial)})`;
  const operators = { and: '∧', or: '∨', implies: '→', iff: '↔' };
  if (Object.hasOwn(operators, node.kind))
    return `(${emitProp(node.left, bindings, serial)} ${operators[node.kind]} ${emitProp(node.right, bindings, serial)})`;
  assert.ok(node.kind === 'forall' || node.kind === 'exists', `unsupported proposition ${node.kind}`);
  assert.ok(sorts[node.sort], `unknown quantifier sort ${node.sort}`);
  const lean = `v${serial.next++}`;
  const next = new Map(bindings);
  next.set(node.variable, { lean, sort: node.sort });
  return `(${node.kind === 'forall' ? '∀' : '∃'} (${lean} : ${sorts[node.sort]}), ${emitProp(node.body, next, serial)})`;
}

export function renderFolTheory(source) {
  assert.equal(source.schema_version, 'auth-foundation.command-boundary-fol-translation/v1-candidate');
  assert.equal(source.status, 'draft-translation-not-current-claim');
  assert.equal(source.profile, 'fol-core/1-candidate');
  assert.equal(source.composition, 'parenthesized-conjunction-in-clause-order');
  assert.deepEqual(source.clauses.map(row => row.clause_id), clauseIds);
  exactSignature(source.formal_signature);
  const proposition = source.clauses.map(row => `(${row.source})`).join(' and ');
  const ast = parseFormalProposition(proposition, source.formal_signature);
  const clauses = topLevelClauses(ast);
  const declarations = clauses.map((clause, index) =>
    `def clause${index + 1} (${index === 5 ? 'decision' : '_decision'} : AuthFolModel.Context → AuthFolModel.DecisionValue) : Prop :=\n  ${emitProp(clause, new Map(), { next: 0 })}`);
  return `-- GENERATED by auth-v2-fol-lean-theory.mjs from the parsed six-clause FOL AST.\n` +
    `-- Candidate interpretation only; its correspondence proof is separate.\n` +
    `import AuthFolModel\n\nnamespace AuthFolGeneratedTheory\n\n` +
    `${declarations.join('\n\n')}\n\n` +
    `def theory (decision : AuthFolModel.Context → AuthFolModel.DecisionValue) : Prop :=\n` +
    `  ${clauses.map((_, i) => `(clause${i + 1} decision)`).join(' ∧ ')}\n\n` +
    `end AuthFolGeneratedTheory\n`;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const source = JSON.parse(readFileSync(new URL('./AUTH-V2-FOL-TRANSLATION.v1-candidate.json', import.meta.url)));
  process.stdout.write(renderFolTheory(source));
}
