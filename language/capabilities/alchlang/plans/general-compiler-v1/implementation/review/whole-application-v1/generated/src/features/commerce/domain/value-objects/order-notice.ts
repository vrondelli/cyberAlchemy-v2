import {ruleIdentityValid as validator0} from "../rules/identity-valid.js";
export interface OrderNoticeFields {
  readonly "id":bigint;
}
const brand:unique symbol = Symbol("commerce:order-notice");
type Component = Readonly<{field:string;tag:'String'|'Bool'|'ValueObject'|'Optional'|'List'|'Set'|'Enum'|'Sum'|'UInt64'|'Entity';value:unknown;protocol_id:'typescript.owned-value-component/v1';protocol_sha256:string}>;
export interface OrderNoticeSnapshot {
  readonly [brand]:true;
  readonly fields:OrderNoticeFields;
  readonly components:readonly Component[];
  readonly hash:()=>string;
  readonly equals:(other:unknown)=>boolean;
}
type ValidatorTrace = Readonly<{rule:string;closure_sha256:string;artifact_sha256:string;outcome:'pass'|'fail'|'exception'}>;
type Trace = Readonly<{route:string;phases:readonly string[];validators:readonly ValidatorTrace[]}>;
type Result = Readonly<{ok:true;value:OrderNoticeSnapshot;failure_codes:readonly string[];trace:Trace}> | Readonly<{ok:false;value:null;failure_codes:readonly string[];trace:Trace}>;
type BoundValidator = Readonly<{rule:string;closure_sha256:string;artifact_sha256:string;validate:(fields:OrderNoticeFields)=>boolean}>;
interface Factory {
  readonly create:(input:unknown)=>Result;
  readonly reconstruct:(input:unknown)=>Result;
  readonly extend:(id:string)=>Factory;
  readonly extensions:readonly string[];
}
const snapshots = new WeakMap<object,Readonly<{fields:OrderNoticeFields;key:string}>>();
const owned = (value:unknown):value is OrderNoticeSnapshot => value !== null && typeof value === 'object' && snapshots.has(value);
const part = (value:string):string => value.length + ':' + value;
type ValueProtocol<T> = Readonly<{normalize:(input:unknown)=>T;key:(value:T)=>string}>;
const uint64Value:ValueProtocol<bigint> = Object.freeze({
  normalize:(input:unknown):bigint=>{
    let value:bigint;
    if(typeof input === 'bigint') value=input;
    else if(typeof input === 'number' && Number.isSafeInteger(input)) value=BigInt(input);
    else if(typeof input === 'string' && input.length <= 20 && /^(0|[1-9][0-9]*)$/.exec(input)?.[0] === input) value=BigInt(input);
    else throw new TypeError('INVALID_UINT64');
    if(value < 0n || value > 18446744073709551615n) throw new TypeError('INVALID_UINT64');
    return value;
  },
  key:(value:bigint):string=>part('UInt64') + part(String(value)),
});
const field0Value = uint64Value;
const valueKey = (fields:OrderNoticeFields):string => part("commerce:order-notice") + part("3eeaf28f589af095624fd15b62621d15abc12839aa5b07ccf2f3f6847a452e0f") + part("id") + part("UInt64") + part(field0Value.key(fields["id"]));
const baseValidators:readonly BoundValidator[] = Object.freeze([Object.freeze({rule:"commerce:identity-valid",closure_sha256:"e0210b2b7a8e6feba57fbe632fecf18b41a7931a61441ce0fa7e851e505cb263",artifact_sha256:"f0a1daad7a17792b0ad7818f663f1f8f0b2c0e4a714d7d17a0ae2a68bbd5291b",validate:(fields:OrderNoticeFields):boolean=>validator0({["identity"]:fields["id"]})})]);
const extensionValidators:Readonly<Record<string,readonly BoundValidator[]>> = Object.freeze({});
const makeFactory = (extensions:readonly string[],validators:readonly BoundValidator[]):Factory => {
  const construct = (route:string,input:unknown):Result => {
    const phases:string[] = ['normalize'];
    const trace:ValidatorTrace[] = [];
    const evidence = ():Trace => Object.freeze({route,phases:Object.freeze([...phases]),validators:Object.freeze([...trace])});
    const failure = (code:string):Result => Object.freeze({ok:false,value:null,failure_codes:Object.freeze([code]),trace:evidence()});
    let fields:OrderNoticeFields;
    try {
      if (input === null || typeof input !== 'object' || Array.isArray(input) || ![Object.prototype,null].includes(Object.getPrototypeOf(input))) return failure('INVALID_FIELDS');
      const descriptors = Object.getOwnPropertyDescriptors(input);
      if (Reflect.ownKeys(descriptors).some(key=>typeof key !== 'string' || !["id"].includes(key)) || Object.values(descriptors).some(d=>!Object.hasOwn(d,'value') || !d.enumerable)) return failure('INVALID_FIELDS');
      fields = Object.freeze({["id"]:field0Value.normalize(Object.hasOwn(descriptors,"id") ? descriptors["id"]!.value : undefined)});
    } catch {return failure('INVALID_FIELDS');}
    for (const validator of validators) {
      let outcome:'pass'|'fail'|'exception';
      try {outcome = validator.validate(fields) === true ? 'pass' : 'fail';} catch {outcome = 'exception';}
      trace.push(Object.freeze({rule:validator.rule,closure_sha256:validator.closure_sha256,artifact_sha256:validator.artifact_sha256,outcome}));
      if (outcome !== 'pass') return failure('RULE_' + outcome.toUpperCase() + ':' + validator.rule);
    }
    const key = valueKey(fields);
    const components:readonly Component[] = Object.freeze([Object.freeze({field:"id",tag:"UInt64" as const,value:fields["id"],protocol_id:"typescript.owned-value-component/v1" as const,protocol_sha256:"3eeaf28f589af095624fd15b62621d15abc12839aa5b07ccf2f3f6847a452e0f"})]);
    phases.push('form');
    const value:OrderNoticeSnapshot = Object.freeze({[brand]:true as const,fields,components,
      hash:():string=>key,
      equals:(other:unknown):boolean=>owned(other) && field0Value.key(snapshots.get(other)!.fields["id"]) === field0Value.key(fields["id"]),
    });
    snapshots.set(value,Object.freeze({fields,key}));
    phases.push('freeze');
    return Object.freeze({ok:true,value,failure_codes:Object.freeze([]),trace:evidence()});
  };
  return Object.freeze({
    create:(input:unknown):Result=>construct('create',input),
    reconstruct:(input:unknown):Result=>construct('reconstruct',input),
    extensions,
    extend:(id:string):Factory=>{
      if (typeof id !== 'string' || !Object.hasOwn(extensionValidators,id) || extensions.includes(id)) throw new TypeError('INVALID_EXTENSION');
      return makeFactory(Object.freeze([...extensions,id]),Object.freeze([...validators,...extensionValidators[id]!]));
    },
  });
};
export const createOrderNoticeFactory = ():Factory => makeFactory(Object.freeze([]),baseValidators);
// Only this provider's validated snapshots can cross an owned-component boundary.
export const OrderNoticeValueComponent = Object.freeze({
  protocol_id:'typescript.owned-value-component/v1' as const,
  concept:"commerce:order-notice",contract_sha256:"3eeaf28f589af095624fd15b62621d15abc12839aa5b07ccf2f3f6847a452e0f",
  isOwned:owned,
  key:(value:unknown):string=>{if (!owned(value)) throw new TypeError('UNOWNED_COMPONENT');return snapshots.get(value)!.key;},
  equals:(left:unknown,right:unknown):boolean=>owned(left) && owned(right) && snapshots.get(left)!.key === snapshots.get(right)!.key,
});
export const OrderNoticeFieldBindings = Object.freeze([] as const);
