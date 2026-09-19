import {digest,failure,isRecord,sealed,success,text,verifyDigest} from './canonical.mjs';
import {verifyRequirementSnapshot} from './requirement-change.mjs';
import {assessRequirementDelta,assessRequirementPatch,reconcileRequirementDeltaLabels,REQUIREMENT_DELTA_INSTRUCTION,REQUIREMENT_PATCH_INSTRUCTION} from './requirement-patch.mjs';

const closed=(value,keys)=>isRecord(value)&&Object.keys(value).every(key=>keys.includes(key));
const unsafeTarget=/(?:^|\s)(?:and|or|not|without|if|unless|maybe|perhaps|except|instead|only|when|after|before)(?:\s|$)/;
const forms=Object.freeze([
  {operation:'add',pattern:/^Add ([a-z0-9][a-z0-9 -]{0,79}) to the requirements\.$/},
  {operation:'remove',pattern:/^Remove ([a-z0-9][a-z0-9 -]{0,79}) from the requirements\.$/},
  {operation:'maintain',pattern:/^Keep ([a-z0-9][a-z0-9 -]{0,79}) as a requirement\.$/},
]);
const expandedForms=Object.freeze([
  {form_id:'strict.add',operation:'add',pattern:forms[0].pattern},
  {form_id:'strict.remove',operation:'remove',pattern:forms[1].pattern},
  {form_id:'strict.maintain',operation:'maintain',pattern:forms[2].pattern},
  {form_id:'polite.add',operation:'add',pattern:/^Please add ([a-z0-9][a-z0-9 -]{0,79}) to the requirements\.$/},
  {form_id:'polite.remove',operation:'remove',pattern:/^Please remove ([a-z0-9][a-z0-9 -]{0,79}) from the requirements\.$/},
  {form_id:'polite.maintain',operation:'maintain',pattern:/^Please keep ([a-z0-9][a-z0-9 -]{0,79}) as a requirement\.$/},
  {form_id:'question.add',operation:'add',pattern:/^Can you add ([a-z0-9][a-z0-9 -]{0,79}) to the requirements\?$/},
  {form_id:'question.remove',operation:'remove',pattern:/^Can you remove ([a-z0-9][a-z0-9 -]{0,79}) from the requirements\?$/},
  {form_id:'question.maintain',operation:'maintain',pattern:/^Can you keep ([a-z0-9][a-z0-9 -]{0,79}) as a requirement\?$/},
  {form_id:'lower.add',operation:'add',pattern:/^add ([a-z0-9][a-z0-9 -]{0,79}) to the requirements\.$/},
  {form_id:'lower.remove',operation:'remove',pattern:/^remove ([a-z0-9][a-z0-9 -]{0,79}) from the requirements\.$/},
  {form_id:'lower.maintain',operation:'maintain',pattern:/^keep ([a-z0-9][a-z0-9 -]{0,79}) as a requirement\.$/},
  {form_id:'no-period.add',operation:'add',pattern:/^Add ([a-z0-9][a-z0-9 -]{0,79}) to the requirements$/},
  {form_id:'no-period.remove',operation:'remove',pattern:/^Remove ([a-z0-9][a-z0-9 -]{0,79}) from the requirements$/},
  {form_id:'no-period.maintain',operation:'maintain',pattern:/^Keep ([a-z0-9][a-z0-9 -]{0,79}) as a requirement$/},
]);

function fallbackValue(snapshot,request,reasonCodes){
  return sealed('are.requirement-operation-fast-path/v1',{snapshot_digest:snapshot.snapshot_digest,request_digest:digest(request),
    disposition:'fallback-required',operation:null,target:null,change:null,reason_codes:reasonCodes,model_call_eligible:true},'fast_path_digest');
}

