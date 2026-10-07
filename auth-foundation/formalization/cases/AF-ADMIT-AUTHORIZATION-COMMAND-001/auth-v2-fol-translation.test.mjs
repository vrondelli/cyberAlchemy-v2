import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parseFormalProposition } from '../../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim.ts';

const repo = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const artifact = JSON.parse(readFileSync(new URL('./AUTH-V2-FOL-TRANSLATION.v1-candidate.json', import.meta.url)));
const sha = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);
const formula = source => source.clauses.map(clause => `(${clause.source})`).join(' and ');
const exact = ref => {
  const path = resolve(repo, ref.path);
  assert.equal(lstatSync(path).isSymbolicLink(), false);
  const bytes = readFileSync(path);
  assert.equal(bytes.length, ref.size_bytes, ref.path);
  assert.equal(sha(bytes), ref.sha256, ref.path);
  assert.equal(ref.current, true);
  return JSON.parse(bytes);
};
const nodes = (value, predicate, found = []) => {
  if (value && typeof value === 'object') {
    if (predicate(value)) found.push(value);
    for (const child of Object.values(value)) nodes(child, predicate, found);
  }
  return found;
};

test('translation is a source-bound non-current candidate, not v2 acceptance or a v4 claim', () => {
  const accepted = exact(artifact.accepted_meaning_ref);
  const draft = exact(artifact.draft_definitions_ref);
  const model = exact(artifact.draft_interpretation_ref);
  assert.equal(artifact.status, 'draft-translation-not-current-claim');
  assert.equal(artifact.authority_effect, 'none');
  assert.equal(draft.status, 'draft');
  assert.equal(draft.acceptance.status, 'not-requested');
  assert.equal(model.status, 'draft');
  assert.equal(model.acceptance.status, 'not-requested');
  assert.match(accepted.rule, /without a downstream authorization call/);
  assert.match(artifact.claim_ceiling, /full no-downstream-call preservation/);
  const caseIds = new Set([...draft.examples, ...draft.counterexamples].map(row => row.case_id));
  for (const witness of artifact.witness_expectations) assert.ok(caseIds.has(witness.case_id));
});

test('one closed typed proposition contains exact qualifiers, scoped witnesses and both outcomes', () => {
  const text = formula(artifact);
  const ast = parseFormalProposition(text, artifact.formal_signature);
  assert.equal(artifact.profile, 'fol-core/1-candidate');
  assert.equal(artifact.representation_media_type, 'text/x-alchlang-fol');
  assert.equal(artifact.clauses.length, 6);
  assert.deepEqual(artifact.clauses.map(row => row.clause_id), [
    'outcomes-distinct', 'outcomes-exhaustive', 'qualifying-authentication',
    'qualifying-route', 'ready-condition', 'decision-biconditionals',
  ]);
  assert.equal(sha(canonical(ast)), '4c17f381ff0b24b58359133e2356a893f8a981f87bf2a03d8bb76d902d180e85');
  assert.equal(nodes(ast, node => node.kind === 'forall' && node.variable === 'c' && node.sort === 'Context').length, 4);
  assert.equal(nodes(ast, node => node.kind === 'exists' && node.variable === 'a').length, 1);
  assert.equal(nodes(ast, node => node.kind === 'exists' && node.variable === 'r').length, 1);
  assert.equal(nodes(ast, node => node.kind === 'iff').length, 5);
  assert.equal(nodes(ast, node => node.kind === 'predicate' && node.name === 'InScopeNormal').length, 0);
  const expectedFields = [
    'RequestID', 'RequestedEvidenceRef', 'RequestedRouteID', 'EvidenceRef', 'SessionID',
    'RouteID', 'ScopeEvidenceRef', 'PermissionResource', 'PermissionAction', 'PermissionScope',
    'CandidateRequestID', 'CandidateSessionID', 'CandidateResource', 'CandidateAction',
    'CandidateScope', 'CandidateScopeEvidenceRef', 'Decision',
  ];
  for (const name of expectedFields) assert.ok(nodes(ast, node => node.kind === 'function' && node.name === name).length, name);
  for (const name of ['AuthMember', 'RouteMember', 'Trusted', 'Complete', 'QA', 'QR', 'ReadyCondition'])
    assert.ok(nodes(ast, node => node.kind === 'predicate' && node.name === name).length, name);
});

test('well-formed semantic mutants remain parseable but fail the independent AST identity', () => {
  const expected = sha(canonical(parseFormalProposition(formula(artifact), artifact.formal_signature)));
  for (const [id, from, to] of [
    ['qualifying-authentication', 'Trusted(a)', 'not Trusted(a)'],
    ['qualifying-route', 'not (PermissionAction(r)=empty)', 'PermissionAction(r)=empty'],
    ['ready-condition', 'CandidateSessionID(c)=SessionID(a)', 'CandidateSessionID(c)=RequestID(c)'],
    ['decision-biconditionals', 'forall c:Context:', 'exists c:Context:'],
  ]) {
    const mutant = structuredClone(artifact);
    const clause = mutant.clauses.find(row => row.clause_id === id);
    assert.ok(clause.source.includes(from));
    clause.source = clause.source.replace(from, to);
    const mutantAst = parseFormalProposition(formula(mutant), mutant.formal_signature);
    assert.notEqual(sha(canonical(mutantAst)), expected, id);
  }
});

