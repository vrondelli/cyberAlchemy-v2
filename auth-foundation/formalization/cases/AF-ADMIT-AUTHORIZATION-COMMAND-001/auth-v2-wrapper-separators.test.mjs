import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { extractCurrentWrapper, extractWrapperFixture } from './auth-v2-wrapper-extract.mjs';
import { renderWrapperLean } from './auth-v2-wrapper-lean.mjs';

// Mutants are source-only fixture controls. The selected production wrapper,
// generated production IR, fixed Lean interpreters, and proof files stay intact.
const here=fileURLToPath(new URL('./',import.meta.url));
const implementation=fileURLToPath(new URL('../../../implementation/',import.meta.url));
const wrapper=join(implementation,'trusted-boundary-v2');
const source=readFileSync(join(wrapper,'src/lib.rs'),'utf8');
const cargo=readFileSync(join(wrapper,'Cargo.toml'),'utf8');
const selected=extractCurrentWrapper();
const toolchain=fileURLToPath(new URL('../../../../tools/toolchain/run',import.meta.url));
const lean=process.env.AUTH_LEAN_BIN ?? '/var/tmp/auth-lean-73F68I/lean-4.32.0-linux/bin/lean';
const leanSha='e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550';
const semantic=({source_sha256,cargo_sha256,...rest})=>rest;

function replaceOnce(oldValue,newValue) {
  assert.equal(source.split(oldValue).length,2,`unique wrapper source: ${oldValue}`);
  return source.replace(oldValue,newValue);
}

function fixedPrefix(name,stop,namespace) {
  const bytes=readFileSync(join(here,`${name}.lean`),'utf8');
  const at=bytes.indexOf(stop);
  assert.ok(at>0,`fixed interpreter cut marker ${name}`);
  return `${bytes.slice(0,at)}\nend ${namespace}\n`;
}

const typedSource=readFileSync(join(here,'AuthTypedPreservation.lean'),'utf8');
const typedStart=typedSource.indexOf('def authQual '), typedEnd=typedSource.indexOf('theorem generated_auth_eq');
assert.ok(typedStart>0 && typedEnd>typedStart);
const fixedModules={
  AuthGeneratedSubject:readFileSync(join(here,'AuthGeneratedSubject.lean'),'utf8'),
  AuthTypedPreservation:`import AuthGeneratedSubject\nnamespace AuthTypedPreservation\n${typedSource.slice(typedStart,typedEnd)}\nend AuthTypedPreservation\n`,
  AuthWrapperTrace:fixedPrefix('AuthWrapperTrace','theorem extracted_trace_eq_intended','AuthWrapperTrace'),
  AuthWrapperQualifiers:fixedPrefix('AuthWrapperQualifiers','theorem auth_eq_kernel_qualifier','AuthWrapperQualifiers'),
  AuthWrapperCandidate:fixedPrefix('AuthWrapperCandidate','private theorem filterM_auth','AuthWrapperCandidate'),
  AuthWrapperMapping:fixedPrefix('AuthWrapperMapping','theorem permission_preserved','AuthWrapperMapping'),
};

const sample=`open AuthGeneratedSubject
def samplePermission : Permission := { resource := "documents", action := "read", scope := "tenant-1" }
def sampleEvidence : Evidence := { evidenceRef := "auth-1", sessionId := "session-1", trusted := true }
def sampleRoute : RouteBinding := { routeId := "route-1", complete := true, scopeEvidenceRef := "scope-1", permission := samplePermission }
def sampleContext : Context := { request := { requestId := "request-1", authenticationEvidenceRef := "auth-1", routeId := "route-1" }, candidate := { requestId := "request-1", sessionId := "session-1", permission := samplePermission, scopeEvidenceRef := "scope-1" }, authRows := [sampleEvidence], routeRows := [sampleRoute] }
`;

