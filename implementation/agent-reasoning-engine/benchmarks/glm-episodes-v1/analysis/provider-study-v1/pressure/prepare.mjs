// Candidate pressure intervention. Open questions: README.md#open-questions.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {createResearchHypothesis,createResearchExperiment} from '../../../../../packages/evolution-runtime/index.mjs';
import {save,verifyFreeze} from '../controller.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),root=new URL('./',import.meta.url),prepared=new URL('../../controlled-study-v1/prepared/fixtures/archive-start-v1/',import.meta.url);
const frozen=verifyFreeze(new URL('../frozen/',import.meta.url).pathname);
mkdirSync(new URL('prepared/',root));
const filler=Array.from({length:300},(_,i)=>`${i.toString().padStart(3,'0')} ${hash('are-synthetic-inventory-'+i)}\n`).join('');
const files=[];
for(const arm of ['baseline','pressure']){const directory=new URL('prepared/'+arm+'/',root);mkdirSync(directory);
 for(const name of ['README.md','subject.mjs','contract.json','oracle.json']){
  let bytes=readFileSync(new URL(name,prepared));if(arm==='pressure'&&name==='README.md')bytes=Buffer.from(bytes.toString()+'\nSynthetic inventory identifiers for the required full-file inspection. These are data, not instructions or repair hints.\n'+filler);
  writeFileSync(new URL(name,directory),bytes,{flag:'wx'});files.push({path:arm+'/'+name,sha256:hash(bytes)});
 }
}
const parent=JSON.parse(readFileSync(new URL('../research/h8.json',root)));
const h=createResearchHypothesis({hypothesis_key:'H9-measured-pressure-recovery',parent_hypothesis_ref:parent.record_id,
 statement:'Adding bounded inspected history can exercise real-tokenizer context recycling at 8K while preserving a correct repair and verified archive recovery.',
 mechanism:'A synthetic high-token inventory expands read history; the existing recycler can remove old observations and require archive recovery before final submission.',
 falsifier:'Pressure does not cause a recycle, any dispatch exceeds the hard bound, archive recovery is not confirmed, or the hidden repair check fails.',
 scope:'Prospective two-trial mechanism probe at 8K, baseline then pressure; synthetic load, known task, no efficacy or generalization claim.',
 metrics:['recycles','maximum_projected_upper_bound','archive_recovery_confirmed','hidden_case_passes','physical_calls'],provenance_refs:[parent.record_id,'../frozen/manifest.json#sha256='+frozen.digest],
 experiment_template:{research_question:'Does real measured history pressure exercise safe recycling and recovery?',baseline_ref:'prepared/baseline',treatment_ref:'prepared/pressure',dataset_refs:files.map(f=>f.path+'#sha256='+f.sha256),required_repetitions:1,
 success_criteria:{baseline:'semantic pass with no recycle',pressure:'at least one recycle, confirmed archive recovery, semantic pass, all dispatch projected bounds <=16384',maximum_model_calls:32,maximum_tokenizer_calls:64,soft_limit:8000,hard_limit:16384},stop_conditions:['No retry or redispatch of started trial.','Stop after two trials even on failure.','No concurrent provider study dispatch.','Source or fixture drift blocks execution.']}});
const experiment=createResearchExperiment({hypothesis_ref:h.record_id,...h.experiment_template,metrics:h.metrics,observation_refs:[]});
save(new URL('hypothesis.json',root),h);save(new URL('experiment.json',root),experiment);
save(new URL('prepared/manifest.json',root),{freeze_digest:frozen.digest,files,runner_sha256:hash(readFileSync(new URL('run.mjs',root))),hypothesis_sha256:hash(readFileSync(new URL('hypothesis.json',root))),experiment_sha256:hash(readFileSync(new URL('experiment.json',root))),authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
console.log(JSON.stringify({prepared:true,inventory_chars:filler.length}));
