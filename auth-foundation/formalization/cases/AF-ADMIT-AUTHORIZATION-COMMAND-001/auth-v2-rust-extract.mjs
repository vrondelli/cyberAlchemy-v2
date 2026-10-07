import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Closed executable-fragment reader for the selected generated Rust. It reads
// Rust bytes, not DomainSpec contracts, generated comments, or the Lean AST.
// This is an extraction boundary, not a verified Rust parser or semantics.
const selected = Object.freeze({
  candidate_command_provenance: 'Bool',
  unique_complete_route_binding: 'Bool',
  unique_trusted_authentication_evidence: 'Bool',
  command_boundary_admissible: 'Bool',
  admit_authorization_command: 'CommandBoundaryDecision',
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
const runtimeFile = fileURLToPath(new URL('../../../implementation/command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs', import.meta.url));
// The selected full module is pinned, including all declarations/attributes
// outside the five parsed bodies. Fixture mode is only for hostile tests and
// never qualifies as a source-bound proof input.
const selectedRustSha256 = '7c19fdb91f4098d7f12cc0c05804dd50c852c69902125af0c3b2d55ba5e497f0';
const fail = (message, token) => { throw new Error(`AUTH_V2_RUST_EXTRACT:${message}${token ? `@${token.start}` : ''}`); };
const node = (op, type, fields) => ({ op, type, ...fields });

export function lexRust(source) {
  assert.equal(typeof source, 'string');
  const out = [];
  let at = 0;
  while (at < source.length) {
    if (/\s/.test(source[at])) { at += 1; continue; }
    if (source.startsWith('//', at)) {
      const end = source.indexOf('\n', at + 2);
      at = end < 0 ? source.length : end + 1;
      continue;
    }
    if (source.startsWith('/*', at)) {
      const end = source.indexOf('*/', at + 2);
      if (end < 0) fail('unterminated-comment', { start: at });
      at = end + 2;
      continue;
    }
    if (source[at] === '"') {
      const start = at++;
      let closed = false;
      while (at < source.length) {
        if (source[at] === '\\') { at += 2; continue; }
        if (source[at++] === '"') { closed = true; break; }
      }
      if (!closed) fail('unterminated-string', { start });
      out.push({ value: source.slice(start, at), start, end: at });
      continue;
    }
    const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(at));
    if (word) {
      out.push({ value: word[0], start: at, end: at + word[0].length });
      at += word[0].length;
      continue;
    }
    const number = /^[0-9]+/.exec(source.slice(at));
    if (number) {
      out.push({ value: number[0], start: at, end: at + number[0].length });
      at += number[0].length;
      continue;
    }
    const paired = ['&&', '||', '==', '!=', '->', '::'].find(x => source.startsWith(x, at));
    if (paired) {
      out.push({ value: paired, start: at, end: at + paired.length });
      at += paired.length;
      continue;
    }
    if ('{}()[].,:;!&|#=<>+-*/'.includes(source[at])) {
      out.push({ value: source[at], start: at, end: at + 1 });
      at += 1;
      continue;
    }
    fail(`unknown-token:${source[at]}`, { start: at });
  }
  return out;
}

class Reader {
  constructor(tokens, start = 0) { this.tokens = tokens; this.i = start; }
  peek(offset = 0) { return this.tokens[this.i + offset]?.value; }
  token() { return this.tokens[this.i]; }
  take(value) {
    const token = this.tokens[this.i];
    if (!token || (value !== undefined && token.value !== value)) fail(`expected:${value ?? 'token'}:got:${token?.value ?? 'EOF'}`, token);
    this.i += 1;
    return token;
  }
  maybe(value) { if (this.peek() === value) { this.i += 1; return true; } return false; }
  name() {
    const t = this.take();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(t.value)) fail(`expected-identifier:${t.value}`, t);
    return t.value;
  }
  scope(parent = null) { return { roots: new Map(parent?.roots ?? [['context', 'CommandBoundaryContext']]), locals: new Map(), parent }; }
  local(scope, name) { for (let s = scope; s; s = s.parent) if (s.locals.has(name)) return s.locals.get(name); return null; }
  rootType(scope, name) { for (let s = scope; s; s = s.parent) if (s.roots.has(name)) return s.roots.get(name); return null; }
  ensure(node_, type) { if (node_.type !== type) fail(`type:${node_.type}:expected:${type}`, this.token()); return node_; }

  block(parent) {
    this.take('{');
    const scope = this.scope(parent);
    while (this.peek() === 'let') {
      this.take('let');
      const name = this.name();
      if (this.local(scope, name) || this.rootType(scope, name)) fail(`shadowed-local:${name}`, this.token());
      this.take('=');
      const value = this.expression(scope);
      this.take(';');
      scope.locals.set(name, { value, uses: 0 });
    }
    const value = this.expression(scope);
    this.take('}');
    for (const [name, local] of scope.locals) if (local.uses !== 1) fail(`local-use:${name}:${local.uses}`, this.token());
    return value;
  }
  expression(scope) {
    if (this.peek() === 'if') return this.branch(scope);
    let left = this.equality(scope);
    while (this.maybe('&&')) {
      this.ensure(left, 'Bool');
      const right = this.ensure(this.equality(scope), 'Bool');
      left = node('and', 'Bool', { left, right });
    }
    return left;
  }
  equality(scope) {
    let left = this.unary(scope);
    if (this.maybe('==')) {
      const right = this.unary(scope);
      if (left.type !== right.type || !['String', 'Bool', 'Usize'].includes(left.type)) fail('incompatible-equality', this.token());
      if (left.type === 'Usize') {
        if (left.op !== 'countFilter' || right.op !== 'usize' || right.value !== 1) fail('unsupported-count-equality', this.token());
        return node('exactlyOne', 'Bool', { collection: left.collection, binding: left.binding, where: left.where });
      }
      left = node('eq', 'Bool', { left, right });
    }
    return left;
  }
  unary(scope) {
    if (this.maybe('!')) return node('not', 'Bool', { term: this.ensure(this.unary(scope), 'Bool') });
    return this.primary(scope);
  }
  primary(scope) {
    if (this.maybe('(')) {
      const inner = this.expression(scope);
      this.take(')');
      return inner;
    }
    if (this.peek() === '{') return this.block(scope);
    if (this.peek() === '""') { this.take('""'); return node('string', 'String', { value: '' }); }
    if (this.peek()?.startsWith('"')) fail('unsupported-string-literal', this.token());
    if (this.peek() === 'true' || this.peek() === 'false') return node('bool', 'Bool', { value: this.take().value === 'true' });
    if (this.peek() === '1') { this.take('1'); return node('usize', 'Usize', { value: 1 }); }
    const name = this.name();
    if (name === 'CommandBoundaryDecision') {
      this.take('::');
      const variant = this.name();
      if (!['Ready', 'Deny'].includes(variant)) fail(`unknown-decision:${variant}`, this.token());
      return node('variant', 'CommandBoundaryDecision', { variant });
    }
    if (this.peek() === '(') {
      if (!Object.hasOwn(selected, name) || name === 'admit_authorization_command') fail(`unknown-call:${name}`, this.token());
      this.take('(');
      const argument = this.ensure(this.expression(scope), 'CommandBoundaryContext');
      this.take(')');
      return node('ruleRef', 'Bool', { name, argument });
    }
    const local = this.local(scope, name);
    let value;
    if (local) { local.uses += 1; value = structuredClone(local.value); }
    else {
      const type = this.rootType(scope, name);
      if (!type) fail(`unknown-root:${name}`, this.token());
      value = node('path', type, { root: name, fields: [] });
    }
    while (this.maybe('.')) {
      const member = this.name();
      if (member === 'iter') {
        if (!value.type.startsWith('List<')) fail('iter-on-non-list', this.token());
        this.take('('); this.take(')'); this.take('.');
        const method = this.name();
        if (!['filter', 'any'].includes(method)) fail(`unknown-iterator-method:${method}`, this.token());
        this.take('('); this.take('|');
        const binding = this.name();
        if (this.rootType(scope, binding) || this.local(scope, binding)) fail(`shadowed-binding:${binding}`, this.token());
        this.take('|');
        const child = this.scope(scope);
        child.roots.set(binding, value.type.slice(5, -1));
        const predicate = this.ensure(this.block(child), 'Bool');
        this.take(')');
        if (method === 'any') value = node('exists', 'Bool', { collection: value, binding, where: predicate });
        else {
          this.take('.'); this.take('count'); this.take('('); this.take(')');
          value = node('countFilter', 'Usize', { collection: value, binding, where: predicate });
        }
        continue;
      }
      if (value.op !== 'path') fail(`field-on-expression:${member}`, this.token());
      const fieldType = records[value.type]?.[member];
      if (!fieldType) fail(`unknown-field:${value.type}.${member}`, this.token());
      value = node('path', fieldType, { root: value.root, fields: [...value.fields, member] });
    }
    return value;
  }
  branch(scope) {
    this.take('if');
    const guard = this.ensure(this.expression(scope), 'Bool');
    const success = this.ensure(this.block(scope), 'CommandBoundaryDecision');
    this.take('else');
    const failure = this.ensure(this.block(scope), 'CommandBoundaryDecision');
    return node('if', 'CommandBoundaryDecision', { guard, success, failure });
  }
}

