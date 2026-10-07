import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lexRust } from './auth-v2-rust-extract.mjs';

// Narrow, closed reader for the selected trusted wrapper. This is not a Rust
// semantics model. Production is pinned to the complete module and manifest;
// fixture mode is for hostile controls only.
const libPath = fileURLToPath(new URL('../../../implementation/trusted-boundary-v2/src/lib.rs', import.meta.url));
const cargoPath = fileURLToPath(new URL('../../../implementation/trusted-boundary-v2/Cargo.toml', import.meta.url));
const libSha = 'e068fd4dac134971b7f7e1e7e55cc455f721d75de2d3f17d327970d51c12e58d';
const cargoSha = '86b601c32d610f667fe5e52b306de5a0bbb97922dc86725e2ba243a188f86c93';
const sha = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(`AUTH_V2_WRAPPER_EXTRACT:${message}`); };
const values = tokens => tokens.map(token => token.value);
const same = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`closed-syntax:${label}`);
};
const matching = (xs, start, open = '{', close = '}') => {
  if (xs[start] !== open) fail(`expected:${open}`);
  let depth = 0;
  for (let i = start; i < xs.length; i++) {
    if (xs[i] === open) depth++;
    if (xs[i] === close && --depth === 0) return i;
  }
  fail(`unclosed:${open}`);
};
const path = xs => {
  const text = xs.join('');
  if (!/^(?:request|evidence|binding|command|permission|matching_authentication\[0\]|matching_bindings\[0\])(?:\.[a-z_]+)+$/.test(text)) fail(`path:${text}`);
  return text;
};
const stripClone = xs => xs.slice(-4).join('') === '.clone()' ? xs.slice(0, -4) : xs;
const fields = Object.freeze({
  'request.request_id':'String','request.authentication_evidence_ref':'String','request.route_id':'String',
  'evidence.evidence_ref':'String','evidence.session_id':'String','evidence.trusted':'Bool',
  'binding.route_id':'String','binding.scope_evidence_ref':'String','binding.complete':'Bool',
  'binding.required_permission':'Permission',
  'binding.required_permission.resource':'String','binding.required_permission.action':'String','binding.required_permission.scope':'String',
  'matching_authentication[0].evidence_ref':'String','matching_authentication[0].session_id':'String','matching_authentication[0].trusted':'Bool',
  'matching_bindings[0].route_id':'String','matching_bindings[0].scope_evidence_ref':'String','matching_bindings[0].complete':'Bool',
  'matching_bindings[0].required_permission':'Permission',
  'command.request_id':'String','command.session_id':'String','command.required_permission':'Permission','command.scope_evidence_ref':'String',
  'permission.resource':'String','permission.action':'String','permission.scope':'String',
});
const typedPath = (xs, expected, roots) => {
  const result=path(xs);
  if (fields[result]!==expected || !roots.some(root=>result.startsWith(`${root}.`))) fail(`typed-path:${result}:${expected}`);
  return result;
};

function functions(source) {
  const xs = values(lexRust(source));
  const out = {};
  const spans = [];
  const selected = new Set(['construct_candidate', 'to_kernel_authentication_evidence', 'to_kernel_route_binding', 'to_kernel_command', 'to_kernel_permission']);
  for (let i = 0; i < xs.length - 2; i++) {
    if (xs[i] !== 'fn' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(xs[i + 1])) continue;
    const name = xs[i + 1];
    if (!selected.has(name) && !(name === 'authorize' && xs[i - 1] === 'pub')) continue;
    if (out[name]) fail(`duplicate-function:${name}`);
    const bodyStart = xs.indexOf('{', i + 2);
    if (bodyStart < 0) fail(`missing-body:${name}`);
    const bodyEnd = matching(xs, bodyStart);
    out[name] = { signature: xs.slice(i - (xs[i - 1] === 'pub' ? 1 : 0), bodyStart), body: xs.slice(bodyStart + 1, bodyEnd) };
    spans.push([bodyStart + 1, bodyEnd]);
    i = bodyEnd;
  }
  same(Object.keys(out).sort(), ['authorize', ...selected].sort(), 'function-set');
  const skeleton = [...xs];
  for (const [start, end] of spans.reverse()) skeleton.splice(start, end - start, '<selected-body>');
  Object.defineProperty(out, 'skeleton', { value: skeleton });
  return out;
}

