import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {join, resolve} from "node:path";

import {canonicalJson} from "../../../intent-route-resolver/index.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw new Error(`hen09-qualification.${reason}`); };

export function loadHen09Freeze(root) {
  root = resolve(root);
  const manifestBytes = readFileSync(join(root, "FREEZE.json"));
  const manifest = JSON.parse(manifestBytes);
  need(["are.hen-tokenizer-qualification-freeze/v1", "are.hen-tokenizer-qualification-freeze/v2"]
    .includes(manifest.schema_version) &&
    manifest.model === "glm-5.3-flash" && manifest.context_limit === 8000 &&
    manifest.token_margin === 512 && manifest.output_cap === 2048, "manifest");
  need(manifest.execution?.provider_requests === 93 && manifest.execution?.model_generation_requests === 0 &&
    manifest.execution?.maximum_workers === 2 && manifest.requests?.length === 93, "execution-bound");
  const ids = new Set();
  const requests = manifest.requests.map((entry) => {
    need(!ids.has(entry.request_id), "duplicate-request"); ids.add(entry.request_id);
    const bytes = readFileSync(join(root, entry.prompt_ref));
    const text = bytes.toString("utf8").trimEnd();
    need(sha(text) === entry.prompt_sha256, `prompt-drift:${entry.request_id}`);
    const body = JSON.parse(text);
    need(canonicalJson(body) === text && body.model === manifest.model &&
      Array.isArray(body.messages) && Array.isArray(body.tools), `prompt-shape:${entry.request_id}`);
    return {...entry, body};
  });
  return {root, manifest, manifest_sha256: sha(manifestBytes), requests};
}

export function renderRemoteTokenizerProgram(freeze) {
  const requests = freeze.requests.map(({request_id, task_ref, instance_id, stage, stage_index,
    prompt_sha256, body}) => ({request_id, task_ref, instance_id, stage, stage_index, prompt_sha256, body}));
  const source = `
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
const requests=${JSON.stringify(requests)};
const endpoint=${JSON.stringify(freeze.manifest.endpoint)};
const digest=value=>createHash("sha256").update(value).digest("hex");
let credential=(await readFile("/run/secrets/model_api_key","utf8")).trim();
if(!credential||credential.length>4096)throw Error("credential-shape");
let next=0,failed=false;
async function worker(){while(!failed){const index=next++;if(index>=requests.length)return;const item=requests[index];const body=JSON.stringify(item.body);if(digest(body)!==item.prompt_sha256)throw Error("prompt-drift:"+item.request_id);const started=Date.now();let response,bytes;try{response=await fetch(endpoint,{method:"POST",headers:{Authorization:"Bearer "+credential,"Content-Type":"application/json"},body,signal:AbortSignal.timeout(30000)});bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>65536)throw Error("response-too-large");const payload=JSON.parse(new TextDecoder().decode(bytes));const input_tokens=payload?.usage?.prompt_tokens;if(response.status!==200||!Number.isSafeInteger(input_tokens)||input_tokens<0)throw Error("provider-response:"+response.status);process.stdout.write(JSON.stringify({schema_version:"are.hen-tokenizer-receipt/v1",request_id:item.request_id,task_ref:item.task_ref,instance_id:item.instance_id,stage:item.stage,stage_index:item.stage_index,prompt_sha256:item.prompt_sha256,request_sha256:digest(body),status:response.status,input_tokens,response_bytes:bytes.length,latency_ms:Date.now()-started,automatic_retries:0,dispatched:true,model:"glm-5.3-flash",authority_effect:"none"})+"\\n");}catch(error){failed=true;process.stdout.write(JSON.stringify({schema_version:"are.hen-tokenizer-failure/v1",request_id:item.request_id,prompt_sha256:item.prompt_sha256,error:String(error.message),status:response?.status??null,response_bytes:bytes?.length??null,latency_ms:Date.now()-started,automatic_retries:0,authority_effect:"none"})+"\\n");}}}
try{await Promise.all([worker(),worker()]);}finally{credential="";}
if(failed)process.exitCode=2;
`;
  return source.trimStart();
}

export function assessHen09Receipts(freeze, lines) {
  const receipts = lines.filter(Boolean).map((line) => JSON.parse(line));
  need(receipts.length === freeze.requests.length, "receipt-count");
  const expected = new Map(freeze.requests.map((request) => [request.request_id, request]));
  const rows = receipts.map((receipt) => {
    const request = expected.get(receipt.request_id);
    need(request && receipt.schema_version === "are.hen-tokenizer-receipt/v1", "unexpected-receipt");
    expected.delete(receipt.request_id);
    need(receipt.prompt_sha256 === request.prompt_sha256 && receipt.request_sha256 === request.prompt_sha256 &&
      receipt.status === 200 && receipt.dispatched === true && receipt.automatic_retries === 0 &&
      receipt.model === freeze.manifest.model && Number.isSafeInteger(receipt.input_tokens) &&
      receipt.input_tokens >= 0, `receipt-invalid:${receipt.request_id}`);
    const projected_tokens = receipt.input_tokens + freeze.manifest.token_margin + freeze.manifest.output_cap;
    return {...receipt, projected_tokens, fits_context: projected_tokens <= freeze.manifest.context_limit};
  });
  need(expected.size === 0, "missing-receipt");
  const overflows = rows.filter((row) => !row.fits_context);
  const stage_maximums = Object.fromEntries(["initial", "populated", "terminal"].map((stage) => [stage,
    Math.max(...rows.filter((row) => row.stage === stage).map((row) => row.projected_tokens))]));
  return {schema_version: "are.hen-tokenizer-qualification-result/v1",
    qualification_ref: freeze.manifest.qualification_ref, freeze_sha256: freeze.manifest_sha256,
    qualified: overflows.length === 0, provider_calls: rows.length, model_calls: 0,
    stage_counts: freeze.manifest.stage_counts, stage_maximums, context_limit: freeze.manifest.context_limit,
    overflows: overflows.map(({request_id, task_ref, instance_id, stage, stage_index, projected_tokens}) =>
      ({request_id, task_ref, instance_id, stage, stage_index, projected_tokens})), rows,
    claim_ceiling: freeze.manifest.claim_ceiling, authority_effect: "none"};
}
