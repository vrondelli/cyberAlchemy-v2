// Immutable result audit. Open questions: EVALUATION.md#open-questions.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {root,read,sha,verify,qualify} from './common.mjs';
import {attributeSource,assess} from './evaluate.mjs';
import {save,trialState} from '../controller.mjs';
import {snapshotTree} from '../../../../../packages/coding-agent-runtime/verifier.mjs';
import {completionBudget,projectCompletionState,assessCompletionRequirements} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/completion.mjs';
import {createContainerPublicValidator} from '../../../../../packages/coding-agent-runtime/container-public-validation.mjs';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
const manifest=verify(),output=resolve(process.argv[2]),sources=[],rows=[];
assert.equal(existsSync(new URL('live/controller.lock',root)),false,'wait for the exact provider process to finish before final audit');
mkdirSync(output);
function pin(path){const bytes=readFileSync(path);sources.push({path:path instanceof URL?path.pathname:resolve(path),sha256:sha(bytes)});return JSON.parse(bytes);}
const binding=pin(new URL('execution-binding.json',root));assert.equal(binding.manifest_digest,manifest.digest);assert.equal(binding.evaluation_sha256,sha(readFileSync(new URL('EVALUATION.md',root))));
for(const row of read(new URL('prepared/schedule.json',root))){
 if(!existsSync(new URL(`live/${row.id}/completed.json`,root)))continue;
 const state=trialState(new URL('live/',root).pathname,row,manifest.digest);assert.equal(state.status,'completed');
 const r=pin(join(state.root,'result.json')),a=pin(join(state.root,'agent-result.json'));assert.equal(sources.at(-1).sha256,r.agent_result_sha256);
 for(const p of ['README.md','subject.mjs','contract.json'])assert.deepEqual(readFileSync(join(state.root,'fixture',p)),readFileSync(new URL(`prepared/fixtures/${row.fixture}/${p}`,root)));
 assert.equal(a.effect_applied,false);assert.deepEqual(a.receipts,r.receipts);
 assert.equal(a.receipts.filter(x=>x.kind==='model').length,r.counts.models);assert.equal(a.receipts.filter(x=>x.kind==='tokenizer').length,r.counts.tokens);
 const base=snapshotTree(join(state.root,'fixture')),attribution=attributeSource(a.final_response_evidence,base,readFileSync(join(state.root,'fixture/subject.mjs'),'utf8'));
 let validation=null,raw_validation=null;
 if(r.validation_sha256){validation=pin(join(state.root,'validation.json'));assert.equal(sources.at(-1).sha256,r.validation_sha256);raw_validation=validation;}
 if(attribution.attributable&&!raw_validation){
  const dir=join(output,row.id);mkdirSync(dir);const subject=join(dir,'candidate.mjs');writeFileSync(subject,attribution.source,{flag:'wx'});
  const path=new URL(`prepared/fixtures/${row.fixture}/oracle.json`,root).pathname,cases=pin(path);
  const plan={schema_version:'are.public-case-plan/v1',sources:[{path,sha256:sha(readFileSync(path))}],checks:cases.map((c,i)=>({...c,evidence:[{path,selector:'/'+i,value_sha256:sha(JSON.stringify(c))}]}))};
  raw_validation=createContainerPublicValidator().validate({subject,plan});save(join(dir,'validation.json'),raw_validation);pin(join(dir,'validation.json'));
 }
 if(raw_validation){assert.equal(attribution.attributable,true);assert.equal(raw_validation.subject_sha256,sha(attribution.source));assert.equal(raw_validation.worker_cleanup_verified,true);assert.equal(raw_validation.total,6);}
 assert.equal(snapshotTree(join(state.root,'fixture')).tree_sha256,base.tree_sha256);
 let gate=null,gate_error=null;
 try{const budget=completionBudget('example-fields-v20',row.soft_limit),recycled=a.recycling?.recycles>0,archive_confirmed=(a.delivery_progress?.meaningful_archive_delivery_call_ids.length??0)>0;
  const completionState=projectCompletionState({paged:budget.page_chars,history_limit:budget.maximum_requests,history:a.history,receipts:a.receipts,maximum_requests:budget.maximum_requests,base,observation_allowlist:['README.md','subject.mjs','contract.json'],delivery_progress:a.delivery_progress,recycled,archive_recovery_seen_or_present:archive_confirmed});
  gate=assessCompletionRequirements(a.completion_requirements,{state:completionState,history:a.history,recycled,archive_confirmed});
 }catch(e){gate_error=e.message;}
 const dispatches=a.recycling?.dispatches??[],safety_passed=dispatches.length>0&&dispatches.every(d=>d.projected_upper_bound<row.soft_limit-256&&d.projected_upper_bound<=16384)&&a.delivery_progress?.delivery_unknown_call_ids.length===0&&a.receipts.every(x=>x.automatic_retries===0);
 assert.equal(qualify(a,validation,row),r.qualified);
 rows.push({...row,status:r.status,outer_reason_codes:r.reason_codes,qualified:r.qualified,...attribution,source:undefined,raw_source_semantics:raw_validation?.ok??null,passed:raw_validation?.passed??null,total:raw_validation?.total??null,failed_receipts:r.receipts.filter(r=>r.status!==200).length,safety_passed,gate,gate_error,recycles:a.recycling?.recycles??0,maximum_projected_tokens:r.maximum_projected_tokens,counts:r.counts,authority_effect:'none'});
}
const assessment=assess(rows),models=rows.reduce((s,r)=>s+r.counts.models,0),tokenizers=rows.reduce((s,r)=>s+r.counts.tokens,0);assert.ok(models<=224&&tokenizers<=448);verify();
const report={...assessment,rows,models,tokenizers,actual_recycles:rows.reduce((s,r)=>s+r.recycles,0),recovery_confirmed:rows.filter(r=>r.gate?.passed&&r.gate?.archive_recovery_confirmed).length,interpretation:'Raw-source audits are supplemental; original schema and end-to-end failures remain failures. Mechanism pilot only, not small-window qualification.',authority_effect:'none',open_questions_ref:'../EVALUATION.md#open-questions'};
save(join(output,'report.json'),report);
const h=pin(new URL('hypothesis.json',root)),e=pin(new URL('prepared/experiment.json',root));
for(const p of ['EVALUATION.md','evaluate.mjs','review.mjs','prepared/manifest.json']){const u=new URL(p,root);sources.push({path:u.pathname,sha256:sha(readFileSync(u))});}
const observation=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:join(output,'report.json'),source_result_digest:sha(readFileSync(join(output,'report.json'))),observation_kind:assessment.kind,phase:'experiment',claim:`${rows.length}/16 rows completed; unchanged source baseline ${assessment.baseline.unchanged_source}, treatment ${assessment.treatment.unchanged_source}; raw semantic passes baseline ${assessment.baseline.raw_semantic_passes}, treatment ${assessment.treatment.raw_semantic_passes}.`,evaluator_id:'are-source-replication-v1',evidence_refs:sources.map(s=>s.path+'#sha256='+s.sha256),limitations:['Targeted replication: four missing window/variant cells, two repetitions; same task family.','Both arms use metadata guidance; this does not isolate that guidance.','The sentence changes wording and length; outcomes cannot prove literal internal interpretation.','Archive recovery does not prove delayed or revised-fact continuity.']});
const decision=createLearningDecision({hypothesis_ref:h.record_id,experiment_ref:e.record_id,observation_refs:[observation.record_id],disposition:assessment.kind==='counterevidence'?'revise-hypothesis':'collect-replications',supporting_count:Number(assessment.kind==='supporting'),counterevidence_count:Number(assessment.kind==='counterevidence'),experiment_support_count:Number(assessment.kind==='supporting'),reason_codes:[assessment.reason],next_action:assessment.kind==='supporting'?'Review combined H15/H16 evidence without pooling their prospective screens; prepare a bounded integration candidate only if supported.':assessment.kind==='inconclusive'?'Inspect mechanism exposure and missing evidence before designing a separately frozen successor.':'Retain counterevidence and revise the explanation using the complete failure-stage audit.'});
for(const r of [h,e,observation,decision])assert.equal(verifyEvolutionRecord(r,r.schema_version).ok,true);
save(join(output,'research.json'),{records:[h,e,observation,decision],sources,authority_effect:'none',open_questions_ref:'../EVALUATION.md#open-questions'});
console.log(JSON.stringify({...report,rows:undefined}));
