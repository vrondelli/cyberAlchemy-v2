// A disposable, no-model fixture for exercising the r8 source-only reclaim path.
// It must run only while the real r8 root is absent. It is never benchmark data.
import {execFileSync} from "node:child_process";
import {mkdir, symlink, writeFile} from "node:fs/promises";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime/g01-product-replication-r8";
const slug = "storage-probe-no-model-20260929";
const pair = join(root, slug);
if (process.argv.length !== 2) throw Error("fixture takes no arguments");
await mkdir(root, {mode: 0o700}); // Exclusive: fail if a real r8 root exists.
for (const arm of ["control", "candidate"]) {
  for (const copy of ["base", "work"]) {
    const dir = join(pair, arm, "source", "00", copy);
    await mkdir(dir, {recursive: true, mode: 0o700});
    execFileSync("git", ["init", "-q", dir]);
    await writeFile(join(dir, "probe.txt"), `${arm}/${copy}: synthetic storage probe; no model or benchmark task\n`, {flag: "wx"});
    await symlink("probe.txt", join(dir, "probe-link"));
  }
}
await writeFile(join(root, "CAMPAIGN-FREEZE.json"), `${JSON.stringify({
  schema_version: "are.g01-campaign-freeze/v1",
  status: "frozen-before-dispatch",
  probe_only: true,
  model_calls: 0,
  ordered_tasks: [{slug}],
  claim_ceiling: "Synthetic storage integration probe only; never a benchmark freeze or score",
}, null, 2)}\n`, {flag: "wx", mode: 0o600});
await writeFile(join(pair, "PAIR-RESULT.json"), `${JSON.stringify({
  schema_version: "are.g01-pair-result/v1",
  status: "unscored",
  reason: "synthetic-no-model-storage-probe",
  model_calls: 0,
  claim_ceiling: "Synthetic storage integration probe only; never benchmark evidence",
}, null, 2)}\n`, {flag: "wx", mode: 0o600});
process.stdout.write(`${JSON.stringify({status: "synthetic-fixture-created", root, slug, model_calls: 0})}\n`);
