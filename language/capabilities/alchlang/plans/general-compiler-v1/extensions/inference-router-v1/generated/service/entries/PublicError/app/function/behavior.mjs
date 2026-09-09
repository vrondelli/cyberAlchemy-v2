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
const n_InvalidInputCode = memo(() => observed("InvalidInputCode", "Mapping", () => (Object.freeze({"code": "INVALID_INPUT"})), observe));
const n_InvalidInputBody = memo(() => observed("InvalidInputBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_InvalidInputCode()})), observe));
const n_InvalidInputResponse = memo(() => observed("InvalidInputResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 400,"body": n_InvalidInputBody()})), observe));
const n_InvalidIdempotencyKeyCode = memo(() => observed("InvalidIdempotencyKeyCode", "Mapping", () => (Object.freeze({"code": "INVALID_IDEMPOTENCY_KEY"})), observe));
const n_InvalidIdempotencyKeyBody = memo(() => observed("InvalidIdempotencyKeyBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_InvalidIdempotencyKeyCode()})), observe));
const n_InvalidIdempotencyKeyResponse = memo(() => observed("InvalidIdempotencyKeyResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 400,"body": n_InvalidIdempotencyKeyBody()})), observe));
const n_UnknownModelCode = memo(() => observed("UnknownModelCode", "Mapping", () => (Object.freeze({"code": "UNKNOWN_MODEL"})), observe));
const n_UnknownModelBody = memo(() => observed("UnknownModelBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_UnknownModelCode()})), observe));
const n_UnknownModelResponse = memo(() => observed("UnknownModelResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 404,"body": n_UnknownModelBody()})), observe));
const n_UnsupportedStrategyCode = memo(() => observed("UnsupportedStrategyCode", "Mapping", () => (Object.freeze({"code": "UNSUPPORTED_STRATEGY"})), observe));
const n_UnsupportedStrategyBody = memo(() => observed("UnsupportedStrategyBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_UnsupportedStrategyCode()})), observe));
const n_UnsupportedStrategyResponse = memo(() => observed("UnsupportedStrategyResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 400,"body": n_UnsupportedStrategyBody()})), observe));
const n_RequestTooLargeCode = memo(() => observed("RequestTooLargeCode", "Mapping", () => (Object.freeze({"code": "REQUEST_TOO_LARGE"})), observe));
const n_RequestTooLargeBody = memo(() => observed("RequestTooLargeBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_RequestTooLargeCode()})), observe));
const n_RequestTooLargeResponse = memo(() => observed("RequestTooLargeResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 413,"body": n_RequestTooLargeBody()})), observe));
const n_UnsupportedMediaTypeCode = memo(() => observed("UnsupportedMediaTypeCode", "Mapping", () => (Object.freeze({"code": "UNSUPPORTED_MEDIA_TYPE"})), observe));
const n_UnsupportedMediaTypeBody = memo(() => observed("UnsupportedMediaTypeBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_UnsupportedMediaTypeCode()})), observe));
const n_UnsupportedMediaTypeResponse = memo(() => observed("UnsupportedMediaTypeResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 415,"body": n_UnsupportedMediaTypeBody()})), observe));
const n_IdempotencyConflictCode = memo(() => observed("IdempotencyConflictCode", "Mapping", () => (Object.freeze({"code": "IDEMPOTENCY_CONFLICT"})), observe));
const n_IdempotencyConflictBody = memo(() => observed("IdempotencyConflictBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_IdempotencyConflictCode()})), observe));
const n_IdempotencyConflictResponse = memo(() => observed("IdempotencyConflictResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 409,"body": n_IdempotencyConflictBody()})), observe));
const n_RequestInProgressCode = memo(() => observed("RequestInProgressCode", "Mapping", () => (Object.freeze({"code": "REQUEST_IN_PROGRESS"})), observe));
const n_RequestInProgressBody = memo(() => observed("RequestInProgressBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_RequestInProgressCode()})), observe));
const n_RequestInProgressResponse = memo(() => observed("RequestInProgressResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 409,"body": n_RequestInProgressBody()})), observe));
const n_StreamNotReplayableCode = memo(() => observed("StreamNotReplayableCode", "Mapping", () => (Object.freeze({"code": "STREAM_NOT_REPLAYABLE"})), observe));
const n_StreamNotReplayableBody = memo(() => observed("StreamNotReplayableBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_StreamNotReplayableCode()})), observe));
const n_StreamNotReplayableResponse = memo(() => observed("StreamNotReplayableResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 409,"body": n_StreamNotReplayableBody()})), observe));
const n_PreviousRequestFailedCode = memo(() => observed("PreviousRequestFailedCode", "Mapping", () => (Object.freeze({"code": "PREVIOUS_REQUEST_FAILED"})), observe));
const n_PreviousRequestFailedBody = memo(() => observed("PreviousRequestFailedBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_PreviousRequestFailedCode()})), observe));
const n_PreviousRequestFailedResponse = memo(() => observed("PreviousRequestFailedResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 409,"body": n_PreviousRequestFailedBody()})), observe));
const n_OverloadedCode = memo(() => observed("OverloadedCode", "Mapping", () => (Object.freeze({"code": "OVERLOADED"})), observe));
const n_OverloadedBody = memo(() => observed("OverloadedBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_OverloadedCode()})), observe));
const n_OverloadedResponse = memo(() => observed("OverloadedResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 429,"body": n_OverloadedBody()})), observe));
const n_RequestStoreBusyCode = memo(() => observed("RequestStoreBusyCode", "Mapping", () => (Object.freeze({"code": "REQUEST_STORE_BUSY"})), observe));
const n_RequestStoreBusyBody = memo(() => observed("RequestStoreBusyBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_RequestStoreBusyCode()})), observe));
const n_RequestStoreBusyResponse = memo(() => observed("RequestStoreBusyResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 429,"body": n_RequestStoreBusyBody()})), observe));
const n_RequestStoreFullCode = memo(() => observed("RequestStoreFullCode", "Mapping", () => (Object.freeze({"code": "REQUEST_STORE_FULL"})), observe));
const n_RequestStoreFullBody = memo(() => observed("RequestStoreFullBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_RequestStoreFullCode()})), observe));
const n_RequestStoreFullResponse = memo(() => observed("RequestStoreFullResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 429,"body": n_RequestStoreFullBody()})), observe));
const n_NoEligibleProviderCode = memo(() => observed("NoEligibleProviderCode", "Mapping", () => (Object.freeze({"code": "NO_ELIGIBLE_PROVIDER"})), observe));
const n_NoEligibleProviderBody = memo(() => observed("NoEligibleProviderBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_NoEligibleProviderCode()})), observe));
const n_NoEligibleProviderResponse = memo(() => observed("NoEligibleProviderResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 503,"body": n_NoEligibleProviderBody()})), observe));
const n_DeadlineExceededCode = memo(() => observed("DeadlineExceededCode", "Mapping", () => (Object.freeze({"code": "DEADLINE_EXCEEDED"})), observe));
const n_DeadlineExceededBody = memo(() => observed("DeadlineExceededBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_DeadlineExceededCode()})), observe));
const n_DeadlineExceededResponse = memo(() => observed("DeadlineExceededResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 504,"body": n_DeadlineExceededBody()})), observe));
const n_CancelledCode = memo(() => observed("CancelledCode", "Mapping", () => (Object.freeze({"code": "CANCELLED"})), observe));
const n_CancelledBody = memo(() => observed("CancelledBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_CancelledCode()})), observe));
const n_CancelledResponse = memo(() => observed("CancelledResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 499,"body": n_CancelledBody()})), observe));
const n_ProviderStatusCode = memo(() => observed("ProviderStatusCode", "Mapping", () => (Object.freeze({"code": "PROVIDER_STATUS"})), observe));
const n_ProviderStatusBody = memo(() => observed("ProviderStatusBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_ProviderStatusCode()})), observe));
const n_ProviderStatusResponse = memo(() => observed("ProviderStatusResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 502,"body": n_ProviderStatusBody()})), observe));
const n_ProviderTransportFailedCode = memo(() => observed("ProviderTransportFailedCode", "Mapping", () => (Object.freeze({"code": "PROVIDER_TRANSPORT_FAILED"})), observe));
const n_ProviderTransportFailedBody = memo(() => observed("ProviderTransportFailedBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_ProviderTransportFailedCode()})), observe));
const n_ProviderTransportFailedResponse = memo(() => observed("ProviderTransportFailedResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 502,"body": n_ProviderTransportFailedBody()})), observe));
const n_InvalidProviderResponseCode = memo(() => observed("InvalidProviderResponseCode", "Mapping", () => (Object.freeze({"code": "INVALID_PROVIDER_RESPONSE"})), observe));
const n_InvalidProviderResponseBody = memo(() => observed("InvalidProviderResponseBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_InvalidProviderResponseCode()})), observe));
const n_InvalidProviderResponseResponse = memo(() => observed("InvalidProviderResponseResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 502,"body": n_InvalidProviderResponseBody()})), observe));
const n_ResponseTooLargeCode = memo(() => observed("ResponseTooLargeCode", "Mapping", () => (Object.freeze({"code": "RESPONSE_TOO_LARGE"})), observe));
const n_ResponseTooLargeBody = memo(() => observed("ResponseTooLargeBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_ResponseTooLargeCode()})), observe));
const n_ResponseTooLargeResponse = memo(() => observed("ResponseTooLargeResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 502,"body": n_ResponseTooLargeBody()})), observe));
const n_InvalidStreamContentTypeCode = memo(() => observed("InvalidStreamContentTypeCode", "Mapping", () => (Object.freeze({"code": "INVALID_STREAM_CONTENT_TYPE"})), observe));
const n_InvalidStreamContentTypeBody = memo(() => observed("InvalidStreamContentTypeBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_InvalidStreamContentTypeCode()})), observe));
const n_InvalidStreamContentTypeResponse = memo(() => observed("InvalidStreamContentTypeResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 502,"body": n_InvalidStreamContentTypeBody()})), observe));
const n_NotFoundCode = memo(() => observed("NotFoundCode", "Mapping", () => (Object.freeze({"code": "NOT_FOUND"})), observe));
const n_NotFoundBody = memo(() => observed("NotFoundBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_NotFoundCode()})), observe));
const n_NotFoundResponse = memo(() => observed("NotFoundResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 404,"body": n_NotFoundBody()})), observe));
const n_MethodNotAllowedCode = memo(() => observed("MethodNotAllowedCode", "Mapping", () => (Object.freeze({"code": "METHOD_NOT_ALLOWED"})), observe));
const n_MethodNotAllowedBody = memo(() => observed("MethodNotAllowedBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_MethodNotAllowedCode()})), observe));
const n_MethodNotAllowedResponse = memo(() => observed("MethodNotAllowedResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 405,"body": n_MethodNotAllowedBody()})), observe));
const n_InternalErrorCode = memo(() => observed("InternalErrorCode", "Mapping", () => (Object.freeze({"code": "INTERNAL_ERROR"})), observe));
const n_InternalErrorBody = memo(() => observed("InternalErrorBody", "Mapping", () => (Object.freeze({"request_id": v_input["request_id"],"error": n_InternalErrorCode()})), observe));
const n_InternalErrorResponse = memo(() => observed("InternalErrorResponse", "Mapping", () => (Object.freeze({"status": "ok","http_status": 500,"body": n_InternalErrorBody()})), observe));


const matches = [() => ((v_input["code"] === "INVALID_INPUT")),() => ((v_input["code"] === "INVALID_IDEMPOTENCY_KEY")),() => ((v_input["code"] === "UNKNOWN_MODEL")),() => ((v_input["code"] === "UNSUPPORTED_STRATEGY")),() => ((v_input["code"] === "REQUEST_TOO_LARGE")),() => ((v_input["code"] === "UNSUPPORTED_MEDIA_TYPE")),() => ((v_input["code"] === "IDEMPOTENCY_CONFLICT")),() => ((v_input["code"] === "REQUEST_IN_PROGRESS")),() => ((v_input["code"] === "STREAM_NOT_REPLAYABLE")),() => ((v_input["code"] === "PREVIOUS_REQUEST_FAILED")),() => ((v_input["code"] === "OVERLOADED")),() => ((v_input["code"] === "REQUEST_STORE_BUSY")),() => ((v_input["code"] === "REQUEST_STORE_FULL")),() => ((v_input["code"] === "NO_ELIGIBLE_PROVIDER")),() => ((v_input["code"] === "DEADLINE_EXCEEDED")),() => ((v_input["code"] === "CANCELLED")),() => ((v_input["code"] === "PROVIDER_STATUS")),() => ((v_input["code"] === "PROVIDER_TRANSPORT_FAILED")),() => ((v_input["code"] === "INVALID_PROVIDER_RESPONSE")),() => ((v_input["code"] === "RESPONSE_TOO_LARGE")),() => ((v_input["code"] === "INVALID_STREAM_CONTENT_TYPE")),() => ((v_input["code"] === "NOT_FOUND")),() => ((v_input["code"] === "METHOD_NOT_ALLOWED")),() => ((((((((((((((((((((((((v_input["code"] !== "INVALID_INPUT") && (v_input["code"] !== "INVALID_IDEMPOTENCY_KEY")) && (v_input["code"] !== "UNKNOWN_MODEL")) && (v_input["code"] !== "UNSUPPORTED_STRATEGY")) && (v_input["code"] !== "REQUEST_TOO_LARGE")) && (v_input["code"] !== "UNSUPPORTED_MEDIA_TYPE")) && (v_input["code"] !== "IDEMPOTENCY_CONFLICT")) && (v_input["code"] !== "REQUEST_IN_PROGRESS")) && (v_input["code"] !== "STREAM_NOT_REPLAYABLE")) && (v_input["code"] !== "PREVIOUS_REQUEST_FAILED")) && (v_input["code"] !== "OVERLOADED")) && (v_input["code"] !== "REQUEST_STORE_BUSY")) && (v_input["code"] !== "REQUEST_STORE_FULL")) && (v_input["code"] !== "NO_ELIGIBLE_PROVIDER")) && (v_input["code"] !== "DEADLINE_EXCEEDED")) && (v_input["code"] !== "CANCELLED")) && (v_input["code"] !== "PROVIDER_STATUS")) && (v_input["code"] !== "PROVIDER_TRANSPORT_FAILED")) && (v_input["code"] !== "INVALID_PROVIDER_RESPONSE")) && (v_input["code"] !== "RESPONSE_TOO_LARGE")) && (v_input["code"] !== "INVALID_STREAM_CONTENT_TYPE")) && (v_input["code"] !== "NOT_FOUND")) && (v_input["code"] !== "METHOD_NOT_ALLOWED")))].map((test,index) => {const passed=test();emit(observe,{kind:'result-case',index,passed});return passed;});
if (matches.filter(Boolean).length !== 1) throw fault('DS_RESULT_CARDINALITY');
if (matches[0]) {emit(observe,{kind:'selected-case',index:0});return n_InvalidInputResponse();}
if (matches[1]) {emit(observe,{kind:'selected-case',index:1});return n_InvalidIdempotencyKeyResponse();}
if (matches[2]) {emit(observe,{kind:'selected-case',index:2});return n_UnknownModelResponse();}
if (matches[3]) {emit(observe,{kind:'selected-case',index:3});return n_UnsupportedStrategyResponse();}
if (matches[4]) {emit(observe,{kind:'selected-case',index:4});return n_RequestTooLargeResponse();}
if (matches[5]) {emit(observe,{kind:'selected-case',index:5});return n_UnsupportedMediaTypeResponse();}
if (matches[6]) {emit(observe,{kind:'selected-case',index:6});return n_IdempotencyConflictResponse();}
if (matches[7]) {emit(observe,{kind:'selected-case',index:7});return n_RequestInProgressResponse();}
if (matches[8]) {emit(observe,{kind:'selected-case',index:8});return n_StreamNotReplayableResponse();}
if (matches[9]) {emit(observe,{kind:'selected-case',index:9});return n_PreviousRequestFailedResponse();}
if (matches[10]) {emit(observe,{kind:'selected-case',index:10});return n_OverloadedResponse();}
if (matches[11]) {emit(observe,{kind:'selected-case',index:11});return n_RequestStoreBusyResponse();}
if (matches[12]) {emit(observe,{kind:'selected-case',index:12});return n_RequestStoreFullResponse();}
if (matches[13]) {emit(observe,{kind:'selected-case',index:13});return n_NoEligibleProviderResponse();}
if (matches[14]) {emit(observe,{kind:'selected-case',index:14});return n_DeadlineExceededResponse();}
if (matches[15]) {emit(observe,{kind:'selected-case',index:15});return n_CancelledResponse();}
if (matches[16]) {emit(observe,{kind:'selected-case',index:16});return n_ProviderStatusResponse();}
if (matches[17]) {emit(observe,{kind:'selected-case',index:17});return n_ProviderTransportFailedResponse();}
if (matches[18]) {emit(observe,{kind:'selected-case',index:18});return n_InvalidProviderResponseResponse();}
if (matches[19]) {emit(observe,{kind:'selected-case',index:19});return n_ResponseTooLargeResponse();}
if (matches[20]) {emit(observe,{kind:'selected-case',index:20});return n_InvalidStreamContentTypeResponse();}
if (matches[21]) {emit(observe,{kind:'selected-case',index:21});return n_NotFoundResponse();}
if (matches[22]) {emit(observe,{kind:'selected-case',index:22});return n_MethodNotAllowedResponse();}
if (matches[23]) {emit(observe,{kind:'selected-case',index:23});return n_InternalErrorResponse();}
}
