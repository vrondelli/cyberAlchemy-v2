// Bounded tokenizer-only launcher. Open questions: RECOVERY-TOKENIZER-PROTOCOL.md.
import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createTokenizerMeasurer,runCounterfactual} from './recovery-tokenizer.mjs';
import {postOnce} from './packet-diversity-v1/transport-bounded-v3.mjs';
import {credentials} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
import {verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../../..');
const hash=x=>createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(readFileSync(p));
const need=(x,m)=>{if(!x)throw Error('recovery-launch.'+m);};
export function verifySources(manifest){
 need(Array.isArray(manifest.bindings)&&manifest.bindings.length>10,'source-manifest');
 for(const b of manifest.bindings)need(hash(readFileSync(resolve(root,b.path)))===b.sha256,'source-drift');
}
export function createCredentialPost({registry,reference,post,signal}){
 return async(raw,on_dispatch)=>{
  let response;
  await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:hash(raw),consumer:async material=>{
   need(!signal.aborted,'aborted-after-secret');const rollback=await on_dispatch();if(signal.aborted){rollback?.();throw Error('recovery-launch.aborted-before-http');}
   response=await post(raw,material);
  }});
  return response;
 };
}
export function checkCredentialTimeout(config){need((config.timeout_ms??5000)<=30000,'secret-timeout-exceeds-30s');}
export async function runLive({output_name,credential_path,review_path}){
 need(/^recovery-tokenizer-r[1-9][0-9]*$/.test(output_name),'output-name');
 const manifestPath=join(dir,'RECOVERY-TOKENIZER-SOURCES.json'),manifest=read(manifestPath),review=read(review_path);
 need(review.approved===true&&review.scope==='recovery-tokenizer-live'&&review.source_manifest_sha256===hash(readFileSync(manifestPath)),'exact-review-required');
 verifySources(manifest);
 const hypotheses=read(join(dir,'RECOVERY-TOKENIZER-HYPOTHESES-R2.json')),experiment=read(join(dir,'RECOVERY-TOKENIZER-EXPERIMENT-R2.json'));
 for(const r of [...hypotheses.records,experiment])need(verifyEvolutionRecord(r).ok,'native-record');
 const audit=read(join(dir,'RECOVERY-VISIBILITY.json')),output=join(dir,output_name),binding=read(join(dir,'../storage-host-binding.json'));
 need(!existsSync(output),'fresh-output-required');
 const guard=growth=>guardStorage({binding,output,growth_reservation_bytes:growth??0});
 const admission=guard(33554432);mkdirSync(output,{mode:0o700});
 const stage=createStageOutputGuard({root:output}),persistence=createStagePersistence({stage_guard:stage,stage_root:output});
 persistence.writeJson(join(output,'STARTED.json'),{source_manifest_sha256:hash(readFileSync(manifestPath)),review_sha256:hash(readFileSync(review_path)),admission,planned_pairs:97,maximum_tokenizer_calls:512,model_calls:0});
 const controller=new AbortController();let timer,result,measurer,outerFailure=null;
 const abort=()=>controller.abort();process.on('SIGINT',abort);process.on('SIGTERM',abort);
 try{
  timer=setTimeout(abort,900000);
  checkCredentialTimeout(read(credential_path));
  const {registry,reference}=credentials(credential_path);
  measurer=createTokenizerMeasurer({signal:controller.signal,record:async receipt=>persistence.append(join(output,'tokenizer-receipts.jsonl'),JSON.stringify(receipt)+'\n'),before_dispatch:async()=>{guard();stage.snapshot();},post:createCredentialPost({registry,reference,signal:controller.signal,post:async(raw,material)=>postOnce(new URL('https://api.z.ai/api/paas/v4/tokenizer'),raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:30000,maximum_response_bytes:65536,signal:controller.signal})})});
  result=await runCounterfactual({outcomes:audit.rows,signal:controller.signal,abort,measure:measurer.measure,write_row:async row=>persistence.atomicJson(join(output,'rows',row.task_id+'-'+row.request_sha256+'.json'),row),load_source:async task=>{
   const b=audit.source_bindings.find(x=>x.path.endsWith('/'+task+'/run/treatment/result.json'));need(b,'source-binding');const raw=readFileSync(resolve(root,b.path));need(hash(raw)===b.sha256,'donor-drift');return JSON.parse(raw);
  }});
  verifySources(manifest);
 }catch(e){outerFailure={code:typeof e.code==='string'?e.code:'launch-failure',message:String(e.message).slice(0,256)};}
 finally{clearTimeout(timer);controller.abort();process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort);}
 result??={schema:'are.recovery-tokenizer-study/v1',rows:audit.rows.flatMap(o=>o.requests.map(p=>({task_id:o.task_id,request_sha256:p.request_sha256,status:'not-started',variants:{}}))),completed_pairs:0,planned_pairs:97,model_calls:0,campaign_goal_achieved:false};
 if(outerFailure)Object.assign(result,{status:'failed',classification:'inconclusive',input_size_supported:false,outer_failure:outerFailure});
 Object.assign(result,{tokenizer_receipts:measurer?.receipts??[],tokenizer_invocations:measurer?.invocations??0,tokenizer_http_attempts:measurer?.receipts.filter(r=>r.dispatched).length??0,source_manifest_sha256:hash(readFileSync(manifestPath)),transport_settled:true,settlement_basis:'Both workers and every started tokenizer promise awaited; no background requests.',authority_effect:'none'});
 persistence.writeJson(join(output,'RESULTS.json'),result,{final:true});return result;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const result=await runLive(read(process.argv[2]));console.log(JSON.stringify({status:result.status,classification:result.classification,completed_pairs:result.completed_pairs,tokenizer_http_attempts:result.tokenizer_http_attempts,input:result.complete_pair_input_totals}));if(result.status!=='completed')process.exitCode=1;}