test('malformed syntax and undeclared symbols fail typed formation', () => {
  const syntax = structuredClone(artifact);
  syntax.clauses[0].source += ' ∨ true';
  assert.throws(() => parseFormalProposition(formula(syntax), syntax.formal_signature));
  const unknown = structuredClone(artifact);
  unknown.clauses[2].source = unknown.clauses[2].source.replace('Trusted(a)', 'Unknown(a)');
  assert.throws(() => parseFormalProposition(formula(unknown), unknown.formal_signature));
});

// One explicit finite interpretation of the candidate signature. This is a
// satisfiability/separator witness, not a proof for every native context.
function finiteModel(context) {
  const auth = context.auth.map((_, index) => ({ owner: context, index }));
  const route = context.routes.map((_, index) => ({ owner: context, index }));
  auth.push({ ghost: true });
  route.push({ ghost: true });
  const strings = new Set(['']);
  const collectStrings = value => {
    if (typeof value === 'string') strings.add(value);
    else if (Array.isArray(value)) value.forEach(collectStrings);
    else if (value && typeof value === 'object') Object.values(value).forEach(collectStrings);
  };
  collectStrings(context);
  const domains = { Context: [context], AuthOccurrence: auth, RouteOccurrence: route,
    String: [...strings], DecisionValue: ['READY', 'DENY'] };
  const authMember = (c, a) => a.owner === c && Number.isInteger(a.index) && a.index >= 0 && a.index < c.auth.length;
  const routeMember = (c, r) => r.owner === c && Number.isInteger(r.index) && r.index >= 0 && r.index < c.routes.length;
  const authRow = a => authMember(context, a) ? context.auth[a.index] : null;
  const routeRow = r => routeMember(context, r) ? context.routes[r.index] : null;
  const qa = (c, a) => authMember(c, a) && authRow(a).evidenceRef === c.requestedEvidenceRef
    && authRow(a).evidenceRef !== '' && authRow(a).sessionID !== '' && authRow(a).trusted === true;
  const qr = (c, r) => routeMember(c, r) && routeRow(r).routeID === c.requestedRouteID
    && routeRow(r).routeID !== '' && routeRow(r).scopeEvidenceRef !== '' && routeRow(r).complete === true
    && routeRow(r).resource !== '' && routeRow(r).action !== '' && routeRow(r).scope !== '';
  const ready = c => {
    const as = auth.filter(a => qa(c, a));
    const rs = route.filter(r => qr(c, r));
    if (c.requestID === '' || as.length !== 1 || rs.length !== 1) return false;
    const a = authRow(as[0]), r = routeRow(rs[0]);
    return c.candidate.requestID === c.requestID && c.candidate.sessionID === a.sessionID
      && c.candidate.resource === r.resource && c.candidate.action === r.action
      && c.candidate.scope === r.scope && c.candidate.scopeEvidenceRef === r.scopeEvidenceRef;
  };
  const term = (node, env) => {
    if (node.kind === 'variable') return env.get(node.name);
    if (node.kind === 'constant') return node.name === 'empty' ? '' : node.name;
    const arg = term(node.arguments[0], env);
    const values = {
      RequestID: () => arg.requestID, RequestedEvidenceRef: () => arg.requestedEvidenceRef,
      RequestedRouteID: () => arg.requestedRouteID, EvidenceRef: () => authRow(arg)?.evidenceRef ?? '',
      SessionID: () => authRow(arg)?.sessionID ?? '', RouteID: () => routeRow(arg)?.routeID ?? '',
      ScopeEvidenceRef: () => routeRow(arg)?.scopeEvidenceRef ?? '',
      PermissionResource: () => routeRow(arg)?.resource ?? '', PermissionAction: () => routeRow(arg)?.action ?? '',
      PermissionScope: () => routeRow(arg)?.scope ?? '', CandidateRequestID: () => arg.candidate.requestID,
      CandidateSessionID: () => arg.candidate.sessionID, CandidateResource: () => arg.candidate.resource,
      CandidateAction: () => arg.candidate.action, CandidateScope: () => arg.candidate.scope,
      CandidateScopeEvidenceRef: () => arg.candidate.scopeEvidenceRef, Decision: () => arg.decision,
    };
    assert.ok(values[node.name], `uninterpreted function ${node.name}`);
    const value = values[node.name]();
    if (node.sort === 'String') assert.ok(domains.String.includes(value), `out-of-carrier String result from ${node.name}`);
    if (node.sort === 'DecisionValue') assert.ok(domains.DecisionValue.includes(value), `out-of-carrier Decision result from ${node.name}`);
    return value;
  };
  const proposition = (node, env = new Map()) => {
    switch (node.kind) {
      case 'equal': return term(node.left, env) === term(node.right, env);
      case 'not': return !proposition(node.operand, env);
      case 'and': return proposition(node.left, env) && proposition(node.right, env);
      case 'or': return proposition(node.left, env) || proposition(node.right, env);
      case 'implies': return !proposition(node.left, env) || proposition(node.right, env);
      case 'iff': return proposition(node.left, env) === proposition(node.right, env);
      case 'forall': return domains[node.sort].every(value => proposition(node.body, new Map([...env, [node.variable, value]])));
      case 'exists': return domains[node.sort].some(value => proposition(node.body, new Map([...env, [node.variable, value]])));
      case 'predicate': {
        const args = node.arguments.map(arg => term(arg, env));
        const predicates = { AuthMember: authMember, RouteMember: routeMember,
          Trusted: a => authRow(a)?.trusted === true, Complete: r => routeRow(r)?.complete === true,
          QA: qa, QR: qr, ReadyCondition: ready };
        assert.ok(predicates[node.name], `uninterpreted predicate ${node.name}`);
        return predicates[node.name](...args);
      }
      default: throw new Error(`unsupported AST kind ${node.kind}`);
    }
  };
  return { proposition, ready };
}

