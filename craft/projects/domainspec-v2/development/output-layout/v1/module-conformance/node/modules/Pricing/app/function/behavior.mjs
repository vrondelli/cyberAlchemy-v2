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

export function validateInput(roots, observe) {const v_input=roots.input; assertObserved(0, 'input', "QUOTE_UNSUPPORTED_CURRENCY", () => ((v_input["request"]["currency_code"].replace(/[A-Z]/g,c=>c.toLowerCase()) === "usd")), observe); }
export function execute(roots, api, observe, binding, phase='guard') {
const v_input = roots["input"];
const v_snapshot = roots["snapshot"];
const n_PriceRow = (v_row) => observed("PriceRow", "Mapping", () => (Object.freeze({"priceId": v_row["id"],"currency": v_row["currency_code"],"amountMinor": decimal(v_row["raw_amount"]["value"],2),"minQuantity": uint64((v_row["min_quantity"] ?? 0)),"maxQuantity": (optionalUint64(v_row["max_quantity"]) ?? uint64("18446744073709551615"))})), observe);
const n_Tiers = memo(() => observed("Tiers", "Query", () => (traceQuery("Tiers", v_snapshot["prices"], (v_row) => ((!(v_row["deleted_at"] != null)) && (v_row["currency_code"] === "usd")), (v_row) => n_PriceRow(v_row), observe)), observe));
const n_Eligible = memo(() => observed("Eligible", "Query", () => (traceQuery("Eligible", n_Tiers(), (v_p) => (((v_p["currency"] === v_input["request"]["currency_code"].replace(/[A-Z]/g,c=>c.toLowerCase())) && (v_p["minQuantity"] <= uint64(v_input["request"]["quantity"]))) && (v_p["maxQuantity"] >= uint64(v_input["request"]["quantity"]))), (v_p) => v_p, observe)), observe));
const n_Cheapest = memo(() => observed("Cheapest", "Query", () => (traceQuery("Cheapest", n_Eligible(), (v_p) => (!n_Eligible().some((v_q) => (v_q["amountMinor"] < v_p["amountMinor"]))), (v_p) => v_p, observe)), observe));
const n_NoPrice = memo(() => observed("NoPrice", "Rule", () => ((!n_Cheapest().some((v_p) => true))), observe));
const n_UniquePrice = memo(() => observed("UniquePrice", "Rule", () => ((n_Cheapest().filter((v_p) => true).length === 1)), observe));
const n_AmbiguousPrice = memo(() => observed("AmbiguousPrice", "Rule", () => ((n_Cheapest().some((v_p) => true) && (!n_UniquePrice()))), observe));
const n_EmptyQuote = memo(() => observed("EmptyQuote", "Mapping", () => (Object.freeze({"request_id": v_input["request"]["request_id"],"variant_id": v_input["request"]["variant_id"],"price_set_id": v_snapshot["price_set_id"],"currency_code": "usd","status": "no_price"})), observe));
const n_AmbiguousQuote = memo(() => observed("AmbiguousQuote", "Mapping", () => (Object.freeze({"request_id": v_input["request"]["request_id"],"variant_id": v_input["request"]["variant_id"],"price_set_id": v_snapshot["price_set_id"],"currency_code": "usd","status": "ambiguous_price","price_ids": [...n_Cheapest().map(row => row["priceId"])].sort((a,b) => a < b ? -1 : a > b ? 1 : 0),"unit_amount": format(one([...new Set(n_Cheapest().map(row => row["amountMinor"]))]),2)})), observe));
const n_SelectedQuote = (v_p) => observed("SelectedQuote", "Mapping", () => (Object.freeze({"request_id": v_input["request"]["request_id"],"variant_id": v_input["request"]["variant_id"],"price_set_id": v_snapshot["price_set_id"],"currency_code": "usd","status": "quoted","price_id": v_p["priceId"],"unit_amount": format(v_p["amountMinor"],2),"unit_amount_minor": v_p["amountMinor"].toString(),"quantity": v_input["request"]["quantity"],"subtotal": format(((arg0,arg1) => observed("LineSubtotal", 'Calculation', () => api.evaluateCalculation("LineSubtotal", {"amountMinor":arg0,"requestedQuantity":arg1}), observe))(v_p["amountMinor"],uint64(v_input["request"]["quantity"])),2),"subtotal_minor": ((arg0,arg1) => observed("LineSubtotal", 'Calculation', () => api.evaluateCalculation("LineSubtotal", {"amountMinor":arg0,"requestedQuantity":arg1}), observe))(v_p["amountMinor"],uint64(v_input["request"]["quantity"])).toString()})), observe);

assertObserved(0, 'behavior', "QUOTE_UNSUPPORTED_CURRENCY", () => ((v_input["request"]["currency_code"].replace(/[A-Z]/g,c=>c.toLowerCase()) === "usd")), observe);
assertObserved(1, 'behavior', "QUOTE_VARIANT_MISMATCH", () => ((v_snapshot["variant_id"] === v_input["request"]["variant_id"])), observe);
assertObserved(2, 'behavior', "QUOTE_PRICE_SET_MISMATCH", () => (v_snapshot["prices"].every((v_row) => (v_row["price_set_id"] === v_snapshot["price_set_id"]))), observe);
assertObserved(3, 'behavior', "QUOTE_DUPLICATE_PRICE", () => (([...new Set(v_snapshot["prices"].map(row => row["id"]))].length === v_snapshot["prices"].length)), observe);
assertObserved(4, 'behavior', "QUOTE_TIER_RANGE", () => (v_snapshot["prices"].every((v_row) => ((v_row["min_quantity"] ?? 0) <= (v_row["max_quantity"] ?? 2147483647)))), observe);
const matches = [() => (n_NoPrice()),() => (n_UniquePrice()),() => (n_AmbiguousPrice())].map((test,index) => {const passed=test();emit(observe,{kind:'result-case',index,passed});return passed;});
if (matches.filter(Boolean).length !== 1) throw fault('DS_RESULT_CARDINALITY');
if (matches[0]) {emit(observe,{kind:'selected-case',index:0});return n_EmptyQuote();}
if (matches[1]) {emit(observe,{kind:'selected-case',index:1});return n_SelectedQuote(one(n_Cheapest()));}
if (matches[2]) {emit(observe,{kind:'selected-case',index:2});return n_AmbiguousQuote();}
}
