// Isolate a single already exposed r8 task for development. Never changes r8.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r8-exposed-fix.${reason}`);};
const base = "/opt/are/evolution-runtime";
const oldSource = `${base}/g01-source-combined-candidate-r9/`;
const newSource = `${base}/g01-source-combined-candidate-r10/`;
const oldPath = `${base}/g01-product-replication-r8/cpp--atch2-83e00afd/CANDIDATE-FREEZE.json`;
const oldSha = "4bce4fb503f5effc1e2f70883c77dc81c1d31c37203e64920ffec70bc846f7e7";
const newRoot = `${base}/g01-r8-exposed-catch2-fix-r1`;
const changedRelative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-convergence-r3.mjs";
const changedSha = "7341f666ed4fffa30788e44068a387ad962ddb71507f42248c9b036f06f30975";
try {
  need(["--check", "--freeze"].includes(process.argv[2]) && process.argv.length === 3, "arguments");
  need(!existsSync(newRoot), "root-used");
  const original = readFileSync(oldPath);
  need(sha(original) === oldSha, "r8-freeze-drift");
  const prior = JSON.parse(original);
  need(prior.status === "frozen-before-dispatch" && prior.arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1" && prior.sources.length === 18 && prior.sources.filter(x => x.path.startsWith(oldSource)).length === 17, "prior-shape");
  need(sha(readFileSync(prior.config_path)) === prior.config_sha256 && sha(readFileSync(newSource + changedRelative)) === changedSha, "config-or-repair-drift");
  const sources = prior.sources.map(item => {
    need(sha(readFileSync(item.path)) === item.sha256, `prior-source-drift:${item.path}`);
    const path = item.path.startsWith(oldSource) ? newSource + item.path.slice(oldSource.length) : item.path;
    const digest = sha(readFileSync(path));
    need(item.path !== oldSource + changedRelative || digest === changedSha, "repair-binding");
    need(item.path === oldSource + changedRelative || digest === item.sha256, `unexpected-source-change:${item.path}`);
    return {path, sha256: digest};
  });
  const freeze = {...prior, sources, output_root: join(newRoot, "candidate"),
    claim_ceiling: "One previously exposed Catch2 r8 task, development only; no frozen-r8 repair, matched-control inference, holdout, or superiority claim",
    development_parent_freeze_sha256: oldSha,
    open_questions: ["Does this prospective bookkeeping repair allow the exposed candidate to reach a final context without changing its model/8K budget?"]};
  if (process.argv[2] === "--check") console.log(JSON.stringify({status: "checked-not-frozen", sources: sources.length, changed_source_sha256: changedSha, model_calls: 0}));
  else {
    mkdirSync(newRoot, {mode: 0o700});
    const path = join(newRoot, "CANDIDATE-FREEZE.json");
    const bytes = Buffer.from(JSON.stringify(freeze, null, 2) + "\n");
    writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "frozen-exposed-development", freeze_path: path, freeze_sha256: sha(bytes), sources: sources.length, model_calls: 0}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "freeze-error", error: String(error.message)}));
  process.exitCode = 2;
}
