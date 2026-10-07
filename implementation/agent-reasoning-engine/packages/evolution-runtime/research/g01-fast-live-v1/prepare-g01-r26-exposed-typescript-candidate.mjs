// Exact r26 successor after the r25 pre-model native-driver rejection.
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

const template = readFileSync(new URL("./prepare-g01-r23-exposed-typescript-candidate.mjs", import.meta.url), "utf8");
const sha = value => createHash("sha256").update(value).digest("hex");
if (sha(template) !== "7a03c3c1039da072cdba34d7d68f967f680e2b2ec57af27b6cdf8ae59bf611d8") {
  throw Error("g01-r26-typescript.template-drift");
}
const edits = [
  ["g01-r23-typescript", "g01-r26-typescript"],
  ["g01-source-r10-prospective-r23", "g01-source-r10-prospective-r26"],
  ["480e7a4f9e902a149da2b2b735cb26c1ca603e0a4e968a39b178c61a8c1a1ea2",
    "dcf49a1d3b406dbed2f7024c87846c6bf9263234f320ca53e7ea6f6a6866adf5"],
  ["g01-r23-exposed-typescript-candidate-r1", "g01-r26-exposed-typescript-candidate-r1"],
  ["client.transport.maximum_output_tokens === 2304",
    "client.transport && typeof client.transport.generate === 'function'"]
];
let source = template;
for (const [before, after] of edits) {
  if (!source.includes(before)) throw Error("g01-r26-typescript.missing-transformation");
  source = source.replaceAll(before, after);
}
await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
