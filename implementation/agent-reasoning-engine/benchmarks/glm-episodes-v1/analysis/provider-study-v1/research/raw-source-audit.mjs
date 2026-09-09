// Supplemental source semantics; never changes initial outcomes. Open questions: NEXT.md.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {verifyFreeze,trialState,save} from '../controller.mjs';
import {attributeSource} from '../source-instruction-v1/evaluate.mjs';
import {snapshotTree} from '../../../../../packages/coding-agent-runtime/verifier.mjs';
import {createContainerPublicValidator} from '../../../../../packages/coding-agent-runtime/container-public-validation.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p));
export function auditSources(frozen,run,output){
 const manifest=verifyFreeze(frozen),rows=read(join(frozen,'schedule.json')),auditor_sha256=sha(readFileSync(new URL('raw-source-audit.mjs',import.meta.url))),out=[];
 mkdirSync(output,{recursive:true});
 for(const row of rows){
  if(!existsSync(join(run,row.id,'completed.json')))continue;
  const state=trialState(run,row,manifest.digest),result=state.result,agentPath=join(state.root,'agent-result.json'),agentBytes=readFileSync(agentPath),a=JSON.parse(agentBytes),result_sha256=sha(readFileSync(join(state.root,'result.json'))),agent_sha256=sha(agentBytes),dir=join(output,row.id);
  assert.deepEqual(a.receipts,result.receipts);
  if(existsSync(join(dir,'result.json'))){const prior=read(join(dir,'result.json'));assert.equal(prior.agent_sha256,agent_sha256);assert.equal(prior.result_sha256,result_sha256);assert.equal(prior.auditor_sha256,auditor_sha256);if(prior.validation_path)assert.equal(sha(readFileSync(prior.validation_path)),prior.validation_sha256);out.push(prior);continue;}
  assert.equal(existsSync(dir),false,'incomplete audit directory requires inspection');mkdirSync(dir);
  const fixture=join(state.root,'fixture'),base=snapshotTree(fixture),source=readFileSync(join(fixture,'subject.mjs'),'utf8');
  const attributed=attributeSource(a.final_response_evidence,base,source);if(a.final_response_evidence)assert.equal(a.final_response_evidence.text_sha256,result.raw_response_sha256);
  let validation=null,validation_path=null;
  if(attributed.attributable){
   if(result.validation_ref){validation_path=join(state.root,result.validation_ref);validation=read(validation_path);}
   else{
    const subject=join(dir,'candidate.mjs');writeFileSync(subject,attributed.source,{flag:'wx'});
    const oraclePath=new URL(`../../controlled-study-v1/prepared/fixtures/${row.fixture}/oracle.json`,import.meta.url).pathname,cases=read(oraclePath);
    const plan={schema_version:'are.public-case-plan/v1',sources:[{path:oraclePath,sha256:sha(readFileSync(oraclePath))}],checks:cases.map((c,i)=>({...c,evidence:[{path:oraclePath,selector:'/'+i,value_sha256:sha(JSON.stringify(c))}]}))};
    validation=createContainerPublicValidator().validate({subject,plan});validation_path=join(dir,'validation.json');save(validation_path,validation);
   }
   assert.equal(validation.subject_sha256,sha(attributed.source));assert.equal(validation.worker_cleanup_verified,true);assert.equal(validation.total,6);
  }
  assert.equal(snapshotTree(fixture).tree_sha256,base.tree_sha256);verifyFreeze(frozen);
  const audited={id:row.id,block:row.block,arm:row.arm,fixture:row.fixture,soft_limit:row.soft_limit,initial_pass:result.initial_pass,native_contract_valid:row.arm==='host-envelope'?(result.normalization.at(-1)?.ok??null):attributed.schema_ok,raw_full_schema_valid:attributed.schema_ok,attributable:attributed.attributable,attribution_reason:attributed.reason,unchanged_source:attributed.unchanged_source,raw_source_semantics:validation?.ok??null,passed:validation?.passed??null,total:validation?.total??null,agent_sha256,result_sha256,auditor_sha256,validation_path,validation_sha256:validation_path?sha(readFileSync(validation_path)):null,authority_effect:'none',open_questions_ref:'../../NEXT.md'};
  save(join(dir,'result.json'),audited);out.push(audited);
 }
 return {completed:out.length,raw_semantic_passes:out.filter(r=>r.raw_source_semantics===true).length,unknown_sources:out.filter(r=>!r.attributable).length,rows:out};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){assert.equal(process.argv.length,5);const r=auditSources(...process.argv.slice(2).map(p=>resolve(p)));console.log(JSON.stringify({...r,rows:undefined}));}