function extractDataDeclarations(tokens) {
  const observed = {};
  let decision = null;
  for (let i = 0; i < tokens.length; i += 1) {
    if (!['struct', 'enum'].includes(tokens[i].value)) continue;
    if (tokens[i - 1]?.value !== 'pub') fail('nonpublic-data-declaration', tokens[i]);
    const reader = new Reader(tokens, i - 1);
    reader.take('pub');
    const kind = reader.take().value;
    const name = reader.name();
    reader.take('{');
    if (kind === 'struct') {
      if (!Object.hasOwn(records, name) || observed[name]) fail(`unexpected-record:${name}`, tokens[i]);
      const fields = {};
      while (reader.peek() !== '}') {
        reader.take('pub');
        const field = reader.name();
        if (Object.hasOwn(fields, field)) fail(`duplicate-field:${name}.${field}`, reader.token());
        reader.take(':');
        let type = reader.name();
        if (type === 'Vec') {
          reader.take('<'); type = `List<${reader.name()}>`; reader.take('>');
        } else if (type === 'bool') type = 'Bool';
        fields[field] = type;
        reader.take(',');
      }
      reader.take('}');
      if (JSON.stringify(Object.entries(fields).sort()) !== JSON.stringify(Object.entries(records[name]).sort()))
        fail(`record-shape:${name}`, tokens[i]);
      observed[name] = fields;
    } else {
      if (name !== 'CommandBoundaryDecision' || decision) fail(`unexpected-enum:${name}`, tokens[i]);
      const variants = [];
      while (reader.peek() !== '}') { variants.push(reader.name()); reader.take(','); }
      reader.take('}');
      if (JSON.stringify(variants) !== JSON.stringify(['Ready', 'Deny'])) fail('decision-shape', tokens[i]);
      decision = variants;
    }
    i = reader.i - 1;
  }
  if (Object.keys(observed).length !== Object.keys(records).length || !decision)
    fail('missing-data-declaration');
  return { records: observed, decision };
}

