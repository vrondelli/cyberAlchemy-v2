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
function first(rows) { if(rows.length===0)throw fault('DS_QUERY_EMPTY');return rows[0]; }
function one(rows) { if(rows.length!==1)throw fault('DS_QUERY_CARDINALITY');return rows[0]; }

export function validateInput(roots, observe) {const v_input=roots.input;  }
export function execute(roots, api, observe, binding, phase='guard') {
const v_input = roots["input"];
const v_catalog = roots["catalog"];
const n_Eligible = memo(() => observed("Eligible", "Query", () => (traceQuery("Eligible", v_catalog["providers"], (v_row) => ((((((v_row["enabled"] && v_row["tenant_allowed"]) && (v_row["task"] === v_input["request"]["task"])) && (v_row["model"] === (v_input["request"]["model"] ?? v_row["model"]))) && ((!v_input["request"]["stream"]) || v_row["streaming"])) && (v_row["context_limit"] >= v_input["request"]["required_context_tokens"])) && (v_row["output_limit"] >= v_input["request"]["max_output_tokens"])), (v_row) => v_row, observe)), observe));
const n_BestRank = memo(() => observed("BestRank", "Query", () => (traceQuery("BestRank", n_Eligible(), (v_row) => n_Eligible().every((v_other) => (v_other["rank"] >= v_row["rank"])), (v_row) => v_row, observe)), observe));
const n_Winner = memo(() => observed("Winner", "Query", () => (traceQuery("Winner", n_BestRank(), (v_row) => (v_row["binding_id"] === first([...n_BestRank().map(row => row["binding_id"])].sort((a,b) => a < b ? -1 : a > b ? 1 : 0))), (v_row) => v_row, observe)), observe));
const n_Available = memo(() => observed("Available", "Rule", () => (n_Winner().some((v_row) => true)), observe));
const n_Selected = (v_row) => observed("Selected", "Mapping", () => (Object.freeze({"request_id": v_input["request"]["request_id"],"status": "selected","policy_version": v_catalog["policy_version"],"binding_id": v_row["binding_id"],"binding_version": v_row["binding_version"],"model": v_row["model"]})), observe);
const n_Unavailable = memo(() => observed("Unavailable", "Mapping", () => (Object.freeze({"request_id": v_input["request"]["request_id"],"status": "unavailable","policy_version": v_catalog["policy_version"]})), observe));

assertObserved(0, 'behavior', "CATALOG_TENANT_MISMATCH", () => ((v_catalog["tenant_id"] === v_input["request"]["tenant_id"])), observe);
assertObserved(1, 'behavior', "DUPLICATE_BINDING", () => (([...new Set(v_catalog["providers"].map(row => row["binding_id"]))].length === v_catalog["providers"].length)), observe);
const matches = [() => (n_Available()),() => ((!n_Available()))].map((test,index) => {const passed=test();emit(observe,{kind:'result-case',index,passed});return passed;});
if (matches.filter(Boolean).length !== 1) throw fault('DS_RESULT_CARDINALITY');
if (matches[0]) {emit(observe,{kind:'selected-case',index:0});return n_Selected(one(n_Winner()));}
if (matches[1]) {emit(observe,{kind:'selected-case',index:1});return n_Unavailable();}
}
