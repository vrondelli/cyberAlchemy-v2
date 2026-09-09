#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../..");
const routerRoot = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router");
const node = process.execPath;
const outputPath = process.argv[2] ? resolve(process.argv[2]) : null;

function run(name, cwd) {
  const result = spawnSync(node, ["--test", "--test-reporter=tap", "test/*.test.mjs"], {cwd, encoding: "utf8", shell: true, env: {...process.env, FORCE_COLOR: "0"}});
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const number = (label) => Number(text.match(new RegExp(`# ${label} (\\d+)`))?.[1] ?? -1);
  return {name, cwd: relative(repositoryRoot, cwd), exit_code: result.status, tests: number("tests"), passed: number("pass"), failed: number("fail"), output_sha256: createHash("sha256").update(text).digest("hex")};
}

const runs = [run("request-decision-router", routerRoot), run("codex-integration", packageRoot)];
const receipt = {
  schema_version: "are.codex-regression-receipt/v2",
  observed_at: new Date().toISOString(),
  status: runs.every((item) => item.exit_code === 0 && item.failed === 0) ? "PASS" : "FAIL",
  runtime: process.version,
  runs,
  runtime_closure_sha256: createHash("sha256").update(readFileSync(resolve(packageRoot, "evidence/runtime-closure.v2.json"))).digest("hex"),
  authority_effect: "none",
  claim_limit: "Deterministic local regression evidence for the exact runtime closure only; no acceptance, admission, publication, deployment, or effect authority.",
};
if (outputPath) {
  if (existsSync(outputPath)) throw new Error("refusing to overwrite immutable regression evidence");
  writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
process.exitCode = receipt.status === "PASS" ? 0 : 1;
