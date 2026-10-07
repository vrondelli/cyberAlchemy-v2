// Verified private cold copy of the sealed/scored exposed r26 candidate.
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

const template = readFileSync(new URL("./archive-g01-r22-exposed-typescript-candidate-wsl.mjs", import.meta.url), "utf8");
const sha = value => createHash("sha256").update(value).digest("hex");
if (sha(template) !== "a0b939f38e9862efa46516cae0ea4b2c0405866bc69b8386b536b9999a35ac2a") {
  throw Error("g01-r26-archive.template-drift");
}
const edits = [
  ["failed exposed r22 candidate", "scored exposed r26 candidate"],
  ["g01-r22-exposed-typescript-candidate-r1", "g01-r26-exposed-typescript-candidate-r1"],
  ["g01-r22-archive", "g01-r26-archive"],
  ["e236bede0fc67fe7bc0b85b0167281f5cf522b1353ff04ff4c601b3d3ecdd04b",
    "6388d125be0930240b7f3f1dede841fb849e7dd5f3c9f0decafb680bfb85faef"],
  ["7fed0d3ca14ae3cb4aab447940e4ec186572ad7b04adc6b11df8648650e822c8",
    "5d7a98e95c6bbad6b7bfb738fb02ebe55b66bc840678c3fbe638efd6b26f04a7"],
  ["FAILURE-AUDIT.json", "INDEPENDENT-AUDIT.json"],
  ["terminal-failure-receipt-audited", "exposed-native-receipts-and-8k-window-verified"],
  ["need(JSON.parse(resultBytes).status === \"run_error\" &&\n  JSON.parse(resultBytes).error === \"glm.incomplete-output\", \"result-status\");",
    "need(JSON.parse(resultBytes).status === \"final_context_selected\", \"result-status\");"],
  ["are.g01-r22-exposed-typescript-candidate-cold-copy/v1",
    "are.g01-r26-exposed-typescript-candidate-cold-copy/v1"],
  ["failure_audit_sha256", "independent_audit_sha256"],
  ["Private exposed failure storage only", "Private exposed scored-task storage only"]
];
let source = template;
for (const [before, after] of edits) {
  if (!source.includes(before)) throw Error("g01-r26-archive.missing-transformation");
  source = source.replaceAll(before, after);
}
await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