function fieldAssignments(xs, type, allowed) {
  same(xs.slice(0, type.length), type, 'constructor-type');
  if (xs[type.length] !== '{' || xs.at(-1) !== '}') fail('constructor-braces');
  const inner = xs.slice(type.length + 1, -1);
  const fields = {};
  let i = 0;
  while (i < inner.length) {
    const key = inner[i++];
    if (!allowed.includes(key) || fields[key] || inner[i++] !== ':') fail(`constructor-field:${key}`);
    const start = i;
    let braces = 0;
    while (i < inner.length) {
      if (inner[i] === '{') braces++;
      if (inner[i] === '}') braces--;
      if (inner[i] === ',' && braces === 0) break;
      i++;
    }
    fields[key] = inner.slice(start, i);
    if (i < inner.length) i++;
  }
  same(Object.keys(fields).sort(), [...allowed].sort(), 'constructor-fields');
  return fields;
}

function qualifier(xs, roots) {
  if (xs[0] === '!' && xs.slice(-4).join('') === '.is_empty()') return { kind: 'nonempty', path: typedPath(xs.slice(1, -4),'String',roots) };
  const eq = xs.indexOf('==');
  if (eq > 0) return { kind: 'eq', left: typedPath(xs.slice(0, eq),'String',roots), right: typedPath(xs.slice(eq + 1),'String',roots) };
  return { kind: 'truthy', path: typedPath(xs,'Bool',roots) };
}
function qualifiers(xs, binding) {
  same(xs.slice(0, 3), ['|', binding, '|'], 'filter-binding');
  if (xs[3] !== '{' || xs.at(-1) !== '}') fail('filter-block');
  const inner = xs.slice(4, -1);
  const pieces = [];
  let start = 0;
  for (let i = 0; i <= inner.length; i++) {
    if (i === inner.length || inner[i] === '&&') {
      if (i === start) fail('empty-qualifier');
      pieces.push(qualifier(inner.slice(start, i),[binding,'request']));
      start = i + 1;
    }
  }
  return pieces;
}

