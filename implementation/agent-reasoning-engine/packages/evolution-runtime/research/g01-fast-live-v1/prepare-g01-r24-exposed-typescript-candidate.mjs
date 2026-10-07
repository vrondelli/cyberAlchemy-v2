// Isolate the r24 cell-guard repair while preserving the rejected r23 pre-dispatch script.
// The exact prior script is transformed in memory; this wrapper creates no temporary source file.
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

const templatePath = new URL("./prepare-g01-r23-exposed-typescript-candidate.mjs", import.meta.url);
const template = readFileSync(templatePath, "utf8");
const sha = value => createHash("sha256").update(value).digest("hex");
if (sha(template) !== "7a03c3c1039da072cdba34d7d68f967f680e2b2ec57af27b6cdf8ae59bf611d8") {
  throw Error("g01-r24-typescript.template-drift");
}
const edits = [
  ["g01-r23-typescript", "g01-r24-typescript"],
  ["g01-source-r10-prospective-r23", "g01-source-r10-prospective-r24"],
  ["480e7a4f9e902a149da2b2b735cb26c1ca603e0a4e968a39b178c61a8c1a1ea2",
    "73be290ffe40cd4b8f94461937dd0283e3eb58ea21f357cfe2da1bbdaa649723"],
  ["g01-r23-exposed-typescript-candidate-r1", "g01-r24-exposed-typescript-candidate-r1"],
  ["client.transport.maximum_output_tokens === 2304",
    "client.transport && typeof client.transport.generate === 'function'"]
];
let source = template;
for (const [before, after] of edits) {
  if (!source.includes(before)) throw Error("g01-r24-typescript.missing-transformation");
  source = source.replaceAll(before, after);
}
await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
