import * as Public0 from "../interfaces/order-api.js";
if(Public0.descriptor.selector!=="commerce:order-api"||Public0.descriptor.contract_sha256!=="6e29703250e36ca4500b12a678ca10e0f989a8434e87d44e80791381ed07bfd8"||Public0.descriptor.graph_sha256!=="2526b57edf7317e09650e5653d18468e82fee93a0626d17971e0a51df36757b8"||Public0.descriptor.field_compilation_sha256!=="ec4c5c0fd176ab0f3fe7a030ce5cf2917980e8c3636fd97f3074b0c60d7b1d02")throw new TypeError("MAPPING_INTERFACE_BINDING");
// structured-rule-capability:base
type RuleProtocol<T> = Readonly<{normalize:(input:unknown)=>T;key:(value:T)=>string}>;
const rulePart = (value:string):string=>value.length+':'+value;
const ruleData = (input:unknown,allowed:readonly string[]):Record<string,PropertyDescriptor>=>{
  if(input===null||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input))) throw new TypeError('RULE_INPUT');
  const descriptors=Object.getOwnPropertyDescriptors(input);
  if(Reflect.ownKeys(descriptors).some(key=>typeof key!=='string'||!allowed.includes(key))||Object.values(descriptors).some(d=>!Object.hasOwn(d,'value')||!d.enumerable)) throw new TypeError('RULE_INPUT');
  return descriptors;
};
// structured-rule-capability:Bool
const ruleBool:RuleProtocol<boolean> = Object.freeze({normalize:(input:unknown):boolean=>{if(typeof input!=='boolean')throw new TypeError('RULE_INPUT');return input;},key:(value:boolean):string=>rulePart('Bool')+rulePart(value?'1':'0')});
// structured-rule-capability:UInt64
const ruleUInt64:RuleProtocol<bigint> = Object.freeze({
  normalize:(input:unknown):bigint=>{
    let value:bigint;
    if(typeof input==='bigint')value=input;
    else if(typeof input==='number'&&Number.isSafeInteger(input))value=BigInt(input);
    else if(typeof input==='string'&&input.length<=20&&/^(0|[1-9][0-9]*)$/.exec(input)?.[0]===input)value=BigInt(input);
    else throw new TypeError('RULE_INPUT');
    if(value<0n||value>18446744073709551615n)throw new TypeError('RULE_INPUT');
    return value;
  },key:(value:bigint):string=>rulePart('UInt64')+rulePart(String(value)),
});
// end structured Rule support
export type Parameters=Readonly<{readonly "payload":Public0.PublicContracts["submit-request"]}>;
export type Result=Readonly<{readonly "id":bigint;readonly "accepted":boolean}>;
export const map=(parameters:Parameters):Result=>{
 const d=ruleData(parameters,["payload"]);
 if(Object.keys(d).length!==1)throw new TypeError("MAPPING_INPUT");
 const p0=Public0.publicContracts["submit-request"].normalize(d["payload"]!.value);
 const v0=ruleUInt64.normalize(p0["id"]);
 const v1=ruleBool.normalize(p0["accepted"]);
 return Object.freeze({["id"]:v0,["accepted"]:v1});
};