export function assessRequirementOperationFastPath(input){
  try{
    if(!closed(input,['snapshot','request','request_ref'])||!verifyRequirementSnapshot(input.snapshot)||!text(input.request)||!text(input.request_ref))throw Error('fast-path.input-invalid');
    const {snapshot,request,request_ref}=input;
    const matched=forms.map(form=>({form,match:form.pattern.exec(request)})).find(candidate=>candidate.match);
    if(!matched)return success('requirement-operation-fast-path',fallbackValue(snapshot,request,['fast-path.explicit-form-not-matched']));
    const target=matched.match[1];
    if(target.includes('  ')||target.endsWith(' ')||unsafeTarget.test(target))return success('requirement-operation-fast-path',fallbackValue(snapshot,request,['fast-path.target-not-closed']));
    const present=snapshot.requirements.includes(target);
    if(matched.form.operation==='maintain'&&!present)return success('requirement-operation-fast-path',fallbackValue(snapshot,request,['fast-path.maintain-target-absent']));
    const patch=matched.form.operation==='add'
      ? {transition:present?'continue':'refine',added:present?[]:[target],removed:[]}
      : matched.form.operation==='remove'
        ? {transition:present?'refine':'continue',added:[],removed:present?[target]:[]}
        : {transition:'continue',added:[],removed:[]};
    const assessed=assessRequirementPatch({snapshot,patch,request,request_ref});
    if(!assessed.ok)throw Error('fast-path.patch-rejected');
    return success('requirement-operation-fast-path',sealed('are.requirement-operation-fast-path/v1',{snapshot_digest:snapshot.snapshot_digest,
      request_digest:digest(request),disposition:'fast-path',operation:matched.form.operation,target,change:assessed.value,
      reason_codes:[],model_call_eligible:false},'fast_path_digest'));
  }catch(error){return failure('requirement-operation-fast-path',[error.message]);}
}

export function verifyRequirementOperationFastPath(record){
  if(!closed(record,['schema_version','snapshot_digest','request_digest','disposition','operation','target','change','reason_codes','model_call_eligible','authority_effect','fast_path_digest'])
    ||record.schema_version!=='are.requirement-operation-fast-path/v1'||record.authority_effect!=='none'||!verifyDigest(record,'fast_path_digest')
    ||![record.snapshot_digest,record.request_digest].every(value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value))
    ||!Array.isArray(record.reason_codes)||!record.reason_codes.every(text))return false;
  if(record.disposition==='fallback-required')return record.operation===null&&record.target===null&&record.change===null
    &&record.reason_codes.length>0&&record.model_call_eligible===true;
  return record.disposition==='fast-path'&&['add','remove','maintain'].includes(record.operation)&&text(record.target)
    &&record.change?.schema_version==='are.objective-requirement-change/v1'&&record.change.snapshot_digest===record.snapshot_digest
    &&record.reason_codes.length===0&&record.model_call_eligible===false;
}

export function assessRequirementOperationFastPathExpanded(input){
  try{
    if(!closed(input,['snapshot','request','request_ref'])||!verifyRequirementSnapshot(input.snapshot)||!text(input.request)||!text(input.request_ref))throw Error('fast-path.input-invalid');
    const {snapshot,request,request_ref}=input;
    const matched=expandedForms.map(form=>({form,match:form.pattern.exec(request)})).find(candidate=>candidate.match);
    if(!matched)return success('requirement-operation-fast-path',sealed('are.requirement-operation-fast-path/v2',{snapshot_digest:snapshot.snapshot_digest,
      request_digest:digest(request),disposition:'fallback-required',operation:null,target:null,form_id:null,change:null,
      reason_codes:['fast-path.expanded-form-not-matched'],model_call_eligible:true},'fast_path_digest'));
    const target=matched.match[1];
    if(target.includes('  ')||target.endsWith(' ')||unsafeTarget.test(target))return success('requirement-operation-fast-path',sealed('are.requirement-operation-fast-path/v2',{
      snapshot_digest:snapshot.snapshot_digest,request_digest:digest(request),disposition:'fallback-required',operation:null,target:null,form_id:null,change:null,
      reason_codes:['fast-path.target-not-closed'],model_call_eligible:true},'fast_path_digest'));
    const present=snapshot.requirements.includes(target);
    if(matched.form.operation==='maintain'&&!present)return success('requirement-operation-fast-path',sealed('are.requirement-operation-fast-path/v2',{
      snapshot_digest:snapshot.snapshot_digest,request_digest:digest(request),disposition:'fallback-required',operation:null,target:null,form_id:null,change:null,
      reason_codes:['fast-path.maintain-target-absent'],model_call_eligible:true},'fast_path_digest'));
    const patch=matched.form.operation==='add'?{transition:present?'continue':'refine',added:present?[]:[target],removed:[]}
      :matched.form.operation==='remove'?{transition:present?'refine':'continue',added:[],removed:present?[target]:[]}
      :{transition:'continue',added:[],removed:[]};
    const assessed=assessRequirementPatch({snapshot,patch,request,request_ref});if(!assessed.ok)throw Error('fast-path.patch-rejected');
    return success('requirement-operation-fast-path',sealed('are.requirement-operation-fast-path/v2',{snapshot_digest:snapshot.snapshot_digest,
      request_digest:digest(request),disposition:'fast-path',operation:matched.form.operation,target,form_id:matched.form.form_id,change:assessed.value,
      reason_codes:[],model_call_eligible:false},'fast_path_digest'));
  }catch(error){return failure('requirement-operation-fast-path',[error.message]);}
}

