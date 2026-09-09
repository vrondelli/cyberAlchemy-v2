// Immutable live evidence review. Open questions: README.md#open-questions.
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {verifyFreeze,trialState} from '../controller.mjs';
import {parseBoundedJSON,diagnosePatch} from '../../../../../packages/coding-agent-runtime/patch-schema.mjs';
import {createHypothesisObservation,createResearchExperiment,createLearningDecision,verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
import {layers} from '../../hypothesis-study-v1/build.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p));
export function compare(rows,treatment,baseline){
 let wins=0,losses=0,ties=0,semanticLosses=0;
 for(const block of new Set(rows.map(r=>r.block))){const t=rows.find(r=>r.block===block&&r.arm===treatment),b=rows.find(r=>r.block===block&&r.arm===baseline);if(!t||!b)continue;
  if(t.initial_pass&&!b.initial_pass)wins++;else if(!t.initial_pass&&b.initial_pass)losses++;else ties++;
  if(b.semantics===true&&t.semantics!==true)semanticLosses++;
 }
 return {treatment,baseline,wins,losses,ties,net_wins:wins-losses,paired_blocks:wins+losses+ties,semantic_losses_or_unobserved:semanticLosses};
}
export function analyze(frozen,run,output){
 const manifest=verifyFreeze(frozen),schedule=read(join(frozen,'schedule.json')),sources=[],rows=[];
 const pin=input=>{const path=input instanceof URL?fileURLToPath(input):input;const bytes=readFileSync(path);sources.push({path:resolve(path),sha256:sha(bytes)});return JSON.parse(bytes);};
 for(const row of schedule){if(!existsSync(join(run,row.id,'completed.json')))continue;
  const state=trialState(run,row,manifest.digest),r=pin(join(state.root,'result.json')),a=pin(join(state.root,'agent-result.json'));
  pin(join(state.root,'started.json'));pin(join(state.root,'completed.json'));if(r.validation_ref)pin(join(state.root,r.validation_ref));
  const raw=a.final_response_evidence?.text,parsed=typeof raw==='string'?parseBoundedJSON(raw):null;
  const schema=parsed?.ok?diagnosePatch(parsed.value):null;
  rows.push({...row,status:r.status,initial_pass:r.initial_pass,semantics:r.semantics,raw_full_schema_valid:schema?.ok??null,
   native_contract_valid:row.arm==='host-envelope'?(r.normalization.at(-1)?.ok??null):(schema?.ok??null),
   normalized_valid:a.candidate?true:null,reason_codes:a.reason_codes??[],recycles:a.recycling?.recycles??null,
   archive_recovery_required:a.completion_gate?.archive_recovery_required??null,archive_recovery_confirmed:a.completion_gate?.archive_recovery_confirmed??null,
   max_projected_tokens:a.recycling?.dispatches?.length?Math.max(...a.recycling.dispatches.map(d=>d.projected_upper_bound)):null,
   models:r.counts.models,tokenizers:r.counts.tokens,failed_receipts:r.receipts.filter(x=>x.status!==200).length,
   model_input_tokens_known:r.receipts.filter(x=>x.kind==='model'&&Number.isFinite(x.input_tokens)).reduce((s,x)=>s+x.input_tokens,0),
   model_input_tokens_unknown:r.receipts.filter(x=>x.kind==='model'&&!Number.isFinite(x.input_tokens)).length,
   latency_ms:r.receipts.reduce((s,x)=>s+(x.latency_ms??0),0)});
 }
 const comparisons=[compare(rows,'metadata-card','baseline'),compare(rows,'host-envelope','baseline'),compare(rows,'boundary-card','neutral-card')];
 const report={freeze_digest:manifest.digest,completed:rows.length,scheduled:schedule.length,initial_passes:rows.filter(r=>r.initial_pass).length,
  recycled_trials:rows.filter(r=>r.recycles>0).length,unknown_recycle_trials:rows.filter(r=>r.recycles===null).length,
  physical_model_calls:rows.reduce((s,r)=>s+r.models,0),physical_tokenizer_calls:rows.reduce((s,r)=>s+r.tokenizers,0),
  comparisons,rows,scope:'Completed rows only; incomplete reservations are not counted as completed. Pilot cannot select a winner under the 24-block screening rule.',authority_effect:'none',open_questions_ref:'../README.md#open-questions'};
 mkdirSync(output);const save=(name,value)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});save('report.json',report);
 const old=pin(new URL('../../hypothesis-study-v1/bundle.json',import.meta.url));
 const h8=pin(new URL('h8.json',import.meta.url));const hypotheses=[old.records.find(h=>h.hypothesis_key==='H2'),old.records.find(h=>h.hypothesis_key==='H3'),h8];
 const reportDigest=sha(readFileSync(join(output,'report.json'))),records=[],nodes=[],edges=[];
 for(const h of hypotheses){
  const exposure=h.hypothesis_key.startsWith('H8'),relevant=rows.filter(r=>r.block===0&&r.arm!=='baseline');
  const tested=exposure&&relevant.length===4&&relevant.every(r=>r.recycles!==null&&r.max_projected_tokens!==null);
  const supports=tested&&relevant.every(r=>r.recycles===0&&r.max_projected_tokens<8000);
  const kind=exposure&&tested?(supports?'supporting':'counterevidence'):'inconclusive';
  const observation=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:resolve(output,'report.json'),source_result_digest:reportDigest,
   observation_kind:kind,phase:'experiment',claim:exposure?`First-block exposure diagnostic: ${relevant.filter(r=>r.recycles>0).length}/${relevant.length} non-baseline rows recycled.`:`${rows.length}/120 rows observed; compare exact paired counts in report. No efficacy selection from this partial cohort.`,
   evaluator_id:'are-glm-live-review-v1',evidence_refs:[resolve(output,'report.json')],limitations:['Four variants in two known families; repeated rows are clustered.','H8 was formulated after baseline and metadata results, while the block was running; exploratory, not preregistered.','Zero recycling is absence of continuity coverage, not continuity success.']});
  const experiment=createResearchExperiment({hypothesis_ref:h.record_id,research_question:h.statement,baseline_ref:resolve(frozen,'protocol.json')+'#baseline',treatment_ref:resolve(frozen,'protocol.json')+'#comparisons',metrics:h.metrics,dataset_refs:[resolve(frozen,'schedule.json')],required_repetitions:exposure?4:24,success_criteria:exposure?h.experiment_template.success_criteria:read(join(frozen,'protocol.json')).screening_rule,stop_conditions:['Frozen schedule and physical caps unchanged.'],observation_refs:[observation.record_id]});
  const decision=createLearningDecision({hypothesis_ref:h.record_id,observation_refs:[observation.record_id],experiment_ref:experiment.record_id,disposition:exposure&&tested?(supports?'run-experiment':'revise-hypothesis'):'collect-replications',supporting_count:kind==='supporting'?1:0,counterevidence_count:kind==='counterevidence'?1:0,experiment_support_count:kind==='supporting'?1:0,reason_codes:[exposure?'context-exposure-diagnostic':'incomplete-fixed-screening'],next_action:exposure?'Design separate pressure-controlled continuity probe; retain this study unchanged.':'Continue fixed matched blocks; no runtime selection yet.'});
  for(const r of [h,experiment,observation,decision]){if(!verifyEvolutionRecord(r,r.schema_version).ok)throw Error('invalid research record');records.push(r);nodes.push({id:r.record_id,kind:r.schema_version});}
  edges.push({from:h.record_id,to:experiment.record_id},{from:experiment.record_id,to:observation.record_id},{from:observation.record_id,to:decision.record_id});
 }
 save('research.json',{records,projection:{kind:'explicit-study-dependency-projection',nodes,edges,dependency_layers:layers(nodes,edges)},authority_effect:'none',ontology_ref:'packages/evolution-runtime/ontology/research-learning-v1.json',selected_definitions:['ARE-RL-D01','ARE-RL-D02','ARE-RL-D03','ARE-RL-D04','ARE-RL-D07'],open_questions_ref:'../README.md#open-questions'});
 for(const u of [new URL('analyze.mjs',import.meta.url),new URL('../../../../../packages/evolution-runtime/ontology/research-learning-v1.json',import.meta.url)])sources.push({path:fileURLToPath(u),sha256:sha(readFileSync(u))});
 sources.push({path:resolve(frozen,'manifest.json'),sha256:sha(readFileSync(join(frozen,'manifest.json')))});save('sources.json',sources);return {completed:report.completed,passes:report.initial_passes,recycled:report.recycled_trials,comparisons};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){if(process.argv.length!==5)throw Error('FROZEN RUN NEW_OUTPUT');console.log(JSON.stringify(analyze(...process.argv.slice(2).map(p=>resolve(p)))));}
