import {assertCheckedComposedOperationAction,type CheckedOperationAction,type CheckedComposedOperationAction} from '../typed-operation/action-bindings.js';
import type {ValueExpression} from '../typed-operation/contracts.js';
import {assertInterfaceData} from '../typed-backend/interface.js';
import type {FieldReferenceModel} from '../input/field-reference-model.js';
import type {OperationValueProviders} from './configured-operation-owned.js';
import {createStructuredValueRenderer} from './configured-value-types.js';
import {createStructuredValueExpressionRenderer,type BoundValue} from './configured-value-expressions.js';
import {createOperationOwnedRenderer} from './configured-operation-owned.js';
import {createOperationCompositionRenderer,type ComposedBoundValue,type OperationValueImport,type OperationPublicValueImport,type OperationAbsenceFailure} from './composed-operation-values.js';

export interface OperationDependencyImport {readonly selector:string;readonly path:string;readonly symbol:string;readonly local:string;}
export function renderConfiguredOperation(action:CheckedOperationAction,model:FieldReferenceModel|null,factories:OperationValueProviders,ownerPath:string,rules:readonly OperationDependencyImport[],events:readonly OperationDependencyImport[]){
  return renderOperationSource(action,model,factories,ownerPath,rules,events,null);
}
export interface OperationCompositionImports {readonly values:readonly OperationValueImport[];readonly public_values:readonly OperationPublicValueImport[];readonly absence_failures:readonly OperationAbsenceFailure[];}
export function renderConfiguredComposedOperation(action:CheckedComposedOperationAction,model:FieldReferenceModel,factories:OperationValueProviders,ownerPath:string,rules:readonly OperationDependencyImport[],events:readonly OperationDependencyImport[],composition:OperationCompositionImports){
  assertCheckedComposedOperationAction(action);
  assertInterfaceData(model);assertInterfaceData(composition);
  return renderOperationSource(action,model,factories,ownerPath,rules,events,composition);
}
function renderOperationSource(action:CheckedOperationAction|CheckedComposedOperationAction,model:FieldReferenceModel|null,factories:OperationValueProviders,ownerPath:string,rules:readonly OperationDependencyImport[],events:readonly OperationDependencyImport[],composition:OperationCompositionImports|null){
  const q=JSON.stringify,fail=(m:string):never=>{throw Error('DS_CONFIGURED_OPERATION:'+m);},b=action.bindings;
  const values=createStructuredValueRenderer(model,fail),owned=createOperationOwnedRenderer(values,model,factories,ownerPath);let next=0;
  const legacyValue=createStructuredValueExpressionRenderer(values,model,()=> 'expr'+next++,fail);
  const initial=new Map<string,ComposedBoundValue>(b.inputs.map((p,i)=>[p.name,{type:p.type,code:'p'+i}])),scope=new Map(initial);
  const parameters=b.inputs.map(p=>values.ensure(p.type));
  const readTypes=action.reads.map(r=>values.ensure({kind:'named',selector:r.target})),keyTypes=action.reads.map(r=>values.ensure(r.identity.type));
  action.reads.forEach((r,i)=>scope.set(r.parameter,{type:{kind:'named',selector:r.target},code:'read'+i}));
  const preparation=action.schema_version==='domainspec.checked-composed-operation-action/v1-candidate'
    ?model&&composition?createOperationCompositionRenderer(action,model,values,scope,composition.values,composition.public_values,composition.absence_failures):fail('missing value composition imports'):null;
  const value=(node:ValueExpression,current:ReadonlyMap<string,ComposedBoundValue>):ComposedBoundValue=>preparation?preparation.expression(node,current):legacyValue(node,current as ReadonlyMap<string,BoundValue>);
  const writeTypes=action.writes.map(w=>values.ensure({kind:'named',selector:w.target}));
  const resultType=values.ensure(b.result.type),result=value(b.result.value,scope).code,resultOwner=owned.ensure(b.result.type);
  const reads=action.reads.map((r,i)=>{
    const key=value(r.key,initial).code;
    return '    const key'+i+'='+keyTypes[i]!.protocol+'.normalize('+key+');\n'+
      '    const raw'+i+'=await transaction.read(Object.freeze({slot:'+q(r.slot)+',target:'+q(r.target)+',key:key'+i+'}));\n'+
      '    if(raw'+i+'===null)return abort("failed","READ_NOT_FOUND");\n'+
      '    const read'+i+'='+readTypes[i]!.protocol+'.normalize(raw'+i+');\n'+
      '    if('+keyTypes[i]!.protocol+'.key(read'+i+'['+q(r.identity.name)+'])!=='+keyTypes[i]!.protocol+'.key(key'+i+'))return abort("failed","READ_IDENTITY_MISMATCH");\n';
  }).join('');
  const guards=action.guards.map(g=>{
    const rule=rules.find(r=>r.selector===g.selector)??fail('missing Rule import');
    const args=g.arguments.map(a=>'['+q(a.parameter)+']:'+value(a.value,scope).code).join(',');
    return '    if(!'+rule.local+'({'+args+'}))return abort("rejected",'+q('RULE_REJECTED:'+g.selector)+');\n';
  }).join('');
  const writes=action.writes.map((w,i)=>'    const write'+i+'='+writeTypes[i]!.protocol+'.normalize('+value(w.value,scope).code+');\n    '+owned.ensure({kind:'named',selector:w.target})+'(write'+i+');\n').join('');
  const eventIndex=(selector:string)=>events.findIndex(e=>e.selector===selector);
  const eventCalls=action.events.map((e,i)=>{
    const index=eventIndex(e.target);if(index<0)return fail('missing Event import');
    return '    const event'+i+'='+events[index]!.local+'(captured['+q(e.parameter)+'] as Event'+index+'Input'+(e.contract.occurred_at_policy==='generated'?',clocks['+q(e.slot)+']':'')+');\n';
  }).join('');
  const clockSlots=action.events.filter(e=>e.contract.occurred_at_policy==='generated').map(e=>e.slot);
  const imports=rules.map(r=>'import {'+r.symbol+' as '+r.local+'} from '+q(r.path)+';\n').join('')+events.map((e,i)=>'import {'+e.symbol+' as '+e.local+'} from '+q(e.path)+';\nimport type {EventInput as Event'+i+'Input,EventValue as Event'+i+'Value} from '+q(e.path)+';\n').join('');
  const fields=[...b.inputs.map(p=>p.name),...b.events.map(e=>e.parameter)];
  const readUnion=action.reads.map((r,i)=>'Readonly<{slot:'+q(r.slot)+';target:'+q(r.target)+';key:'+keyTypes[i]!.native+'}>').join('|')||'never';
  const writeUnion=action.writes.map((w,i)=>'Readonly<{slot:'+q(w.slot)+';target:'+q(w.target)+';mode:'+q(w.mode)+';value:'+writeTypes[i]!.native+'}>').join('|')||'never';
  const eventUnion=action.events.map(e=>'Readonly<{slot:'+q(e.slot)+';target:'+q(e.target)+';value:Event'+eventIndex(e.target)+'Value}>').join('|')||'never';
  const body=owned.source()+captureSupport+
    'export type OperationInput=Readonly<{'+b.inputs.map((p,i)=>'readonly '+q(p.name)+':'+parameters[i]!.input).concat(action.events.map(e=>'readonly '+q(e.parameter)+':Event'+eventIndex(e.target)+'Input')).join(';')+'}>;\n'+
    'export type OperationValue='+resultType.native+';\n'+
    'export type ReadRequest='+readUnion+';\nexport type WriteIntent='+writeUnion+';\nexport type EventIntent='+eventUnion+';\n'+
    'export type OperationBatch=Readonly<{writes:readonly WriteIntent[];events:readonly EventIntent[]}>;\n'+
    'export type CommitReceipt=Readonly<{status:"committed"|"rejected"|"indeterminate"}>;\n'+
    (preparation?'export type QuerySourceRequest='+preparation.sourceRequest+';\n':'')+
    'export type Transaction=Readonly<{read:(request:ReadRequest)=>Promise<unknown>;'+(preparation&&preparation.sourceRequest!=='never'?'querySource:(request:QuerySourceRequest)=>Promise<unknown>;':'')+'commit:(batch:OperationBatch)=>Promise<CommitReceipt>;rollback:()=>Promise<void>}>;\n'+
    'export type OperationDependencies=Readonly<{store:Readonly<{begin:()=>Promise<Transaction>}>'+ (clockSlots.length?';clocks:Readonly<{'+clockSlots.map(s=>'readonly '+q(s)+':()=>string').join(';')+'}>':'')+'}>;\n'+
    'export type OperationFailure=Readonly<{status:"rejected"|"failed"|"indeterminate";stage:string;code:string;continuation:'+q(action.failure_continuation)+';cleanupFailed:boolean}>;\n'+
    'export type OperationOutcome=Readonly<{status:"committed";value:OperationValue}>|OperationFailure;\n'+
    'export const execute=async (parameters:OperationInput,dependencies:OperationDependencies):Promise<OperationOutcome>=>{\n'+
    '  let stage="input";\n  const failure=(status:OperationFailure["status"],code:string,cleanupFailed=false):OperationFailure=>Object.freeze({status,stage,code,continuation:'+q(action.failure_continuation)+',cleanupFailed});\n'+
    '  let captured:Record<string,unknown>;\n'+b.inputs.map((p,i)=>'  let p'+i+':'+parameters[i]!.native+';\n').join('')+
    '  try {captured=captureData(parameters) as Record<string,unknown>;const d=ruleData(captured,'+q(fields)+');if(Object.keys(d).length!=='+fields.length+')throw new TypeError("OPERATION_INPUT");\n'+
    b.inputs.map((p,i)=>'    p'+i+'='+parameters[i]!.protocol+'.normalize(d['+q(p.name)+']!.value);\n').join('')+
    '  }catch{return failure("failed","OPERATION_INPUT");}\n'+
    '  stage="begin";let transaction:Transaction;\n'+
    (clockSlots.length?'  let clocks:OperationDependencies["clocks"];\n':'')+
    '  try{'+(clockSlots.length?'clocks=Object.freeze({'+clockSlots.map(s=>'['+q(s)+']:dependencies.clocks['+q(s)+']').join(',')+'});if('+clockSlots.map(s=>'typeof clocks['+q(s)+']!=="function"').join('||')+')throw new TypeError("CLOCK_DEPENDENCY");':'')+'transaction=await dependencies.store.begin();}catch{return failure("failed","BEGIN_FAILED");}\n'+
    '  const abort=async(status:OperationFailure["status"],code:string):Promise<OperationFailure>=>{try{await transaction.rollback();return failure(status,code);}catch{return failure(status,code,true);}};\n'+
    '  let commitAttempted=false;\n  try{\n    stage="read";\n'+reads+(preparation?.preparation??'')+'    stage="guard";\n'+guards+'    stage="write-validation";\n'+writes+'    stage="event";\n'+eventCalls+
    '    stage="result";const result='+resultType.protocol+'.normalize('+result+');\n    '+resultOwner+'(result);\n'+
    '    const batch:OperationBatch=Object.freeze({writes:Object.freeze(['+action.writes.map((w,i)=>'Object.freeze({slot:'+q(w.slot)+',target:'+q(w.target)+',mode:'+q(w.mode)+',value:write'+i+'})').join(',')+']),events:Object.freeze(['+action.events.map((e,i)=>'Object.freeze({slot:'+q(e.slot)+',target:'+q(e.target)+',value:event'+i+'})').join(',')+'])});\n'+
    '    stage="commit";commitAttempted=true;\n    const receipt=await transaction.commit(batch);\n'+
    '    const d=ruleData(receipt,["status"]);if(Object.keys(d).length!==1)return failure("indeterminate","INVALID_COMMIT_RECEIPT");\n'+
    '    if(d.status!.value==="committed")return Object.freeze({status:"committed",value:result});\n'+
    '    if(d.status!.value==="rejected")return failure("rejected","COMMIT_REJECTED");\n'+
    '    return failure("indeterminate",d.status!.value==="indeterminate"?"COMMIT_INDETERMINATE":"INVALID_COMMIT_RECEIPT");\n'+
    '  }catch{return commitAttempted?failure("indeterminate","COMMIT_UNCERTAIN"):abort("failed","OPERATION_FAILED");}\n};\n';
  return imports+owned.imports()+(preparation?.imports()??'')+(preparation?preparation.source(body):values.source(body)).replaceAll('RULE_INPUT','OPERATION_INPUT');
}