function candidate(body) {
  // The non-predicate list/filter/collect scaffolding is fixed. Only atom
  // values and constructor field RHSs are admitted as semantic slots.
  const startA = ['let','matching_authentication',':','Vec','<','_','>','=','authentication_evidence','.','iter','(',')','.','filter','('];
  same(body.slice(0, startA.length), startA, 'auth-filter-prefix');
  let i = startA.length;
  // The first ')' within is_empty is not the filter close; find balanced parens.
  const filterEnd = start => { let d=1; for(let j=start;j<body.length;j++){if(body[j]==='(')d++;if(body[j]===')'&&--d===0)return j;} fail('filter-close'); };
  const aEnd = filterEnd(i);
  const authQualifiers = qualifiers(body.slice(i, aEnd), 'evidence');
  i = aEnd + 1;
  same(body.slice(i, i + 5), ['.','collect','(',')',';'], 'auth-collect'); i += 5;
  const startB = ['let','matching_bindings',':','Vec','<','_','>','=','route_bindings','.','iter','(',')','.','filter','('];
  same(body.slice(i, i + startB.length), startB, 'route-filter-prefix'); i += startB.length;
  const bEnd = filterEnd(i);
  const routeQualifiers = qualifiers(body.slice(i, bEnd), 'binding'); i = bEnd + 1;
  same(body.slice(i, i + 5), ['.','collect','(',')',';'], 'route-collect'); i += 5;
  const condition=['if','matching_authentication','.','len','(',')','==','1','&&','matching_bindings','.','len','(',')','==','1'];
  same(body.slice(i, i + condition.length), condition, 'candidate-condition');
  // Parse the branch bodies by braces, then demand exact branch scaffolding.
  const thenOpen = body.indexOf('{', i + 1);
  same(body.slice(i + condition.length, thenOpen), [], 'candidate-between-condition-body');
  const thenClose = matching(body, thenOpen);
  const thenFields = fieldAssignments(body.slice(thenOpen + 1, thenClose), ['AuthorizationCommand'], ['request_id','session_id','required_permission','scope_evidence_ref']);
  same(body.slice(thenClose + 1, thenClose + 4), ['else','{','AuthorizationCommand'], 'candidate-else');
  const elseOpen = thenClose + 2;
  const elseClose = matching(body, elseOpen);
  const elseFields = fieldAssignments(body.slice(elseOpen + 1, elseClose), ['AuthorizationCommand'], ['request_id','session_id','required_permission','scope_evidence_ref']);
  same(body.slice(elseClose + 1), [], 'candidate-trailing');
  const success = Object.entries(thenFields).map(([field, expr]) => [field, typedPath(stripClone(expr),field==='required_permission'?'Permission':'String',['request','matching_authentication[0]','matching_bindings[0]'])]);
  const fallback = [];
  for (const [field, expr] of Object.entries(elseFields)) {
    if (field === 'required_permission') {
      const nested = fieldAssignments(expr, ['Permission'], ['resource','action','scope']);
      for (const [sub, value] of Object.entries(nested)) { same(value, ['String','::','new','(',')'], `fallback:${sub}`); fallback.push([`${field}.${sub}`, 'String::new()']); }
    } else { same(expr, ['String','::','new','(',')'], `fallback:${field}`); fallback.push([field, 'String::new()']); }
  }
  return { authQualifiers, routeQualifiers, candidateSuccessFields: success, candidateFallbackFields: fallback };
}

function mapper(body, type, fields) {
  if (body.at(-1)===';') fail(`mapper-return-statement:${type}`);
  const assignments = fieldAssignments(body, ['boundary_kernel','::',type], fields);
  const expected={evidence_ref:'String',session_id:'String',trusted:'Bool',route_id:'String',required_permission:'Permission',scope_evidence_ref:'String',complete:'Bool',request_id:'String',resource:'String',action:'String',scope:'String'};
  const root={AuthenticatedSessionEvidence:'evidence',RouteAuthorizationBinding:'binding',AuthorizationCommand:'command',Permission:'permission'}[type];
  return Object.entries(assignments).map(([field, expr]) => {
    if (expr.slice(0, 3).join('') === 'to_kernel_permission(&' && expr.at(-1) === ')' && field==='required_permission') return [field, `to_kernel_permission(&${typedPath(expr.slice(3, -1),'Permission',[root])})`];
    return [field, typedPath(stripClone(expr),expected[field],[root])];
  });
}

function statement(xs, start) {
  const end=xs.indexOf(';',start);
  if (end<0) fail('missing-statement-end');
  return [xs.slice(start,end+1),end+1];
}

function resolver(xs, name, receiver, call, requestField) {
  const prefix=['let',name,'=','self','.',receiver,'.',call,'(','&','request','.',requestField,')','.'];
  same(xs.slice(0,prefix.length),prefix,`resolver:${name}`);
  const suffix=xs.slice(prefix.length);
  if (JSON.stringify(suffix)===JSON.stringify(['unwrap_or_default','(',')',';'])) return true;
  if (JSON.stringify(suffix)===JSON.stringify(['unwrap','(',')',';'])) return false;
  fail(`resolver-tail:${name}`);
}