export function verifyRequirementOperationFastPathExpanded(record){
  if(!closed(record,['schema_version','snapshot_digest','request_digest','disposition','operation','target','form_id','change','reason_codes','model_call_eligible','authority_effect','fast_path_digest'])
    ||record.schema_version!=='are.requirement-operation-fast-path/v2'||record.authority_effect!=='none'||!verifyDigest(record,'fast_path_digest')
    ||!Array.isArray(record.reason_codes)||!record.reason_codes.every(text))return false;
  if(record.disposition==='fallback-required')return record.operation===null&&record.target===null&&record.form_id===null&&record.change===null
    &&record.reason_codes.length>0&&record.model_call_eligible===true;
  return record.disposition==='fast-path'&&['add','remove','maintain'].includes(record.operation)&&text(record.target)&&text(record.form_id)
    &&record.change?.schema_version==='are.objective-requirement-change/v1'&&record.change.snapshot_digest===record.snapshot_digest
    &&record.reason_codes.length===0&&record.model_call_eligible===false;
}

export async function resolveRequirementOperation(input,fallback){
  try{
    const assessed=assessRequirementOperationFastPath(input);
    if(!assessed.ok)return assessed;
    const fastPath=assessed.value;
    if(fastPath.disposition==='fast-path')return success('requirement-operation-resolution',sealed('are.requirement-operation-resolution/v1',{
      fast_path_digest:fastPath.fast_path_digest,disposition:'fast-path',model_calls:0,change:fastPath.change,fallback_contract_digest:null},'resolution_digest'));
    if(typeof fallback!=='function')return failure('requirement-operation-resolution',['fast-path.fallback-required']);
    const contract=Object.freeze({instruction:REQUIREMENT_PATCH_INSTRUCTION,snapshot:input.snapshot,request:input.request,request_ref:input.request_ref});
    const patch=await fallback(contract);
    const result=assessRequirementPatch({...input,patch});
    if(!result.ok)return failure('requirement-operation-resolution',result.reason_codes);
    return success('requirement-operation-resolution',sealed('are.requirement-operation-resolution/v1',{fast_path_digest:fastPath.fast_path_digest,
      disposition:'model-fallback',model_calls:1,change:result.value,fallback_contract_digest:digest(contract)},'resolution_digest'));
  }catch(error){return failure('requirement-operation-resolution',[error.message]);}
}

