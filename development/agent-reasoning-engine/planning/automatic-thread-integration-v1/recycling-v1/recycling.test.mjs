import test from 'node:test';import assert from 'node:assert/strict';
import {budgetDecision,stateCapsule,beginRecycle,finishRecycle,acceptContextEvent} from './recycling.mjs';
import {digestValue} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/canonical.mjs';
function fixture(){
 const state={objective:'Build the agreed system',constraints:['No deployment'],completed:['Parser validated'],pending:['Integrate parser'],facts:['Input schema v1'],lessons:['Use examples'],evidence_refs:['test:parser:1']};
 const capsule=stateCapsule({task_id:'logical-task',checkpoint_ref:'checkpoint:1',state});
 const route={task_id:'logical-task',context_id:'old',generation:0,observation_sequence:1,state_digest:digestValue(state),checkpoint_ref:'checkpoint:1',status:'running'};
 const policy={limit_ref:'fixture-effective-limit',compaction_limit:100000,recycle_at:80000,safety_margin:10000};
 const observation={kind:'context-upper-bound',evidence_ref:'measurement:1',upper_bound:70000,context_id:'old',generation:0,sequence:1,limit_ref:policy.limit_ref};
 const nextStep={input_upper_bound:1000,growth_upper_bound:9000,evidence_ref:'bounded-step:1',request_digest:'request:1'};
 const control={owns_every_provider_step:true,bounds_all_growth:true,in_flight_steps:0};
 const input={route,policy,observation,nextStep,control};
 const receipt={host_observation_verified:true,fresh_history:true,context_id:'fresh',source_context_id:'old',task_id:'logical-task',generation:1,capsule_digest:capsule.capsule_digest,source_state_digest:route.state_digest,policy_digest:digestValue(policy),observation_sequence:1,context_upper_bound:4000,evidence_ref:'fresh-measurement:1'};
 return {state,capsule,input,receipt};
}
test('recycle on exact threshold before native compaction',()=>{const {input}=fixture();assert.equal(budgetDecision(input).action,'recycle');input.observation.upper_bound--;assert.equal(budgetDecision(input).action,'continue');});
test('large next step triggers early recycling even when current usage is low',()=>{const {input}=fixture();input.observation.upper_bound=10000;input.nextStep.growth_upper_bound=70000;assert.equal(budgetDecision(input).action,'recycle');});
for(const field of ['compaction_limit','recycle_at','safety_margin'])test('unknown policy '+field+' blocks',()=>{const {input}=fixture();delete input.policy[field];assert.equal(budgetDecision(input).action,'block');});
test('boundary must preserve safety margin',()=>{const {input}=fixture();input.policy.recycle_at=95000;assert.equal(budgetDecision(input).action,'block');});
test('cumulative token usage is not accepted as context occupancy',()=>{const {input}=fixture();input.observation.kind='cumulative-token-usage';assert.equal(budgetDecision(input).action,'block');});
for(const field of ['context_id','generation','sequence','limit_ref'])test('stale observation '+field+' blocks',()=>{const {input}=fixture();input.observation[field]='wrong';assert.equal(budgetDecision(input).action,'block');});
test('missing measurement proof blocks',()=>{const {input}=fixture();delete input.observation.evidence_ref;assert.equal(budgetDecision(input).action,'block');});
test('uncontrolled intra-turn loop blocks',()=>{const {input}=fixture();input.control.owns_every_provider_step=false;assert.equal(budgetDecision(input).action,'block');});
test('unbounded step growth blocks',()=>{const {input}=fixture();input.nextStep.growth_upper_bound=Infinity;assert.equal(budgetDecision(input).action,'block');});
test('in-flight work must drain before handover',()=>{const {input,capsule}=fixture();input.control.in_flight_steps=1;assert.equal(budgetDecision(input).action,'drain');assert.throws(()=>beginRecycle(input,capsule));});
test('unsafe existing context cannot be described as safely recycled',()=>{const {input}=fixture();input.observation.upper_bound=100000;assert.equal(budgetDecision(input).reason,'compaction-boundary-already-unsafe');});
test('arithmetic overflow blocks',()=>{const {input}=fixture();input.nextStep.growth_upper_bound=Number.MAX_SAFE_INTEGER;assert.equal(budgetDecision(input).action,'block');});
test('capsule retains all supplied work and evidence with no authority',()=>{const {state,capsule}=fixture();assert.deepEqual(capsule.state,state);assert.equal(capsule.authority_effect,'none');state.pending.push('Changed externally');assert.equal(capsule.state.pending.length,1);});
test('missing task-state fields cannot silently disappear',()=>{const {state}=fixture();delete state.pending;assert.throws(()=>stateCapsule({task_id:'task',checkpoint_ref:'c',state}),/pending/);});
test('oversized capsule is rejected without truncating work',()=>{const {state}=fixture();assert.throws(()=>stateCapsule({task_id:'task',checkpoint_ref:'c',state,max_bytes:10}),/too-large/);});
test('changed capsule blocks handover',()=>{const {input,capsule}=fixture();capsule.state.pending=[];assert.throws(()=>beginRecycle(input,capsule),/integrity/);});
test('unrelated checkpoint cannot be carried forward',()=>{const {input,capsule}=fixture();input.route.checkpoint_ref='other';assert.throws(()=>beginRecycle(input,capsule),/source-mismatch/);});
test('verified fresh context advances generation and preserves logical task',()=>{const {input,capsule,receipt}=fixture();const plan=beginRecycle(input,capsule);const next=finishRecycle(plan,receipt,input.route);assert.equal(next.route.task_id,input.route.task_id);assert.equal(next.route.generation,1);assert.equal(next.route.context_id,'fresh');assert.equal(next.route.state_digest,input.route.state_digest);assert.equal(input.route.context_id,'old');});
for(const field of ['fresh_history','host_observation_verified'])test('missing fresh-context evidence '+field+' blocks',()=>{const {input,capsule,receipt}=fixture();receipt[field]=false;assert.throws(()=>finishRecycle(beginRecycle(input,capsule),receipt,input.route));});
for(const field of ['source_context_id','capsule_digest','source_state_digest','policy_digest','generation'])test('handover receipt mismatch '+field+' blocks',()=>{const {input,capsule,receipt}=fixture();receipt[field]='wrong';assert.throws(()=>finishRecycle(beginRecycle(input,capsule),receipt,input.route));});
test('reusing old context cannot masquerade as recycling',()=>{const {input,capsule,receipt}=fixture();receipt.context_id='old';assert.throws(()=>finishRecycle(beginRecycle(input,capsule),receipt,input.route),/identity/);});
test('fresh context that still cannot fit next step is rejected',()=>{const {input,capsule,receipt}=fixture();receipt.context_upper_bound=70000;assert.throws(()=>finishRecycle(beginRecycle(input,capsule),receipt,input.route),/budget-insufficient/);});
test('changed source route blocks stale handover activation',()=>{const {input,capsule,receipt}=fixture();const plan=beginRecycle(input,capsule);assert.throws(()=>finishRecycle(plan,receipt,{...input.route,observation_sequence:2}),/source-route-changed/);});
test('tampered handover plan blocks',()=>{const {input,capsule,receipt}=fixture();const plan=beginRecycle(input,capsule);plan.nextStep.growth_upper_bound=0;assert.throws(()=>finishRecycle(plan,receipt,input.route),/plan-integrity/);});
test('old context events are fenced after switch',()=>{const {input,capsule,receipt}=fixture();const {route}=finishRecycle(beginRecycle(input,capsule),receipt,input.route);assert.equal(acceptContextEvent(route,{context_id:'old',generation:0,kind:'completed'}).action,'reject');assert.equal(acceptContextEvent(route,{context_id:'fresh',generation:1,kind:'completed'}).action,'accept');});
test('native compaction is an invariant violation',()=>{const {input}=fixture();assert.equal(acceptContextEvent(input.route,{context_id:'old',generation:0,kind:'native-compaction'}).action,'block');});
test('bounded 300-step simulation recycles repeatedly without reaching trigger',()=>{
 const {input,capsule}=fixture();let cycles=0,highest=0;input.observation.upper_bound=4000;
 for(let i=0;i<300;i++){
  const decision=budgetDecision(input);
  if(decision.action==='recycle'){
   const plan=beginRecycle(input,capsule);const receipt={host_observation_verified:true,fresh_history:true,context_id:'fresh-'+ ++cycles,source_context_id:input.route.context_id,task_id:input.route.task_id,generation:input.route.generation+1,capsule_digest:capsule.capsule_digest,source_state_digest:input.route.state_digest,policy_digest:digestValue(input.policy),observation_sequence:0,context_upper_bound:4000,evidence_ref:'fixture-fresh'};
   input.route=finishRecycle(plan,receipt,input.route).route;input.observation={...input.observation,context_id:input.route.context_id,generation:input.route.generation,sequence:0,upper_bound:4000};
  }
  assert.equal(budgetDecision(input).action,'continue');input.observation.upper_bound+=input.nextStep.input_upper_bound+input.nextStep.growth_upper_bound;highest=Math.max(highest,input.observation.upper_bound);assert.ok(input.observation.upper_bound<input.policy.recycle_at);input.route.observation_sequence++;input.observation.sequence++;
 }
 assert.ok(cycles>10);assert.ok(highest<input.policy.compaction_limit);
});