function mapList(xs, source, mapperName) {
  const start=[source,'.','into_iter','(',')'];
  same(xs.slice(0,start.length),start,`list-source:${source}`);
  let i=start.length;
  if (xs[i]==='.' && xs[i+1]==='take') {
    same(xs.slice(i,i+5),['.','take','(','1',')'],`list-take:${source}`);
    i+=5;
  }
  same(xs.slice(i),['.','map','(',mapperName,')','.','collect','(',')'],`list-map:${source}`);
  return xs.join('');
}

function contextFields(xs) {
  const raw=fieldAssignments(xs,['boundary_kernel','::','CommandBoundaryContext'],
    ['request','resolved_authentication_evidence','resolved_route_bindings','candidate_command']);
  const request=fieldAssignments(raw.request,['boundary_kernel','::','BoundaryRequest'],
    ['request_id','authentication_evidence_ref','route_id']);
  const wiring=[];
  for (const [field,expression] of Object.entries(request))
    wiring.push([`request.${field}`,typedPath(stripClone(expression),'String',['request'])]);
  wiring.push(['resolved_authentication_evidence',mapList(raw.resolved_authentication_evidence,'authentication_evidence','to_kernel_authentication_evidence')]);
  wiring.push(['resolved_route_bindings',mapList(raw.resolved_route_bindings,'route_bindings','to_kernel_route_binding')]);
  if (JSON.stringify(raw.candidate_command)!==JSON.stringify(['to_kernel_command','(','&','candidate',')']) &&
      JSON.stringify(raw.candidate_command)!==JSON.stringify(['to_kernel_command','(','&','candidate','.','clone','(',')',')'])) fail('candidate-context');
  wiring.push(['candidate_command',raw.candidate_command.join('')]);
  return wiring;
}

function directAction(expr, { allowDeny = true } = {}) {
  const call=['self','.','downstream','.','authorize','(','candidate',')'];
  const cloned=['self','.','downstream','.','authorize','(','candidate','.','clone','(',')',')'];
  if ([call,cloned].some(template=>JSON.stringify(expr)===JSON.stringify(template))) return 'callDownstream';
  if (allowDeny && JSON.stringify(expr)===JSON.stringify(['BinaryAuthorizationDecision','::','Deny'])) return 'returnDeny';
  fail(`action-expression:${expr.join('')}`);
}

function actionStatement(xs) {
  if (xs.at(-1)!==';') fail('action-statement');
  const expr=xs.slice(0,-1);
  const direct=expr.slice(0,3).join('')==='let_=' ? expr.slice(3) : expr;
  return directAction(direct,{allowDeny:false});
}

function branchActions(expr) {
  if (expr[0]!=='{') return [directAction(expr)];
  const close=matching(expr,0);
  if (close!==expr.length-1) fail('arm-block-trailing');
  const inside=expr.slice(1,-1);
  const actions=[];
  let i=0;
  while (inside.indexOf(';',i)>=0) {
    const [xs,next]=statement(inside,i);
    actions.push(actionStatement(xs));
    i=next;
  }
  actions.push(directAction(inside.slice(i)));
  return actions;
}

function authorizePrelude(xs) {
  let i=0;
  const [authStmt,afterAuth]=statement(xs,i); i=afterAuth;
  const authResolverDefault=resolver(authStmt,'authentication_evidence','authentication_evidence',
    'resolve_authentication_evidence','authentication_evidence_ref');
  const [routeStmt,afterRoute]=statement(xs,i); i=afterRoute;
  const routeResolverDefault=resolver(routeStmt,'route_bindings','route_bindings',
    'resolve_route_authorization_bindings','route_id');
  const [candidateStmt,afterCandidate]=statement(xs,i); i=afterCandidate;
  same(candidateStmt,['let','candidate','=','construct_candidate','(','&','request',',','&','authentication_evidence',',','&','route_bindings',')',';'], 'construct-candidate-call');
  const prefixActions=[];
  while(i<xs.length && JSON.stringify(xs.slice(i,i+4))!==JSON.stringify(['let','context','=','boundary_kernel'])) {
    const [callStmt,next]=statement(xs,i);
    prefixActions.push(actionStatement(callStmt));
    i=next;
  }
  same(xs.slice(i,i+4),['let','context','=','boundary_kernel'],'context-let');
  const contextOpen=xs.indexOf('{',i+4);
  if (contextOpen<0) fail('context-open');
  const contextClose=matching(xs,contextOpen);
  same(xs.slice(contextClose+1,contextClose+2),[';'],'context-semicolon');
  const contextWiring=contextFields(xs.slice(i+3,contextClose+1));
  i=contextClose+2;
  while(i<xs.length) {
    const [callStmt,next]=statement(xs,i);
    prefixActions.push(actionStatement(callStmt));
    i=next;
  }
  return { authResolverDefault,routeResolverDefault,contextWiring,prefixActions };
}

