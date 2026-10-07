// Seal then native-score the separately frozen exposed r26 candidate.
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

const template = readFileSync(new URL("./score-g01-r21-exposed-typescript-control.mjs", import.meta.url), "utf8");
const sha = value => createHash("sha256").update(value).digest("hex");
if (sha(template) !== "2464de004ea14a87e13ef4d77b215c5ee5d22b90577ced19e3cab9dce356068c") {
  throw Error("g01-r26-score.template-drift");
}
const edits = [
  ["g01-r21-score", "g01-r26-score"],
  ["g01-r21-exposed-typescript-control-r1", "g01-r26-exposed-typescript-candidate-r1"],
  ["CONTROL-FREEZE.json", "CANDIDATE-FREEZE.json"],
  ["2b8a925f237a6bf0fdf04b879eb41f19e5ffc23b538e1bdbd0c2bd6dd892e0d5",
    "6388d125be0930240b7f3f1dede841fb849e7dd5f3c9f0decafb680bfb85faef"],
  ["g01-source-r10-prospective-r21-evidence", "g01-source-r10-prospective-r26-evidence"],
  ["b566988148bc8fa93fadc3eaf8d8643e32aab70f121a6fd439c285ae0d9ed21d",
    "dcf49a1d3b406dbed2f7024c87846c6bf9263234f320ca53e7ea6f6a6866adf5"],
  ["intent-anchor-convergence-r3", "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1"],
  ["are.g01-r21-exposed-typescript-control", "are.g01-r26-exposed-typescript-candidate"],
  ["Exposed control reliability qualification", "Exposed candidate output-reservation qualification"],
  ["One exposed control task", "One exposed candidate task"]
];
let source = template;
for (const [before, after] of edits) {
  if (!source.includes(before)) throw Error("g01-r26-score.missing-transformation");
  source = source.replaceAll(before, after);
}
await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