export async function resolveRequirementOperationFromDelta(input,fallback){
  try{
    const assessed=assessRequirementOperationFastPath(input);
    if(!assessed.ok)return assessed;
    const fastPath=assessed.value;
    if(fastPath.disposition==='fast-path')return success('requirement-operation-resolution',sealed('are.requirement-operation-resolution/v2',{
      fast_path_digest:fastPath.fast_path_digest,disposition:'fast-path',model_calls:0,change:fastPath.change,fallback_contract_digest:null,
      transition_owner:'deterministic-host'},'resolution_digest'));
    if(typeof fallback!=='function')return failure('requirement-operation-resolution',['fast-path.fallback-required']);
    const contract=Object.freeze({instruction:REQUIREMENT_DELTA_INSTRUCTION,snapshot:input.snapshot,request:input.request,request_ref:input.request_ref});
    const delta=await fallback(contract);
    const result=assessRequirementDelta({...input,delta});
    if(!result.ok)return failure('requirement-operation-resolution',result.reason_codes);
    return success('requirement-operation-resolution',sealed('are.requirement-operation-resolution/v2',{fast_path_digest:fastPath.fast_path_digest,
      disposition:'model-fallback',model_calls:1,change:result.value,fallback_contract_digest:digest(contract),transition_owner:'deterministic-host'},'resolution_digest'));
  }catch(error){return failure('requirement-operation-resolution',[error.message]);}
}

export async function resolveRequirementOperationFromReconciledDelta(input,fallback){
  try{
    const assessed=assessRequirementOperationFastPath(input);
    if(!assessed.ok)return assessed;
    const fastPath=assessed.value;
    if(fastPath.disposition==='fast-path')return success('requirement-operation-resolution',sealed('are.requirement-operation-resolution/v3',{
      fast_path_digest:fastPath.fast_path_digest,disposition:'fast-path',model_calls:0,change:fastPath.change,fallback_contract_digest:null,
      transition_owner:'deterministic-host',label_owner:'exact-request-span',label_reconciliation_digest:null},'resolution_digest'));
    if(typeof fallback!=='function')return failure('requirement-operation-resolution',['fast-path.fallback-required']);
    const contract=Object.freeze({instruction:REQUIREMENT_DELTA_INSTRUCTION,snapshot:input.snapshot,request:input.request,request_ref:input.request_ref});
    const delta=await fallback(contract),reconciled=reconcileRequirementDeltaLabels({request:input.request,delta});
    if(!reconciled.ok)return failure('requirement-operation-resolution',reconciled.reason_codes);
    const result=assessRequirementDelta({...input,delta:reconciled.value.reconciled_delta});
    if(!result.ok)return failure('requirement-operation-resolution',result.reason_codes);
    return success('requirement-operation-resolution',sealed('are.requirement-operation-resolution/v3',{fast_path_digest:fastPath.fast_path_digest,
      disposition:'model-fallback',model_calls:1,change:result.value,fallback_contract_digest:digest(contract),transition_owner:'deterministic-host',
      label_owner:'exact-request-span',label_reconciliation_digest:reconciled.value.reconciliation_digest},'resolution_digest'));
  }catch(error){return failure('requirement-operation-resolution',[error.message]);}
}

export async function resolveRequirementOperationExpanded(input,fallback){
  try{
    const assessed=assessRequirementOperationFastPathExpanded(input);if(!assessed.ok)return assessed;const fastPath=assessed.value;
    if(fastPath.disposition==='fast-path')return success('requirement-operation-resolution',sealed('are.requirement-operation-resolution/v4',{
      fast_path_digest:fastPath.fast_path_digest,disposition:'fast-path',form_id:fastPath.form_id,model_calls:0,change:fastPath.change,
      fallback_contract_digest:null,transition_owner:'deterministic-host',label_owner:'expanded-grammar',label_reconciliation_digest:null},'resolution_digest'));
    const fallbackResult=await resolveRequirementOperationFromReconciledDelta(input,fallback);if(!fallbackResult.ok)return fallbackResult;
    return success('requirement-operation-resolution',sealed('are.requirement-operation-resolution/v4',{fast_path_digest:fastPath.fast_path_digest,
      disposition:fallbackResult.value.disposition,form_id:null,model_calls:fallbackResult.value.model_calls,change:fallbackResult.value.change,
      fallback_contract_digest:fallbackResult.value.fallback_contract_digest,transition_owner:fallbackResult.value.transition_owner,
      label_owner:fallbackResult.value.label_owner,label_reconciliation_digest:fallbackResult.value.label_reconciliation_digest},'resolution_digest'));
  }catch(error){return failure('requirement-operation-resolution',[error.message]);}
}