const cases=[
  {
    name:'Ready arm returns Deny instead of calling downstream', module:'AuthWrapperTrace',
    source:replaceOnce('CommandBoundaryDecision::Ready => self.downstream.authorize(candidate)',
      'CommandBoundaryDecision::Ready => BinaryAuthorizationDecision::Deny'),
    lean:`import AuthWrapperTrace\n${sample}
example : (AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches true
    sampleContext.candidate .allow).map (fun trace => trace.result) = some .deny := by decide
example : (AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches true
    sampleContext.candidate .allow).map (fun trace => trace.directCalls.length) = some 0 := by decide
example : AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches true
    sampleContext.candidate .allow ≠
    some (AuthWrapperTrace.intended true sampleContext.candidate .allow) := by decide
`,
    changed:ir=>assert.deepEqual(ir.branches.ready,['returnDeny']),
  },
  {
    name:'eager call before kernel Deny', module:'AuthWrapperTrace',
    source:replaceOnce('        match boundary_kernel::admit_authorization_command(&context) {',
      '        let _ = self.downstream.authorize(candidate.clone());\n        match boundary_kernel::admit_authorization_command(&context) {'),
    lean:`import AuthWrapperTrace\n${sample}
example : (AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches false
    sampleContext.candidate .allow).map (fun trace => trace.directCalls.length) = some 1 := by decide
example : AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches false
    sampleContext.candidate .allow ≠
    some (AuthWrapperTrace.intended false sampleContext.candidate .allow) := by decide
`,
    changed:ir=>assert.deepEqual(ir.prefixActions,['callDownstream']),
  },
  {
    name:'duplicate Ready call', module:'AuthWrapperTrace',
    source:replaceOnce('CommandBoundaryDecision::Ready => self.downstream.authorize(candidate)',
      'CommandBoundaryDecision::Ready => { self.downstream.authorize(candidate.clone()); self.downstream.authorize(candidate) }'),
    lean:`import AuthWrapperTrace\n${sample}
example : (AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches true
    sampleContext.candidate .allow).map (fun trace => trace.directCalls.length) = some 2 := by decide
example : AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches true
    sampleContext.candidate .allow ≠
    some (AuthWrapperTrace.intended true sampleContext.candidate .allow) := by decide
`,
    changed:ir=>assert.deepEqual(ir.branches.ready,['callDownstream','callDownstream']),
  },
  {
    name:'redirected authentication qualifier', module:'AuthWrapperQualifiers',
    source:replaceOnce('evidence.evidence_ref == request.authentication_evidence_ref',
      'evidence.session_id == request.authentication_evidence_ref'),
    lean:`import AuthWrapperQualifiers\n${sample}
def redirectedContext : Context := { sampleContext with
  request := { sampleContext.request with authenticationEvidenceRef := "session-1" } }
example : AuthWrapperQualifiers.auth redirectedContext sampleEvidence = some true := by decide
example : AuthTypedPreservation.authQual redirectedContext sampleEvidence = false := by decide
example : AuthWrapperQualifiers.auth redirectedContext sampleEvidence ≠
    some (AuthTypedPreservation.authQual redirectedContext sampleEvidence) := by decide
`,
    changed:ir=>assert.deepEqual(ir.authQualifiers[0],{kind:'eq',left:'evidence.session_id',right:'request.authentication_evidence_ref'}),
  },
  {
    name:'candidate session copied from request ID', module:'AuthWrapperCandidate',
    source:replaceOnce('session_id: matching_authentication[0].session_id.clone()',
      'session_id: request.request_id.clone()'),
    lean:`import AuthWrapperCandidate\n${sample}
example : (AuthWrapperCandidate.construct sampleContext).map (fun c => c.sessionId) = some "request-1" := by decide
example : (AuthWrapperCandidate.intended sampleContext).sessionId = "session-1" := by decide
example : AuthWrapperCandidate.construct sampleContext ≠
    some (AuthWrapperCandidate.intended sampleContext) := by decide
`,
    changed:ir=>assert.deepEqual(ir.candidateSuccessFields[1],['session_id','request.request_id']),
  },
  {
    name:'evidence mapper session copied from evidence reference', module:'AuthWrapperMapping',
    source:replaceOnce('evidence_ref: evidence.evidence_ref,\n        session_id: evidence.session_id,',
      'evidence_ref: evidence.evidence_ref.clone(),\n        session_id: evidence.evidence_ref,'),
    lean:`import AuthWrapperMapping\n${sample}
example : (AuthWrapperMapping.mapEvidence sampleEvidence).map (fun e => e.sessionId) = some "auth-1" := by decide
example : sampleEvidence.sessionId = "session-1" := by decide
example : AuthWrapperMapping.mapEvidence sampleEvidence ≠ some sampleEvidence := by decide
`,
    changed:ir=>assert.deepEqual(ir.authMapperFields[1],['session_id','evidence.evidence_ref']),
  },
  {
    name:'list take one loses duplicate row', module:'AuthWrapperMapping',
    source:replaceOnce('authentication_evidence\n                .into_iter()\n                .map(to_kernel_authentication_evidence)',
      'authentication_evidence\n                .into_iter()\n                .take(1)\n                .map(to_kernel_authentication_evidence)'),
    lean:`import AuthWrapperMapping\n${sample}
def duplicateContext : Context := { sampleContext with authRows := [sampleEvidence, sampleEvidence] }
example : duplicateContext.authRows.length = 2 := by decide
example : (AuthWrapperMapping.mapContext duplicateContext).map (fun c => c.authRows.length) = some 1 := by decide
example : AuthWrapperMapping.mapContext duplicateContext ≠ some duplicateContext := by decide
`,
    changed:ir=>assert.match(ir.contextWiring[3][1],/take\(1\)/),
  },
];

