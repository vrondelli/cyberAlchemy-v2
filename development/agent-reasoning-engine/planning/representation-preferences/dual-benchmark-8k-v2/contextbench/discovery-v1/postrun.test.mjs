// Synthetic result classification and native record validation only. No run mutation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyOutcome,createRecords,gateKeys,taskIds} from './register-result.mjs';
import {read,dir} from './prepare-live.mjs';
import {join} from 'node:path';
import {verifyEvolutionRecord} from '../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {digest} from '../../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
const fixture=()=>({campaign_goal_achieved:false,development_target_passed:true,gates:Object.fromEntries(gateKeys.map(k=>[k,true])),outcomes:Array.from({length:8},()=>({metrics_valid:true})),infrastructure_failures:[],totals:{control:{complete:4},treatment:{complete:4,perfect:4}},accounting:{known_tokens:140000},relative_token_reduction:.2,limitations:['Synthetic exposed-development comparison only.']});
test('support requires exact conjunction, not just better quality',()=>{assert.equal(classifyOutcome(fixture()),'supporting');const r=fixture();r.gates.at_least_15_percent_reduction=false;r.development_target_passed=false;r.relative_token_reduction=.09;assert.equal(classifyOutcome(r),'counterevidence');});
test('clean model completion/quality failure is bounded counterevidence',()=>{for(const gate of ['all_eight_valid','treatment_each_task_perfect','all_long_trajectories','all_requests_admitted']){const r=fixture();r.gates[gate]=false;r.development_target_passed=false;assert.equal(classifyOutcome(r),'counterevidence');}});
test('infrastructure, unknown accounting and scoring gaps are inconclusive',()=>{for(const mode of ['infra','account','seal','metric','scoring']){const r=fixture();let options={};if(mode==='infra')r.infrastructure_failures.push({error:'disk full'});if(mode==='account')r.gates.complete_accounting=false;if(mode==='seal')r.gates.all_pairs_sealed_and_recorded=false;if(mode==='metric')r.outcomes[0].metrics_valid=false;if(mode==='scoring')options={scoring_errors:[{error:'native evaluator failed'}]};r.development_target_passed=gateKeys.every(k=>r.gates[k]);assert.equal(classifyOutcome(r,options),'inconclusive',mode);}});
test('reject missing or altered acceptance gates, wrong denominator and campaign claim',()=>{for(const mode of ['missing','extra','type','pass','slots','campaign']){const r=fixture();if(mode==='missing')delete r.gates.complete_accounting;if(mode==='extra')r.gates.relaxed=true;if(mode==='type')r.gates.complete_accounting='true';if(mode==='pass')r.development_target_passed=false;if(mode==='slots')r.outcomes.pop();if(mode==='campaign')r.campaign_goal_achieved=true;assert.throws(()=>classifyOutcome(r),undefined,mode);}});
test('synthetic classifications create valid D02/D04 tied to actual frozen H1/D03',()=>{
 const hypotheses=read(join(dir,'live-hypotheses.json')),experiment=read(join(dir,'live-experiment.json'));
 for(const kind of ['supporting','counterevidence','inconclusive']){const r=fixture();if(kind==='counterevidence'){r.gates.at_least_15_percent_reduction=false;r.development_target_passed=false;}if(kind==='inconclusive')r.infrastructure_failures.push({error:'uncertain'});
  const v=createRecords({result:r,hypotheses,experiment});assert.equal(v.kind,kind);assert.ok(verifyEvolutionRecord(v.observation).ok);assert.ok(verifyEvolutionRecord(v.decision).ok);assert.equal(v.observation.source_result_digest,digest(r));assert.equal(v.observation.hypothesis_ref,hypotheses.selection.selected);assert.equal(v.decision.experiment_ref,experiment.record_id);assert.equal(v.decision.supporting_count,Number(kind==='supporting'));assert.equal(v.decision.counterevidence_count,Number(kind==='counterevidence'));
 }
 assert.deepEqual(taskIds,['integration','tokenizer-preflight','freeze','generation-two-workers','native-score','complete-report','independent-review']);
});