function authorize(body) {
  const marker = ['match','boundary_kernel','::','admit_authorization_command','(','&','context',')','{'];
  let at = -1;
  for (let i=0;i<=body.length-marker.length;i++) if (JSON.stringify(body.slice(i,i+marker.length))===JSON.stringify(marker)) { at=i; break; }
  if (at < 0) fail('kernel-match');
  const prelude=authorizePrelude(body.slice(0,at));
  const close = matching(body, at+marker.length-1);
  same(body.slice(close+1), [], 'authorize-trailing');
  const arms = body.slice(at+marker.length, close);
  const parseArm = (xs, variant) => {
    const prefix=['boundary_kernel','::','CommandBoundaryDecision','::',variant,'=','>'];
    same(xs.slice(0,prefix.length),prefix,`arm:${variant}`);
    return branchActions(xs.slice(prefix.length));
  };
  let comma = arms.indexOf(',');
  if (comma < 0 || arms.at(-1) !== ',') fail('match-arms');
  const ready=parseArm(arms.slice(0,comma),'Ready');
  const deny=parseArm(arms.slice(comma+1,-1),'Deny');
  return { branches: { ready, deny }, ...prelude };
}

export function extractWrapperFixture(source, cargo) {
  assert.equal(typeof source,'string'); assert.equal(typeof cargo,'string');
  // The fixture may vary only inside the selected bodies. The full Cargo
  // manifest is fixed, so dependency redirection never yields an IR subject.
  if (sha(cargo)!==cargoSha) fail('cargo-pin');
  const baseline = functions(readFileSync(libPath,'utf8'));
  const parsed = functions(source);
  same(parsed.skeleton, baseline.skeleton, 'whole-module-outside-selected-bodies');
  for (const name of Object.keys(baseline)) same(parsed[name].signature,baseline[name].signature,`signature:${name}`);
  const constructed=candidate(parsed.construct_candidate.body);
  const authorized=authorize(parsed.authorize.body);
  return {
    schema_version:'auth-foundation.trusted-wrapper-ir/v1-candidate',
    source_sha256:sha(source), cargo_sha256:sha(cargo),
    ...authorized, ...constructed,
    authMapperFields:mapper(parsed.to_kernel_authentication_evidence.body,'AuthenticatedSessionEvidence',['evidence_ref','session_id','trusted']),
    routeMapperFields:mapper(parsed.to_kernel_route_binding.body,'RouteAuthorizationBinding',['route_id','required_permission','scope_evidence_ref','complete']),
    commandMapperFields:mapper(parsed.to_kernel_command.body,'AuthorizationCommand',['request_id','session_id','required_permission','scope_evidence_ref']),
    permissionMapperFields:mapper(parsed.to_kernel_permission.body,'Permission',['resource','action','scope']),
  };
}

export function extractCurrentWrapper() {
  const source=readFileSync(libPath,'utf8'), cargo=readFileSync(cargoPath,'utf8');
  if (sha(source)!==libSha || sha(cargo)!==cargoSha) fail('production-pin');
  return extractWrapperFixture(source,cargo);
}
