// Create-only offline study preparation. Open questions: README.md#open-questions.
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {archiveSpec,retentionSpec} from '../offline-audit-v1/audit.mjs';
import {arms,cards} from './treatments.mjs';
const base=new URL('../../',import.meta.url),sha=x=>createHash('sha256').update(x).digest('hex');
const read=p=>readFileSync(new URL(p,base),'utf8');
const capture=(fn,args)=>{try{return {ok:true,value:fn(...structuredClone(args))};}catch(e){return {ok:false,error:e.message};}};
const exchange=(ids,results=ids)=>({messages:[{role:'assistant',tool_calls:ids.map(id=>({id,type:'function',function:{name:'read_file',arguments:'{}'}}))},...results.map(id=>({role:'tool',tool_call_id:id,content:'unseen value '+id}))]});
export function definitions(){
 const archive=read('fixtures/archive-slice-bounds/reference.mjs'),retention=read('fixtures/retention-tool-pairs/reference.mjs');
 return [
  {id:'archive-start-v1',family:'archive',reference:archive,subject:archive.replace(" need(!splitPair(offset),'inspection-range-splits-unicode');",''),cases:[['PQ🧭RS',3,2],['PQ🧭RS',0,3],['🧭🧩',0,1],['PQ🧭RS',6,1],['mno',1,1],['PQ🧭RS',2,2]]},
  {id:'archive-end-v1',family:'archive',reference:archive,subject:archive.replace(' if(splitPair(end))end--;',''),cases:[['uvw🧩t',0,4],['uvw🧩t',4,2],['🧩🧭',2,1],['uvw🧩t',6,2],['rstuv',2,2],['uvw🧩t',3,2]]},
  {id:'retention-empty-v1',family:'retention',reference:retention,subject:retention.replace('Array.isArray(history) && history.length <= 12','Array.isArray(history) && history.length > 0 && history.length <= 12'),cases:[[[],'d'.repeat(64),2],[[exchange(['new-A','new-B'])],'d'.repeat(64),2],[[exchange(['dup-Z','dup-Z'])],'d'.repeat(64),2],[[exchange(['left-X','right-X'],['right-X','left-X'])],'d'.repeat(64),1],[[exchange(['old-K']),exchange(['new-K'])],'d'.repeat(64),1],[[exchange(['solo-Y'])],'d'.repeat(64),0]]},
  {id:'retention-order-v1',family:'retention',reference:retention,subject:retention.replace('message.tool_call_id === ids[index]','ids.includes(message.tool_call_id)'),cases:[[[exchange(['alpha-Q','beta-Q'],['beta-Q','alpha-Q'])],'e'.repeat(64),1],[[exchange(['alpha-Q','beta-Q'])],'e'.repeat(64),1],[[],'e'.repeat(64),0],[[exchange(['dup-Q','dup-Q'])],'e'.repeat(64),1],[[exchange(['old-J']),exchange(['new-J'])],'e'.repeat(64),1],[[exchange(['single-J'],['foreign-J'])],'e'.repeat(64),1]]}
 ];
}
export function schedule(){
 const rows=[];let block=0;
 for(const repetition of [1,2])for(const soft of [8000,10000,12000])for(const f of definitions()){
  const order=arms.map((_,i)=>arms[(i+block)%arms.length]);
  for(const [position,arm] of order.entries())rows.push({id:`b${block}-${arm}`,block,fixture:f.id,family:f.family,repetition,soft_limit:soft,position,arm,maximum_model_attempts:soft===8000?16:12,maximum_tokenizer_attempts:soft===8000?32:24});block++;
 }
 return rows;
}
async function main(){
 if(process.argv.length!==3)throw Error('provide new output directory');const out=resolve(process.argv[2]);mkdirSync(out);
 const write=(p,x)=>writeFileSync(join(out,p),typeof x==='string'?x:JSON.stringify(x,null,2)+'\n',{flag:'wx'});
 const validation=[];
 for(const f of definitions()){
  if(f.reference===f.subject)throw Error('mutation missing '+f.id);
  const directory='fixtures/'+f.id;mkdirSync(join(out,directory),{recursive:true});
  const sourceFamily=f.family==='archive'?'archive-slice-bounds':'retention-tool-pairs';
  const contract=JSON.parse(read('fixtures/'+sourceFamily+'/contract.json'));
  write(directory+'/subject.mjs',f.subject);write(directory+'/reference.mjs',f.reference);
  write(directory+'/contract.json',{requirements:contract.requirements,open_questions_ref:'../../../README.md#open-questions'});
  write(directory+'/README.md',`# ${f.id}\n\nRestore the inspected contract in subject.mjs. Only subject.mjs may change. Read this file, subject.mjs and contract.json before submitting a proposal. Preserve all unrelated behavior. Do not claim tests ran.\n\n## Open Questions\n\nOwned by ../../../README.md#open-questions.\n`);
  const fn=f.family==='archive'?archiveSpec:retentionSpec,name=f.family==='archive'?'sliceInspection':'projectObservations';
  const cases=f.cases.map((args,i)=>({id:`${f.id}-${i}`,export_name:name,args,expected:capture(fn,args)}));
  const old=JSON.parse(read('fixtures/'+sourceFamily+'/oracle.json'));
  if(cases.some(c=>old.some(o=>JSON.stringify(c.args)===JSON.stringify(o.args))))throw Error('old case reused');
  write(directory+'/oracle.json',cases);
  const ref=await import(pathToFileURL(join(out,directory,'reference.mjs'))),mutant=await import(pathToFileURL(join(out,directory,'subject.mjs')));
  let rejected=0;
  for(const c of cases){if(JSON.stringify(capture(ref[name],c.args))!==JSON.stringify(c.expected))throw Error('reference disagreement');if(JSON.stringify(capture(mutant[name],c.args))!==JSON.stringify(c.expected))rejected++;}
  if(!rejected)throw Error('undetected mutant');
  write(directory+'/task.json',{id:f.id,family:f.family,observation_allowlist:['README.md','subject.mjs','contract.json'],mutation_allowlist:['subject.mjs'],excluded_from_model:['oracle.json','reference.mjs','task.json'],evaluation_role:'held-out case variant in known family; not a new task family',open_questions_ref:'../../../README.md#open-questions'});
  validation.push({fixture:f.id,reference_passed:cases.length,mutant_failures:rejected,old_exact_cases_reused:0});
 }
 const rows=schedule();write('schedule.json',rows);write('cards.json',cards);
 write('protocol.json',{schema_version:'are.glm-controlled-screening-design/v1',status:'candidate-offline-prepared',hypotheses:['H2','H3'],model:'glm-5.3-flash',completion_policy:'example-fields-v20',source_policy:'inspected-mutation-v1',retention_policy:'recent-observations-v2',hard_limit:16384,output_cap:2048,reasoning_effort:'low',concurrency:1,model_timeout_ms:60000,maximum_model_retries:0,maximum_corrections:0,rows:rows.length,blocks:24,arms,
  limits:{maximum_model_attempts:rows.reduce((s,r)=>s+r.maximum_model_attempts,0),maximum_tokenizer_attempts:rows.reduce((s,r)=>s+r.maximum_tokenizer_attempts,0)},
  comparisons:[['metadata-card','baseline'],['host-envelope','baseline'],['boundary-card','neutral-card']],
  endpoint:'initial semantic correctness plus valid declared output contract; all dispatch failures count against end-to-end success',
  reported_separately:['native model-contract validity','full normalized validity','metadata fidelity only for full-contract arms','semantic success conditional on readable source, descriptive only','token usage with unknowns','latency including failures'],
  screening_rule:{minimum_net_paired_wins:3,paired_blocks:24,semantic_losses_allowed_for_envelope_or_metadata:0,interpretation:'Exploratory prioritization only; repeated cases and four fixture clusters do not support general-population efficacy claims.'},
  order:'24 sequential matched blocks; five-arm cyclic rotation; each arm occupies each position four or five times. Finish a block before starting another.',
  stop_conditions:['Stop on source, fixture, prompt or scorer drift; retain evidence.','Stop at fixed physical-call caps; no replacement of failed trials.','Infrastructure stop leaves incomplete pairs visible; no success claim.'],
  execution_blockers:['Live harness must route decorated body through tokenizer and transport before dispatch and bind normalization to assigned arm.','Bind tokenizer-measured neutral/boundary prompt lengths; current text is not claimed token-matched.','Freeze actual candidate source, full render hashes, fixture materialization hashes, endpoint identity and schedule before first provider call.','Validate sandboxed hidden oracle execution and deny model access to oracle/reference/task metadata.'],authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
 const files=[];const walk=p=>{for(const e of readdirSync(join(out,p),{withFileTypes:true})){const q=join(p,e.name);if(e.isDirectory())walk(q);else files.push({path:q,sha256:sha(readFileSync(join(out,q)))});}};walk('');
 write('manifest.json',{files,source_hashes:['prepare.mjs','treatments.mjs','../offline-audit-v1/audit.mjs'].map(p=>({path:p,sha256:sha(readFileSync(new URL(p,import.meta.url)))})),validation,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
 console.log(JSON.stringify({rows:rows.length,validation,model_cap:rows.reduce((s,r)=>s+r.maximum_model_attempts,0)}));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main();
