// domainspec.declarative-function/v1; generated from typed contracts, not executable source text.

const fault = code => Object.assign(new Error(code), {code});
const memo = f => { let ready=false, value; return () => {if (!ready) {value=f(); ready=true;} return value;}; };
function uint64(value) {
 if (typeof value==='number'&&!Number.isSafeInteger(value)||typeof value==='string'&&!/^(0|[1-9][0-9]*)$/.test(value)||!['bigint','number','string'].includes(typeof value)) throw fault('FUNCTION_UINT64');
 const n=BigInt(value); if(n<0n||n>18446744073709551615n)throw fault('FUNCTION_UINT64');return n;
}
function optionalUint64(value) {return value == null ? null : uint64(value);}
function decimal(value,scale) {
 if(!new RegExp('^(0|[1-9][0-9]*)(\\.[0-9]{1,'+Math.max(1,scale)+'})?$').test(value)||(scale===0&&value.includes('.')))throw fault('FUNCTION_DECIMAL');
 const [whole,fraction='']=value.split('.');return uint64(BigInt(whole)*10n**BigInt(scale)+BigInt(fraction.padEnd(scale,'0')||'0'));
}
function format(value,scale) { const n=uint64(value),base=10n**BigInt(scale);return scale ? (n/base)+'.'+(n%base).toString().padStart(scale,'0') : n.toString(); }
function one(rows) { if(rows.length!==1)throw fault('DS_QUERY_CARDINALITY');return rows[0]; }

export function validateInput(roots) {const v_input=roots.input; if (!((v_input["request"]["currency_code"].toLowerCase() === "usd"))) throw fault("QUOTE_UNSUPPORTED_CURRENCY"); }
export function execute(roots, api) {
const v_input = roots["input"];
const v_snapshot = roots["snapshot"];
const n_PriceRow = (v_row) => (Object.freeze({"priceId": v_row["id"],"currency": v_row["currency_code"],"amountMinor": decimal(v_row["raw_amount"]["value"],2),"minQuantity": uint64((v_row["min_quantity"] ?? 0)),"maxQuantity": (optionalUint64(v_row["max_quantity"]) ?? uint64("18446744073709551615"))}));
const n_Tiers = memo(() => (v_snapshot["prices"].filter((v_row) => ((!(v_row["deleted_at"] != null)) && (v_row["currency_code"] === "usd"))).map((v_row) => n_PriceRow(v_row))));
const n_Eligible = memo(() => (n_Tiers().filter((v_p) => (((v_p["currency"] === v_input["request"]["currency_code"].toLowerCase()) && (v_p["minQuantity"] <= uint64(v_input["request"]["quantity"]))) && (v_p["maxQuantity"] >= uint64(v_input["request"]["quantity"])))).map((v_p) => v_p)));
const n_Cheapest = memo(() => (n_Eligible().filter((v_p) => (!n_Eligible().some((v_q) => (v_q["amountMinor"] < v_p["amountMinor"])))).map((v_p) => v_p)));
const n_NoPrice = memo(() => ((!n_Cheapest().some((v_p) => true))));
const n_UniquePrice = memo(() => ((n_Cheapest().filter((v_p) => true).length === 1)));
const n_AmbiguousPrice = memo(() => ((n_Cheapest().some((v_p) => true) && (!n_UniquePrice()))));
const n_EmptyQuote = memo(() => (Object.freeze({"request_id": v_input["request"]["request_id"],"variant_id": v_input["request"]["variant_id"],"price_set_id": v_snapshot["price_set_id"],"currency_code": "usd","status": "no_price"})));
const n_AmbiguousQuote = memo(() => (Object.freeze({"request_id": v_input["request"]["request_id"],"variant_id": v_input["request"]["variant_id"],"price_set_id": v_snapshot["price_set_id"],"currency_code": "usd","status": "ambiguous_price","price_ids": [...n_Cheapest().map(row => row["priceId"])].sort((a,b) => a < b ? -1 : a > b ? 1 : 0),"unit_amount": format(one([...new Set(n_Cheapest().map(row => row["amountMinor"]))]),2)})));
const n_SelectedQuote = (v_p) => (Object.freeze({"request_id": v_input["request"]["request_id"],"variant_id": v_input["request"]["variant_id"],"price_set_id": v_snapshot["price_set_id"],"currency_code": "usd","status": "quoted","price_id": v_p["priceId"],"unit_amount": format(v_p["amountMinor"],2),"unit_amount_minor": v_p["amountMinor"].toString(),"quantity": v_input["request"]["quantity"],"subtotal": format(api.evaluateCalculation("LineSubtotal", {"amountMinor":v_p["amountMinor"],"requestedQuantity":uint64(v_input["request"]["quantity"])}),2),"subtotal_minor": api.evaluateCalculation("LineSubtotal", {"amountMinor":v_p["amountMinor"],"requestedQuantity":uint64(v_input["request"]["quantity"])}).toString()}));
if (!((v_input["request"]["currency_code"].toLowerCase() === "usd"))) throw fault("QUOTE_UNSUPPORTED_CURRENCY");
if (!((v_snapshot["variant_id"] === v_input["request"]["variant_id"]))) throw fault("QUOTE_VARIANT_MISMATCH");
if (!(v_snapshot["prices"].every((v_row) => (v_row["price_set_id"] === v_snapshot["price_set_id"])))) throw fault("QUOTE_PRICE_SET_MISMATCH");
if (!(([...new Set(v_snapshot["prices"].map(row => row["id"]))].length === v_snapshot["prices"].length))) throw fault("QUOTE_DUPLICATE_PRICE");
if (!(v_snapshot["prices"].every((v_row) => ((v_row["min_quantity"] ?? 0) <= (v_row["max_quantity"] ?? 2147483647))))) throw fault("QUOTE_TIER_RANGE");
const matches = [() => (n_NoPrice()),() => (n_UniquePrice()),() => (n_AmbiguousPrice())].map(test => test());
if (matches.filter(Boolean).length !== 1) throw fault('DS_RESULT_CARDINALITY');
if (matches[0]) return n_EmptyQuote();
if (matches[1]) return n_SelectedQuote(one(n_Cheapest()));
if (matches[2]) return n_AmbiguousQuote();
}