const captureSupport=`const captureData=(input:unknown):unknown=>{
  let count=0;
  const copy=(v:unknown,depth:number):unknown=>{
    if(++count>20000||depth>64)throw new TypeError("OPERATION_INPUT");
    if(v===null||typeof v==="string"||typeof v==="boolean"||typeof v==="bigint"||typeof v==="number"&&Number.isFinite(v))return v;
    if(!v||typeof v!=="object")throw new TypeError("OPERATION_INPUT");
    const array=Array.isArray(v),proto=Object.getPrototypeOf(v);
    if(array?proto!==Array.prototype:proto!==Object.prototype&&proto!==null)throw new TypeError("OPERATION_INPUT");
    const d=Object.getOwnPropertyDescriptors(v),keys=Reflect.ownKeys(d);
    if(keys.length>2048)throw new TypeError("OPERATION_INPUT");
    if(array){const length=d.length!.value;if(length>1024||keys.length!==length+1)throw new TypeError("OPERATION_INPUT");const result:unknown[]=[];for(let i=0;i<length;i++){const p=d[String(i)];if(!p||!Object.hasOwn(p,"value")||!p.enumerable)throw new TypeError("OPERATION_INPUT");result.push(copy(p.value,depth+1));}return Object.freeze(result);}
    const result:Record<string,unknown>=Object.create(null);
    for(const k of keys){const p=d[k as string];if(typeof k!=="string"||!p||!Object.hasOwn(p,"value")||!p.enumerable)throw new TypeError("OPERATION_INPUT");result[k]=copy(p.value,depth+1);}return Object.freeze(result);
  };return copy(input,0);
};
`;
