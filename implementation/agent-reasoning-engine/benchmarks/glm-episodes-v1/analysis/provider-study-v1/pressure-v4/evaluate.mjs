// Canonical observation for the predeclared pressure experiment. Open questions: README.md#open-questions.
import {readFileSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
import {save} from '../controller.mjs';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function classify(trials){
 if(trials.length!==2||trials.some(r=>r.models===0||r.receipts.some(x=>x.status!==200)))return 'inconclusive';
 const baseline=trials.find(r=>r.arm==='baseline'),pressure=trials.find(r=>r.arm==='pressure');if(!baseline||!pressure)return 'inconclusive';
 return baseline.status==='BLOCK'&&baseline.reason_codes?.includes('recycling.fresh-context-too-large')&&pressure.semantics===true&&pressure.recycles>0&&pressure.archive_recovery_confirmed===true&&trials.every(r=>Number.isFinite(r.max_projected_tokens)&&r.max_projected_tokens<=16384)?'supporting':'counterevidence';
}
export function evaluate(){
 const root=new URL('./',import.meta.url),sources=[];
 const read=u=>{const bytes=readFileSync(u);sources.push({path:u.pathname,sha256:sha(bytes)});return JSON.parse(bytes);};
 const h=read(new URL('hypothesis.json',root)),e=read(new URL('experiment.json',root)),summary=read(new URL('live/result.json',root));
 for(const r of summary.trials){const u=new URL('live/'+r.arm+'/',root),bytes=readFileSync(new URL('result.json',u)),complete=read(new URL('completed.json',u));if(complete.result_sha256!==sha(bytes)||sha(readFileSync(new URL('agent-result.json',u)))!==r.agent_result_sha256||JSON.stringify(JSON.parse(bytes))!==JSON.stringify(r))throw Error('result binding drift');read(new URL('result.json',u));read(new URL('agent-result.json',u));if(existsSync(new URL('validation.json',u)))read(new URL('validation.json',u));}
 const kind=classify(summary.trials),metrics=summary.trials.map(({receipts,...r})=>r);
 const observation=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:new URL('live/result.json',root).pathname,source_result_digest:sha(readFileSync(new URL('live/result.json',root))),observation_kind:kind,phase:'experiment',claim:JSON.stringify(metrics),evaluator_id:'are-pressure-probe-review-v1',evidence_refs:sources.map(s=>s.path+'#sha256='+s.sha256),limitations:['One baseline and one pressure trial, fixed order, synthetic high-token inventory.','No general reliability or larger-window claim.','Configured 16384 bound is this harness limit, not the provider model maximum.']});
 const decision=createLearningDecision({hypothesis_ref:h.record_id,observation_refs:[observation.record_id],experiment_ref:e.record_id,disposition:kind==='supporting'?'collect-replications':kind==='counterevidence'?'revise-hypothesis':'inconclusive',supporting_count:kind==='supporting'?1:0,counterevidence_count:kind==='counterevidence'?1:0,experiment_support_count:kind==='supporting'?1:0,reason_codes:['predeclared-pressure-mechanism-test'],next_action:kind==='supporting'?'Replicate recovery with delayed and revised facts at all three small-window thresholds.':'Inspect actual token bounds, completion gate and receipts; define successor before another probe.'});
 for(const r of [h,e,observation,decision])if(!verifyEvolutionRecord(r,r.schema_version).ok)throw Error('invalid record');
 const result={kind,metrics,records:[h,e,observation,decision],sources,projection:{kind:'explicit-study-dependency-projection',edges:[{from:h.parent_hypothesis_ref,to:h.record_id},{from:h.record_id,to:e.record_id},{from:e.record_id,to:observation.record_id},{from:observation.record_id,to:decision.record_id}]},authority_effect:'none',open_questions_ref:'README.md#open-questions'};
 save(new URL('evaluation.json',root),result);return {kind,metrics};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(evaluate()));
