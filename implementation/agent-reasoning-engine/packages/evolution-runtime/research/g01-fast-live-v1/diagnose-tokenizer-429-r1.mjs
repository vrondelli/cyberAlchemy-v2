// Minimal no-generation provider error classification; never exports payload or secret.
import {createHash} from "node:crypto";
import {writeFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

const [output, helperPath] = process.argv.slice(2);
if (!output?.startsWith("/opt/are/evolution-runtime/") ||
    !helperPath?.startsWith("/opt/are/evolution-runtime/")) throw new Error("bounded-absolute-paths-required");
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
verifyHen11VpsTopology();
const post = createVpsLocalPost();
const url = new URL("https://api.z.ai/api/paas/v4/tokenizer");
const body = JSON.stringify({model: "glm-5.3-flash", messages: [{role: "user", content: "ARE G01 no-generation provider-code diagnostic."}]});
const started = Date.now();
let classification;
try {
  const response = await post(url, body, {apiKey: "container-owned-marker", timeout_ms: 30000,
    maximum_response_bytes: 65536});
  const candidate = response.payload?.error?.code ?? response.payload?.code ?? null;
  const api_error_code = (typeof candidate === "string" || typeof candidate === "number") &&
    /^[A-Za-z0-9_.-]{1,40}$/.test(String(candidate)) ? String(candidate) : null;
  classification = {status: response.status, api_error_code, response_bytes: response.bytes,
    response_payload_sha256: createHash("sha256").update(JSON.stringify(response.payload)).digest("hex"),
    elapsed_ms: Date.now() - started};
} catch (error) {
  classification = {status: null, api_error_code: null, error_code: String(error.message).split(":")[0],
    elapsed_ms: Date.now() - started};
}
const receipt = {schema_version: "are.g01-tokenizer-error-classification/v1",
  posture: "private-no-generation-no-secret-or-payload-export",
  endpoint: url.href, model: "glm-5.3-flash",
  prompt_sha256: createHash("sha256").update(body).digest("hex"),
  requests: 1, generation_calls: 0, automatic_retries: 0, classification,
  claim_ceiling: "Current provider diagnostic only; not account billing proof, transport reliability, benchmark quality, or campaign readiness.",
  open_questions: ["Which provider-side condition produced this response, and when can tokenizer and tiny generation both pass?"]};
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
process.stdout.write(`${JSON.stringify({status: classification.status, api_error_code: classification.api_error_code})}\n`);
