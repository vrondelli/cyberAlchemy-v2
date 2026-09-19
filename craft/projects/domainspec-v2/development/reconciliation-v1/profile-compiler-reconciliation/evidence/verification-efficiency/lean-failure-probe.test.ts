// Run-local diagnostic for failed caller77; does not modify production proof generation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {recordWitnessFixture} from '../../../../../impl/cli/test/helpers/record-witness-project.ts';
import {createReconciledFormalization} from '../../../../../impl/cli/src/formalization/reconciled.ts';
import {sha256} from '../../../../../impl/cli/src/input/source-manifest.ts';
import {SUBPROCESS_TIMEOUT_MS} from '../../../../../impl/cli/src/input/limits.ts';

test('record witness proof isolates import cost with unchanged kernel and full roundtrip',t=>{
 const f=recordWitnessFixture(t),formal=createReconciledFormalization(f.graph,f.plan);
 const candidate=process.env.DOMAINSPEC_LEAN_PROBE_INIT==='1';
 assert.ok(formal.artifact.content.startsWith('import Lean\n'));
 const artifact=candidate?formal.artifact.content.replace(/^import Lean\n/,'import Init\n'):formal.artifact.content;
 assert.equal(artifact.slice(artifact.indexOf('\n')),formal.artifact.content.slice(formal.artifact.content.indexOf('\n')));
 const source=artifact+'\n#print axioms DomainSpec.Reconciled.currentStructuralReferencesHold\n#eval IO.println (DomainSpec.Reconciled.toJson DomainSpec.Reconciled.sourceData)\n';
 const file=path.join(f.root,'Audit.lean');fs.writeFileSync(file,source,{flag:'wx'});
 fs.mkdirSync(path.join(f.root,'scratch'));
 const lean=process.env.DOMAINSPEC_LEAN!;assert.ok(path.isAbsolute(lean));
 const leanRoot=path.dirname(path.dirname(lean)),image='domainspec-node-toolchain:26.8.1-ts7.0.2';
 const imageId=execFileSync('docker',['image','inspect',image,'--format','{{.Id}}'],{encoding:'utf8'}).trim();
 assert.equal(imageId,'sha256:ad84ad003986966fc38cf50953363ce81eb44d108734b882bee8b912c9b652ef');
 const body=`const cp=require('node:child_process');const env={...process.env};delete env.NODE_OPTIONS;delete env.NODE_PATH;delete env.LEAN_SYSROOT;delete env.LEAN_SRC_PATH;env.LEAN_PATH='';const start=performance.now();const r=cp.spawnSync(${JSON.stringify(lean)},[${JSON.stringify(file)}],{cwd:${JSON.stringify(f.root)},env,encoding:'utf8',timeout:${SUBPROCESS_TIMEOUT_MS},maxBuffer:33554432});console.log(JSON.stringify({elapsed_ms:performance.now()-start,status:r.status,signal:r.signal,error:r.error?{code:r.error.code,message:r.error.message}:null,stdout:r.stdout,stderr:r.stderr}));`;
 const argv=['run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--user',process.getuid!()+':'+process.getgid!(),
  '--mount','type=bind,source='+leanRoot+',target='+leanRoot+',readonly','--mount','type=bind,source='+f.root+',target='+f.root,
  '--workdir',f.root,'--env','TMPDIR='+path.join(f.root,'scratch'),image,'node','-e',body];
 let result:any;
 try{result=JSON.parse(execFileSync('docker',argv,{encoding:'utf8',timeout:SUBPROCESS_TIMEOUT_MS+30000,maxBuffer:33554432}));}
 catch(e:any){throw Error(JSON.stringify({message:String(e.message??'').slice(0,2000),code:e.code,signal:e.signal,status:e.status,stdout:String(e.stdout??'').slice(-8192),stderr:String(e.stderr??'').slice(-8192)}));}
 const {stdout,...execution}=result;
 t.diagnostic(JSON.stringify({candidate,source_sha256:sha256(source),source_bytes:Buffer.byteLength(source),projection_sha256:formal.input.projection_sha256,imageId,timeout_ms:SUBPROCESS_TIMEOUT_MS,...execution,
  stdout_sha256:sha256(stdout??''),stdout_bytes:Buffer.byteLength(stdout??''),stdout_excerpt:(stdout??'').slice(0,1024)}));
 assert.equal(result.status,0,JSON.stringify({error:result.error,stderr:result.stderr,elapsed_ms:result.elapsed_ms}));
 assert.equal(result.error,null);
 const lines=result.stdout.trim().split('\n');assert.equal(lines.length,2);
 assert.equal(lines[0],"'DomainSpec.Reconciled.currentStructuralReferencesHold' depends on axioms: [propext, Classical.choice, Quot.sound]");
 assert.deepEqual(JSON.parse(lines[1]),{graph:formal.input.semantic_graph,selection:formal.input.compilation_selection});
});
