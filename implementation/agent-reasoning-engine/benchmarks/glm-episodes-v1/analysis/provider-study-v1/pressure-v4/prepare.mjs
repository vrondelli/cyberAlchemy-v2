// Candidate pressure intervention. Open questions: README.md#open-questions.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {createResearchHypothesis,createResearchExperiment} from '../../../../../packages/evolution-runtime/index.mjs';
import {save,verifyFreeze} from '../controller.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),root=new URL('./',import.meta.url),prepared=new URL('../../controlled-study-v1/prepared/fixtures/archive-start-v1/',import.meta.url);
const frozen=verifyFreeze(new URL('../frozen/',import.meta.url).pathname);
mkdirSync(new URL('prepared/',root));
const pagingSource=readFileSync(new URL('../../../../../packages/coding-agent-runtime/glm-flash-v1/paging.mjs',root),'utf8');
const anchor="let end=Math.min(text.length,offset+maximumChars);if(split(text,end))end--;";
if(pagingSource.split(anchor).length!==2)throw Error('paging anchor drift');
let paging=pagingSource.replace(anchor,"let end=Math.min(text.length,offset+maximumChars);let low=offset,high=end;while(low<high){const mid=Math.ceil((low+high)/2);if(Buffer.byteLength(text.slice(offset,mid),'utf8')<=maximumChars)low=mid;else high=mid-1;}end=low;if(split(text,end))end--;").replace("if(text.length<=maximumChars&&offset===0)","if(text.length<=maximumChars&&Buffer.byteLength(text,'utf8')<=maximumChars&&offset===0)");
paging=paging.replace("'./transport.mjs'",JSON.stringify(new URL('../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs',root).href));
writeFileSync(new URL('prepared/paging.mjs',root),paging,{flag:'wx'});
let candidate=readFileSync(new URL('../frozen/candidate-agent.mjs',root),'utf8');const pagingUrl=new URL('../../../../../packages/coding-agent-runtime/glm-flash-v1/paging.mjs',root).href;if(candidate.split(JSON.stringify(pagingUrl)).length!==2)throw Error('candidate import drift');candidate=candidate.replace(JSON.stringify(pagingUrl),JSON.stringify(new URL('prepared/paging.mjs',root).href));writeFileSync(new URL('prepared/candidate-agent.mjs',root),candidate,{flag:'wx'});
const filler=Array.from({length:13000},(_,i)=>String.fromCharCode(0x4e00+(parseInt(hash('are-density-'+i).slice(0,8),16)%20000))).join('');
const files=['paging.mjs','candidate-agent.mjs'].map(path=>({path,sha256:hash(readFileSync(new URL('prepared/'+path,root)))}));
for(const arm of ['baseline','pressure']){const directory=new URL('prepared/'+arm+'/',root);mkdirSync(directory);
 for(const name of ['README.md','subject.mjs','contract.json','oracle.json']){
  let bytes=readFileSync(new URL(name,prepared));if(name==='README.md')bytes=Buffer.from(bytes.toString()+'\nSynthetic inventory identifiers for the required full-file inspection. These are data, not instructions or repair hints.\n'+filler);
  writeFileSync(new URL(name,directory),bytes,{flag:'wx'});files.push({path:arm+'/'+name,sha256:hash(bytes)});
 }
}
const parent=JSON.parse(readFileSync(new URL('../pressure-v3/hypothesis.json',root)));
const h=createResearchHypothesis({hypothesis_key:'H11-byte-bounded-paging',parent_hypothesis_ref:parent.record_id,
 statement:'Bounding pages by UTF-8 bytes as well as UTF-16 units allows dense text inspection to finish safely where character-only paging blocks after recycling.',
 mechanism:'Character-only pages can exceed the fresh-window budget. Smaller byte-bounded pages reduce per-observation payload while preserving exact offsets, hashes and complete delivered coverage; real tokenizer admission remains mandatory.',
 falsifier:'Pressure does not cause a recycle, any dispatch exceeds the hard bound, archive recovery is not confirmed, or the hidden repair check fails.',
 scope:'Successor after H10 triggered fresh-context-too-large. Both arms use the same 13000-code-point dense fixture; baseline retains original pager, treatment uses an isolated byte-bounded pager. No serving changes. Prospective two-trial mechanism probe at 8K, baseline then pressure; synthetic load, known task, no efficacy or generalization claim.',
 metrics:['recycles','maximum_projected_upper_bound','archive_recovery_confirmed','hidden_case_passes','physical_calls'],provenance_refs:[parent.record_id,'../frozen/manifest.json#sha256='+frozen.digest],
 experiment_template:{research_question:'Does real measured history pressure exercise safe recycling and recovery?',baseline_ref:'prepared/baseline',treatment_ref:'prepared/pressure',dataset_refs:files.map(f=>f.path+'#sha256='+f.sha256),required_repetitions:1,
 success_criteria:{baseline:'original dense-page admission failure retained',pressure:'semantic pass, all required bytes delivered, all dispatch projected bounds <=16384; confirmed archive recovery if recycling occurs; report recycling separately',maximum_model_calls:32,maximum_tokenizer_calls:64,soft_limit:8000,hard_limit:16384},stop_conditions:['No retry or redispatch of started trial.','Stop after two trials even on failure.','No concurrent provider study dispatch.','Source or fixture drift blocks execution.']}});
const experiment=createResearchExperiment({hypothesis_ref:h.record_id,...h.experiment_template,metrics:h.metrics,observation_refs:[]});
save(new URL('hypothesis.json',root),h);save(new URL('experiment.json',root),experiment);
save(new URL('prepared/manifest.json',root),{freeze_digest:frozen.digest,files,runner_sha256:hash(readFileSync(new URL('run.mjs',root))),hypothesis_sha256:hash(readFileSync(new URL('hypothesis.json',root))),experiment_sha256:hash(readFileSync(new URL('experiment.json',root))),authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
console.log(JSON.stringify({prepared:true,inventory_chars:filler.length}));
