// Evaluator-only module: never imported by generation; no provider construction.
// Reference values remain in this process and judge requests, never public journals.
// Remaining gates: EVALUATOR-READINESS.md.
import assert from 'node:assert/strict';
import {readFileSync,lstatSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {IDS,SOURCE,sha,loadSourceManifest,admitActualWire,createTokenizerSession} from './adapter.mjs';
export const ORACLE=Object.freeze({sha256:'821a2034d219ab45846873dd14c14f12cfe7776e73527a483f9dac095d38620c',bytes:15388478,records:500});
export const RUBRIC_SHA256='64e3ee142988fecff66a37057e2259ad501978590ce4272ee88a5f39187f1f12';
export const RUBRIC_PATH=fileURLToPath(new URL('../../../benchmark-pilot-v2/execution/longmemeval/native-rubric.py',import.meta.url));
const need=(v,m)=>assert.ok(v,'full-s-evaluator.'+m);
const zero=()=>({prompt_tokens:0,completion_tokens:0,total_tokens:0});
const valid=u=>['prompt_tokens','completion_tokens','total_tokens'].every(k=>Number.isSafeInteger(u?.[k])&&u[k]>=0)&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
const usageTotals=u=>({prompt_tokens:u.prompt_tokens,completion_tokens:u.completion_tokens,total_tokens:u.total_tokens});
const capacity=r=>[429,503].includes(r?.status)||['1302','1305'].includes(String(r?.error_code??r?.provider_code));
const identity=row=>({question_id:row.question_id,question_type:row.question_type,question:row.question,question_date:row.question_date});
function supportedAnswer(value,depth=0){
 if(depth>64)return false;
 if(value===null||typeof value==='boolean'||typeof value==='string')return true;
 if(typeof value==='number')return Number.isFinite(value)&&(!Number.isInteger(value)||Number.isSafeInteger(value))&&!Object.is(value,-0);
 if(Array.isArray(value))return value.every(v=>supportedAnswer(v,depth+1));
 return value&&typeof value==='object'&&Object.keys(value).length<=128&&Object.values(value).every(v=>supportedAnswer(v,depth+1));
}
const answerType=value=>value===null?'null':Array.isArray(value)?'array':typeof value;
function selectedReferences(rows,oracle){
 need(Array.isArray(rows)&&rows.length===4&&rows.every((r,i)=>r.question_id===IDS[i]),'fixed-source-rows');
 const refs=IDS.map((id,index)=>{const matches=oracle.filter(r=>r.question_id===id);need(matches.length===1,'reference-identity-cardinality');const ref=matches[0];need(sha(identity(rows[index]))===sha(identity(ref)),'question-type-date-identity');need(Object.hasOwn(ref,'answer')&&supportedAnswer(ref.answer),'reference-answer-shape');return {...identity(ref),answer:ref.answer,abstention:id.endsWith('_abs')};});
 return refs;
}
/** Pure identity validation; output has hashes only, never answer/question/date text. */
export function referenceBinding({rows,oracle,source_binding,oracle_sha256,rubric_sha256,production=false}){
 const refs=selectedReferences(rows,oracle);
 return {schema:'are.full-s-reference-binding/v1',production_verified:production,source_binding_sha256:sha(source_binding),reference_source_sha256:oracle_sha256,rubric_sha256,question_ids:[...IDS],rows:refs.map(r=>({question_id:r.question_id,identity_sha256:sha(identity(r)),reference_sha256:sha(r),answer_json_type:answerType(r.answer)})),reference_values_emitted:false,answer_rendering:'JSON typed value passed unchanged to native Python get_anscheck_prompt formatting; no String coercion',unsafe_numeric_values:'nonfinite, unsafe integers and negative zero rejected before scoring'};
}
export function renderNative(rubricPath,ref,response){
 need(sha(readFileSync(rubricPath))===RUBRIC_SHA256,'native-rubric-drift');
 try{return execFileSync('python3',['-c',"import json,sys,runpy; x=json.load(sys.stdin); print(runpy.run_path(sys.argv[1])['get_anscheck_prompt'](x['question_type'],x['question'],x['answer'],x['response'],x['abstention']),end='')",rubricPath],{input:JSON.stringify({...ref,response}),encoding:'utf8',timeout:5000,maxBuffer:1024*1024,stdio:['pipe','pipe','pipe']});}
 catch{throw Error('full-s-evaluator.native-rubric-render-failed');}
}
/** Real evaluator file access is isolated here; the only returned public data is binding. */
export function openEvaluator({source_manifest,oracle_path,rubric_path=RUBRIC_PATH}){
 const loaded=loadSourceManifest(source_manifest),stat=lstatSync(oracle_path);need(stat.isFile()&&!stat.isSymbolicLink()&&stat.size===ORACLE.bytes,'pinned-oracle-file');
 const raw=readFileSync(oracle_path);need(sha(raw)===ORACLE.sha256,'pinned-oracle-hash');const oracle=JSON.parse(raw);need(oracle.length===ORACLE.records,'pinned-oracle-records');
 const rubric=readFileSync(rubric_path);need(sha(rubric)===RUBRIC_SHA256,'native-rubric-binding');
 const binding=referenceBinding({rows:loaded.rows,oracle,source_binding:loaded.bindings,oracle_sha256:ORACLE.sha256,rubric_sha256:sha(rubric),production:true});
 return evaluator({rows:loaded.rows,oracle,binding,render:(ref,response)=>renderNative(rubric_path,ref,response)});
}
/** Full-S references stay in a distinct evaluator-only directory. */
export function openFullSEvaluator({source_manifest,reference_directory,rubric_path=RUBRIC_PATH}){
 const loaded=loadSourceManifest(source_manifest);
 const readBound=(name,limit,digest)=>{const path=join(reference_directory,name),stat=lstatSync(path);need(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=limit,'reference-file-bound');const raw=readFileSync(path);if(digest)need(sha(raw)===digest,'reference-file-drift');return {raw,value:JSON.parse(raw)};};
 const receipt=readBound('reference-acquisition.json',1024**2);
 need(receipt.value.status==='verified-evaluator-reference-projection'&&receipt.value.pinned_upstream_source_verified===true&&receipt.value.source_sha256===SOURCE.sha256&&receipt.value.source_bytes===SOURCE.bytes&&receipt.value.source_records===500&&receipt.value.source_revision===SOURCE.revision&&receipt.value.source_filename===SOURCE.filename&&receipt.value.evaluation_references_emitted===true&&receipt.value.generator_reference_access===false,'verified-full-s-references');
 need(receipt.value.selected?.length===4,'fixed-reference-selection');
 const refs=IDS.map((id,index)=>{const selected=receipt.value.selected[index];need(selected.question_id===id&&selected.path===`reference-${id}.json`&&/^[a-f0-9]{64}$/.test(selected.sha256),'reference-path-identity');const row=readBound(selected.path,1024**2,selected.sha256).value;need(Object.keys(row).sort().join('|')===['question_id','question_type','question','question_date','answer'].sort().join('|'),'reference-whitelist');return row;});
 need(sha(readFileSync(rubric_path))===RUBRIC_SHA256,'native-rubric-binding');
 const binding=referenceBinding({rows:loaded.rows,oracle:refs,source_binding:loaded.bindings,oracle_sha256:SOURCE.sha256,rubric_sha256:RUBRIC_SHA256,production:true});
 binding.reference_acquisition_sha256=sha(receipt.raw);binding.reference_variant=SOURCE.filename;binding.reference_files=receipt.value.selected.map(s=>({question_id:s.question_id,path:s.path,sha256:s.sha256}));
 return evaluator({rows:loaded.rows,oracle:refs,binding,render:(ref,response)=>renderNative(rubric_path,ref,response)});
}
/** Injectable evaluator for synthetic tests; production caller uses openEvaluator. */
export function evaluator({rows,oracle,binding,render}){
 need(typeof render==='function','explicit-render');const refs=selectedReferences(rows,oracle);
 need(binding.rows?.length===4&&refs.every((r,i)=>binding.rows[i].question_id===r.question_id&&binding.rows[i].reference_sha256===sha(r)&&binding.rows[i].identity_sha256===sha(identity(r))),'reference-binding-drift');
 const bindingDigest=sha(binding);
 return {binding:structuredClone(binding),score:options=>scoreBound({...options,refs,binding:structuredClone(binding),bindingDigest,render})};
}
function slotsFromSeal(seal){
 need(seal?.schema==='are.full-s-generation-seal/v1'&&seal.terminal===true&&seal.source_integrity_verified===true&&seal.transport_settled===true,'terminal-generation-seal');
 const result=seal.result;need(result?.planned_pairs===4&&result.planned_answer_slots===8&&result.results?.length===4&&!result.unknown_usage&&!result.persistence_failure&&result.held_tokens===0&&valid(result.usage),'known-fixed-generation');
 need(['prompt_tokens','completion_tokens','total_tokens'].every(k=>result.results.reduce((n,p)=>n+(p.usage?.[k]??NaN),0)===result.usage[k]),'generation-aggregate-usage');
 return result.results.flatMap((pair,index)=>{
  need(pair.question_id===IDS[index]&&!pair.unknown_usage&&!pair.persistence_failure&&pair.held_tokens===0&&valid(pair.usage)&&pair.answers?.length===2,'generation-pair-evidence');
  need(Array.isArray(pair.calls)&&pair.calls.every(c=>['control','treatment'].includes(c.arm)&&!c.unknown_usage&&valid(c.usage))&&['prompt_tokens','completion_tokens','total_tokens'].every(k=>pair.calls.reduce((n,c)=>n+c.usage[k],0)===pair.usage[k]),'generation-call-usage');
  need(new Set(pair.answers.map(a=>a.arm)).size===2&&pair.answers.every(a=>['control','treatment'].includes(a.arm)),'generation-arms');
  return ['control','treatment'].map(arm=>{const answer=pair.answers.find(a=>a.arm===arm);need(['completed','failed','blocked'].includes(answer.status),'terminal-answer');if(answer.status==='completed')need(typeof answer.text==='string'&&answer.text.length>0&&sha(answer.text)===answer.answer_sha256,'answer-hash');return {question_id:pair.question_id,arm,completed:answer.status==='completed',text:answer.status==='completed'?answer.text:null,answer_sha256:answer.status==='completed'?answer.answer_sha256:null};});
 });
}
async function scoreBound({refs,binding,bindingDigest,render,seal,freeze,meter,generate,record,signal,synthetic_only=false}){
 need(typeof meter==='function'&&typeof generate==='function'&&typeof record==='function','explicit-effects');
 need(freeze?.schema==='are.full-s-evaluator-freeze/v1'&&freeze.approved===true&&freeze.reference_binding_sha256===bindingDigest&&freeze.generation_seal_sha256===sha(seal),'separate-evaluator-freeze');
 need(freeze.maximum_judge_calls===8&&freeze.maximum_judge_tokens===64000&&freeze.context_limit===8000,'judge-budget');
 need(binding.production_verified===true||synthetic_only,'production-reference-binding');
 need(freeze.evaluator_sha256===sha(readFileSync(fileURLToPath(import.meta.url)))&&freeze.rubric_sha256===binding.rubric_sha256,'evaluator-code-binding');
 const slots=slotsFromSeal(seal),usage=zero(),judgments=[];let held_tokens=0,reserved_tokens=0,health_stop=null,persistence_failure=false;
 const bounded=createTokenizerSession((request,options)=>meter(request,{signal:signal?AbortSignal.any([signal,options.signal]):options.signal}),{max_calls:8,timeout_ms:freeze.tokenizer_timeout_ms});
 const journal=async event=>{try{await record(structuredClone(event));}catch{persistence_failure=true;health_stop??='judge-journal-failure';throw Error('full-s-evaluator.judge-journal-failure');}};
 // Opaque IDs determine a fixed blind schedule; no arm label reaches the rubric.
 const jobs=slots.map(slot=>({...slot,id:sha([slot.question_id,slot.arm,slot.answer_sha256]).slice(0,24)})).sort((a,b)=>a.id.localeCompare(b.id));
 for(const slot of jobs){const judgment={id:slot.id,question_id:slot.question_id,arm:slot.arm,answer_sha256:slot.answer_sha256,completed:slot.completed,status:'not-judged',valid:false,correct:false,usage:zero(),model_started:false};judgments.push(judgment);
  if(!slot.completed){judgment.reason='generation-not-completed';continue;}
  if(health_stop||signal?.aborted){judgment.reason=health_stop??'aborted';continue;}
  let receipt,admission;
  try{
   const ref=refs.find(r=>r.question_id===slot.question_id),prompt=render(ref,slot.text);need(typeof prompt==='string'&&prompt.length>0,'native-prompt');
   admission=await admitActualWire([{role:'user',content:prompt}],1024,bounded);need(admission.admitted,'judge-wire-over-budget');
   judgment.request_sha256=admission.wire_sha256;judgment.input_tokens=admission.input_tokens;
   // Public journal excludes prompt, reference values, response bodies and error text.
   await journal({kind:'judge-start',...judgment});if(signal?.aborted){judgment.reason='aborted';continue;}
   need(reserved_tokens+8000<=64000,'judge-reservation');reserved_tokens+=8000;judgment.model_started=true;
   receipt=await generate({id:'judge-'+slot.id,request:structuredClone(admission.request),signal});
   need(valid(receipt?.usage),'unknown-judge-usage');judgment.usage=usageTotals(receipt.usage);
   need(receipt.request_sha256===admission.wire_sha256,'judge-request-binding');need(receipt.status===200&&receipt.ok!==false&&receipt.finish_reason==='stop'&&!receipt.persistence_failure,'judge-incomplete');
   need(receipt.usage.prompt_tokens<=6976&&receipt.usage.completion_tokens<=1024&&receipt.usage.total_tokens<=8000,'judge-usage-over-budget');
   for(const [detail,maximum]of [[receipt.usage.completion_tokens_details?.reasoning_tokens,receipt.usage.completion_tokens],[receipt.usage.prompt_tokens_details?.cached_tokens,receipt.usage.prompt_tokens]])need(detail===undefined||(Number.isSafeInteger(detail)&&detail>=0&&detail<=maximum),'judge-usage-detail');
   const answer=typeof receipt.output==='string'?receipt.output.trim().toLowerCase():'';judgment.valid=['yes','no'].includes(answer);judgment.correct=judgment.valid&&answer==='yes';judgment.status=judgment.valid?'judged':'invalid-judgment';judgment.response_sha256=sha(receipt.output??null);
  }catch(error){receipt=receipt??error.receipt;const observed=receipt?.usage??error.usage;
   if(judgment.model_started&&error.model_started===false){
    const positive=[receipt?.usage,error.usage].some(u=>u&&['prompt_tokens','completion_tokens','total_tokens'].some(k=>typeof u[k]==='number'&&u[k]>0))||receipt?.dispatched===true||receipt?.status!==undefined;
    if(error.dispatch_proof==='not-dispatched'&&!positive)judgment.model_started=false;
    else health_stop??='contradictory-or-unproven-dispatch-claim';
   }
   if(!judgment.model_started)judgment.usage=zero();
   else if(valid(observed))judgment.usage=usageTotals(observed);
   else{judgment.usage=null;judgment.unknown_usage=true;held_tokens+=8000;health_stop??='unknown-judge-usage';}
   judgment.status='failed';judgment.reason='judge-or-admission-failure';
   if(!judgment.model_started&&!admission)health_stop??='judge-tokenizer-or-render-failure';
   if(String(error.message).includes('judge-usage-detail'))health_stop??='judge-usage-detail';
   if(capacity(receipt))health_stop??='judge-capacity';if(receipt?.persistence_failure){persistence_failure=true;health_stop??='judge-provider-persistence';}
   if(judgment.model_started&&receipt?.request_sha256!==admission?.wire_sha256)health_stop??='judge-request-binding';
   if(valid(judgment.usage)&&(judgment.usage.prompt_tokens>6976||judgment.usage.completion_tokens>1024||judgment.usage.total_tokens>8000))health_stop??='judge-usage-over-budget';
  }
  if(valid(judgment.usage))for(const k of Object.keys(usage))usage[k]+=judgment.usage[k];
  try{await journal({kind:'judge-result',...judgment});}catch{judgment.status='failed';judgment.valid=false;judgment.correct=false;}
 }
 const totals=Object.fromEntries(['control','treatment'].map(arm=>{const selected=judgments.filter(j=>j.arm===arm),generation_tokens=seal.result.results.reduce((n,p)=>n+p.calls.filter(c=>c.arm===arm).reduce((m,c)=>m+c.usage.total_tokens,0),0),judge_tokens=selected.reduce((n,j)=>n+(j.usage?.total_tokens??0),0);return [arm,{planned:4,completed:selected.filter(j=>j.completed).length,valid_judgments:selected.filter(j=>j.valid).length,correct:selected.filter(j=>j.correct).length,generation_tokens,judge_tokens,total_tokens:generation_tokens+judge_tokens}];}));
 const result={schema:'are.full-s-evaluation-result/v1',reference_binding_sha256:bindingDigest,generation_seal_sha256:sha(seal),planned_answer_slots:8,maximum_judge_calls:8,judgments,totals,usage,held_tokens,reserved_tokens,unknown_usage:judgments.some(j=>j.unknown_usage),persistence_failure,health_stop,judge_calls:judgments.filter(j=>j.model_started).length,tokenizer_budget:bounded.snapshot(),generation_usage:seal.result.usage,campaign_goal_achieved:false,reference_values_emitted:false,answer_rendering:'JSON typed value passed unchanged to native Python get_anscheck_prompt formatting; no String coercion',unsafe_numeric_values:'nonfinite, unsafe integers and negative zero rejected before scoring'};
 try{await journal({kind:'evaluation-result',result});}catch(error){result.persistence_failure=true;throw Object.assign(error,{result,...(!result.unknown_usage?{usage:structuredClone(usage)}:{})});}return result;
}
