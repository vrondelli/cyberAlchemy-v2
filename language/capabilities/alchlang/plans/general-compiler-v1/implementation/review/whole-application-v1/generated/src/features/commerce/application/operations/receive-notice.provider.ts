import {ruleIdentityValid as guard0} from "../../domain/rules/identity-valid.js";
import {createOrderNoticeFactory as ownedImport1} from "../../domain/value-objects/order-notice.js";
import {mappingMessageToOrder as valueCall0} from "../mappings/message-to-order.js";
// structured-rule-capability:base
type RuleProtocol<T> = Readonly<{normalize:(input:unknown)=>T;key:(value:T)=>string}>;
const rulePart = (value:string):string=>value.length+':'+value;
const ruleData = (input:unknown,allowed:readonly string[]):Record<string,PropertyDescriptor>=>{
  if(input===null||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input))) throw new TypeError('OPERATION_INPUT');
  const descriptors=Object.getOwnPropertyDescriptors(input);
  if(Reflect.ownKeys(descriptors).some(key=>typeof key!=='string'||!allowed.includes(key))||Object.values(descriptors).some(d=>!Object.hasOwn(d,'value')||!d.enumerable)) throw new TypeError('OPERATION_INPUT');
  return descriptors;
};
// structured-rule-capability:UInt64
const ruleUInt64:RuleProtocol<bigint> = Object.freeze({
  normalize:(input:unknown):bigint=>{
    let value:bigint;
    if(typeof input==='bigint')value=input;
    else if(typeof input==='number'&&Number.isSafeInteger(input))value=BigInt(input);
    else if(typeof input==='string'&&input.length<=20&&/^(0|[1-9][0-9]*)$/.exec(input)?.[0]===input)value=BigInt(input);
    else throw new TypeError('OPERATION_INPUT');
    if(value<0n||value>18446744073709551615n)throw new TypeError('OPERATION_INPUT');
    return value;
  },key:(value:bigint):string=>rulePart('UInt64')+rulePart(String(value)),
});
// end structured Rule support
type R1 = Readonly<{readonly "id":bigint}>;
type R1Input = Readonly<{readonly "id":bigint|number|string}>;
const R1Value:RuleProtocol<R1> = Object.freeze({
  normalize:(input:unknown):R1=>{
    const d=ruleData(input,["id"]);
    return Object.freeze({["id"]:ruleUInt64.normalize(Object.hasOwn(d,"id")?d["id"]!.value:undefined)});
  },key:(value:R1):string=>rulePart("Value Object")+rulePart("commerce:order-notice")+rulePart("id")+rulePart(ruleUInt64.key(value["id"])),
});
const own2=(v:bigint)=>(v);
const own0Factory=ownedImport1();
const own0=(v:R1)=>{const result=own0Factory.create({["id"]:own2(v["id"])});if(!result.ok)throw new TypeError("OPERATION_VALUE:"+result.failure_codes.join(","));return result.value;};
const captureData=(input:unknown):unknown=>{
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
export type OperationInput=Readonly<{readonly "request":R1Input}>;
export type OperationValue=R1;
export type ReadRequest=never;
export type WriteIntent=never;
export type EventIntent=never;
export type OperationBatch=Readonly<{writes:readonly WriteIntent[];events:readonly EventIntent[]}>;
export type CommitReceipt=Readonly<{status:"committed"|"rejected"|"indeterminate"}>;
export type QuerySourceRequest=never;
export type Transaction=Readonly<{read:(request:ReadRequest)=>Promise<unknown>;commit:(batch:OperationBatch)=>Promise<CommitReceipt>;rollback:()=>Promise<void>}>;
export type OperationDependencies=Readonly<{store:Readonly<{begin:()=>Promise<Transaction>}>}>;
export type OperationFailure=Readonly<{status:"rejected"|"failed"|"indeterminate";stage:string;code:string;continuation:"return-notice-error";cleanupFailed:boolean}>;
export type OperationOutcome=Readonly<{status:"committed";value:OperationValue}>|OperationFailure;
export const execute=async (parameters:OperationInput,dependencies:OperationDependencies):Promise<OperationOutcome>=>{
  let stage="input";
  const failure=(status:OperationFailure["status"],code:string,cleanupFailed=false):OperationFailure=>Object.freeze({status,stage,code,continuation:"return-notice-error",cleanupFailed});
  let captured:Record<string,unknown>;
  let p0:R1;
  try {captured=captureData(parameters) as Record<string,unknown>;const d=ruleData(captured,["request"]);if(Object.keys(d).length!==1)throw new TypeError("OPERATION_INPUT");
    p0=R1Value.normalize(d["request"]!.value);
  }catch{return failure("failed","OPERATION_INPUT");}
  stage="begin";let transaction:Transaction;
  try{transaction=await dependencies.store.begin();}catch{return failure("failed","BEGIN_FAILED");}
  const abort=async(status:OperationFailure["status"],code:string):Promise<OperationFailure>=>{try{await transaction.rollback();return failure(status,code);}catch{return failure(status,code,true);}};
  let commitAttempted=false;
  try{
    stage="read";
    stage="mapping:commerce:message-to-order";
    const computed0=valueCall0({["payload"]:p0});
    stage="guard";
    if(!guard0({["identity"]:computed0["id"]}))return abort("rejected","RULE_REJECTED:commerce:identity-valid");
    stage="write-validation";
    stage="event";
    stage="result";const result=R1Value.normalize(computed0);
    own0(result);
    const batch:OperationBatch=Object.freeze({writes:Object.freeze([]),events:Object.freeze([])});
    stage="commit";commitAttempted=true;
    const receipt=await transaction.commit(batch);
    const d=ruleData(receipt,["status"]);if(Object.keys(d).length!==1)return failure("indeterminate","INVALID_COMMIT_RECEIPT");
    if(d.status!.value==="committed")return Object.freeze({status:"committed",value:result});
    if(d.status!.value==="rejected")return failure("rejected","COMMIT_REJECTED");
    return failure("indeterminate",d.status!.value==="indeterminate"?"COMMIT_INDETERMINATE":"INVALID_COMMIT_RECEIPT");
  }catch{return commitAttempted?failure("indeterminate","COMMIT_UNCERTAIN"):abort("failed","OPERATION_FAILED");}
};
