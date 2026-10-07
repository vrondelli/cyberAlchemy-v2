import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// This is a deliberately narrow source translator, not an alternate Auth policy.
// The source expression trees, including selector arguments and Operation branches,
// are retained in the emitted IR. A fixture can bypass byte pins but not grammar.
const here = dirname(fileURLToPath(import.meta.url));
const nodes = resolve(here, '../../../implementation/command-boundary-source-v2/specs/auth-command-boundary/nodes');
const names = Object.freeze({
  auth: ['unique-trusted-authentication-evidence', 'eada37d662b8d31737c2c00d118f629a03e250a1742bb137231bd7996e1e6608'],
  route: ['unique-complete-route-binding', 'd6a56c77c2c00937ee6526cfe423b37fc31b4a9940795c840e276cd6b3e322b4'],
  provenance: ['candidate-command-provenance', '102b60b8da13f51273b4bafe6fb6522cdc68c923597f10dee02772bd8836937c'],
  aggregate: ['command-boundary-admissible', '91899b41f928554b796ce4446d06e7ed1836fcbcf20deac814430010a9a320ed'],
  operation: ['admit-authorization-command', 'fbace90ffca46b51fd286d3bf733b39b803f739c69bf5d2c9a1a1daeb5df9ac1'],
});
const S = name => ({ kind: 'scalar', name });
const N = name => ({ kind: 'named', selector: `auth-command-boundary:${name}` });
const L = name => ({ kind: 'list', element: N(name) });
// This is the complete typed data closure used by the executable projection.
// Pins detect changes even to meaning prose; the shape check below binds the
// handwritten Lean record declarations and path table to the selected types.
const recordSpecs = Object.freeze({
  context: ['command-boundary-context', 'f59e12aad5efa12375cca82f56b36d73e532fb8795c7a7d4ad7e9a9ef2c9df34', 'AUTH-CB-CONTEXT', [
    ['request', N('boundary-request'), 'one', false],
    ['resolved_authentication_evidence', L('authenticated-session-evidence'), 'many', false],
    ['resolved_route_bindings', L('route-authorization-binding'), 'many', false],
    ['candidate_command', N('authorization-command'), 'one', false],
  ]],
  request: ['boundary-request', '58337de28063fc3e55cf609b64cecdfd70f60940d98c595ec773015b1260c595', 'AUTH-CB-BOUNDARY-REQUEST', [
    ['request_id', S('String'), 'one', true],
    ['authentication_evidence_ref', S('String'), 'one', false],
    ['route_id', S('String'), 'one', false],
  ]],
  command: ['authorization-command', 'd08be186e89686a43110c8ce279d9e49546eb210e19b0b8aad9de26613f64f1d', 'AUTH-CB-AUTHORIZATION-COMMAND', [
    ['request_id', S('String'), 'one', true],
    ['session_id', S('String'), 'one', false],
    ['required_permission', N('permission'), 'one', false],
    ['scope_evidence_ref', S('String'), 'one', false],
  ]],
  evidence: ['authenticated-session-evidence', '3a5b7bd1c90ced228666b105d8157d9af1075d5d5a93c5e1870a08af7d6241be', 'AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE', [
    ['evidence_ref', S('String'), 'one', true],
    ['session_id', S('String'), 'one', false],
    ['trusted', S('Bool'), 'one', false],
  ]],
  route: ['route-authorization-binding', 'd04569313462038598a1a045ed3c4e35b3510c5ee4a68e4175d71965ec615d51', 'AUTH-CB-ROUTE-AUTHORIZATION-BINDING', [
    ['route_id', S('String'), 'one', true],
    ['required_permission', N('permission'), 'one', false],
    ['scope_evidence_ref', S('String'), 'one', false],
    ['complete', S('Bool'), 'one', false],
  ]],
  permission: ['permission', '26f9c3217096bed9d3e3a7b9e0edcbe8f196bbf4ac32a0c4251e2f5262c36a3a', 'AUTH-CB-PERMISSION', [
    ['resource', S('String'), 'one', true],
    ['action', S('String'), 'one', true],
    ['scope', S('String'), 'one', true],
  ]],
  decision: ['command-boundary-decision', 'ab768996fe16624e2a949b51099cd2e1b7081c994f524914d101545b7f7ff0f1', 'AUTH-CB-DECISION', [
    ['Ready', null], ['Deny', null],
  ]],
});
const selectors = Object.fromEntries(Object.entries(names).filter(([key]) => key !== 'operation').map(([key, [name]]) => [`auth-command-boundary:${name}`, key]));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const own = (o, keys) => { assert.deepStrictEqual(Object.keys(o).sort(), [...keys].sort()); return o; };
const str = x => { assert.equal(typeof x, 'string'); return x; };

