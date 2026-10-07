import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { extractCurrentWrapper, extractWrapperFixture } from './auth-v2-wrapper-extract.mjs';
import { renderWrapperLean } from './auth-v2-wrapper-lean.mjs';

const libPath=fileURLToPath(new URL('../../../implementation/trusted-boundary-v2/src/lib.rs',import.meta.url));
const cargoPath=fileURLToPath(new URL('../../../implementation/trusted-boundary-v2/Cargo.toml',import.meta.url));
const leanPath=fileURLToPath(new URL('./AuthGeneratedWrapperIR.lean',import.meta.url));
const source=readFileSync(libPath,'utf8'), cargo=readFileSync(cargoPath,'utf8');
const replace=(oldValue,newValue) => {
  assert.equal(source.split(oldValue).length,2,`unique source target: ${oldValue}`);
  return source.replace(oldValue,newValue);
};
const extract = changed => extractWrapperFixture(changed,cargo);

test('production extraction and emitted Lean replay exact current bytes',() => {
  const ir=extractCurrentWrapper();
  assert.deepEqual(ir,extract(source));
  assert.equal(readFileSync(leanPath,'utf8'),renderWrapperLean(ir));
  assert.deepEqual(ir.branches,{ready:['callDownstream'],deny:['returnDeny']});
  assert.deepEqual(ir.prefixActions,[]);
  assert.equal(ir.authResolverDefault,true);
  assert.equal(ir.routeResolverDefault,true);
  assert.equal(ir.authQualifiers.length,4);
  assert.equal(ir.routeQualifiers.length,7);
});

test('Ready arm semantic mutation changes extracted branch, not just a fixture string',() => {
  const changed=replace('CommandBoundaryDecision::Ready => self.downstream.authorize(candidate)',
    'CommandBoundaryDecision::Ready => BinaryAuthorizationDecision::Deny');
  assert.deepEqual(extract(changed).branches.ready,['returnDeny']);
  assert.notEqual(renderWrapperLean(extract(changed),{fixture:true}),readFileSync(leanPath,'utf8'));
});

test('type-correct eager downstream call is extracted before the kernel match',() => {
  const changed=replace('        match boundary_kernel::admit_authorization_command(&context) {',
    '        let _ = self.downstream.authorize(candidate.clone());\n        match boundary_kernel::admit_authorization_command(&context) {');
  assert.deepEqual(extract(changed).prefixActions,['callDownstream']);
  const beforeContext=replace('        let context = boundary_kernel::CommandBoundaryContext {',
    '        let _ = self.downstream.authorize(candidate.clone());\n        let context = boundary_kernel::CommandBoundaryContext {');
  assert.deepEqual(extract(beforeContext).prefixActions,['callDownstream']);
});

test('type-correct duplicate downstream calls in Ready branch are both extracted',() => {
  const changed=replace('CommandBoundaryDecision::Ready => self.downstream.authorize(candidate)',
    'CommandBoundaryDecision::Ready => { self.downstream.authorize(candidate.clone()); self.downstream.authorize(candidate) }');
  assert.deepEqual(extract(changed).branches.ready,['callDownstream','callDownstream']);
});

test('context field-copy and list-map mutations change source-derived wiring',() => {
  const changed=replace('request_id: request.request_id,\n                authentication_evidence_ref:',
    'request_id: request.route_id.clone(),\n                authentication_evidence_ref:');
  assert.deepEqual(extract(changed).contextWiring[0],['request.request_id','request.route_id']);
  const changedList=replace('authentication_evidence\n                .into_iter()\n                .map(to_kernel_authentication_evidence)',
    'authentication_evidence\n                .into_iter()\n                .take(1)\n                .map(to_kernel_authentication_evidence)');
  assert.match(extract(changedList).contextWiring[3][1],/take\(1\)/);
});

test('resolver error handling is parsed, not assumed',() => {
  const changed=replace('.resolve_authentication_evidence(&request.authentication_evidence_ref)\n            .unwrap_or_default()',
    '.resolve_authentication_evidence(&request.authentication_evidence_ref)\n            .unwrap()');
  assert.equal(extract(changed).authResolverDefault,false);
});

test('source-only candidate field-copy mutation changes extracted mapping',() => {
  const changed=replace('session_id: matching_authentication[0].session_id.clone()',
    'session_id: request.request_id.clone()');
  assert.deepEqual(extract(changed).candidateSuccessFields.find(([field])=>field==='session_id'),['session_id','request.request_id']);
});

test('source-only mapper field-copy mutation changes extracted mapping',() => {
  const changed=replace('session_id: evidence.session_id,','session_id: evidence.evidence_ref,');
  assert.deepEqual(extract(changed).authMapperFields.find(([field])=>field==='session_id'),['session_id','evidence.evidence_ref']);
});

test('source-only qualifier mutation changes extracted atom',() => {
  const changed=replace('&& !evidence.session_id.is_empty()', '&& !evidence.evidence_ref.is_empty()');
  assert.deepEqual(extract(changed).authQualifiers.at(-1),{kind:'nonempty',path:'evidence.evidence_ref'});
});

test('unknown arm calls and extra executable statements fail closed',() => {
  assert.throws(()=>extract(replace('self.downstream.authorize(candidate)', 'self.downstream.authorize(other)')),/action-expression/);
  assert.throws(()=>extract(replace('BinaryAuthorizationDecision::Deny,','{ self.downstream.authorize(other); BinaryAuthorizationDecision::Deny },')),/action-expression/);
});

test('unknown filter syntax, bad types, and candidate condition fail closed',() => {
  assert.throws(()=>extract(replace('&& evidence.trusted','|| evidence.trusted')),/typed-path|path/);
  assert.throws(()=>extract(replace('&& evidence.trusted','&& evidence.session_id')),/typed-path/);
  assert.throws(()=>extract(replace('matching_bindings.len() == 1','matching_bindings.len() == 2')),/candidate-condition/);
});

test('mapper return changed to a statement fails closed',() => {
  assert.throws(()=>extract(replace('scope: permission.scope.clone(),\n    }',
    'scope: permission.scope.clone(),\n    };')), /mapper-return-statement/);
});

test('unselected executable mutation and Cargo dependency mutation fail closed',() => {
  assert.throws(()=>extract(`${source}\ninclude!("evil.rs");\n`),/whole-module-outside-selected-bodies/);
  assert.throws(()=>extractWrapperFixture(source,cargo.replace('../command-boundary-runtime-v2','../untrusted-kernel')),/cargo-pin/);
});

test('comments and strings are lexed, not parsed as executable arms',() => {
  const changed=replace('//! Fail-closed trusted boundary', '//! self.downstream.authorize(candidate) Fail-closed trusted boundary');
  assert.deepEqual(extract(changed).branches,{ready:['callDownstream'],deny:['returnDeny']});
  assert.throws(()=>extract(replace('CommandBoundaryDecision::Ready => self.downstream.authorize(candidate)',
    'CommandBoundaryDecision::Ready => "self.downstream.authorize(candidate)"')),/action-expression/);
});

test('rendering rejects invented production IR and unknown fixture shape',() => {
  const ir=extractCurrentWrapper();
  assert.throws(()=>renderWrapperLean({...ir,source_sha256:'0'.repeat(64)}),/production IR/);
  assert.throws(()=>renderWrapperLean({...ir,authQualifiers:[{kind:'invented'}]},{fixture:true}),/atom-kind/);
});
