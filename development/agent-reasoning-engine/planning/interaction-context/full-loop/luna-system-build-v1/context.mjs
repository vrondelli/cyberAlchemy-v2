import {createInteractionLearningLifecycle} from '../../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs';
import {createReasoningStateLedger} from '../../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
import {materializeIntentContract} from '../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/index.mjs';
import {digestValue} from '../../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/canonical.mjs';
import {projectInteractionContext,materializeLearningPolicy} from '../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs';
const rules=[
 {instruction:'Keep product and participant boundaries explicit in every API, CLI operation and stored event.',conditions:['build']},
 {instruction:'Preserve durable data and old event content. Validate changes before replacing storage.',conditions:['storage']},
 {instruction:'Deliver real tests and usable command examples alongside complete implementation files.',conditions:['testing']}
];
export function buildMemory(){
 let supplied={};const life=createInteractionLearningLifecycle({ledger:createReasoningStateLedger(),configuration:{enabled:true,participant_ref:'fixture:build-author',product_ref:'fixture:luna-build',policy:{mode:'apply-scoped'}},input_provider:()=>supplied});
 let seq=0;
 function turn(text,feedback){
  supplied=feedback?{feedback}:{};const id=++seq,threadId='fixture:training';
  const p=life.prepare({id,method:'turn/start',params:{threadId,input:[{type:'text',text}]}});if(!p.ok)throw Error(JSON.stringify(p));
  const contract=materializeIntentContract({request_ref:p.request.request_ref,request_digest:digestValue(text),objective:text,target:'response',disposition:'act'});
  if(!life.dispatch(p,digestValue(id),digestValue('fixture'),contract).ok)throw Error('fixture.dispatch');
  if(!life.bind(id,threadId,String(id)).ok)throw Error('fixture.bind');
  if(!life.complete({method:'turn/completed',params:{threadId,turn:{id:String(id),items:[{type:'agentMessage',text:'Scripted fixture completion; not live model evidence.'}]}}}).ok)throw Error('fixture.complete');
  return p.request.request_ref;
 }
 for(const rule of rules){const source=turn('Prepare a system build with storage and testing.');turn(rule.instruction,{episode_ref:source,quote:rule.instruction,instruction:rule.instruction,target:'response',posture:'explicit',retention_scope:'current-product',user_selected:true,correction_kind:'new-preference',conditions:rule.conditions,exclusions:[],expected_checks:[]});}
 return life.inspect({detail:true});
}
export function memoryContext(state,arm,request){
 if(arm==='summary')return Object.values(state.lessons).map(l=>`Current retained instruction: ${l.preference.instruction} Applies when request contains all of: ${l.preference.conditions.join(', ')}. Source: ${l.preference.grounding.source.request_ref}. Current explicit instructions take priority.`).join('\n');
 if(arm!=='are')throw Error('unknown arm');
 return JSON.stringify(projectInteractionContext(state,{participant_ref:state.participant_ref,product_ref:state.product_ref,interaction_ref:'build',request,request_ref:digestValue(request),target:'response'},materializeLearningPolicy({mode:'apply-scoped'})));
}
