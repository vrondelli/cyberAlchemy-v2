// structured-rule-capability:base
type RuleProtocol<T> = Readonly<{normalize:(input:unknown)=>T;key:(value:T)=>string}>;
const rulePart = (value:string):string=>value.length+':'+value;
const ruleData = (input:unknown,allowed:readonly string[]):Record<string,PropertyDescriptor>=>{
  if(input===null||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input))) throw new TypeError('MAPPING_INPUT');
  const descriptors=Object.getOwnPropertyDescriptors(input);
  if(Reflect.ownKeys(descriptors).some(key=>typeof key!=='string'||!allowed.includes(key))||Object.values(descriptors).some(d=>!Object.hasOwn(d,'value')||!d.enumerable)) throw new TypeError('MAPPING_INPUT');
  return descriptors;
};
// structured-rule-capability:UInt64
const ruleUInt64:RuleProtocol<bigint> = Object.freeze({
  normalize:(input:unknown):bigint=>{
    let value:bigint;
    if(typeof input==='bigint')value=input;
    else if(typeof input==='number'&&Number.isSafeInteger(input))value=BigInt(input);
    else if(typeof input==='string'&&input.length<=20&&/^(0|[1-9][0-9]*)$/.exec(input)?.[0]===input)value=BigInt(input);
    else throw new TypeError('MAPPING_INPUT');
    if(value<0n||value>18446744073709551615n)throw new TypeError('MAPPING_INPUT');
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
export const map = (parameters:Readonly<{readonly "payload":R1Input}>):Readonly<{readonly "id":bigint}> => {
  const d=ruleData(parameters,["payload"]);
  if(Object.keys(d).length!==1)throw new TypeError("MAPPING_INPUT");
  const p0 = R1Value.normalize(d["payload"]!.value);
  const v0 = p0["id"];
  return Object.freeze({["id"]:v0});
};