function term(t, scope) {
  assert.equal(typeof t, 'object');
  if (t.op === 'literal') {
    own(t, ['op', 'type', 'value']);
    assert.ok(t.type === 'String' || t.type === 'Bool');
    assert.equal(typeof t.value, t.type === 'String' ? 'string' : 'boolean');
    return structuredClone(t);
  }
  if (t.op === 'path') {
    own(t, ['op', 'root', 'properties']);
    assert.ok(scope.includes(t.root), `out-of-scope root ${t.root}`);
    assert.ok(Array.isArray(t.properties));
    t.properties.forEach(p => assert.match(str(p), /^AUTH-CB-[A-Z-]+#[a-z_]+$/));
    return structuredClone(t);
  }
  throw new Error(`unsupported term ${t.op}`);
}
function expression(e, scope) {
  assert.equal(typeof e, 'object');
  switch (e.op) {
    case 'eq': own(e, ['op', 'left', 'right']); return { op: 'eq', left: term(e.left, scope), right: term(e.right, scope) };
    case 'not': own(e, ['op', 'term']); return { op: 'not', term: expression(e.term, scope) };
    case 'all': own(e, ['op', 'terms']); assert.ok(Array.isArray(e.terms) && e.terms.length); return { op: 'all', terms: e.terms.map(x => expression(x, scope)) };
    case 'exactly_one': case 'exists':
      own(e, ['op', 'binding', 'collection', 'where']);
      assert.ok(['evidence', 'binding'].includes(e.binding) && !scope.includes(e.binding));
      return { op: e.op, binding: e.binding, collection: term(e.collection, scope), where: expression(e.where, [...scope, e.binding]) };
    case 'rule_ref':
      own(e, ['op', 'selector', 'arguments']);
      assert.ok(selectors[e.selector] && selectors[e.selector] !== 'aggregate');
      assert.ok(Array.isArray(e.arguments) && e.arguments.length === 1);
      own(e.arguments[0], ['parameter', 'value']);
      assert.equal(e.arguments[0].parameter, 'context');
      return { op: 'rule_ref', selector: e.selector, arguments: [{ parameter: 'context', value: term(e.arguments[0].value, scope) }] };
    default: throw new Error(`unsupported expression ${e.op}`);
  }
}
export function readSubjectNodes() {
  return Object.fromEntries(Object.entries(names).map(([key, [name, pin]]) => {
    const bytes = readFileSync(resolve(nodes, `${name}.json`));
    assert.equal(sha(bytes), pin, `source drift: ${name}`);
    return [key, JSON.parse(bytes)];
  }));
}
export function readTypedRecordNodes() {
  return Object.fromEntries(Object.entries(recordSpecs).map(([key, [name, pin]]) => {
    const bytes = readFileSync(resolve(nodes, `${name}.json`));
    assert.equal(sha(bytes), pin, `typed record source drift: ${name}`);
    return [key, JSON.parse(bytes)];
  }));
}
export function validateTypedRecordClosure(rows, { fixture = false } = {}) {
  assert.deepStrictEqual(Object.keys(rows).sort(), Object.keys(recordSpecs).sort());
  if (!fixture) assert.deepStrictEqual(rows, readTypedRecordNodes());
  for (const [key, [name, , ontology, fields]] of Object.entries(recordSpecs)) {
    const row = rows[key], contract = row.body?.typed_contract;
    assert.equal(row.schema_version, 'domainspec.node/v1');
    assert.equal(row.node_id, name);
    assert.equal(row.feature_id, 'auth-command-boundary');
    assert.equal(contract.ontology_node, ontology);
    if (key === 'decision') {
      assert.equal(row.kind, 'Enum');
      assert.equal(contract.schema_version, 'domainspec.typed-sum/v1');
      assert.deepStrictEqual(row.body.values, fields.map(([variant]) => variant));
      assert.deepStrictEqual(contract.variants.map(v => [v.name, v.payload, v.ontology_variant]),
        fields.map(([variant, payload]) => [variant, payload, `${ontology}#${variant}`]));
    } else {
      assert.equal(row.kind, 'Value Object');
      assert.equal(contract.schema_version, 'domainspec.typed-record/v1');
      assert.deepStrictEqual(row.body.fields, fields.map(([field]) => field));
      assert.deepStrictEqual(contract.properties.map(p => [p.name, p.type, p.cardinality, p.identity, p.ontology_property]),
        fields.map(([field, type, cardinality, identity]) => [field, type, cardinality, identity, `${ontology}#${field}`]));
    }
  }
  return rows;
}

// The fixed Lean interpreter descends by expression/rule-reference depth, not
// by resolver-list length. This check makes fuel 8 sufficient for every AST
// admitted by this narrow translator, including fixture mutants.
export function validateSelectedRuleGraph(rules) {
  const refs = e => {
    switch (e.op) {
      case 'eq': return [];
      case 'not': return refs(e.term);
      case 'all': return e.terms.flatMap(refs);
      case 'exactly_one': case 'exists': return refs(e.where);
      case 'rule_ref': return [selectors[e.selector]];
      default: throw new Error(`unsupported graph expression ${e.op}`);
    }
  };
  for (const key of ['auth', 'route', 'provenance']) {
    assert.deepStrictEqual(refs(rules[key].expression), [], `leaf Rule ${key} cannot reference another Rule`);
  }
  for (const target of refs(rules.aggregate.expression)) {
    assert.ok(['auth', 'route', 'provenance'].includes(target), `unsupported aggregate Rule reference ${target}`);
  }
  const depth = (e, stack) => {
    switch (e.op) {
      case 'eq': return 1;
      case 'not': return 1 + depth(e.term, stack);
      case 'all': return 1 + Math.max(0, ...e.terms.map(term => depth(term, stack)));
      case 'exactly_one': case 'exists': return 1 + depth(e.where, stack);
      case 'rule_ref': {
        const target = selectors[e.selector];
        assert.ok(target && !stack.includes(target), `cyclic or unknown Rule reference ${e.selector}`);
        assert.deepStrictEqual(e.arguments[0].value, { op: 'path', root: 'context', properties: [] });
        return 1 + depth(rules[target].expression, [...stack, target]);
      }
      default: throw new Error(`unsupported depth expression ${e.op}`);
    }
  };
  const depths = Object.fromEntries(Object.keys(rules).map(key => [key, depth(rules[key].expression, [key])]));
  assert.ok(Object.values(depths).every(value => value <= 8), `selected AST exceeds Lean fuel 8: ${JSON.stringify(depths)}`);
  return depths;
}
export function translateSubject(rows, { fixture = false } = {}) {
  assert.deepStrictEqual(Object.keys(rows).sort(), Object.keys(names).sort());
  if (!fixture) assert.deepStrictEqual(rows, readSubjectNodes());
  const rules = {};
  for (const key of ['auth', 'route', 'provenance', 'aggregate']) {
    const row = rows[key], contract = row.body?.typed_contract;
    assert.equal(row.kind, 'Rule'); assert.equal(row.node_id, names[key][0]);
    assert.equal(row.feature_id, 'auth-command-boundary');
    assert.equal(contract.schema_version, 'domainspec.typed-rule/v1');
    assert.deepStrictEqual(contract.parameters, [{ name: 'context', type: { kind: 'named', selector: 'auth-command-boundary:command-boundary-context' } }]);
    rules[key] = { selector: `auth-command-boundary:${row.node_id}`, ontology_rule: str(contract.ontology_rule), expression: expression(contract.expression, ['context']) };
  }
  validateSelectedRuleGraph(rules);
  const row = rows.operation, op = row.body?.typed_contract;
  assert.equal(row.kind, 'Operation'); assert.equal(row.node_id, names.operation[0]);
  assert.equal(row.feature_id, 'auth-command-boundary');
  assert.equal(op.schema_version, 'domainspec.typed-operation/v1');
  assert.ok(Object.values(rules).some(rule => rule.selector === op.guard), 'guard outside selected Rule closure');
  assert.deepStrictEqual(op.inputs, [{ name: 'context', type: { kind: 'named', selector: 'auth-command-boundary:command-boundary-context' } }]);
  assert.deepStrictEqual(op.output, { kind: 'named', selector: 'auth-command-boundary:command-boundary-decision' });
  for (const field of ['reads', 'writes', 'effects']) assert.deepStrictEqual(op[field], []);
  assert.equal(op.success_result.payload_variant, null);
  assert.equal(op.failure_result.payload_variant, null);
  return { schema_version: 'auth-foundation.typed-subject-ir/v1-candidate', rules, operation: {
    ontology_operation: str(op.ontology_operation), guard: str(op.guard),
    output: structuredClone(op.output),
    success_result: structuredClone(op.success_result), failure_result: structuredClone(op.failure_result),
    failure_continuation: str(op.failure_continuation),
  } };
}

function path(t, env) {
  let value = env[t.root];
  for (const property of t.properties) {
    assert.ok(value && typeof value === 'object');
    value = value[property.split('#')[1]];
  }
  assert.notEqual(value, undefined);
  return value;
}
function value(t, env) { return t.op === 'literal' ? t.value : path(t, env); }
export function evaluateSubject(subject, context) {
  const active = new Set();
  function rule(key, ctx) {
    if (active.has(key)) throw new Error(`rule cycle: ${key}`);
    active.add(key);
    try { return expr(subject.rules[key].expression, { context: ctx }); }
    finally { active.delete(key); }
  }
  function expr(e, env) {
    switch (e.op) {
      case 'eq': return value(e.left, env) === value(e.right, env);
      case 'not': return !expr(e.term, env);
      case 'all': return e.terms.every(t => expr(t, env));
      case 'exactly_one': case 'exists': {
        const rows = value(e.collection, env);
        assert.ok(Array.isArray(rows));
        const count = rows.reduce((n, row) => n + Number(expr(e.where, { ...env, [e.binding]: row })), 0);
        return e.op === 'exactly_one' ? count === 1 : count > 0;
      }
      case 'rule_ref': return rule(selectors[e.selector], value(e.arguments[0].value, env));
      default: throw new Error(`unsupported expression ${e.op}`);
    }
  }
  const guardKey = selectors[subject.operation.guard];
  assert.ok(guardKey && subject.rules[guardKey]?.selector === subject.operation.guard);
  const admitted = rule(guardKey, context);
  return admitted ? subject.operation.success_result.variant : subject.operation.failure_result.variant;
}

// Fixed, separately reviewable interpretation of the clarified draft; this
// intentionally does not call evaluateSubject or inspect its translated IR.
export function candidateMeaning(context) {
  const { request, candidate_command: candidate, resolved_authentication_evidence: authRows, resolved_route_bindings: routeRows } = context;
  const auth = authRows.filter(row => row.evidence_ref === request.authentication_evidence_ref && row.evidence_ref !== '' && row.trusted === true && row.session_id !== '');
  const routes = routeRows.filter(row => row.route_id === request.route_id && row.route_id !== '' && row.complete === true && row.scope_evidence_ref !== '' && row.required_permission.resource !== '' && row.required_permission.action !== '' && row.required_permission.scope !== '');
  return request.request_id !== '' && auth.length === 1 && routes.length === 1 &&
    candidate.request_id === request.request_id && candidate.session_id === auth[0].session_id &&
    candidate.required_permission.resource === routes[0].required_permission.resource &&
    candidate.required_permission.action === routes[0].required_permission.action &&
    candidate.required_permission.scope === routes[0].required_permission.scope &&
    candidate.scope_evidence_ref === routes[0].scope_evidence_ref ? 'Ready' : 'Deny';
}

// Both the Lean data and executable projection are derived from the pinned AST.
// Every path is checked against this closed typed environment; unknown paths
// cannot silently become an arbitrary field with the same suffix.
const leanPaths = Object.freeze({
  'context:': ['context', 'Context'],
  'context:AUTH-CB-CONTEXT#resolved_authentication_evidence': ['context.authRows', 'List Evidence'],
  'context:AUTH-CB-CONTEXT#resolved_route_bindings': ['context.routeRows', 'List RouteBinding'],
  'context:AUTH-CB-CONTEXT#request|AUTH-CB-BOUNDARY-REQUEST#authentication_evidence_ref': ['context.request.authenticationEvidenceRef', 'String'],
  'context:AUTH-CB-CONTEXT#request|AUTH-CB-BOUNDARY-REQUEST#route_id': ['context.request.routeId', 'String'],
  'context:AUTH-CB-CONTEXT#request|AUTH-CB-BOUNDARY-REQUEST#request_id': ['context.request.requestId', 'String'],
  'context:AUTH-CB-CONTEXT#candidate_command|AUTH-CB-AUTHORIZATION-COMMAND#request_id': ['context.candidate.requestId', 'String'],
  'context:AUTH-CB-CONTEXT#candidate_command|AUTH-CB-AUTHORIZATION-COMMAND#session_id': ['context.candidate.sessionId', 'String'],
  'context:AUTH-CB-CONTEXT#candidate_command|AUTH-CB-AUTHORIZATION-COMMAND#scope_evidence_ref': ['context.candidate.scopeEvidenceRef', 'String'],
  'context:AUTH-CB-CONTEXT#candidate_command|AUTH-CB-AUTHORIZATION-COMMAND#required_permission|AUTH-CB-PERMISSION#resource': ['context.candidate.permission.resource', 'String'],
  'context:AUTH-CB-CONTEXT#candidate_command|AUTH-CB-AUTHORIZATION-COMMAND#required_permission|AUTH-CB-PERMISSION#action': ['context.candidate.permission.action', 'String'],
  'context:AUTH-CB-CONTEXT#candidate_command|AUTH-CB-AUTHORIZATION-COMMAND#required_permission|AUTH-CB-PERMISSION#scope': ['context.candidate.permission.scope', 'String'],
  'evidence:AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#evidence_ref': ['evidence.evidenceRef', 'String'],
  'evidence:AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#trusted': ['evidence.trusted', 'Bool'],
  'evidence:AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#session_id': ['evidence.sessionId', 'String'],
  'binding:AUTH-CB-ROUTE-AUTHORIZATION-BINDING#route_id': ['binding.routeId', 'String'],
  'binding:AUTH-CB-ROUTE-AUTHORIZATION-BINDING#complete': ['binding.complete', 'Bool'],
  'binding:AUTH-CB-ROUTE-AUTHORIZATION-BINDING#scope_evidence_ref': ['binding.scopeEvidenceRef', 'String'],
  'binding:AUTH-CB-ROUTE-AUTHORIZATION-BINDING#required_permission|AUTH-CB-PERMISSION#resource': ['binding.permission.resource', 'String'],
  'binding:AUTH-CB-ROUTE-AUTHORIZATION-BINDING#required_permission|AUTH-CB-PERMISSION#action': ['binding.permission.action', 'String'],
  'binding:AUTH-CB-ROUTE-AUTHORIZATION-BINDING#required_permission|AUTH-CB-PERMISSION#scope': ['binding.permission.scope', 'String'],
});

function renderLeanExecutable(subject) {
  const term = x => {
    if (x.op === 'literal') return [x.type === 'String' ? JSON.stringify(x.value) : String(x.value), x.type];
    const entry = leanPaths[`${x.root}:${x.properties.join('|')}`];
    assert.ok(entry, `unsupported typed Lean path ${x.root}:${x.properties.join('|')}`);
    return entry;
  };
  const expr = x => {
    switch (x.op) {
      case 'eq': {
        const [left, lt] = term(x.left), [right, rt] = term(x.right);
        assert.equal(lt, rt, 'typed equality mismatch');
        assert.ok(lt === 'String' || lt === 'Bool');
        return `(${left} == ${right})`;
      }
      case 'not': return `(!${expr(x.term)})`;
      case 'all': return `(${x.terms.map(expr).join(' && ')})`;
      case 'exactly_one': case 'exists': {
        const [collection, type] = term(x.collection);
        assert.equal(type, x.binding === 'evidence' ? 'List Evidence' : 'List RouteBinding');
        const predicate = expr(x.where);
        return x.op === 'exactly_one'
          ? `(((${collection}).filter (fun ${x.binding} => ${predicate})).length == 1)`
          : `((${collection}).any (fun ${x.binding} => ${predicate}))`;
      }
      case 'rule_ref': {
        assert.deepStrictEqual(x.arguments[0].value, { op: 'path', root: 'context', properties: [] });
        const target = selectors[x.selector];
        assert.ok(['auth', 'route', 'provenance'].includes(target));
        return `(eval${target[0].toUpperCase()}${target.slice(1)} context)`;
      }
      default: throw new Error(`unsupported executable expression ${x.op}`);
    }
  };
  const guard = selectors[subject.operation.guard];
  assert.ok(['auth', 'route', 'provenance', 'aggregate'].includes(guard));
  return `structure Permission where\n  resource : String\n  action : String\n  scope : String\nderiving Repr, DecidableEq\nstructure Request where\n  requestId : String\n  authenticationEvidenceRef : String\n  routeId : String\nderiving Repr, DecidableEq\nstructure Command where\n  requestId : String\n  sessionId : String\n  permission : Permission\n  scopeEvidenceRef : String\nderiving Repr, DecidableEq\nstructure Evidence where\n  evidenceRef : String\n  trusted : Bool\n  sessionId : String\nderiving Repr, DecidableEq\nstructure RouteBinding where\n  routeId : String\n  complete : Bool\n  scopeEvidenceRef : String\n  permission : Permission\nderiving Repr, DecidableEq\nstructure Context where\n  request : Request\n  candidate : Command\n  authRows : List Evidence\n  routeRows : List RouteBinding\nderiving Repr, DecidableEq\n${['auth', 'route', 'provenance', 'aggregate'].map(key => `def eval${key[0].toUpperCase()}${key.slice(1)} (context : Context) : Bool :=\n  ${expr(subject.rules[key].expression)}\n`).join('\n')}\ndef evalOperation (context : Context) : String :=\n  if eval${guard[0].toUpperCase()}${guard.slice(1)} context then operationSuccess else operationFailure\n`;
}

export function renderLeanSubject(subject, { recordRows = readTypedRecordNodes(), fixture = false } = {}) {
  validateTypedRecordClosure(recordRows, { fixture });
  const q = JSON.stringify;
  const list = xs => `[${xs.join(', ')}]`;
  const t = x => x.op === 'path' ? `(AuthTerm.path ${q(x.root)} ${list(x.properties.map(q))})` :
    x.type === 'String' ? `(AuthTerm.string ${q(x.value)})` : `(AuthTerm.bool ${x.value})`;
  const e = x => {
    switch (x.op) {
      case 'eq': return `(AuthExpr.eq ${t(x.left)} ${t(x.right)})`;
      case 'not': return `(AuthExpr.not ${e(x.term)})`;
      case 'all': return `(AuthExpr.all ${list(x.terms.map(e))})`;
      case 'exactly_one': return `(AuthExpr.exactlyOne ${q(x.binding)} ${t(x.collection)} ${e(x.where)})`;
      case 'exists': return `(AuthExpr.existsOne ${q(x.binding)} ${t(x.collection)} ${e(x.where)})`;
      case 'rule_ref': return `(AuthExpr.ruleRef ${q(x.selector)} ${q(x.arguments[0].parameter)} ${t(x.arguments[0].value)})`;
      default: throw new Error(`unrenderable ${x.op}`);
    }
  };
  return `-- GENERATED by auth-v2-typed-subject.mjs from five pinned Rule/Operation\n-- contracts and seven pinned typed data nodes.\n-- Candidate AST data and executable projection; their proof is separate.\nnamespace AuthGeneratedSubject\ninductive AuthTerm where\n  | path (root : String) (properties : List String)\n  | string (value : String)\n  | bool (value : Bool)\nderiving Repr, DecidableEq\ninductive AuthExpr where\n  | eq (left right : AuthTerm)\n  | not (term : AuthExpr)\n  | all (terms : List AuthExpr)\n  | exactlyOne (binding : String) (collection : AuthTerm) (where_ : AuthExpr)\n  | existsOne (binding : String) (collection : AuthTerm) (where_ : AuthExpr)\n  | ruleRef (selector parameter : String) (value : AuthTerm)\nderiving Repr\n${Object.entries(subject.rules).map(([key, r]) => `def ${key} : AuthExpr :=\n  ${e(r.expression)}\n`).join('\n')}\ndef operationGuard : String := ${q(subject.operation.guard)}\ndef operationSuccess : String := ${q(subject.operation.success_result.variant)}\ndef operationFailure : String := ${q(subject.operation.failure_result.variant)}\ndef operationOntologyId : String := ${q(subject.operation.ontology_operation)}\ndef operationOutputSelector : String := ${q(subject.operation.output.selector)}\ndef operationFailureContinuation : String := ${q(subject.operation.failure_continuation)}\n${renderLeanExecutable(subject)}\nend AuthGeneratedSubject\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv[2] === '--write-lean') {
  const generated = renderLeanSubject(translateSubject(readSubjectNodes()));
  writeFileSync(resolve(here, 'AuthGeneratedSubject.lean'), generated);
}
