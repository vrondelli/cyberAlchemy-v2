import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extractCurrentGeneratedRust } from './auth-v2-rust-extract.mjs';

// A source-bound data renderer, not a Rust evaluator. The Rust executable
// fragment is independently extracted by auth-v2-rust-extract.mjs.
const here = fileURLToPath(new URL('./', import.meta.url));
const selected = Object.freeze({
  candidate_command_provenance: ['candidateCommandProvenance', 'Bool'],
  unique_complete_route_binding: ['uniqueCompleteRouteBinding', 'Bool'],
  unique_trusted_authentication_evidence: ['uniqueTrustedAuthenticationEvidence', 'Bool'],
  command_boundary_admissible: ['commandBoundaryAdmissible', 'Bool'],
  admit_authorization_command: ['admitAuthorizationCommand', 'CommandBoundaryDecision'],
});
const records = Object.freeze({
  CommandBoundaryContext: Object.freeze({
    request: 'BoundaryRequest',
    resolved_authentication_evidence: 'List<AuthenticatedSessionEvidence>',
    resolved_route_bindings: 'List<RouteAuthorizationBinding>',
    candidate_command: 'AuthorizationCommand',
  }),
  BoundaryRequest: Object.freeze({ request_id: 'String', authentication_evidence_ref: 'String', route_id: 'String' }),
  AuthorizationCommand: Object.freeze({
    request_id: 'String', session_id: 'String', required_permission: 'Permission', scope_evidence_ref: 'String',
  }),
  AuthenticatedSessionEvidence: Object.freeze({ evidence_ref: 'String', session_id: 'String', trusted: 'Bool' }),
  RouteAuthorizationBinding: Object.freeze({
    route_id: 'String', required_permission: 'Permission', scope_evidence_ref: 'String', complete: 'Bool',
  }),
  Permission: Object.freeze({ resource: 'String', action: 'String', scope: 'String' }),
});
const fail = message => { throw new Error(`AUTH_V2_RUST_LEAN:${message}`); };
const own = (object, keys, label) => {
  if (!object || typeof object !== 'object' || Array.isArray(object) ||
      JSON.stringify(Object.keys(object).sort()) !== JSON.stringify([...keys].sort())) fail(`shape:${label}`);
};
const q = value => JSON.stringify(value);
const list = values => `[${values.join(', ')}]`;
const typeOfPath = (root, fields, scope) => {
  let type = scope[root];
  if (!type) fail(`unknown-root:${root}`);
  if (!Array.isArray(fields) || fields.some(value => typeof value !== 'string')) fail('path-fields');
  for (const field of fields) {
    type = records[type]?.[field];
    if (!type) fail(`unknown-field:${root}.${fields.join('.')}`);
  }
  return type;
};

function renderExpr(expression, scope) {
  if (!expression || typeof expression !== 'object' || Array.isArray(expression)) fail('expression');
  const checkType = expected => { if (expression.type !== expected) fail(`type:${expression.op}:${expression.type}:expected:${expected}`); };
  switch (expression.op) {
    case 'path': {
      own(expression, ['op', 'type', 'root', 'fields'], 'path');
      const type = typeOfPath(expression.root, expression.fields, scope);
      checkType(type);
      return { type, lean: `(Expr.path ${q(expression.root)} ${list(expression.fields.map(q))})` };
    }
    case 'string':
      own(expression, ['op', 'type', 'value'], 'string'); checkType('String');
      if (expression.value !== '') fail('unsupported-string-literal');
      return { type: 'String', lean: `(Expr.string ${q(expression.value)})` };
    case 'bool':
      own(expression, ['op', 'type', 'value'], 'bool'); checkType('Bool');
      if (typeof expression.value !== 'boolean') fail('bool-literal');
      return { type: 'Bool', lean: `(Expr.bool ${expression.value})` };
    case 'eq': {
      own(expression, ['op', 'type', 'left', 'right'], 'eq'); checkType('Bool');
      const left = renderExpr(expression.left, scope), right = renderExpr(expression.right, scope);
      if (left.type !== right.type || !['String', 'Bool'].includes(left.type)) fail('incompatible-equality');
      return { type: 'Bool', lean: `(Expr.eq ${left.lean} ${right.lean})` };
    }
    case 'not': {
      own(expression, ['op', 'type', 'term'], 'not'); checkType('Bool');
      const term = renderExpr(expression.term, scope);
      if (term.type !== 'Bool') fail('not-nonbool');
      return { type: 'Bool', lean: `(Expr.not ${term.lean})` };
    }
    case 'and': {
      own(expression, ['op', 'type', 'left', 'right'], 'and'); checkType('Bool');
      const left = renderExpr(expression.left, scope), right = renderExpr(expression.right, scope);
      if (left.type !== 'Bool' || right.type !== 'Bool') fail('and-nonbool');
      return { type: 'Bool', lean: `(Expr.and ${left.lean} ${right.lean})` };
    }
    case 'exactlyOne':
    case 'exists': {
      own(expression, ['op', 'type', 'collection', 'binding', 'where'], expression.op); checkType('Bool');
      const collection = renderExpr(expression.collection, scope);
      if (!/^List<(AuthenticatedSessionEvidence|RouteAuthorizationBinding)>$/.test(collection.type)) fail('nonlist-quantifier');
      if (typeof expression.binding !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(expression.binding) ||
          Object.hasOwn(scope, expression.binding)) fail('invalid-binding');
      const element = collection.type.slice(5, -1);
      const where = renderExpr(expression.where, { ...scope, [expression.binding]: element });
      if (where.type !== 'Bool') fail('nonbool-where');
      return { type: 'Bool', lean: `(Expr.${expression.op} ${q(expression.binding)} ${collection.lean} ${where.lean})` };
    }
    case 'ruleRef': {
      own(expression, ['op', 'type', 'name', 'argument'], 'ruleRef'); checkType('Bool');
      if (!Object.hasOwn(selected, expression.name) || expression.name === 'admit_authorization_command') fail('unknown-rule-call');
      const argument = renderExpr(expression.argument, scope);
      if (argument.type !== 'CommandBoundaryContext') fail('rule-argument');
      return { type: 'Bool', lean: `(Expr.ruleRef ${q(expression.name)} ${argument.lean})` };
    }
    case 'variant':
      own(expression, ['op', 'type', 'variant'], 'variant'); checkType('CommandBoundaryDecision');
      if (!['Ready', 'Deny'].includes(expression.variant)) fail('variant');
      return { type: 'CommandBoundaryDecision', lean: `(Expr.variant ${q(expression.variant)})` };
    case 'if': {
      own(expression, ['op', 'type', 'guard', 'success', 'failure'], 'if'); checkType('CommandBoundaryDecision');
      const guard = renderExpr(expression.guard, scope);
      const success = renderExpr(expression.success, scope);
      const failure = renderExpr(expression.failure, scope);
      if (guard.type !== 'Bool' || success.type !== 'CommandBoundaryDecision' || failure.type !== 'CommandBoundaryDecision') fail('branch-type');
      return { type: 'CommandBoundaryDecision', lean: `(Expr.branch ${guard.lean} ${success.lean} ${failure.lean})` };
    }
    default: fail(`unknown-op:${expression.op}`);
  }
}

