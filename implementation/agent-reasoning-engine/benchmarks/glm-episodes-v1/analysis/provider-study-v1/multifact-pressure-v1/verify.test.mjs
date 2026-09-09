// Independent source and semantic checks. Open questions: README.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {root,read,sha,verify,planFor,exposure} from './common.mjs';
import {attributeSource} from '../source-instruction-v1/evaluate.mjs';
import {createContainerPublicValidator} from '../../../../../packages/coding-agent-runtime/container-public-validation.mjs';
test('per-fact exposure rejects echoes, wrong hashes and one missing component',()=>{
 const task=read(new URL('prepared/fixtures/w8000-r1-delayed/task.json',root)),prompt=messages=>[{prompt:JSON.stringify({messages})}],tool=f=>({role:'tool',content:JSON.stringify({ok:true,tool_name:'read-file',output:{path:f.path,sha256:f.sha256,utf8:f.utf8}})}),agent={recycling:{recycles:0}};
 assert.ok(exposure(agent,prompt(task.facts.map(tool)),task).facts.every(f=>f.present_at_final));
 assert.equal(exposure(agent,prompt([tool(task.facts[0])]),task).facts.filter(f=>f.present_at_final).length,1);
 assert.ok(exposure(agent,prompt(task.facts.map(f=>({role:'assistant',content:f.utf8}))),task).facts.every(f=>!f.delivered));
 const stale=structuredClone(task.facts);stale.forEach(f=>f.sha256='bad');assert.ok(exposure(agent,prompt(stale.map(tool)),task).facts.every(f=>!f.delivered));
});
test('actual scripted patches and single-component corruptions are independently checked in the pinned sandbox',()=>{
 const binding=verify(),report=read(new URL('evidence/report.json',root));assert.equal(report.freeze_digest,binding.digest);assert.equal(report.rows.length,12);
 const out=new URL('oracle-checks/',root);mkdirSync(out);const temp=mkdtempSync(join(tmpdir(),'are-h22-oracle-')),results=[];
 try{
  for(const row of report.rows){
   const id=`${row.soft}-${row.neutral_position}-${row.arm}`,e=read(new URL('evidence/'+id+'.json',root)),task=e.task;
   assert.equal(task.paths.length,6);assert.ok(!task.paths.some(p=>['task.json','oracle.json'].includes(p)));for(const f of task.facts)assert.ok(!task.request.includes(f.value));
   const attr=attributeSource(e.agent_result.final_response_evidence,e.base,e.fixtures['subject.mjs']);assert.ok(attr.attributable&&attr.schema_ok);
   const subject=join(temp,id+'.mjs');writeFileSync(subject,attr.source);const plan=planFor(new URL('prepared/fixtures/'+task.id+'/oracle.json',root).pathname),validation=createContainerPublicValidator().validate({subject,plan});
   assert.ok(validation.worker_validation&&validation.worker_cleanup_verified);assert.equal(validation.ok,row.scripted_semantics);writeFileSync(new URL(id+'.json',out),JSON.stringify(validation,null,2)+'\n',{flag:'wx'});results.push({id,expected:row.scripted_semantics,observed:validation.ok,source_sha256:sha(attr.source),validation_sha256:sha(readFileSync(new URL(id+'.json',out)))});
  }
  const task=read(new URL('prepared/fixtures/w8000-r1-delayed/task.json',root));
  for(const key of ['route','region']){
   const values=Object.fromEntries(task.facts.map(f=>[f.key,f.value]));values[key]='WRONG';const subject=join(temp,key+'.mjs');writeFileSync(subject,`export function routeCode(){return ${JSON.stringify(values.route+'/'+values.region)};} export function stableLabel(){return "stable";}`);
   const validation=createContainerPublicValidator().validate({subject,plan:planFor(new URL('prepared/fixtures/'+task.id+'/oracle.json',root).pathname)});assert.ok(validation.worker_validation&&validation.worker_cleanup_verified);assert.equal(validation.ok,false);assert.equal(validation.passed,1);writeFileSync(new URL('corrupt-'+key+'.json',out),JSON.stringify(validation,null,2)+'\n',{flag:'wx'});
  }
  writeFileSync(new URL('report.json',out),JSON.stringify({freeze_digest:binding.digest,checked_scripted_proposals:12,independent_component_negative_controls:2,results,provider_calls:0,authority_effect:'none',open_questions_ref:'../README.md'},null,2)+'\n',{flag:'wx'});
 }finally{rmSync(temp,{recursive:true,force:true});}
});
