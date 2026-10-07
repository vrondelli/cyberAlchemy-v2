// Same-gateway tokenizer and tiny-generation readiness; no secret or payload output.
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {createGatewayProviders} from "/opt/are/evolution-runtime/g03-product-replication-code-r9/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1/provider-gateway-unexposed-v1.mjs";
import {wire} from "/opt/are/evolution-runtime/g03-product-replication-code-r9/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1/replication-cohort-adapter-v1.mjs";

const root = "/opt/are/evolution-runtime/g03-product-replication-r7/provider-readiness-r2";
mkdirSync(root, {recursive: false, mode: 0o700});
const events = [];
const {meter, generate} = createGatewayProviders({record: async row => { events.push(row); }, maximum_calls: 1});
const request = wire([{role: "user", content: "Reply OK."}], 768);
let status = "not-ready", tokenizer_status = null, generation_status = null;
try {
  const counted = await meter(request);
  if (!Number.isSafeInteger(counted.input_tokens) || counted.input_tokens <= 0) throw Error("tokenizer-invalid");
  tokenizer_status = 200;
  const reply = await generate({id: "g03-r7-provider-readiness", request});
  if (reply.status !== 200 || reply.ok !== true || reply.finish_reason !== "stop" ||
      !Number.isSafeInteger(reply.usage?.total_tokens) || !String(reply.output ?? "").trim()) throw Error("generation-invalid");
  generation_status = 200; status = "ready";
} catch (error) {
  status = "not-ready";
} finally {
  await Promise.allSettled([meter.settle(), generate.settle()]);
}
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const receipt = {schema_version: "are.g03-r7-provider-readiness/v1", status, tokenizer_status, generation_status,
  provider_calls: events.filter(row => row.channel === "model" && row.phase === "dispatch-intent").length,
  unknown_usage: events.some(row => row.channel === "model" && row.phase === "failed" && !row.usage),
  event_digests: events.map(row => sha(JSON.stringify(row))),
  script_sha256: sha(readFileSync(import.meta.filename)), checked_at: new Date().toISOString(),
  claim_ceiling: "Same-gateway transport readiness only; no benchmark score or reliability claim"};
const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
writeFileSync(join(root, "RESULT.json"), bytes, {flag: "wx", mode: 0o600});
process.stdout.write(`${JSON.stringify({status, tokenizer_status, generation_status, receipt_sha256: sha(bytes)})}\n`);
if (status !== "ready") process.exitCode = 2;
