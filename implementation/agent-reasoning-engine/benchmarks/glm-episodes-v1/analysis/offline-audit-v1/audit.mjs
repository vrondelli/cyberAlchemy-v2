// Offline diagnostic only. Open questions: README.md#open-questions.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {resolve,relative} from 'node:path';
import {publicCheckPlan} from '../../public-checks.mjs';
import {submissionTool} from '../../../../packages/coding-agent-runtime/glm-flash-v1/submission.mjs';
import {diagnosePatch} from '../../../../packages/coding-agent-runtime/patch-schema.mjs';
const root=new URL('../../',import.meta.url), sha=x=>createHash('sha256').update(x).digest('hex');
const inputs=new Map();
function bytes(url){const b=readFileSync(url);inputs.set(url.href,sha(b));return b;}
const json=url=>JSON.parse(bytes(url));
const capture=(fn,args)=>{const copy=structuredClone(args);let result;try{result={ok:true,value:fn(...copy)};}catch(e){result={ok:false,error:e.message};}return isDeepStrictEqual(copy,args)?result:{ok:false,error:'candidate-mutated-input'};};
const reject=code=>{throw Error(code);};
// Independent specification: enumerate legal UTF-16 cut positions via code-point widths.
export function archiveSpec(text,offset=0,width=1024){
 if(typeof text!=='string')reject('inspection-text-invalid');
 if(!Number.isSafeInteger(offset)||offset<0||offset>text.length||!Number.isSafeInteger(width)||width<1||width>1024)reject('inspection-range-invalid');
 const cuts=[0];for(const cp of text)cuts.push(cuts.at(-1)+cp.length);
 if(!cuts.includes(offset))reject('inspection-range-splits-unicode');
 const end=cuts.filter(x=>x>=offset&&x<=Math.min(text.length,offset+width)).at(-1);
 if(end===offset&&offset!==text.length)reject('inspection-range-splits-unicode');
 return {offset_unit:'utf16-code-units',offset,next_offset:end,total_chars:text.length,eof:end===text.length,utf8:text.substring(offset,end)};
}
// Independent validation and projection passes; declarative positional pairs.
export function retentionSpec(history,ref,recent){
 if(!Array.isArray(history)||history.length>12||typeof ref!=='string'||!/^[a-f0-9]{64}$/.test(ref))reject('retention-history-invalid');
 for(const entry of history){
  const m=entry?.messages,c=m?.[0]?.tool_calls;
  if(!Array.isArray(c)||!c.length||m[0].role!=='assistant'||m.length!==c.length+1)reject('retention-tool-pair-invalid');
  const ids=c.map(x=>x.id);
  if(ids.some((x,i)=>typeof x!=='string'||x.length===0||ids.indexOf(x)!==i))reject('retention-tool-pair-invalid');
  if(c.some((x,i)=>m[i+1]?.role!=='tool'||m[i+1]?.tool_call_id!==x.id||typeof m[i+1]?.content!=='string'))reject('retention-tool-pair-invalid');
 }
 return structuredClone(history).map((entry,i)=>{
  if(i>=history.length-recent)return entry;
  for(const m of entry.messages.slice(1))m.content=JSON.stringify({are_observation_masked:true,history_ref:ref,history_step:i+1,original_content_sha256:sha(m.content),recovery:'Original result is available through read-context-evidence.',tool_call_id:m.tool_call_id});
  return entry;
 });
}
export async function audit(){
 inputs.clear();bytes(new URL('audit.mjs',import.meta.url));
 const trialPath=new URL('analysis/snapshots/2026-09-09-final/trials.jsonl',root);
 const trials=bytes(trialPath).toString().trim().split('\n').map(JSON.parse).filter(r=>r.cohort==='qualification-complete');
 const failures=trials.filter(r=>r.schema_ok===false),schemaRows=[];
 for(const r of failures){
  const trace=json(new URL('evidence/'+r.trace_ref,root)),e=trace.final_response_evidence;
  if(e.truncated||sha(e.text)!==e.text_sha256)throw Error('response evidence mismatch');
  const d=diagnosePatch(e.text),v=JSON.parse(e.text);
  const issues=d.issues.map(x=>[x.instance_path,x.keyword]).sort();
  if(!isDeepStrictEqual(issues,r.schema_issues.map(x=>[x.instance_path,x.keyword]).sort()))throw Error('diagnostic drift');
  schemaRows.push({trial:r.key,trace_ref:r.trace_ref,text_sha256:e.text_sha256,issues,omitted_fields:d.issues.filter(x=>x.keyword==='required').map(x=>x.expected.field),public_before_ok:r.public_before_ok,
   full_request_body_available:false,model_request_hashes:trace.receipts.filter(x=>x.kind==='model').map(x=>x.request_sha256)});
 }
 const base={tree_sha256:'a'.repeat(64),files:{'src/subject.mjs':'b'.repeat(64)}};
 const tool=submissionTool(base,['src/subject.mjs']);
 const valid={schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'src/subject.mjs',expected_file_sha256:base.files['src/subject.mjs'],utf8:'export const x=1;'}],rationale:'audit',authority_effect:'none'};
 const schemaControls=[{name:'valid',expected:true,actual:diagnosePatch(valid).ok}];
 for(const field of tool.function.parameters.required){const v=structuredClone(valid);delete v[field];schemaControls.push({name:'omit/'+field,expected:false,actual:diagnosePatch(v).ok});}
 for(const field of tool.function.parameters.properties.changes.items.required){const v=structuredClone(valid);delete v.changes[0][field];schemaControls.push({name:'omit/changes/0/'+field,expected:false,actual:diagnosePatch(v).ok});}
 const semantic=[];
 for(const family of ['archive-slice-bounds','retention-tool-pairs','retention-long-window']){
  const dir=new URL('fixtures/'+family+'/',root),oracle=json(new URL('oracle.json',dir));
  bytes(new URL('reference.mjs',dir));bytes(new URL('mutant.mjs',dir));bytes(new URL('cases.json',dir));bytes(new URL('contract.json',dir));
  const ref=await import(new URL('reference.mjs',dir)),mutant=await import(new URL('mutant.mjs',dir));
  const spec=family==='archive-slice-bounds'?archiveSpec:retentionSpec;
  const publicPlan=publicCheckPlan(family,new URL('cases.json',dir).pathname);
  const disagreements=[];let referenceFailures=0,mutantRejected=0;
  for(const [suite,cases] of [['public',publicPlan.checks],['oracle',oracle]])for(const c of cases){
   const expected=capture(spec,c.args);if(!isDeepStrictEqual(expected,c.expected))disagreements.push({suite,id:c.id,expected,recorded:c.expected});
   if(!isDeepStrictEqual(capture(ref[c.export_name],c.args),c.expected))referenceFailures++;
   if(!isDeepStrictEqual(capture(mutant[c.export_name],c.args),c.expected))mutantRejected++;
  }
  let expanded=0,expandedDisagreements=0;
  if(family==='archive-slice-bounds')for(const text of ['', 'abc','😀','A😀B','😀😀','x\ud800y','x\udc00y'])for(let offset=-1;offset<=text.length+1;offset++)for(const width of [0,1,2,3,1024,1025]){
   expanded++;if(!isDeepStrictEqual(capture(spec,[text,offset,width]),capture(ref.sliceInspection,[text,offset,width])))expandedDisagreements++;
  }
  if(family!=='archive-slice-bounds')for(let count=0;count<=12;count++)for(const recent of [0,1,2,12]){
   const history=Array.from({length:count},(_,i)=>({messages:[{role:'assistant',tool_calls:[{id:'id'+i}]},{role:'tool',tool_call_id:'id'+i,content:'value'+i}]}));
   expanded++;const args=[history,'c'.repeat(64),recent];if(!isDeepStrictEqual(capture(spec,args),capture(ref.projectObservations,args)))expandedDisagreements++;
  }
  const mutations=family==='archive-slice-bounds'?[
   ['allow-interior-start',(t,o,w)=>o===3?archiveSpec(t,2,w):archiveSpec(t,o,w)],
   ['allow-split-end',(t,o,w)=>({offset_unit:'utf16-code-units',offset:o,next_offset:Math.min(t.length,o+w),total_chars:t.length,eof:o+w>=t.length,utf8:t.slice(o,o+w)})],
   ['allow-no-progress',(t,o,w)=>t==='😀'&&w===1?{offset_unit:'utf16-code-units',offset:o,next_offset:o,total_chars:2,eof:false,utf8:''}:archiveSpec(t,o,w)]
  ]:[['reject-empty',(h,r,n)=>{if(!h.length)reject('retention-history-invalid');return retentionSpec(h,r,n);}],['skip-pair-validation',h=>h]];
  const controls=mutations.map(([name,fn])=>({name,rejected_by:publicPlan.checks.filter(c=>!isDeepStrictEqual(capture(fn,c.args),c.expected)).map(c=>c.id)}));
  semantic.push({family,public_checks:publicPlan.checks.length,oracle_checks:oracle.length,disagreements,referenceFailures,mutantRejected,expanded,expandedDisagreements,controls});
 }
 for(const p of ['public-checks.mjs','../../packages/coding-agent-runtime/patch-schema.mjs','../../packages/coding-agent-runtime/schemas/patch-set-candidate.schema.json','../../packages/coding-agent-runtime/glm-flash-v1/submission.mjs','../../packages/coding-agent-runtime/glm-flash-v1/agent.mjs','../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs'])bytes(new URL(p,root));
 const auditedSources=[...inputs];const freezeComparisons=[];
 for(const campaign of [...new Set(trials.map(r=>r.campaign))]){
  const manifest=json(new URL('evidence/'+campaign+'/run/manifest.json',root));
  const comparisons=auditedSources.filter(([url])=>!url.includes('/evidence/')&&!url.includes('/analysis/')).map(([url,current])=>{const path=new URL(url).pathname;const frozen=manifest.sources.find(s=>s.path===path);return {path,frozen_sha256:frozen?.sha256??null,current_sha256:current,match:frozen?frozen.sha256===current:null};});
  freezeComparisons.push({campaign,comparisons});
 }
 return {schema_version:'are.glm-offline-audit/v1',qualification_trials:trials.length,freezeComparisons,schema_failures:schemaRows,
  native_schema:{required:tool.function.parameters.required,strict:tool.function.strict??null,claim:'Current builder; historical exact request bytes unavailable in selected exports.'},schemaControls,semantic,
  checks_passed:schemaControls.every(c=>c.actual===c.expected)&&semantic.every(s=>!s.disagreements.length&&!s.referenceFailures&&!s.expandedDisagreements&&s.controls.every(c=>c.rejected_by.length)),
  input_hashes:[...inputs].map(([url,sha256])=>({path:relative(root.pathname,new URL(url).pathname),sha256})),
  limitations:['No retained model code was executed.','Historical dispatched body reconstruction is not established by request hashes.','Independent specification is a second authored interpretation, not a formal proof.','Freeze comparisons explicitly identify source differences and missing bindings; only matching sources support historical equivalence.'],
  authority_effect:'none',open_questions_ref:'README.md#open-questions'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 if(process.argv.length!==3)throw Error('provide new output path');const result=await audit();writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({checks_passed:result.checks_passed,schema_failures:result.schema_failures.length,semantic:result.semantic}));if(!result.checks_passed)process.exitCode=1;
}
