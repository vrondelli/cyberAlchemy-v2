const eventFail = ():never => {throw new TypeError("EVENT_INPUT");};
const eventData = (value:unknown,allowed:readonly string[],required:readonly string[]):Record<string,PropertyDescriptor> => {
  if(!value||typeof value!=="object"||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return eventFail();
  const d=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(d).some(k=>typeof k!=="string"||!allowed.includes(k))||Object.values(d).some(p=>!Object.hasOwn(p,"value")||!p.enumerable)||required.some(k=>!Object.hasOwn(d,k)))return eventFail();
  return d;
};
const eventString = (v:unknown):string => typeof v==="string"?v:eventFail();
const eventText = (v:unknown):string => typeof v==="string"&&v.length>0?v:eventFail();
const eventUInt64 = (v:unknown):bigint => {
  let n:bigint;
  if(typeof v==="bigint")n=v;
  else if(typeof v==="number"&&Number.isSafeInteger(v))n=BigInt(v);
  else if(typeof v==="string"&&v.length<=20&&/^(0|[1-9][0-9]*)$/.exec(v)?.[0]===v)n=BigInt(v);
  else return eventFail();
  return n>=0n&&n<=18446744073709551615n?n:eventFail();
};
type EventRef<S extends string,V> = V & {readonly __domainspecRef?:S};
export type EventInput = Readonly<{occurrence:Readonly<{"event-id":string}>;occurredAt:string;payload:Readonly<{readonly "order-id":bigint|number|string}>}>;
export type EventValue = Readonly<{type:"order-submitted";version:"1";occurrence:Readonly<{"event-id":string}>;occurredAt:string;payload:Readonly<{readonly "order-id":EventRef<"commerce:order",bigint>}>}>;
export const make = (input:EventInput):EventValue => {
  const d=eventData(input,["occurrence","occurredAt","payload"],["occurrence","occurredAt","payload"]);
  const o=eventData(d["occurrence"]!.value,["event-id"],["event-id"]);
  const p=eventData(d["payload"]!.value,["order-id"],["order-id"]);
  const occurrence=Object.freeze({["event-id"]:eventString(o["event-id"]!.value)});
  const payload=Object.freeze({["order-id"]:eventUInt64(p["order-id"]!.value)});
  const occurredAt=eventText(d["occurredAt"]!.value);
  return Object.freeze({type:"order-submitted",version:"1",occurrence,occurredAt,payload});
};
