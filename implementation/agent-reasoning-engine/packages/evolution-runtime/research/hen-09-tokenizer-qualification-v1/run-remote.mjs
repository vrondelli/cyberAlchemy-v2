import {spawn} from "node:child_process";
import {existsSync, mkdirSync, renameSync, writeFileSync} from "node:fs";
import {basename, join, resolve} from "node:path";

import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {assessHen09Receipts, loadHen09Freeze, renderRemoteTokenizerProgram} from "./qualification.mjs";

const need = (value, reason) => { if (!value) throw new Error(`hen09-remote.${reason}`); };

export async function runRemoteHen09({freezeRoot, attemptId, host = "187.77.163.194"}) {
  freezeRoot = resolve(freezeRoot);
  need(/^[a-z0-9][a-z0-9._-]{0,127}$/.test(attemptId), "attempt-id");
  const attemptRoot = join(freezeRoot, "attempts", attemptId);
  need(!existsSync(attemptRoot), "attempt-exists");
  mkdirSync(attemptRoot, {recursive: true, mode: 0o700});
  const freeze = loadHen09Freeze(freezeRoot);
  const program = renderRemoteTokenizerProgram(freeze);
  const args = ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ConnectTimeout=10",
    `root@${host}`, "docker", "exec", "--user", "65532:65532", "-i",
    "are-keld-presentation-provider-gateway-1", "/nodejs/bin/node", "--input-type=module", "-"];
  const child = spawn("ssh", args, {stdio: ["pipe", "pipe", "pipe"]});
  let stdout = "", stderr = "";
  child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { stdout += chunk; need(Buffer.byteLength(stdout) <= 2 ** 20, "stdout-bound"); });
  child.stderr.on("data", (chunk) => { stderr += chunk; need(Buffer.byteLength(stderr) <= 65536, "stderr-bound"); });
  child.stdin.end(program);
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("close", resolveExit);
  });
  const receiptLines = stdout.trimEnd() ? stdout.trimEnd().split("\n") : [];
  const rawPath = join(attemptRoot, "RECEIPTS.jsonl.partial");
  writeFileSync(rawPath, receiptLines.map((line) => `${canonicalJson(JSON.parse(line))}\n`).join(""),
    {flag: "wx", mode: 0o600});
  const settlement = {schema_version: "are.hen-tokenizer-remote-settlement/v1", attempt_id: attemptId,
    host, container: "are-keld-presentation-provider-gateway-1", exit_code: exitCode,
    stdout_lines: receiptLines.length, stderr: stderr.trim(), remote_artifacts_retained: false,
    model_calls: 0, authority_effect: "none"};
  writeFileSync(join(attemptRoot, "SETTLEMENT.json"), `${canonicalJson(settlement)}\n`, {flag: "wx", mode: 0o600});
  need(exitCode === 0, `exit:${exitCode}`);
  const result = assessHen09Receipts(freeze, receiptLines);
  renameSync(rawPath, join(attemptRoot, "RECEIPTS.jsonl"));
  writeFileSync(join(attemptRoot, "RESULTS.json"), `${canonicalJson({...result, settlement})}\n`,
    {flag: "wx", mode: 0o600});
  need(result.qualified, "context-overflow");
  return {...result, attempt_root: attemptRoot};
}

if (process.argv[1] && basename(process.argv[1]) === basename(import.meta.filename)) {
  const [freezeRoot, attemptId] = process.argv.slice(2);
  need(freezeRoot && attemptId, "usage");
  console.log(canonicalJson(await runRemoteHen09({freezeRoot, attemptId})));
}
