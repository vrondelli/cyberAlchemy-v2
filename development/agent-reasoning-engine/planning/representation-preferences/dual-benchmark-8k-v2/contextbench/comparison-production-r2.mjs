// Additive bounded production composition. Open questions: COMPARISON-PRODUCTION-R2.md.
import assert from 'node:assert/strict';import {readFileSync,mkdirSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {verifyComparisonProductionFreeze} from './comparison-production.mjs';
import {createComparisonGenerationProcess} from './comparison-generation-process-r2.mjs';
import {launchComparison} from './comparison-launcher-r3.mjs';
import {runComparisonProductionStage} from './comparison-production-stage.mjs';
const read=p=>JSON.parse(readFileSync(p)),hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('comparison-production-r2.'+m);};
export function verifyComparisonProductionR2Freeze(args){
 const f=verifyComparisonProductionFreeze(args),files=new Set(f.files.map(b=>b.path));
 for(const name of ['comparison-production-r2.mjs','comparison-production-stage.mjs','comparison-production-stage-worker.mjs'])need(files.has(join(import.meta.dirname,name)),'stage-binding');
 return f;
}
export async function runComparisonProduction({manifest_path,manifest_sha256,review_path,signal},{qualify=null,launch=launchComparison,create_process=createComparisonGenerationProcess,evaluate=null}={}){
 const args={manifest_path,manifest_sha256},f=verifyComparisonProductionR2Freeze(args),review=read(review_path);
 need(signal instanceof AbortSignal&&!signal.aborted,'active-signal');
 const qualifyStage=qualify??(async input=>(await runComparisonProductionStage({operation:'qualify',args:input,signal})).value);
 need(review.approved===true&&review.live_execution_admitted===true&&review.manifest_sha256===manifest_sha256,'exact-live-review');
 // Qualification precedes directory creation; launcher then repeats it at its boundary.
 await qualifyStage(args);
 for(const p of [f.request.outcome_root,f.request.runs_root,f.request.metadata_root,f.score_root,f.supervision_root])mkdirSync(p,{recursive:true,mode:0o700});
 const processRun=create_process(),process_adapter={generate:async input=>{verifyComparisonProductionFreeze(args);return await processRun.generate(input);},settle:async input=>{const local=await processRun.settle(input);verifyComparisonProductionFreeze(args);return local;}};
 const score=async input=>{
  verifyComparisonProductionR2Freeze(args);
  const pins={schedule_sha256:f.request.schedule.schedule_sha256,manifest_sha256:input.expected_manifest_sha256};
  need(await input.verify_settlement(pins)===true,'parent-pre-score-settlement');
  let result;
  if(evaluate)result=await evaluate(input);
  else{
   const generation_pins=Object.fromEntries(['RESULTS.json','EVIDENCE-MANIFEST.json','PROCESS-SETTLEMENT.json'].map(name=>[name,hash(readFileSync(join(name==='PROCESS-SETTLEMENT.json'?f.supervision_root:f.request.metadata_root,name)))]));
   const {verify_settlement,admit_score,...serializable}=input;
   result=(await runComparisonProductionStage({operation:'score',args:{...args,score:serializable,generation_pins},signal})).value;
  }
  need(await input.verify_settlement(pins)===true,'parent-post-score-settlement');
  verifyComparisonProductionR2Freeze(args);return result;
 };
 return await launch({request:f.request,score_root:f.score_root,supervision_root:f.supervision_root,signal,deadline_ms:f.generation_deadline_ms,qualify:async({request})=>{assert.deepEqual(request,f.request);return await qualifyStage(args);}},{process_adapter,score});
}
