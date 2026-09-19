// domainspec.declarative-function/v1; generated from typed contracts, not executable source text.

const fault = code => Object.assign(new Error(code), {code});
const errorCode = error => /^[A-Z][A-Z0-9_]*$/.test(error?.code ?? '') ? error.code : String(error?.message ?? '').match(/\bCALCULATION_(?:OVERFLOW|UNDERFLOW|DIVIDE_BY_ZERO|INEXACT)\b/)?.[0] ?? 'EVALUATION_FAILED';
function emit(observe,event) {if(observe) {try {observe(structuredClone(event));} catch { /* Observers cannot alter evaluation. */ }}}
function observed(declaration,node_kind,compute,observe) {
 emit(observe,{kind:'node-start',declaration,node_kind});
 try {const value=compute();emit(observe,{kind:'node-result',declaration,node_kind,...(node_kind==='Query'?{count:value.length}:{value})});return value;}
 catch(error){emit(observe,{kind:'node-error',declaration,node_kind,code:errorCode(error)});throw error;}
}
function traceQuery(declaration,rows,predicate,project,observe) {
 emit(observe,{kind:'query-start',declaration,total:rows.length});
 // Preserve filter-before-projection order and evaluate each predicate exactly once.
 return rows.filter((row,index)=>{const accepted=predicate(row);emit(observe,{kind:'query-row',declaration,index,accepted,row});return accepted;}).map(project);
}
function assertObserved(index,phase,code,test,observe) {
 const passed=test();emit(observe,{kind:'assertion',index,phase,code,passed});if(!passed)throw fault(code);
}

const memo = f => { let ready=false, value; return () => {if (!ready) {value=f(); ready=true;} return value;}; };
function fullMatch(pattern,value) {const match=pattern.exec(value);return !!match&&match[0].length===value.length;}
function uint64(value) {
 if (typeof value==='number'&&!Number.isSafeInteger(value)||typeof value==='string'&&!fullMatch(/^(0|[1-9][0-9]*)$/,value)||!['bigint','number','string'].includes(typeof value)) throw fault('FUNCTION_UINT64');
 const n=BigInt(value); if(n<0n||n>18446744073709551615n)throw fault('FUNCTION_UINT64');return n;
}
function optionalUint64(value) {return value == null ? null : uint64(value);}
function decimal(value,scale) {
 if(!fullMatch(new RegExp('^(0|[1-9][0-9]*)(\\.[0-9]{1,'+Math.max(1,scale)+'})?$'),value)||(scale===0&&value.includes('.')))throw fault('FUNCTION_DECIMAL');
 const [whole,fraction='']=value.split('.');return uint64(BigInt(whole)*10n**BigInt(scale)+BigInt(fraction.padEnd(scale,'0')||'0'));
}
function format(value,scale) { const n=uint64(value),base=10n**BigInt(scale);return scale ? (n/base)+'.'+(n%base).toString().padStart(scale,'0') : n.toString(); }
function one(rows) { if(rows.length!==1)throw fault('DS_QUERY_CARDINALITY');return rows[0]; }

export function validateInput(roots, observe) {const v_input=roots.input; assertObserved(0, 'input', "CHECKOUT_REQUEST_MISMATCH", () => (((v_input["pricing"]["request"]["request_id"] === v_input["request_id"]) && (v_input["shipping"]["request"]["request_id"] === v_input["request_id"]))), observe); }
export function execute(roots, api, observe, binding, phase='guard') {
const v_input = roots["input"];
const v_pricing = roots["pricing"];
const v_shipping = roots["shipping"];
const n_NoPrice = memo(() => observed("NoPrice", "Rule", () => ((v_pricing["status"] === "no_price")), observe));
const n_AmbiguousPrice = memo(() => observed("AmbiguousPrice", "Rule", () => ((v_pricing["status"] === "ambiguous_price")), observe));
const n_ShippingUnavailable = memo(() => observed("ShippingUnavailable", "Rule", () => (((v_pricing["status"] === "quoted") && (v_shipping["status"] === "unavailable"))), observe));
const n_Quoted = memo(() => observed("Quoted", "Rule", () => (((v_pricing["status"] === "quoted") && (v_shipping["status"] === "available"))), observe));
const n_NoPriceResponse = memo(() => observed("NoPriceResponse", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"status": "no_price","currency_code": "usd"})), observe));
const n_AmbiguousResponse = memo(() => observed("AmbiguousResponse", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"status": "ambiguous_price","currency_code": "usd"})), observe));
const n_ShippingUnavailableResponse = memo(() => observed("ShippingUnavailableResponse", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"status": "shipping_unavailable","currency_code": "usd"})), observe));
const n_QuotedResponse = memo(() => observed("QuotedResponse", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"status": "quoted","currency_code": "usd","price_id": v_pricing["price_id"],"shipping_option_id": v_shipping["option_id"],"subtotal_minor": v_pricing["subtotal_minor"],"shipping_minor": v_shipping["fee_minor"],"total_minor": ((arg0,arg1) => observed("CheckoutTotal", 'Calculation', () => api.evaluateCalculation("CheckoutTotal", {"subtotalMinor":arg0,"shippingMinor":arg1}), observe))(uint64((v_pricing["subtotal_minor"] ?? "0")),uint64((v_shipping["fee_minor"] ?? "0"))).toString(),"total": format(((arg0,arg1) => observed("CheckoutTotal", 'Calculation', () => api.evaluateCalculation("CheckoutTotal", {"subtotalMinor":arg0,"shippingMinor":arg1}), observe))(uint64((v_pricing["subtotal_minor"] ?? "0")),uint64((v_shipping["fee_minor"] ?? "0"))),2)})), observe));

assertObserved(0, 'behavior', "CHECKOUT_REQUEST_MISMATCH", () => (((v_input["pricing"]["request"]["request_id"] === v_input["request_id"]) && (v_input["shipping"]["request"]["request_id"] === v_input["request_id"]))), observe);
assertObserved(1, 'behavior', "CHECKOUT_RESPONSE_MISMATCH", () => (((v_pricing["request_id"] === v_input["request_id"]) && (v_shipping["request_id"] === v_input["request_id"]))), observe);
assertObserved(2, 'behavior', "CHECKOUT_SHIPPING_MISMATCH", () => ((v_shipping["option_id"] === v_input["shipping"]["request"]["option_id"])), observe);
assertObserved(3, 'behavior', "CHECKOUT_INCOMPLETE_QUOTE", () => (((!n_Quoted()) || (((v_pricing["price_id"] != null) && (v_pricing["subtotal_minor"] != null)) && (v_shipping["fee_minor"] != null)))), observe);
const matches = [() => (n_NoPrice()),() => (n_AmbiguousPrice()),() => (n_ShippingUnavailable()),() => (n_Quoted())].map((test,index) => {const passed=test();emit(observe,{kind:'result-case',index,passed});return passed;});
if (matches.filter(Boolean).length !== 1) throw fault('DS_RESULT_CARDINALITY');
if (matches[0]) {emit(observe,{kind:'selected-case',index:0});return n_NoPriceResponse();}
if (matches[1]) {emit(observe,{kind:'selected-case',index:1});return n_AmbiguousResponse();}
if (matches[2]) {emit(observe,{kind:'selected-case',index:2});return n_ShippingUnavailableResponse();}
if (matches[3]) {emit(observe,{kind:'selected-case',index:3});return n_QuotedResponse();}
}
