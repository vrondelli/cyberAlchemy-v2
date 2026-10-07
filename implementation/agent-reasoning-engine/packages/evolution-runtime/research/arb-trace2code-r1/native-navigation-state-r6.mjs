// Same-budget native task-state bridge; no provider/filesystem or new source access.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R6.json.
import {buildMethodNavigationState,collectConfirmedMethodNavigation} from './method-navigation-state-r6.mjs';
import {buildTaskStateProjection as buildReadState} from '../../../../benchmarks/contextbench-v1/task-state.mjs';
import {requireCertainReceiptHistory} from './compact-method-terminal-r4b.mjs';
export async function buildTaskStateProjection(input){
 requireCertainReceiptHistory(input.receipts);
 if(input.generation===0)return null;
 if(typeof input.task?.native_navigation_case_id!=='string')throw Error('native-navigation.case-binding');
 if(input.max_bytes>4096||input.max_tokens>512||input.novelty_gate||input.max_paths!==undefined||input.max_handles_per_path!==undefined)
  throw Error('native-navigation.original-state-limits');
 const binding={caseId:input.task.native_navigation_case_id,captures:input.captures,receipts:input.receipts};
 const collected=collectConfirmedMethodNavigation(binding);
 if(!collected.observations.length)return buildReadState(input);
 const projected=await buildMethodNavigationState({...binding,generation:input.generation,max_bytes:input.max_bytes,
  max_tokens:input.max_tokens,max_pages:input.max_outcomes,measure_tokens:input.measure_tokens});
 return {...projected,generation:input.generation,projection_mode:'confirmed-native-navigation',evidence:[],outcomes:[],
  limitation:'Navigation is observed metadata, not complete-source evidence. Existing native read index/recovery and exact terminal delivery proof remain required.'};
}
