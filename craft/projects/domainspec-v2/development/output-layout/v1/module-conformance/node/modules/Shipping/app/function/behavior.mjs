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

export function validateInput(roots, observe) {const v_input=roots.input;  }
export function execute(roots, api, observe, binding, phase='guard') {
const v_input = roots["input"];
const v_snapshot = roots["snapshot"];
const n_Choice = (v_row) => observed("Choice", "Mapping", () => (Object.freeze({"optionId": v_row["id"],"amountMinor": decimal(v_row["amount"],2)})), observe);
const n_Eligible = memo(() => observed("Eligible", "Query", () => (traceQuery("Eligible", v_snapshot["options"], (v_row) => ((((((v_row["id"] === v_input["request"]["option_id"]) && v_row["enabled"]) && (v_row["country"] === v_input["request"]["country"])) && (v_row["min_weight"] <= v_input["request"]["weight_grams"])) && ((v_row["max_weight"] ?? 100000) >= v_input["request"]["weight_grams"])) && ((!v_input["request"]["requires_tracking"]) || v_row["tracked"])), (v_row) => v_row, observe)), observe));
const n_Choices = memo(() => observed("Choices", "Query", () => (traceQuery("Choices", n_Eligible(), (v_row) => true, (v_row) => n_Choice(v_row), observe)), observe));
const n_Available = memo(() => observed("Available", "Rule", () => (n_Choices().some((v_row) => true)), observe));
const n_AvailableResponse = (v_choice) => observed("AvailableResponse", "Mapping", () => (Object.freeze({"request_id": v_input["request"]["request_id"],"status": "available","currency_code": "usd","option_id": v_choice["optionId"],"fee_minor": v_choice["amountMinor"].toString(),"fee": format(v_choice["amountMinor"],2)})), observe);
const n_UnavailableResponse = memo(() => observed("UnavailableResponse", "Mapping", () => (Object.freeze({"request_id": v_input["request"]["request_id"],"status": "unavailable","currency_code": "usd","option_id": v_input["request"]["option_id"]})), observe));

assertObserved(0, 'behavior', "SHIPPING_COUNTRY_MISMATCH", () => ((v_snapshot["country"] === v_input["request"]["country"])), observe);
assertObserved(1, 'behavior', "SHIPPING_DUPLICATE_OPTION", () => (([...new Set(v_snapshot["options"].map(row => row["id"]))].length === v_snapshot["options"].length)), observe);
assertObserved(2, 'behavior', "SHIPPING_WEIGHT_RANGE", () => (v_snapshot["options"].every((v_row) => (v_row["min_weight"] <= (v_row["max_weight"] ?? 100000)))), observe);
const matches = [() => (n_Available()),() => ((!n_Available()))].map((test,index) => {const passed=test();emit(observe,{kind:'result-case',index,passed});return passed;});
if (matches.filter(Boolean).length !== 1) throw fault('DS_RESULT_CARDINALITY');
if (matches[0]) {emit(observe,{kind:'selected-case',index:0});return n_AvailableResponse(one(n_Choices()));}
if (matches[1]) {emit(observe,{kind:'selected-case',index:1});return n_UnavailableResponse();}
}
