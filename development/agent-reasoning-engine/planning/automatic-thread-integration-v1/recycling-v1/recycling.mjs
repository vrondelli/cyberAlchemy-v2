import {digestValue} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/canonical.mjs';
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const text=v=>typeof v==='string'&&v.trim().length>0;
const need=(v,r)=>{if(!v)throw Error(r);};
const block=reason=>({action:'block',reason});
export function budgetDecision({route,policy,observation,nextStep,control}){
 if(!route||!policy||!observation||!nextStep||!control)return block('missing-budget-evidence');
 if(!text(route.task_id)||!text(route.context_id)||!text(route.state_digest)||!text(route.checkpoint_ref)||!integer(route.generation)||!integer(route.observation_sequence))return block('invalid-route-binding');
 if(route.status!=='running')return block('context-not-running');
 if(control.owns_every_provider_step!==true||control.bounds_all_growth!==true)return block('uncontrolled-growth');
 if(!integer(control.in_flight_steps))return block('unknown-in-flight-work');
 if(control.in_flight_steps>0)return {action:'drain',reason:'await-bounded-in-flight-work'};
 if(!text(policy.limit_ref)||![policy.compaction_limit,policy.recycle_at,policy.safety_margin].every(integer)||policy.safety_margin===0||policy.recycle_at===0||policy.recycle_at>policy.compaction_limit-policy.safety_margin)return block('invalid-or-unknown-limit');
 if(observation.kind!=='context-upper-bound'||!text(observation.evidence_ref)||!integer(observation.upper_bound)||observation.context_id!==route.context_id||observation.generation!==route.generation||observation.sequence!==route.observation_sequence||observation.limit_ref!==policy.limit_ref)return block('stale-or-unverified-context-budget');
 if(!integer(nextStep.input_upper_bound)||!integer(nextStep.growth_upper_bound)||!text(nextStep.evidence_ref)||!text(nextStep.request_digest))return block('unbounded-next-step');
 if(observation.upper_bound>=policy.compaction_limit)return block('compaction-boundary-already-unsafe');
 const projected=observation.upper_bound+nextStep.input_upper_bound+nextStep.growth_upper_bound;
 if(!integer(projected))return block('budget-overflow');
 return {action:projected>=policy.recycle_at?'recycle':'continue',projected_upper_bound:projected,recycle_at:policy.recycle_at,binding_digest:digestValue({route,policy,observation,nextStep,control})};
}
export function stateCapsule({task_id,checkpoint_ref,state,max_bytes=65536}){
 need(text(task_id)&&text(checkpoint_ref)&&integer(max_bytes)&&max_bytes>0,'invalid-capsule-binding');
 need(state&&text(state.objective),'objective-required');
 for(const key of ['constraints','completed','pending','facts','lessons','evidence_refs'])need(Array.isArray(state[key]),'missing-state-field:'+key);
 need(state.evidence_refs.length>0&&state.evidence_refs.every(text),'evidence-required');
 const value={version:1,task_id,checkpoint_ref,state:structuredClone(state),source_state_digest:digestValue(state),authority_effect:'none'};
 need(Buffer.byteLength(JSON.stringify(value))<=max_bytes,'capsule-too-large');
 return {...value,capsule_digest:digestValue(value)};
}
function validCapsule(capsule){
 const {capsule_digest,...value}=capsule??{};
 need(text(capsule_digest)&&digestValue(value)===capsule_digest&&digestValue(value.state)===value.source_state_digest,'capsule-integrity-failed');
 need(value.version===1&&value.authority_effect==='none','invalid-capsule-version');
}
export function beginRecycle(input,capsule){
 const decision=budgetDecision(input);need(decision.action==='recycle','recycle-not-required-or-not-safe');validCapsule(capsule);
 need(capsule.task_id===input.route.task_id&&capsule.source_state_digest===input.route.state_digest&&capsule.checkpoint_ref===input.route.checkpoint_ref,'capsule-source-mismatch');
 const plan={version:1,phase:'awaiting-fresh-context',route:structuredClone(input.route),policy:structuredClone(input.policy),nextStep:structuredClone(input.nextStep),capsule:structuredClone(capsule),source_binding:decision.binding_digest,authority_effect:'none'};
 return {...plan,plan_digest:digestValue(plan)};
}
export function finishRecycle(plan,receipt,currentRoute){
 const {plan_digest,...value}=plan??{};
 need(text(plan_digest)&&digestValue(value)===plan_digest,'handover-plan-integrity-failed');
 need(digestValue(currentRoute)===digestValue(plan.route),'source-route-changed');
 need(plan?.phase==='awaiting-fresh-context','handover-not-pending');validCapsule(plan.capsule);
 need(receipt?.host_observation_verified===true&&receipt.fresh_history===true,'fresh-context-evidence-required');
 need(text(receipt.context_id)&&receipt.context_id!==plan.route.context_id,'fresh-context-identity-required');
 need(receipt.source_context_id===plan.route.context_id&&receipt.task_id===plan.route.task_id&&receipt.generation===plan.route.generation+1&&receipt.capsule_digest===plan.capsule.capsule_digest&&receipt.source_state_digest===plan.route.state_digest&&receipt.policy_digest===digestValue(plan.policy),'handover-binding-mismatch');
 const successor={...plan.route,context_id:receipt.context_id,generation:receipt.generation,observation_sequence:receipt.observation_sequence,status:'running'};
 need(integer(successor.observation_sequence)&&integer(successor.generation),'invalid-successor-epoch');
 const observation={kind:'context-upper-bound',evidence_ref:receipt.evidence_ref,upper_bound:receipt.context_upper_bound,context_id:successor.context_id,generation:successor.generation,sequence:successor.observation_sequence,limit_ref:plan.policy.limit_ref};
 const check=budgetDecision({route:successor,policy:plan.policy,observation,nextStep:plan.nextStep,control:{owns_every_provider_step:true,bounds_all_growth:true,in_flight_steps:0}});
 need(check.action==='continue','fresh-context-budget-insufficient');
 return {route:successor,retired_context_id:plan.route.context_id,capsule_digest:plan.capsule.capsule_digest,action:'switch-local-route',authority_effect:'none'};
}
export function acceptContextEvent(route,event){
 if(event?.context_id!==route.context_id||event.generation!==route.generation)return {action:'reject',reason:'stale-context-generation'};
 if(event.kind==='native-compaction')return {action:'block',reason:'no-compaction-invariant-violated'};
 return {action:'accept'};
}
