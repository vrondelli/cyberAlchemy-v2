import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const cli = fileURLToPath(new URL("../../../implementation/agent-reasoning-engine/bin/are.mjs", import.meta.url));
const request = JSON.parse(readFileSync(new URL("route.example.json", import.meta.url), "utf8"));
request.session_id = process.argv[2] ?? "demo-session";
function call(operation, input) {
  const run = spawnSync(process.execPath, [cli, "decide", operation], {input: JSON.stringify(input), encoding: "utf8", maxBuffer: 2 * 1024 * 1024});
  if (run.error) throw run.error;
  const output = JSON.parse(run.stdout);
  if (!output.ok || output.kind === "block") throw new Error(JSON.stringify(output));
  return output;
}
const route = call("route", request);
const bound = {...request, previous_receipt: route.receipt};
const results = [route, call("context", bound), call("effect", {...bound,
  effect: {method: "item/commandExecution/requestApproval", item_id: "sample-read", proposal: {command: "read SOURCE-MAP.md (example only)"}, metadata: {effect_classes: ["local-read"], reversible: true}}}),
call("continue", {...bound, continuation: {completion: {completion_id: "demo-complete", status: "completed", continuation_required: false, evidence_refs: []}, options: []}})];
process.stdout.write(`${JSON.stringify({session_id: request.session_id, results: results.map(({operation, kind, result_digest}) => ({operation, kind, result_digest})), authority_effect: "none"}, null, 2)}\n`);
