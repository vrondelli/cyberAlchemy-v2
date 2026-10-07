// Source-only development candidate: require receipt-backed code-path coverage before final selection.
// It delegates the pinned cross-layer build, then changes one unique prompt sentence.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {readFileSync, writeFileSync} from "node:fs";

const [basePath, helperPath, outputPath] = process.argv.slice(2);
if (![basePath, helperPath, outputPath].every(path => typeof path === "string" && path.startsWith("/")))
  throw Error("g02-evidence-coverage-prompt.absolute-paths-required");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const builder = "/opt/are/evolution-runtime/g02-cross-layer-nodebb-live-diagnostic-r4/code/build-ranker.mjs";
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
if (hash(readFileSync(builder)) !== "ee79891183eec1538ce85d98aabf54b41f910dc091fca202a4592efa45e8a003")
  throw Error("g02-evidence-coverage-prompt.base-builder-drift");
const intermediate = `${outputPath}.base`;
const built = spawnSync(node, [builder, basePath, helperPath, intermediate], {encoding: "utf8", maxBuffer: 1024 * 1024});
if (built.status !== 0) throw Error(`g02-evidence-coverage-prompt.base-build:${built.stderr?.slice(0, 500)}`);
const source = readFileSync(intermediate, "utf8");
const before = "For relevant source already found, use read_file at base revision to re-read short, exact line ranges around the responsible symbols or tests; prefer those focused read_ids over broad discovery reads in the final selection. ";
const after = "Before final selection, check whether the delivered base reads cover the full responsible code path for each distinct issue requirement. If a selected read is only one line or a clipped fragment and leaves a responsible function branch or directly called helper uninspected, use read_file to acquire one bounded enclosing function or helper at the pinned base revision. Select its delivered read_id only when relevant. Keep narrow exact reads when they already support the requirement; never broaden context solely to increase coverage. ";
if (source.split(before).length !== 2) throw Error("g02-evidence-coverage-prompt.anchor-drift");
const candidate = source.replace(before, after);
writeFileSync(outputPath, candidate, {flag: "wx", mode: 0o644});
console.log(JSON.stringify({base_builder_sha256: hash(readFileSync(builder)), intermediate_sha256: hash(source), candidate_sha256: hash(candidate), output: outputPath}));
