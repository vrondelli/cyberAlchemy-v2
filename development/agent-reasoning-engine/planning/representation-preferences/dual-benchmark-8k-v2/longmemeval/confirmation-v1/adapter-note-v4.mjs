// Full-S source-only confirmation adapter. Open questions: NOTE-V4-CORE.md.
import {readFileSync,lstatSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {ANSWER_SYSTEM} from '../../../dual-benchmark-8k-v1/longmemeval/adapter.mjs';
import {SCOPE_POLICY} from '../adapter.mjs';
import {stable} from '../../../benchmark-pilot-v2/execution/selectivity-v2/provider.mjs';
import {ingestionMessages as legacyIngestionMessages} from '../../../benchmark-pilot-v2/execution/longmemeval-sequential-v2/chunks.mjs';
export const IDS=Object.freeze(['09ba9854_abs','06db6396','cc06de0d','54026fce']);
export const SOURCE=Object.freeze({revision:'98d7416c24c778c2fee6e6f3006e7a073259d48f',sha256:'d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442',bytes:277383467,filename:'longmemeval_s_cleaned.json'});
export const COMMON_ANSWER_SYSTEM=ANSWER_SYSTEM+' '+SCOPE_POLICY;
export const sha=value=>createHash('sha256').update(Buffer.isBuffer(value)||typeof value==='string'?value:stable(value)).digest('hex');
const fail=message=>{throw Error(message);};
const exact=(object,keys)=>object&&typeof object==='object'&&!Array.isArray(object)&&Object.keys(object).sort().join('|')===[...keys].sort().join('|');
const expectedFields=['question_id','question_type','question','question_date','haystack_dates','haystack_sessions'];
function validHistoryDate(value){
 if(typeof value!=='string')return false;
 const m=/^(\d{4})\/(\d{2})\/(\d{2}) \((Mon|Tue|Wed|Thu|Fri|Sat|Sun)\) (\d{2}):(\d{2})$/.exec(value);
 if(!m)return false;
 const [year,month,day,hour,minute]=[m[1],m[2],m[3],m[5],m[6]].map(Number);
 const leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 return year>=1&&month>=1&&month<=12&&day>=1&&day<=days[month-1]&&hour<=23&&minute<=59;
}
export function validateSourceRow(row){
 if(!exact(row,expectedFields)||!IDS.includes(row.question_id)||['question_type','question','question_date'].some(k=>typeof row[k]!=='string'||!row[k]))fail('invalid source-only row');
 if(!Array.isArray(row.haystack_dates)||!row.haystack_dates.length||!Array.isArray(row.haystack_sessions)||row.haystack_dates.length!==row.haystack_sessions.length)fail('history cardinality');
 if(row.haystack_dates.some(d=>!validHistoryDate(d)))fail('invalid history date format');
 for(const session of row.haystack_sessions)if(!Array.isArray(session)||!session.length||session.some(m=>!exact(m,['role','content'])||!['user','assistant'].includes(m.role)||typeof m.content!=='string'))fail('invalid source message');
 return row;
}
export function flattenHistory(row){validateSourceRow(row);return row.haystack_sessions.flatMap((messages,si)=>messages.map((m,mi)=>({source_id:`s${si}-m${mi}`,date:row.haystack_dates[si],role:m.role,content:m.content})));}
/** Explicit source manifest; no default dataset path and no reference-file reads. */
export function loadSourceManifest(manifest){
 if(manifest?.schema!=='longmemeval-full-s-source-manifest/v1'||manifest.variant!==SOURCE.filename||manifest.source_sha256!==SOURCE.sha256||manifest.source_revision!==SOURCE.revision||!Array.isArray(manifest.rows)||manifest.rows.length!==4||manifest.rows.some((r,i)=>r.question_id!==IDS[i]))fail('fixed full-S manifest required');
 const directory=resolve(manifest.package_directory);
 const readBound=(name,digest,limit)=>{if(typeof name!=='string'||basename(name)!==name||!/^[a-f0-9]{64}$/.test(digest))fail('unsafe source binding');const path=join(directory,name),stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>limit)fail('source file bound');const raw=readFileSync(path);if(sha(raw)!==digest)fail('source hash drift');return JSON.parse(raw);};
 const receipt=readBound('acquisition.json',manifest.acquisition_sha256,1024**2);
 if(receipt.status!=='verified-source-only-projection'||receipt.pinned_upstream_source_verified!==true||receipt.source_sha256!==SOURCE.sha256||receipt.source_bytes!==SOURCE.bytes||receipt.source_revision!==SOURCE.revision||receipt.source_filename!==SOURCE.filename||receipt.source_records!==500||!Array.isArray(receipt.selected)||receipt.selected.length!==4||receipt.evaluation_references_emitted!==false)fail('unverified acquisition');
 const rows=manifest.rows.map((binding,i)=>{const source=receipt.selected.find(s=>s.question_id===IDS[i]);if(!source||binding.path!==`source-${IDS[i]}.json`||source.path!==binding.path||source.sha256!==binding.sha256)fail('source selection binding');const row=readBound(binding.path,binding.sha256,8*1024**2);validateSourceRow(row);if(row.question_id!==IDS[i])fail('row identity mismatch');if(binding.question_sha256!==sha(row.question)||binding.question_date!==row.question_date)fail('source-only question identity mismatch');return row;});
 return {rows,bindings:{manifest_sha256:sha(manifest),acquisition_sha256:manifest.acquisition_sha256,source_sha256:SOURCE.sha256,histories:rows.map(row=>({question_id:row.question_id,archive_sha256:sha(flattenHistory(row))}))},status:'source-bound-not-token-qualified'};
}
const terms=text=>new Set((text.toLowerCase().match(/[a-z0-9]+/g)??[]).filter(w=>w.length>2&&!new Set(['the','and','for','with','have','how','many','there','that','this','can','you','are','was','were','has','had','from','been','since','what','which','will','would','could','should','about','into']).has(w)));
function ranking(row,units){const q=terms(row.question);return units.map((u,index)=>({u,index,score:[...terms(u.content)].filter(t=>q.has(t)).length})).sort((a,b)=>(b.u.role==='user')-(a.u.role==='user')||b.score-a.score||a.index-b.index);}
function projection(row,ranked,chosen,initialOmitted=[]){const all=flattenHistory(row),indices=new Set(chosen.map(x=>x.index)),units=all.filter((_,i)=>indices.has(i));return {units,archive_sha256:sha(all),projection_sha256:sha(units),selected_priority_ids:ranked.filter(x=>indices.has(x.index)).map(x=>x.u.source_id),omitted_source_ids:all.filter((_,i)=>!indices.has(i)).map(x=>x.source_id),initial_omitted_source_ids:initialOmitted,all_user_turns_retained:all.filter(x=>x.role==='user').every(x=>units.some(u=>u.source_id===x.source_id)),projection_characters:JSON.stringify(units).length,policy:'all-user-priority-question-lexical-whole-turn-v1',character_unit:'JavaScript UTF-16 string length, not tokens or UTF-8 bytes'};}
export function project(row,limit=10000){if(!Number.isSafeInteger(limit)||limit<2)fail('invalid character ceiling');const ranked=ranking(row,flattenHistory(row)),chosen=[];for(const x of ranked)if(JSON.stringify([...chosen.map(y=>y.u),x.u]).length<=limit)chosen.push(x);const result=projection(row,ranked,chosen);result.initial_omitted_source_ids=[...result.omitted_source_ids];return result;}
const query=row=>({current_question_date:row.question_date,current_question:row.question});
export function answerMessages(row,{arm,notes='',projection:projected}={}){validateSourceRow(row);if(!['control','treatment'].includes(arm)||typeof notes!=='string')fail('invalid answer inputs');return [{role:'system',content:COMMON_ANSWER_SYSTEM},{role:'user',content:arm==='control'?'Retained notes:\n'+notes:JSON.stringify({archived_evidence:(projected??project(row)).units})},{role:'user',content:JSON.stringify(query(row))}];}
export function wire(messages,output_cap){if(![768,1024].includes(output_cap)||!Array.isArray(messages)||messages.some(m=>!['system','user','assistant'].includes(m.role)||typeof m.content!=='string'))fail('invalid wire');return {model:'glm-5.3-flash',messages,max_tokens:output_cap,temperature:0,stream:false,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'};}
// Prospective defaults, not a real-cohort qualification or frozen execution limit.
export const TOKENIZER_LIMITS=Object.freeze({max_calls:256,timeout_ms:900000});
const sessions=new WeakSet();
export function createTokenizerSession(meter,{max_calls=256,timeout_ms=900000}={}){
 if(typeof meter!=='function'||!Number.isSafeInteger(max_calls)||max_calls<1||!Number.isSafeInteger(timeout_ms)||timeout_ms<1||timeout_ms>2147483647)fail('invalid tokenizer budget');
 const started=performance.now();let calls=0,terminal=null,active=false;
 const snapshot=()=>({calls,max_calls,timeout_ms,elapsed_ms:Math.ceil(performance.now()-started),terminal});
 const stop=reason=>{terminal=reason;const error=Error(reason);error.tokenizer_budget=snapshot();return error;};
 const bounded=async request=>{
  if(terminal)throw stop(terminal);
  if(active)throw stop('tokenizer-session-concurrent-call');
  if(calls>=max_calls)throw stop('tokenizer-call-budget-exhausted');
  const remaining=timeout_ms-(performance.now()-started);if(remaining<=0)throw stop('tokenizer-deadline-exceeded');
  calls++;active=true;const controller=new AbortController();let timer;
  try{const reading=await Promise.race([Promise.resolve().then(()=>meter(request,{signal:controller.signal})),new Promise((_,reject)=>{timer=setTimeout(()=>{const error=stop('tokenizer-deadline-exceeded');controller.abort(error);reject(error);},remaining);})]);if(terminal)throw stop(terminal);if(performance.now()-started>=timeout_ms){const error=stop('tokenizer-deadline-exceeded');controller.abort(error);throw error;}return reading;}
  catch(error){if(!terminal)terminal='tokenizer-measurement-failed';if(error&&typeof error==='object')error.tokenizer_budget=snapshot();throw error;}
  finally{clearTimeout(timer);active=false;}
 };
 bounded.snapshot=snapshot;sessions.add(bounded);return bounded;
}
const session=(meter,limits)=>sessions.has(meter)?meter:createTokenizerSession(meter,limits);
async function measure(messages,cap,meter){if(typeof meter!=='function')fail('explicit actual-wire meter required');const request=wire(messages,cap),digest=sha(request),reading=await meter(request);if(!Number.isSafeInteger(reading?.input_tokens)||reading.input_tokens<0||reading.wire_sha256!==digest)fail('unbound tokenizer measurement');return {request,wire_sha256:digest,input_tokens:reading.input_tokens,output_reserve:cap};}
/** Fresh measurement, not a planning estimate; does not dispatch or grant effects. */
export async function admitActualWire(messages,cap,meter){const measured=await measure(messages,cap,session(meter));return {...measured,admitted:measured.input_tokens<=6976&&measured.input_tokens+cap<=8000,reason:measured.input_tokens<=6976&&measured.input_tokens+cap<=8000?'within-8000':'actual-wire-over-budget'};}
/** Optional deterministic fit step: remove lowest priority selected whole turns only. */
export async function fitProjection(row,meter,{limit=10000,tokenizer_limits}={}){
 meter=session(meter,tokenizer_limits);
 const initial=project(row,limit),ranked=ranking(row,flattenHistory(row));let chosen=ranked.filter(x=>initial.selected_priority_ids.includes(x.u.source_id));const measurements=[],removed=[];
 while(true){const selected=projection(row,ranked,chosen,initial.omitted_source_ids),messages=answerMessages(row,{arm:'treatment',projection:selected}),admission=await admitActualWire(messages,1024,meter);measurements.push({wire_sha256:admission.wire_sha256,input_tokens:admission.input_tokens,admitted:admission.admitted});if(admission.admitted)return {...selected,fit_removed_source_ids:removed,measurements,admission};if(!chosen.length)return {...selected,fit_removed_source_ids:removed,measurements,admission};removed.push(chosen.pop().u.source_id);}
}
/** Query-free original-source-order whole-turn planning. Carry is an estimate; actual notes must be remeasured. */
export async function planIngestion(row,meter,{proposal_characters=16000,tokenizer_limits}={}){
 if(!Number.isSafeInteger(proposal_characters)||proposal_characters<2)fail('invalid proposal character heuristic');
 meter=session(meter,tokenizer_limits);
 const units=flattenHistory(row),chunks=[],measurements=[],proposals=[];let current=[],characters=2;
 // Linear source walk; UTF-16 serialized characters propose boundaries only.
 for(const unit of units){const length=JSON.stringify(unit).length;if(current.length&&characters+1+length>proposal_characters){proposals.push(current);current=[];characters=2;}characters+=length+(current.length?1:0);current.push(unit);}
 if(current.length)proposals.push(current);
 const fit=async chunk=>{
  const m=await measure(ingestionMessages(chunk,'control',''),768,meter),carry=chunks.length?768:0;
  const fits=m.input_tokens+carry<=6976&&m.input_tokens+carry+768<=8000;
  measurements.push({source_ids:chunk.map(x=>x.source_id),wire_sha256:m.wire_sha256,input_tokens:m.input_tokens,carry_estimate:carry,fits});
  if(fits){chunks.push(chunk);return null;}
  if(chunk.length===1)return chunk[0].source_id;
  const midpoint=Math.floor(chunk.length/2);
  return await fit(chunk.slice(0,midpoint))??await fit(chunk.slice(midpoint));
 };
 for(const proposal of proposals){const unfit=await fit(proposal);if(unfit!==null)return {admitted:false,reason:'unfit-whole-turn',unfit_source_id:unfit,chunks,measurements,coverage_complete:false,archive_sha256:sha(units),tokenizer_budget:meter.snapshot()};}
 if(sha(chunks.flat())!==sha(units))fail('ingestion coverage violation');
 return {admitted:true,chunks,measurements,coverage_complete:true,archive_sha256:sha(units),chunk_count:chunks.length,carry_estimate:768,actual_dispatch_remeasurement_required:true,reservation_tokens:7744*chunks.length,proposal_count:proposals.length,proposal_characters,proposal_unit:'JavaScript UTF-16 serialized string length; heuristic only',tokenizer_budget:meter.snapshot()};
}
export async function planConfirmation(rows,meter,{tokenizer_limits,proposal_characters=16000}={}){
 meter=session(meter,tokenizer_limits);
 if(!Array.isArray(rows)||rows.length!==4||rows.some((r,i)=>r.question_id!==IDS[i]))fail('exact ordered full-S cohort required');const tasks=[];
 for(const [i,row]of rows.entries()){
  validateSourceRow(row);
  const original=await measure([{role:'user',content:JSON.stringify({history:row.haystack_sessions.map((messages,i)=>({date:row.haystack_dates[i],messages}))})}],1024,meter);
  const ingestion=await planIngestion(row,meter,{proposal_characters}),treatment=await fitProjection(row,meter),controlAnswer=await measure(answerMessages(row,{arm:'control'}),1024,meter);
  const control_answer_planning_admitted=controlAnswer.input_tokens+768<=6976;
  const generation_reservation=ingestion.admitted?7744*ingestion.chunk_count+16000:null;
  tasks.push({question_id:row.question_id,order:i%2?['treatment','control']:['control','treatment'],original_history:{input_tokens:original.input_tokens,wire_sha256:original.wire_sha256,long:original.input_tokens>8000,measurement:'history-only message framing; output reserve excluded from length'},ingestion,treatment,control_answer_planning_admitted,generation_reservation,judge_reservation:16000,total_reservation:generation_reservation===null?null:generation_reservation+16000});
 }
 const admitted=tasks.every(t=>t.original_history.long&&t.ingestion.admitted&&t.treatment.admission.admitted&&t.control_answer_planning_admitted);
 return {status:admitted?'tokenizer-planned-not-frozen':'blocked-source-or-request-qualification',admitted,tasks,planned_pairs:4,planned_answer_slots:8,maximum_pair_concurrency:2,generation_reservation:tasks.every(t=>t.generation_reservation!==null)?tasks.reduce((n,t)=>n+t.generation_reservation,0):null,judge_reservation:64000,total_reservation:tasks.every(t=>t.total_reservation!==null)?tasks.reduce((n,t)=>n+t.total_reservation,0):null,judge_prompt_admission_pending:true,actual_dispatch_remeasurement_required:true,tokenizer_measurements:tasks.reduce((n,t)=>n+2+t.ingestion.measurements.length+t.treatment.measurements.length,0),tokenizer_budget:meter.snapshot(),model_generation_calls:0};
}
export function ingestionMessages(chunk,arm,notes=''){const messages=legacyIngestionMessages(chunk,arm,notes);messages[0].content=messages[0].content.replace('next chronological conversation chunk','next conversation chunk in original source order (dates remain attached)');return messages;}
