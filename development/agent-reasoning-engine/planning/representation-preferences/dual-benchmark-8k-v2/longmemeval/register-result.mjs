// Post-run D02/D04/D07 registration. No provider calls. Open questions: LIVE-PROTOCOL.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {join,relative} from 'node:path';
import assert from 'node:assert/strict';
import {dir,root,read,sha,save,verifyFreeze} from './live.mjs';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {materializeResearchDag} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-dag.mjs';
import {materializeResearchPlan} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {digest} from '../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
verifyFreeze();
const prefix=relative(root,dir),r=read(join(dir,'LIVE-RESULTS.json')),h=read(join(dir,'live-hypotheses.json')).records[0],e=read(join(dir,'live-experiment.json')),freeze=read(join(dir,'live-freeze.json'));
assert.equal(e.hypothesis_ref,h.record_id);
const delta=r.totals.scope.correct-r.totals.baseline.correct,valid=r.outcomes.every(o=>o.completed&&o.judge_valid)&&r.accounting.unknown_reserved_tokens===0;
// Reviewed attribution: the sole discordance is fish-count abstention, not recommendation scope.
const kind='inconclusive';
const o=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:prefix+'/LIVE-RESULTS.json',source_result_digest:digest(r),observation_kind:kind,phase:'experiment',
 claim:`Fixed four-task scope-policy diagnostic: baseline ${r.totals.baseline.correct}/4, scope ${r.totals.scope.correct}/4; known generation+judge tokens ${r.accounting.known_tokens}; unknown reservation ${r.accounting.unknown_reserved_tokens}. The sole correctness difference is fish-count abstention; both arms passed the previously failing recommendation case. This does not isolate or confirm the preference-scope mechanism.`,evaluator_id:'frozen-native-longmemeval-rubric-glm-judge',evidence_refs:[prefix+'/LIVE-RESULTS.json',prefix+'/live-freeze.json',prefix+'/LIVE-REVIEW.json'],limitations:r.limitations});
const d=createLearningDecision({hypothesis_ref:h.record_id,experiment_ref:e.record_id,observation_refs:[o.record_id],disposition:kind==='counterevidence'?'revise-hypothesis':'collect-replications',next_action:kind==='counterevidence'?'Audit source-only scope failure and preregister a revised mechanism without task-specific gold.':'Freeze independent replication or untouched long-task confirmation; do not adopt or claim improvement from equal scores or this exposed diagnostic.',reason_codes:['fixed-development-diagnostic',kind,'campaign-goal-open'],supporting_count:kind==='supporting'?1:0,counterevidence_count:kind==='counterevidence'?1:0});
save(join(dir,'LIVE-OBSERVATIONS.json'),{records:[o,d],observed_correctness_delta:delta,classification_amendment:'Initial automated accuracy-delta label was replaced after checking the hypothesis-specific mechanism; original records retained in classification-amendment-r1.',campaign_goal_achieved:false,authority_effect:'none'});
const bind=p=>({path:p,sha256:sha(join(root,p))});
const body={experiment_id:'longmem-scope-v2-r1',records:[h,e,o,d],implementation:{record_id:'implementation:'+digest(freeze.bindings),source_bindings:freeze.bindings},question:{record_id:'question:'+digest(d.next_action),question:d.next_action},evidence_bindings:[bind(prefix+'/LIVE-RESULTS.json'),bind(prefix+'/LIVE-OBSERVATIONS.json')]};
const registration={...body,registration_digest:digest(body)},verify=x=>{
 try{const{registration_digest,...b}=x;assert.equal(registration_digest,digest(b));for(const ref of [...x.evidence_bindings,...x.implementation.source_bindings])assert.equal(sha(join(root,ref.path)),ref.sha256);assert.ok(x.records.every(r=>verifyEvolutionRecord(r).ok));assert.equal(x.records[2].source_result_digest,digest(r));assert.equal(x.records[3].experiment_ref,e.record_id);return true;}catch{return false;}
};
assert.ok(verify(registration));const dag=materializeResearchDag({registrations:[registration],verify_registration:verify});
save(join(dir,'LIVE-REGISTRATION.json'),registration);save(join(dir,'LIVE-RESEARCH-DAG.json'),dag);
const tasks=[['freeze',[]],['generation',['freeze']],['judge',['generation']],['report',['judge']],['audit',['report']]].map(([task_id,depends_on])=>({task_id,depends_on,title:task_id,owner:'coordinator',lane:'product-construction',stage:'prototype',question_ref:registration.question.record_id,completion_criteria:['Verify exact fixed diagnostic evidence for '+task_id],validator_ref:prefix+'/LIVE-COMPLETION-AUDIT.md'}));
const plan=materializeResearchPlan({research_dag:dag,registrations:[registration],verify_registration:verify,tasks});save(join(dir,'LIVE-RESEARCH-WORK.json'),plan);
console.log(JSON.stringify({observation:kind,quality_delta:delta,campaign_goal_achieved:false}));
