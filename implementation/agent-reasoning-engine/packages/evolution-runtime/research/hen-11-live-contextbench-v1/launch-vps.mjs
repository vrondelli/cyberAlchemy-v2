import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {HEN11_VPS_TOPOLOGY, verifyHen11VpsTopology} from "./vps-local-glm-v1.mjs";
import {runHen11Host} from "./run-host.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, reason) => { if (!value) throw new Error(`hen11-launch.${reason}`); };

export function verifyHen11LaunchRuntime({execPath = process.execPath, version = process.version, execArgv = process.execArgv, read = readFileSync, topology = HEN11_VPS_TOPOLOGY} = {}) {
  need(execPath === topology.node_path, "node-path");
  need(version === topology.node_version, "node-version");
  need(sha(read(execPath)) === topology.node_sha256, "node-digest");
  need(execArgv.includes("--experimental-vm-modules") && typeof vm.SourceTextModule === "function", "vm-flag");
  return true;
}

export async function launchHen11Vps({freezePath, freezeSha256, signal, host = {}}) {
  verifyHen11LaunchRuntime(host.runtime); (host.verify_topology ?? verifyHen11VpsTopology)();
  return runHen11Host({freezePath, freezeSha256, signal, host: {...host, verify_topology: () => true}});
}

if (process.argv[1] === import.meta.filename) {
  const [freezePath, freezeSha256] = process.argv.slice(2);
  if (!freezePath || !freezeSha256) { console.error(canonicalJson({status: "disabled", reason: "freeze-and-digest-required", authority_effect: "none"})); process.exitCode = 2; }
  else { const controller = new AbortController(); process.on("SIGINT", () => controller.abort()); process.on("SIGTERM", () => controller.abort()); try { console.log(canonicalJson(await launchHen11Vps({freezePath, freezeSha256, signal: controller.signal}))); } catch (error) { console.error(canonicalJson({status: "failed", error: String(error.message), authority_effect: "none"})); process.exitCode = 2; } }
}
