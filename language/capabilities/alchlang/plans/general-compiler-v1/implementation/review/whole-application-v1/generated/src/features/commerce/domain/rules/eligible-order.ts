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
type R2 = Readonly<{readonly "accepted":boolean;readonly "id":bigint}>;
type R2Input = Readonly<{readonly "accepted":boolean;readonly "id":bigint|number|string}>;
const R2Value:RuleProtocol<R2> = Object.freeze({
  normalize:(input:unknown):R2=>{
    const d=ruleData(input,["accepted","id"]);
    return Object.freeze({["accepted"]:ruleBool.normalize(Object.hasOwn(d,"accepted")?d["accepted"]!.value:undefined),["id"]:ruleUInt64.normalize(Object.hasOwn(d,"id")?d["id"]!.value:undefined)});
  },key:(value:R2):string=>rulePart("Entity")+rulePart("commerce:order")+rulePart("id")+rulePart(ruleUInt64.key(value["id"])),
});
// domainspec-rule: "commerce:eligible-order"; closure: ebaaf7a675b22208419c0ac335a89ce4d4da705486bd34d5dcd2f5e1dd267539
export const ruleEligibleOrder = (parameters:Readonly<{readonly "order":R2Input}>):boolean => {
  const d=ruleData(parameters,["order"]);
  if(Object.keys(d).length!==1)throw new TypeError('RULE_INPUT');
  const p0 = R2Value.normalize(d["order"]!.value);
  return (ruleBool.key(p0["accepted"]) === ruleBool.key(true));
};