test('bounded finite interpretations witness both outcomes and preserve list multiplicity', () => {
  const ast = parseFormalProposition(formula(artifact), artifact.formal_signature);
  const valid = {
    requestID: 'req', requestedEvidenceRef: 'ev', requestedRouteID: 'route',
    auth: [{ evidenceRef: 'ev', sessionID: 'session', trusted: true }],
    routes: [{ routeID: 'route', scopeEvidenceRef: 'scope-ev', complete: true,
      resource: 'resource', action: 'action', scope: 'scope' }],
    candidate: { requestID: 'req', sessionID: 'session', resource: 'resource',
      action: 'action', scope: 'scope', scopeEvidenceRef: 'scope-ev' },
    decision: 'READY',
  };
  const cases = [
    ['ready', valid, true],
    ['blank-id', { ...valid, requestID: '', candidate: { ...valid.candidate, requestID: '' }, decision: 'DENY' }, false],
    ['empty-lists', { ...valid, auth: [], routes: [], decision: 'DENY' }, false],
    ['equal-duplicate-auth', { ...valid, auth: [valid.auth[0], { ...valid.auth[0] }], decision: 'DENY' }, false],
    ['equal-duplicate-route', { ...valid, routes: [valid.routes[0], { ...valid.routes[0] }], decision: 'DENY' }, false],
    ['wrong-row-provenance', { ...valid, auth: [valid.auth[0], { evidenceRef: 'ev', sessionID: '', trusted: false }],
      candidate: { ...valid.candidate, sessionID: '' }, decision: 'DENY' }, false],
  ];
  for (const [id, context, expectedReady] of cases) {
    const model = finiteModel(context);
    assert.equal(model.ready(context), expectedReady, id);
    assert.equal(model.proposition(ast), true, `${id}: FOL conjunction must have a finite witness`);
    const wrongOutcome = { ...context, decision: context.decision === 'READY' ? 'DENY' : 'READY' };
    assert.equal(finiteModel(wrongOutcome).proposition(ast), false, `${id}: opposite outcome must violate the proposition`);
  }
});

test('semantic clause mutants fail against the fixed finite interpretation, not only the AST digest', () => {
  const context = {
    requestID: 'req', requestedEvidenceRef: 'ev', requestedRouteID: 'route',
    auth: [{ evidenceRef: 'ev', sessionID: 'session', trusted: true }],
    routes: [{ routeID: 'route', scopeEvidenceRef: 'scope-ev', complete: true,
      resource: 'resource', action: 'action', scope: 'scope' }],
    candidate: { requestID: 'req', sessionID: 'session', resource: 'resource',
      action: 'action', scope: 'scope', scopeEvidenceRef: 'scope-ev' },
    decision: 'READY',
  };
  const model = finiteModel(context);
  assert.equal(model.proposition(parseFormalProposition(formula(artifact), artifact.formal_signature)), true);
  for (const [id, from, to] of [
    ['qualifying-authentication', 'Trusted(a)', 'not Trusted(a)'],
    ['qualifying-route', 'not (PermissionAction(r)=empty)', 'PermissionAction(r)=empty'],
    ['ready-condition', 'CandidateSessionID(c)=SessionID(a)', 'CandidateSessionID(c)=RequestID(c)'],
    ['decision-biconditionals', 'Decision(c)=READY iff ReadyCondition(c)',
      'Decision(c)=DENY iff ReadyCondition(c)'],
  ]) {
    const mutant = structuredClone(artifact);
    const clause = mutant.clauses.find(row => row.clause_id === id);
    assert.ok(clause.source.includes(from), id);
    clause.source = clause.source.replace(from, to);
    const ast = parseFormalProposition(formula(mutant), mutant.formal_signature);
    assert.equal(model.proposition(ast), false, `${id}: changed meaning must fail in a READY witness`);
  }
});