function validateRuleCallGraph(functions) {
  const names = Object.keys(selected).filter(name => name !== 'admit_authorization_command');
  const edges = new Map(names.map(name => [name, new Set()]));
  const walk = (expression, owner) => {
    if (!expression || typeof expression !== 'object') return;
    if (expression.op === 'ruleRef') {
      if (!edges.has(expression.name)) fail(`call-outside-rule-closure:${expression.name}`);
      edges.get(owner).add(expression.name);
    }
    for (const child of Object.values(expression)) {
      if (Array.isArray(child)) child.forEach(value => walk(value, owner));
      else if (child && typeof child === 'object') walk(child, owner);
    }
  };
  for (const name of names) walk(functions[name].expression, name);
  const visiting = new Set();
  const visited = new Set();
  const visit = (name, stack) => {
    if (visiting.has(name)) fail(`rule-cycle:${[...stack, name].join('>')}`);
    if (visited.has(name)) return;
    visiting.add(name);
    for (const child of edges.get(name)) visit(child, [...stack, name]);
    visiting.delete(name);
    visited.add(name);
  };
  for (const name of names) visit(name, []);
}

export function extractGeneratedRust(source, { fixture = false } = {}) {
  const rustSha256 = createHash('sha256').update(source).digest('hex');
  if (!fixture && rustSha256 !== selectedRustSha256) fail('selected-rust-bytes-drift');
  const tokens = lexRust(source);
  const data_types = extractDataDeclarations(tokens);
  const functions = {};
  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i].value !== 'fn') continue;
    if (tokens[i - 1]?.value !== 'pub') fail('nonpublic-function', tokens[i]);
    const reader = new Reader(tokens, i - 1);
    reader.take('pub'); reader.take('fn');
    const name = reader.name();
    if (!Object.hasOwn(selected, name) || functions[name]) fail(`unexpected-function:${name}`, tokens[i]);
    reader.take('('); reader.take('context'); reader.take(':'); reader.take('&');
    reader.take('CommandBoundaryContext'); reader.take(')'); reader.take('->');
    reader.take(selected[name] === 'Bool' ? 'bool' : 'CommandBoundaryDecision');
    const start = reader.token()?.start;
    const expression = reader.ensure(reader.block(null), selected[name]);
    const end = tokens[reader.i - 1]?.end;
    functions[name] = { source_span: { start, end }, expression };
    i = reader.i - 1;
  }
  if (Object.keys(functions).length !== Object.keys(selected).length ||
      Object.keys(selected).some(name => !functions[name])) fail('missing-selected-function');
  validateRuleCallGraph(functions);
  // Other executable top-level forms are outside this closed generated module.
  for (const t of tokens) if (['unsafe', 'extern', 'impl', 'static', 'macro_rules'].includes(t.value)) fail(`unsupported-top-level:${t.value}`, t);
  return {
    schema_version: 'auth-foundation.generated-rust-fragment-ir/v1-candidate',
    rust_sha256: rustSha256,
    data_types,
    functions,
  };
}

export function extractCurrentGeneratedRust() {
  return extractGeneratedRust(readFileSync(runtimeFile, 'utf8'));
}

if (process.argv[1] && fileURLToPath(new URL(`file://${process.argv[1]}`)) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(extractCurrentGeneratedRust())}\n`);
}
