import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {sha} from './shared/provider.mjs';
const dir=import.meta.dirname,json=p=>JSON.parse(readFileSync(join(dir,p))),bindings=[];
const source=p=>{bindings.push({path:p,sha256:sha(readFileSync(join(dir,p)))});return json(p);};
const a=source('longmemeval-sequential-v2/finish-independent-control/RESULTS.json');
const c=source('selectivity-v2/RESULTS.json');
const gold=source('longmemeval/gold.json');
const acategories={};
for(const task of [...new Set(a.rows.map(r=>r.task_id))]){
 const g=gold.find(g=>g.task_id===task),category=g.abstention?'abstention':g.question_type;
 acategories[category]=Object.fromEntries(['control','treatment'].map(arm=>[arm,{correct:a.rows.filter(r=>r.task_id===task&&r.arm===arm&&r.review.pass).length,planned:2,completed:a.rows.filter(r=>r.task_id===task&&r.arm===arm).length}]));
}
const paired=(rows,key,pass)=>{
 const groups=new Map();for(const r of rows){const k=key(r);if(!groups.has(k))groups.set(k,{});assert.equal(groups.get(k)[r.arm],undefined);groups.get(k)[r.arm]=pass(r);}
 const out={both_pass:0,control_only:0,treatment_only:0,both_fail:0};
 for(const v of groups.values()){assert.deepEqual(Object.keys(v).sort(),['control','treatment']);out[v.control?(v.treatment?'both_pass':'control_only'):(v.treatment?'treatment_only':'both_fail')]++;}
 return out;
};
const apairs=paired([...a.rows,{...a.failed_slot,review:{pass:false}}],r=>r.task_id+':'+r.repetition,r=>r.review.pass);
assert.deepEqual(apairs,{both_pass:3,control_only:3,treatment_only:0,both_fail:2});
const cm={};
for(const arm of ['control','treatment']){
 const rows=c.rows.filter(r=>r.arm===arm),applications=rows.filter(r=>['apply','change'].includes(r.score.category)),suppression=rows.filter(r=>r.task_id.includes('suppress')||r.task_id.includes('override'));
 // Supplementary blinded classifications: both r2 override answers explicitly
 // choose DAG against plain-text request. Preserve exact output hashes and judgments.
 const misapplications=[];
 for(const r of suppression){
  const receipt=source('selectivity-v2/live/'+r.id+'-receipt.json');
  const wrong=r.task_id.endsWith('override')&&r.repetition===2;
  if(wrong){assert.equal(r.semantic_review.semantic_pass,false);assert.match(receipt.output,/dag/i);misapplications.push({call_id:r.id,output_sha256:sha(receipt.output),blind_reason:r.semantic_review.reason});}
 }
 cm[arm]={appropriate_application:{correct:applications.filter(r=>r.combined_pass).length,opportunities:applications.length},misapplication:{count:misapplications.length,opportunities:suppression.length,labels:misapplications}};
}
const archives={};
for(const path of ['selectivity/live','selectivity-v2/live','transport-diagnostic-v1','transport-diagnostic-v2','transport-diagnostic-v3','longmemeval-sequential-v1/live','longmemeval-sequential-v2/live','longmemeval-sequential-v2/recovery-v1/live','longmemeval-sequential-v2/finish-independent-control/live']){
 const receipts=readdirSync(join(dir,path)).filter(f=>f.endsWith('-receipt.json')).map(f=>json(path+'/'+f)).filter(r=>r.kind==='model');
 let known_tokens=0,unknown_usage=0;
 for(const r of receipts){const u=r.usage;if(u){assert.ok(Number.isSafeInteger(u.prompt_tokens)&&u.prompt_tokens>=0);assert.ok(Number.isSafeInteger(u.completion_tokens)&&u.completion_tokens>=0);assert.equal(u.total_tokens,u.prompt_tokens+u.completion_tokens);known_tokens+=u.total_tokens;}else unknown_usage++;}
 archives[path]={attempts:receipts.length,successful:receipts.filter(r=>r.ok).length,known_tokens,unknown_usage};
}
const atotal=Object.entries(archives).filter(([p])=>p.startsWith('longmemeval')).reduce((s,[,v])=>s+v.known_tokens,0);
assert.equal(atotal,152973);assert.equal(atotal,a.whole_branch_tokens);assert.equal(archives['selectivity-v2/live'].known_tokens,6059);
const livePaths=['longmemeval-sequential-v2/live','longmemeval-sequential-v2/recovery-v1/live','longmemeval-sequential-v2/finish-independent-control/live'];
const ids=livePaths.flatMap(p=>readdirSync(join(dir,p)).filter(f=>f.endsWith('-receipt.json')).map(f=>json(p+'/'+f)).filter(r=>r.kind==='model').map(r=>r.id));
assert.equal(ids.length,62);assert.equal(new Set(ids).size,62);
const result={status:'verified-derived-analysis',source_bindings:bindings,longmemeval:{categories:acategories,paired_task_outcomes:apairs,planned_pairs:8,independent_tasks:4,model_attempts_in_amended_protocol:62,whole_branch_tokens:atotal},selectivity:{supplementary_metrics:cm,semantic_pairs:paired(c.rows,r=>r.task_id+':'+r.repetition,r=>r.semantic_review.semantic_pass),combined_pairs:paired(c.rows,r=>r.task_id+':'+r.repetition,r=>r.combined_pass)},provider_archives:archives,known_tokens_all_branches:atotal+6059,unknown_usage_attempts:Object.values(archives).reduce((s,v)=>s+v.unknown_usage,0),exact_whole_episode_tokens:null,authority_effect:'none'};
const bytes=JSON.stringify(result,null,2)+'\n';if(process.argv.includes('--check'))assert.equal(readFileSync(join(dir,'PAIRED-ANALYSIS.json'),'utf8'),bytes);else writeFileSync(join(dir,'PAIRED-ANALYSIS.json'),bytes,{flag:'wx'});
console.log(JSON.stringify({verified:true,longmemeval_pairs:apairs,known_tokens:result.known_tokens_all_branches,unknown_usage_attempts:result.unknown_usage_attempts}));
