// Exact r25 successor to the rejected r23/r24 pre-dispatch attempts; no model call here.
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

const template = readFileSync(new URL("./prepare-g01-r23-exposed-typescript-candidate.mjs", import.meta.url), "utf8");
const sha = value => createHash("sha256").update(value).digest("hex");
if (sha(template) !== "7a03c3c1039da072cdba34d7d68f967f680e2b2ec57af27b6cdf8ae59bf611d8") {
  throw Error("g01-r25-typescript.template-drift");
}
const edits = [
  ["g01-r23-typescript", "g01-r25-typescript"],
  ["g01-source-r10-prospective-r23", "g01-source-r10-prospective-r25"],
  ["480e7a4f9e902a149da2b2b735cb26c1ca603e0a4e968a39b178c61a8c1a1ea2",
    "4e7ddc8bebe9dff12d2f5e06eeea73dffa2c83360745d43f475b2f9f239461a7"],
  ["g01-r23-exposed-typescript-candidate-r1", "g01-r25-exposed-typescript-candidate-r1"],
  ["client.transport.maximum_output_tokens === 2304",
    "client.transport && typeof client.transport.generate === 'function'"]
];
let source = template;
for (const [before, after] of edits) {
  if (!source.includes(before)) throw Error("g01-r25-typescript.missing-transformation");
  source = source.replaceAll(before, after);
}
await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
