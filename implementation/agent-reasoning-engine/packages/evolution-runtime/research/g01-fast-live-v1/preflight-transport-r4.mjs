// No-generation live transport preflight for the prospective G01 r4 cohort.
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
const body = JSON.stringify({model: "glm-5.3-flash", messages: [{role: "user", content: "ARE G01 r4 no-generation transport preflight."}]});
const probe = async ordinal => {
  const started = Date.now();
  try {
    const response = await post(url, body, {apiKey: "container-owned-marker", timeout_ms: 30000, maximum_response_bytes: 65536});
    return {ordinal, status: response.status, response_bytes: response.bytes,
      prompt_tokens: response.payload?.usage?.prompt_tokens ?? null, elapsed_ms: Date.now() - started,
      settled: response.status === 200 && Number.isSafeInteger(response.payload?.usage?.prompt_tokens), automatic_retries: 0};
  } catch (error) {
    return {ordinal, status: null, elapsed_ms: Date.now() - started, settled: false,
      automatic_retries: 0, error_code: String(error.message).split(":")[0]};
  }
};
const results = await Promise.all([probe(1), probe(2)]);
const receipt = {schema_version: "are.g01-r4-transport-preflight/v1", endpoint: url.href, model: "glm-5.3-flash",
  prompt_sha256: createHash("sha256").update(body).digest("hex"), concurrent_requests: 2,
  generation_calls: 0, results, passed: results.every(row => row.settled), authority_effect: "none",
  claim_ceiling: "Current no-generation transport settlement only; not full generation reliability or campaign validity"};
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, {flag: "wx", mode: 0o600});
process.stdout.write(`${JSON.stringify({passed: receipt.passed, count: results.length, results})}\n`);
if (!receipt.passed) process.exitCode = 2;