function run(label,command,args,cwd,env,timeout=120000) {
  const result=spawnSync(command,args,{cwd,env,encoding:'utf8',timeout,maxBuffer:4*1024*1024});
  assert.equal(result.status,0,`${label}: ${result.error?.message ?? ''}\n${result.stdout}\n${result.stderr}`);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`,/sorryAx|declaration uses 'sorry'/);
}

test('seven source-only wrapper mutants typecheck and have Lean-reduced semantic separators',()=>{
  assert.equal(createHash('sha256').update(readFileSync(lean)).digest('hex'),leanSha,'isolated Lean binary identity');
  const owned=mkdtempSync('/var/tmp/auth-wrapper-separators-');
  try {
    const leanDir=join(owned,'lean'); mkdirSync(leanDir);
    const leanEnv={...process.env,LEAN_PATH:leanDir,TMPDIR:'/var/tmp'};
    for (const [name,body] of Object.entries(fixedModules)) writeFileSync(join(leanDir,`${name}.lean`),body);
    run('AuthGeneratedSubject',lean,['-o',join(leanDir,'AuthGeneratedSubject.olean'),'AuthGeneratedSubject.lean'],leanDir,leanEnv);
    run('AuthTypedPreservation definitions',lean,['-o',join(leanDir,'AuthTypedPreservation.olean'),'AuthTypedPreservation.lean'],leanDir,leanEnv);

    const nativeDir=join(owned,'implementation'); mkdirSync(nativeDir);
    for (const entry of readdirSync(implementation,{withFileTypes:true})) {
      if (entry.name==='trusted-boundary-v2') continue;
      if (entry.isDirectory()) symlinkSync(join(implementation,entry.name),join(nativeDir,entry.name),'dir');
    }
    const nativeWrapper=join(nativeDir,'trusted-boundary-v2'); mkdirSync(join(nativeWrapper,'src'),{recursive:true});
    copyFileSync(join(wrapper,'Cargo.toml'),join(nativeWrapper,'Cargo.toml'));
    copyFileSync(join(wrapper,'Cargo.lock'),join(nativeWrapper,'Cargo.lock'));
    const cargoEnv={...process.env,TMPDIR:'/var/tmp',CARGO_TARGET_DIR:join(owned,'target')};

    for (const item of cases) {
      const ir=extractWrapperFixture(item.source,cargo);
      assert.notDeepEqual(semantic(ir),semantic(selected),`${item.name} must change extracted semantics`);
      item.changed(ir);
      writeFileSync(join(nativeWrapper,'src/lib.rs'),item.source);
      run(`${item.name} Cargo typecheck`,toolchain,
        ['cargo','check','--offline','--locked','--manifest-path',join(nativeWrapper,'Cargo.toml'),'--lib'],
        nativeWrapper,cargoEnv,180000);
      writeFileSync(join(leanDir,'AuthGeneratedWrapperIR.lean'),renderWrapperLean(ir,{fixture:true}));
      run(`${item.name} IR`,lean,['-o',join(leanDir,'AuthGeneratedWrapperIR.olean'),'AuthGeneratedWrapperIR.lean'],leanDir,leanEnv);
      for (const name of ['AuthWrapperTrace','AuthWrapperQualifiers','AuthWrapperCandidate','AuthWrapperMapping']) {
        run(`${item.name} ${name}`,lean,['-o',join(leanDir,`${name}.olean`),`${name}.lean`],leanDir,leanEnv);
        if (name===item.module) break;
      }
      writeFileSync(join(leanDir,'Separation.lean'),item.lean);
      run(`${item.name} separator`,lean,['Separation.lean'],leanDir,leanEnv);
    }
  } finally { rmSync(owned,{recursive:true,force:true}); }
});
