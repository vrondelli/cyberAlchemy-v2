// Evaluator process only; no generation entry point. Open questions: LIVE-PROTOCOL.md.
import assert from 'node:assert/strict';import {readFileSync,existsSync,mkdirSync} from 'node:fs';import {join,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {sha} from './adapter.mjs';import {createProviders} from './provider.mjs';import {openFullSEvaluator,RUBRIC_SHA256} from './evaluate.mjs';import {verifyFreeze,bound,guard,durableWrite} from './live.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../../../..'),read=p=>JSON.parse(readFileSync(p));
export function publicEvent(event){
 if(!event.channel)return structuredClone(event);
 const allowed=['channel','kind','id','phase','request_sha256','wire_sha256','tokenizer_request_sha256','model','started_at','finished_at','dispatched','transport_attempts','status','http_status','response_sha256','usage','response_model','finish_reason','ok','failure_code','persistence_failure','input_tokens','model_calls'];
 const safe=Object.fromEntries(allowed.filter(k=>Object.hasOwn(event,k)).map(k=>[k,structuredClone(event[k])]));
 if(safe.usage){const usage={};for(const k of ['prompt_tokens','completion_tokens','total_tokens'])if(Number.isSafeInteger(safe.usage[k])&&safe.usage[k]>=0)usage[k]=safe.usage[k];for(const [parent,key]of [['completion_tokens_details','reasoning_tokens'],['prompt_tokens_details','cached_tokens']])if(Number.isSafeInteger(safe.usage[parent]?.[key])&&safe.usage[parent][key]>=0)usage[parent]={[key]:safe.usage[parent][key]};safe.usage=usage;}return safe;
}
export function preScore(seal){assert.equal(seal.schema,'are.full-s-generation-seal/v1');assert.equal(seal.terminal,true);assert.equal(seal.source_integrity_verified,true);assert.equal(seal.transport_settled,true);assert.equal(seal.result.planned_answer_slots,8);assert.equal(seal.result.planned_pairs,4);assert.equal(seal.result.unknown_usage,false);assert.equal(seal.result.held_tokens,0);assert.ok(!seal.result.persistence_failure);}
export function summary(seal,evaluation){
 const totals=Object.fromEntries(['control','treatment'].map(arm=>{const generation=seal.result.results.reduce((n,p)=>n+p.calls.filter(c=>c.arm===arm).reduce((sum,c)=>sum+(c.usage?.total_tokens??0),0),0),judging=evaluation.totals[arm].judge_tokens;return [arm,{...evaluation.totals[arm],generation_tokens:generation,total_tokens:generation+judging}];}));
 const reduction=totals.control.total_tokens>0?1-totals.treatment.total_tokens/totals.control.total_tokens:null;
 const windows=seal.result.results.flatMap(p=>p.calls).filter(c=>c.model_started).every(c=>c.admission?.admitted===true&&c.admission.input_tokens+c.admission.output_reserve<=8000&&c.usage?.prompt_tokens+c.admission.output_reserve<=8000&&c.usage?.completion_tokens<=c.admission.output_reserve)&&evaluation.judgments.filter(j=>j.model_started).every(j=>j.input_tokens+1024<=8000&&j.usage?.prompt_tokens+1024<=8000&&j.usage?.completion_tokens<=1024);
 const gates={generation_clean:seal.status==='completed'&&seal.wrapper_error===null&&seal.result.status==='completed'&&!seal.result.health_stop&&!seal.result.persistence_failure&&!seal.result.unknown_usage&&seal.result.held_tokens===0,all_requests_within_8k:windows,all_eight_completed:Object.values(totals).every(t=>t.completed===4),all_eight_valid_judgments:Object.values(totals).every(t=>t.valid_judgments===4),treatment_four_correct:totals.treatment.correct===4,quality_nonregression:totals.treatment.correct>=totals.control.correct,at_least_15_percent_reduction:reduction!==null&&reduction>=0.15,known_accounting:!evaluation.unknown_usage&&!evaluation.persistence_failure&&!evaluation.health_stop&&evaluation.held_tokens===0,complete_token_allocation:totals.control.total_tokens+totals.treatment.total_tokens===seal.result.usage.total_tokens+evaluation.usage.total_tokens};
 return {totals,relative_token_reduction:reduction,gates,confirmation_passed:Object.values(gates).every(Boolean),campaign_goal_achieved:false,claim_ceiling:'Four fixed full-S confirmation tasks; not full-benchmark perfection.',open_questions_ref:'../LIVE-PROTOCOL.md'};
}
export function interruptedEvaluation(seal,events){
 const valid=u=>Number.isSafeInteger(u?.prompt_tokens)&&Number.isSafeInteger(u?.completion_tokens)&&u.prompt_tokens>=0&&u.completion_tokens>=0&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
 const zero=()=>({prompt_tokens:0,completion_tokens:0,total_tokens:0});
 const judgments=seal.result.results.flatMap(pair=>['control','treatment'].map(arm=>{
  const answer=pair.answers.find(a=>a.arm===arm),id=sha([pair.question_id,arm,answer.answer_sha256??null]).slice(0,24),done=events.findLast(e=>e.kind==='judge-result'&&e.id===id);if(done)return done;
  const receipts=events.filter(e=>e.channel==='model'&&e.id==='judge-'+id),last=receipts.at(-1),started=receipts.some(r=>r.dispatched===true),usage=valid(last?.usage)?last.usage:started?null:zero();
  return {id,question_id:pair.question_id,arm,completed:answer.status==='completed',status:'interrupted',valid:false,correct:false,model_started:started,usage,unknown_usage:started&&!valid(usage)};
 }));
 const usage=zero();for(const j of judgments)if(valid(j.usage))for(const k of Object.keys(usage))usage[k]+=j.usage[k];
 const totals=Object.fromEntries(['control','treatment'].map(arm=>{const rows=judgments.filter(j=>j.arm===arm);return [arm,{planned:4,completed:rows.filter(j=>j.completed).length,valid_judgments:rows.filter(j=>j.valid).length,correct:rows.filter(j=>j.correct).length,judge_tokens:rows.reduce((n,j)=>n+(j.usage?.total_tokens??0),0)}];}));
 return {planned_answer_slots:8,judgments,totals,usage,unknown_usage:judgments.some(j=>j.unknown_usage),held_tokens:judgments.filter(j=>j.unknown_usage).length*8000,persistence_failure:true,health_stop:'wrapper-interrupted',judge_calls:judgments.filter(j=>j.model_started).length,campaign_goal_achieved:false};
}
export async function scoreLive(runName,name){
 assert.match(runName,/^live-r[1-9][0-9]*$/);assert.match(name,/^score-r[1-9][0-9]*$/);
 const sealPath=join(dir,runName,'GENERATION-SEAL.json');assert.ok(existsSync(sealPath),'global generation seal required before evaluator access');const seal=read(sealPath);preScore(seal);
 const verified=verifyFreeze(join(dir,'live-freeze.json'));assert.equal(seal.freeze_sha256,verified.freeze_sha256);
 const reviewPath=join(dir,'EVALUATOR-LIVE-REVIEW.json'),review=read(reviewPath);assert.ok(review.approved&&review.scope==='full-s-evaluator-live');review.bindings.forEach(bound);
 const expected=read(bound(verified.freeze.evaluator_binding)),scorer=openFullSEvaluator({source_manifest:verified.manifest,reference_directory:resolve(root,verified.freeze.reference_directory)});assert.equal(sha(scorer.binding),sha(expected));
 const output=join(dir,'evaluator',name);assert.ok(!existsSync(output),'single-use evaluation');guard();mkdirSync(output,{mode:0o700});
 const freeze={schema:'are.full-s-evaluator-freeze/v1',approved:true,reference_binding_sha256:sha(expected),generation_seal_sha256:sha(seal),maximum_judge_calls:8,maximum_judge_tokens:64000,context_limit:8000,evaluator_sha256:sha(readFileSync(join(dir,'evaluate.mjs'))),rubric_sha256:RUBRIC_SHA256,tokenizer_timeout_ms:1200000};durableWrite(output,'FREEZE.json',freeze);
 const controller=new AbortController(),events=[];let sequence=0,providers,result,error=null;
 const abort=()=>controller.abort();process.once('SIGINT',abort);process.once('SIGTERM',abort);const timer=setTimeout(abort,1200000);
 const record=async event=>{const safe=publicEvent(event);events.push(safe);guard();durableWrite(output,'event-'+String(++sequence).padStart(4,'0')+'.json',safe);};
 let settlement=[];
 try{providers=createProviders({credential:verified.freeze.credential_path,record,before:guard,maximum_calls:8});result=await scorer.score({seal,freeze,meter:providers.meter,generate:providers.generate,record,signal:controller.signal});}
 catch(failure){error='evaluation-or-persistence-failure';result=failure.result??null;}
 finally{clearTimeout(timer);controller.abort();const settled=await Promise.allSettled([Promise.resolve().then(()=>providers?.meter.settle({timeout_ms:35000})),Promise.resolve().then(()=>providers?.generate.settle({timeout_ms:35000}))]);settlement=settled.map(s=>s.status==='fulfilled'?s.value:{settled:false}).filter(Boolean);process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort);}
 let sources=true;try{verifyFreeze(join(dir,'live-freeze.json'));review.bindings.forEach(bound);assert.equal(sha(openFullSEvaluator({source_manifest:verified.manifest,reference_directory:resolve(root,verified.freeze.reference_directory)}).binding),sha(expected));}catch{sources=false;error??='evaluation-source-drift';}
 result??=interruptedEvaluation(seal,events);
 const report={schema:'are.full-s-live-evaluation/v1',status:!error&&sources&&settlement.every(s=>s.settled)&&result?'scored':'failed',error,source_integrity_verified:sources,transport_settled:settlement.every(s=>s.settled),settlement,result,summary:result?summary(seal,result):null,...(!result?{partial_events:events}:{}),campaign_goal_achieved:false};
 if(report.status!=='scored'&&report.summary)report.summary.confirmation_passed=false;
 try{durableWrite(output,'RESULTS.json',report);}catch(failure){throw Object.assign(failure,{report,persistence_failure:true});}return report;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const report=await scoreLive(process.argv[2],process.argv[3]);console.log(JSON.stringify({status:report.status,summary:report.summary}));}