export function renderRustLeanSubject(ir, { fixture = false } = {}) {
  if (!fixture) assert.deepStrictEqual(ir, extractCurrentGeneratedRust(), 'production IR must be the current pinned Rust extraction');
  own(ir, ['schema_version', 'rust_sha256', 'data_types', 'functions'], 'subject');
  if (ir.schema_version !== 'auth-foundation.generated-rust-fragment-ir/v1-candidate' ||
      !/^[0-9a-f]{64}$/.test(ir.rust_sha256)) fail('subject-identity');
  own(ir.data_types, ['records', 'decision'], 'data-types');
  try {
    assert.deepStrictEqual(ir.data_types.records, records);
    assert.deepStrictEqual(ir.data_types.decision, ['Ready', 'Deny']);
  } catch { fail('data-types'); }
  own(ir.functions, Object.keys(selected), 'functions');
  const definitions = [];
  for (const [name, [leanName, expectedType]] of Object.entries(selected)) {
    const row = ir.functions[name];
    own(row, ['source_span', 'expression'], `function:${name}`);
    own(row.source_span, ['start', 'end'], `source-span:${name}`);
    if (!Number.isSafeInteger(row.source_span.start) || !Number.isSafeInteger(row.source_span.end) ||
        row.source_span.start < 0 || row.source_span.end <= row.source_span.start) fail(`source-span:${name}`);
    const body = renderExpr(row.expression, { context: 'CommandBoundaryContext' });
    if (body.type !== expectedType) fail(`function-result:${name}`);
    definitions.push(`def ${leanName} : Expr :=\n  ${body.lean}`);
  }
  return `-- GENERATED from production-mode extraction of exact selected Rust bytes.
-- Rust fragment syntax is data; this module does not define its semantics.
namespace AuthGeneratedRustIR
inductive Expr where
  | path (root : String) (fields : List String)
  | string (value : String)
  | bool (value : Bool)
  | eq (left right : Expr)
  | not (term : Expr)
  | and (left right : Expr)
  | exactlyOne (binding : String) (collection where_ : Expr)
  | exists (binding : String) (collection where_ : Expr)
  | ruleRef (name : String) (argument : Expr)
  | variant (name : String)
  | branch (guard success failure : Expr)
deriving Repr
def selectedRustSha256 : String := ${q(ir.rust_sha256)}
${definitions.join('\n\n')}
end AuthGeneratedRustIR
`;
}

export function renderCurrentRustLeanSubject() {
  return renderRustLeanSubject(extractCurrentGeneratedRust());
}

if (process.argv[1] && fileURLToPath(new URL(`file://${process.argv[1]}`)) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] !== '--write-lean') fail('usage: --write-lean');
  writeFileSync(new URL('./AuthGeneratedRustIR.lean', import.meta.url), renderCurrentRustLeanSubject());
}
