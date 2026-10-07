// structured-rule-capability:base
type RuleProtocol<T> = Readonly<{normalize:(input:unknown)=>T;key:(value:T)=>string}>;
const rulePart = (value:string):string=>value.length+':'+value;
const ruleData = (input:unknown,allowed:readonly string[]):Record<string,PropertyDescriptor>=>{
  if(input===null||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input))) throw new TypeError('INTERFACE_VALUE');
  const descriptors=Object.getOwnPropertyDescriptors(input);
  if(Reflect.ownKeys(descriptors).some(key=>typeof key!=='string'||!allowed.includes(key))||Object.values(descriptors).some(d=>!Object.hasOwn(d,'value')||!d.enumerable)) throw new TypeError('INTERFACE_VALUE');
  return descriptors;
};
// structured-rule-capability:Bool
const ruleBool:RuleProtocol<boolean> = Object.freeze({normalize:(input:unknown):boolean=>{if(typeof input!=='boolean')throw new TypeError('INTERFACE_VALUE');return input;},key:(value:boolean):string=>rulePart('Bool')+rulePart(value?'1':'0')});
// structured-rule-capability:UInt64
const ruleUInt64:RuleProtocol<bigint> = Object.freeze({
  normalize:(input:unknown):bigint=>{
    let value:bigint;
    if(typeof input==='bigint')value=input;
    else if(typeof input==='number'&&Number.isSafeInteger(input))value=BigInt(input);
    else if(typeof input==='string'&&input.length<=20&&/^(0|[1-9][0-9]*)$/.exec(input)?.[0]===input)value=BigInt(input);
    else throw new TypeError('INTERFACE_VALUE');
    if(value<0n||value>18446744073709551615n)throw new TypeError('INTERFACE_VALUE');
    return value;
  },key:(value:bigint):string=>rulePart('UInt64')+rulePart(String(value)),
});
// end structured Rule support
type I0=Readonly<{readonly "accepted":boolean;readonly "id":bigint}>;
const I0Value:RuleProtocol<I0>=Object.freeze({normalize:(input:unknown):I0=>{
  const d=ruleData(input,["accepted","id"]);
  return Object.freeze({["accepted"]:ruleBool.normalize(Object.hasOwn(d,"accepted")?d["accepted"]!.value:undefined),["id"]:ruleUInt64.normalize(Object.hasOwn(d,"id")?d["id"]!.value:undefined)});
},key:(value:I0):string=>rulePart("commerce:order-api")+rulePart("submit-request")+rulePart("accepted")+rulePart(ruleBool.key(value["accepted"]))+rulePart("id")+rulePart(ruleUInt64.key(value["id"]))});
type I1=Readonly<{readonly "accepted":boolean;readonly "id":bigint}>;
const I1Value:RuleProtocol<I1>=Object.freeze({normalize:(input:unknown):I1=>{
  const d=ruleData(input,["accepted","id"]);
  return Object.freeze({["accepted"]:ruleBool.normalize(Object.hasOwn(d,"accepted")?d["accepted"]!.value:undefined),["id"]:ruleUInt64.normalize(Object.hasOwn(d,"id")?d["id"]!.value:undefined)});
},key:(value:I1):string=>rulePart("commerce:order-api")+rulePart("summary")+rulePart("accepted")+rulePart(ruleBool.key(value["accepted"]))+rulePart("id")+rulePart(ruleUInt64.key(value["id"]))});
export const versionPolicy = Object.freeze({"schema_version":"domainspec.interface-version-policy/v1","mode":"exact","direction":"consumer-to-provider","provider_version":"1.0.0","definition_sha256":"15f8132055336ba19d64fb0bee59d8f8bc711600ab1aa159116d5a03d65d6526","authority_effect":"none"} as const);
export const acceptsVersion = (consumerVersion: unknown): boolean => {
  if (typeof consumerVersion !== "string" || consumerVersion.length > 194) return false;
  const match = /^(0|[1-9][0-9]{0,63})\.(0|[1-9][0-9]{0,63})\.(0|[1-9][0-9]{0,63})$/.exec(consumerVersion);
  if (!match || match[0] !== consumerVersion) return false;
  return consumerVersion === "1.0.0";
};
export type PublicContracts=Readonly<{readonly "submit-request":I0;readonly "summary":I1}>;
export type Interface=Readonly<{readonly "submit-order":(request:I0)=>Promise<I1>}>;
export const publicContracts=Object.freeze({["submit-request"]:I0Value,["summary"]:I1Value});
export const endpointValues=Object.freeze({["submit-order"]:Object.freeze({request:I0Value,result:I1Value})});
export const descriptor=Object.freeze({["schema_version"]:"domainspec.named-interface-descriptor/v1-candidate",["selector"]:"commerce:order-api",["definition_sha256"]:"cfaaff5a40d3c84b128ffc572fa74652863241a8513bac8b63342fc1148fb4b5",["graph_sha256"]:"2526b57edf7317e09650e5653d18468e82fee93a0626d17971e0a51df36757b8",["source"]:Object.freeze({["relative_path"]:"specs/commerce/nodes/order-api.json",["sha256"]:"ad0afee67ef964e9b29fc5943dcb71774d4a63c5964a3adb3e01c6071f78cf7b"}),["field_compilation_sha256"]:"ec4c5c0fd176ab0f3fe7a030ce5cf2917980e8c3636fd97f3074b0c60d7b1d02",["contract_sha256"]:"6e29703250e36ca4500b12a678ca10e0f989a8434e87d44e80791381ed07bfd8",["contract"]:Object.freeze({["schema_version"]:"domainspec.typed-interface/v1",["ontology_interface"]:"FIXTURE-ORDER-API",["boundary_kind"]:"external",["version_policy"]:Object.freeze({["schema_version"]:"domainspec.interface-version-policy/v1",["mode"]:"exact",["direction"]:"consumer-to-provider",["provider_version"]:"1.0.0"}),["contracts"]:Object.freeze([Object.freeze({["contract_id"]:"submit-request",["ontology_contract"]:"FIXTURE-SUBMIT-REQUEST",["fields"]:Object.freeze([Object.freeze({["name"]:"id",["ontology_field"]:"FIXTURE-SUBMIT-REQUEST#id",["meaning"]:"Public identity value.",["type"]:Object.freeze({["kind"]:"scalar",["name"]:"UInt64"})}),Object.freeze({["name"]:"accepted",["ontology_field"]:"FIXTURE-SUBMIT-REQUEST#accepted",["meaning"]:"Explicit acceptance flag.",["type"]:Object.freeze({["kind"]:"scalar",["name"]:"Bool"})})])}),Object.freeze({["contract_id"]:"summary",["ontology_contract"]:"FIXTURE-SUMMARY",["fields"]:Object.freeze([Object.freeze({["name"]:"id",["ontology_field"]:"FIXTURE-SUMMARY#id",["meaning"]:"Public identity value.",["type"]:Object.freeze({["kind"]:"scalar",["name"]:"UInt64"})}),Object.freeze({["name"]:"accepted",["ontology_field"]:"FIXTURE-SUMMARY#accepted",["meaning"]:"Explicit acceptance flag.",["type"]:Object.freeze({["kind"]:"scalar",["name"]:"Bool"})})])})]),["operations"]:Object.freeze([Object.freeze({["operation_id"]:"submit-order",["operation_ref"]:"commerce:submit-order",["request"]:Object.freeze({["kind"]:"contract",["contract_id"]:"submit-request"}),["result"]:Object.freeze({["kind"]:"contract",["contract_id"]:"summary"})})])}),["effect_contract"]:"structural-interface-and-pure-shape-normalizers",["invariant_execution"]:"not-performed",["transport_execution"]:"not-performed",["authority_effect"]:"none"});
