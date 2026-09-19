// Run-local diagnostic, not a replacement for public caller qualification.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {publicFixture,publicSelection} from '../../../../../impl/cli/test/helpers/composition-project.ts';
import {planCompiledReconciledProject} from '../../../../../impl/cli/src/generation/reconciled-project.ts';
import {createReconciledFormalization} from '../../../../../impl/cli/src/formalization/reconciled.ts';
import {sha256} from '../../../../../impl/cli/src/input/source-manifest.ts';
import {SUBPROCESS_TIMEOUT_MS} from '../../../../../impl/cli/src/input/limits.ts';

test('isolated unchanged composition structural proof preserves the public Lean limit',t=>{
 const f=publicFixture(t),plan=planCompiledReconciledProject(f.graph,publicSelection());
 const formal=createReconciledFormalization(f.graph,plan);
 const compact=process.env.DOMAINSPEC_LEAN_PROBE_COMPACT==='1';let replacements=0;
 const artifact=compact?formal.artifact.content.replace(/\.str \[([0-9, ]*)\]/g,(original,units:string)=>{
  const values=units?units.split(',').map(v=>Number(v.trim())):[];
  if(!values.every(n=>n===9||n===10||n===13||(n>=32&&n<=126)))return original;
  replacements++;return '.str (key '+JSON.stringify(values.map(n=>String.fromCharCode(n)).join(''))+')';
 }):formal.artifact.content;
 if(compact)assert.ok(replacements>0,'candidate must change the actual costly representation');
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
 const result=JSON.parse(execFileSync('docker',argv,{encoding:'utf8',timeout:SUBPROCESS_TIMEOUT_MS+30000,maxBuffer:33554432}));
 const {stdout,...execution}=result;
 t.diagnostic(JSON.stringify({compact,replacements,source_sha256:sha256(source),source_bytes:Buffer.byteLength(source),projection_sha256:formal.input.projection_sha256,imageId,timeout_ms:SUBPROCESS_TIMEOUT_MS,...execution,
  stdout_sha256:sha256(stdout??''),stdout_bytes:Buffer.byteLength(stdout??''),stdout_excerpt:(stdout??'').slice(0,1024)}));
 assert.equal(result.status,0,JSON.stringify({error:result.error,stderr:result.stderr,elapsed_ms:result.elapsed_ms}));
 assert.equal(result.error,null);
 const lines=result.stdout.trim().split('\n');assert.equal(lines.length,2);
 assert.equal(lines[0],"'DomainSpec.Reconciled.currentStructuralReferencesHold' depends on axioms: [propext, Classical.choice, Quot.sound]");
 assert.deepEqual(JSON.parse(lines[1]),{graph:formal.input.semantic_graph,selection:formal.input.compilation_selection});
});
