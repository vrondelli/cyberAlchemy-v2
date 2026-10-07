import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {resolve} from "node:path";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {treeBinding} from "./prepare.mjs";
import {verifyHen11VpsTopology} from "./vps-local-glm-v1.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, reason) => { if (!value) throw new Error(`hen11-package.${reason}`); };
const readJson = path => JSON.parse(readFileSync(path, "utf8"));

function verifyScoringEnvironment(environment) { need(sha(readFileSync(environment.python.path)) === environment.python.sha256 && sha(readFileSync(environment.sandbox.path)) === environment.sandbox.sha256, "scoring-environment"); const probe = spawnSync(environment.sandbox.path, ["--unshare-all", "--die-with-parent", "--ro-bind", "/", "/", "--dev-bind", "/dev/null", "/dev/null", "--proc", "/proc", "--clearenv", "--setenv", "PATH", "/usr/bin:/bin", "--setenv", "HOME", "/tmp", "--", environment.python.path, "-B", "-c", "import importlib.metadata as m,json;print(json.dumps({x:m.version(x) for x in ['pyarrow','tree-sitter','tree-sitter-language-pack']},sort_keys=True))"], {encoding: "utf8", timeout: 30000}); need(probe.status === 0, "scoring-modules"); return true; }
export function verifyHen11VpsPackage({manifestPath, freezeSha256, stagedRoot = null, verify_topology = verifyHen11VpsTopology, verify_scoring_environment = verifyScoringEnvironment}) {
  manifestPath = resolve(manifestPath); const manifest = readJson(manifestPath), target = manifest.target_root, map = path => stagedRoot && path.startsWith(`${target}/`) ? `${resolve(stagedRoot)}${path.slice(target.length)}` : path;
  need(manifest.schema_version === "are.hen11-vps-transfer-manifest/v1" && manifest.execution_host === "187.77.163.194" && manifest.launch?.disabled === false, "manifest");
  const freezeEntry = manifest.files.find(file => file.remote_path === `${target}/FREEZE.json`); need(freezeEntry && freezeEntry.sha256 === freezeSha256 && sha(readFileSync(map(freezeEntry.remote_path))) === freezeSha256, "freeze"); const freeze = readJson(map(freezeEntry.remote_path));
  for (const file of manifest.files) need(existsSync(map(file.remote_path)) && sha(readFileSync(map(file.remote_path))) === file.sha256, `file:${file.remote_path}`);
  need(freeze.execution_mode === "development" && freeze.development_execution?.prelaunch_authorization_required === false && freeze.development_execution?.cryptographic_signatures_required === false, "development-execution-policy");
  const trees = [...manifest.repositories, ...manifest.scoring_assets];
  const verifyTrees = suffix => { for (const binding of trees) { const observed = treeBinding(map(binding.remote_path)); need(observed.tree_sha256 === binding.tree_sha256 && observed.files === binding.files && observed.bytes === binding.bytes, `tree${suffix}:${binding.remote_path}`); } };
  verifyTrees("");
  need(verify_scoring_environment(freeze.native_scoring_environment) === true, "scoring-environment-verifier");
  verifyTrees("-after-preflight");
  const topology = verify_topology();
  return {schema_version: "are.hen11-vps-package-observation/v2", freeze_sha256: freezeSha256, deployment_digest: manifest.deployment_digest, target_root: target, staged_root: stagedRoot ? resolve(stagedRoot) : null, files_verified: manifest.files.length, trees_verified: manifest.repositories.length + manifest.scoring_assets.length, topology, launch_disabled: false, prelaunch_authorization_required: false, provider_calls: 0, model_calls: 0, authority_effect: "none"};
}

if (process.argv[1] === import.meta.filename) {
  try { console.log(canonicalJson(verifyHen11VpsPackage({manifestPath: process.argv[2], freezeSha256: process.argv[3], stagedRoot: process.argv[4] || null}))); }
  catch (error) { console.error(canonicalJson({status: "failed", error: String(error.message), authority_effect: "none"})); process.exitCode = 2; }
}
