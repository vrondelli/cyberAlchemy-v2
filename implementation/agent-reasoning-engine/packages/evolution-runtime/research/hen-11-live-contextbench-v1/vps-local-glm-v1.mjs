import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {spawn, spawnSync} from "node:child_process";

import {createInjectedSecretProvider, createSecretProviderRegistry, createSecretReference} from "../../../coding-agent-runtime/secret-provider.mjs";

export const HEN11_VPS_TOPOLOGY = Object.freeze({
  host: "187.77.163.194", host_fingerprint_sha256: "bb6900a580e91ec8efa83d491ba9493cd8ae782c69bafaa94d12cfc856f27e2f",
  node_path: "/opt/cyberalchemy-are-tools/node-24.10.0/node", node_version: "v24.10.0", node_sha256: "141542ec0c8f73b568cd774ea8df43f23768cb086eb5bf21d2dea33072fb2f56",
  container: "are-keld-presentation-provider-gateway-1", container_image: "sha256:dbaf783163a0d1b1e6ea7cd693f1145803df7bfaa1d23d31c41c4ffd447e3361",
  container_user: "65532:65532", secret_path: "/run/secrets/model_api_key", secret_crosses_container_boundary: false
});
const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, code) => { if (!value) throw new Error(`hen11-vps-provider.${code}`); };

const REMOTE_PROGRAM = String.raw`
const {readFile}=await import('node:fs/promises');let input='';for await(const chunk of process.stdin){input+=chunk;if(Buffer.byteLength(input)>300000)process.exit(41)}
const request=JSON.parse(input),secret=(await readFile('/run/secrets/model_api_key','utf8')).trim();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),request.timeout_ms);
try{const response=await fetch(request.url,{method:'POST',headers:{'content-type':'application/json',accept:'application/json',authorization:'Bearer '+secret},body:request.body,signal:controller.signal,redirect:'error'});const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>request.maximum_response_bytes)process.exit(42);process.stdout.write(JSON.stringify({status:response.status,payload:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),bytes:bytes.length}));}catch(error){process.stderr.write(error?.name==='AbortError'?'deadline-exceeded':'request-failed');process.exit(43)}finally{clearTimeout(timer)}
`;
const encoded = Buffer.from(REMOTE_PROGRAM).toString("base64"), command = ["exec", "--user", HEN11_VPS_TOPOLOGY.container_user, "-i", HEN11_VPS_TOPOLOGY.container, "/nodejs/bin/node", "--input-type=module", "-e", `await eval('(async()=>{'+Buffer.from('${encoded}','base64').toString('utf8')+'})()')`];

export function verifyHen11VpsTopology({run = spawnSync} = {}) {
  need(sha(readFileSync("/etc/machine-id", "utf8").trim()) === HEN11_VPS_TOPOLOGY.host_fingerprint_sha256, "host-identity");
  need(sha(readFileSync(HEN11_VPS_TOPOLOGY.node_path)) === HEN11_VPS_TOPOLOGY.node_sha256, "node-digest");
  const version = run(HEN11_VPS_TOPOLOGY.node_path, ["--version"], {encoding: "utf8", timeout: 10000}); need(version.status === 0 && version.stdout.trim() === HEN11_VPS_TOPOLOGY.node_version, "node-version");
  const inspect = run("docker", ["inspect", "-f", "{{.Image}} {{.State.Running}} {{.Config.User}}", HEN11_VPS_TOPOLOGY.container], {encoding: "utf8", timeout: 10000});
  need(inspect.status === 0 && inspect.stdout.trim() === `${HEN11_VPS_TOPOLOGY.container_image} true ${HEN11_VPS_TOPOLOGY.container_user}`, "container-identity"); return HEN11_VPS_TOPOLOGY;
}

export function createVpsLocalCredentialBinding() {
  const provider = createInjectedSecretProvider({provider_id: "vps-container-secret", resolve: async () => Buffer.from("container-owned-marker")});
  return Object.freeze({registry: createSecretProviderRegistry({providers: [provider]}), reference: createSecretReference({provider_id: provider.provider_id, locator: `container:${HEN11_VPS_TOPOLOGY.secret_path}`})});
}

export function createVpsLocalPost({spawnProcess = spawn} = {}) {
  verifyHen11VpsTopology();
  return async (url, body, {apiKey, timeout_ms, maximum_response_bytes, signal}) => {
    need(apiKey === "container-owned-marker", "credential-marker"); need(!signal?.aborted, "cancelled"); const child = spawnProcess("docker", command, {stdio: ["pipe", "pipe", "pipe"]}); let stdout = Buffer.alloc(0), stderr = Buffer.alloc(0), settled = false;
    return new Promise((resolve, reject) => { const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener("abort", abort); error ? reject(error) : resolve(value); }, abort = () => { try { child.kill("SIGKILL"); } catch {} finish(new Error("hen11-vps-provider.cancelled")); }, timer = setTimeout(abort, timeout_ms + 5000);
      signal?.addEventListener("abort", abort, {once: true}); child.stdout.on("data", chunk => { stdout = Buffer.concat([stdout, chunk]); if (stdout.length > maximum_response_bytes + 65536) abort(); }); child.stderr.on("data", chunk => { stderr = Buffer.concat([stderr, chunk]).subarray(0, 4096); }); child.on("error", () => finish(new Error("hen11-vps-provider.spawn"))); child.on("close", code => { if (code !== 0) return finish(new Error(`hen11-vps-provider.remote:${code}:${sha(stderr)}`)); try { const value = JSON.parse(stdout); need(Number.isInteger(value.status) && value.bytes <= maximum_response_bytes, "response"); finish(null, value); } catch (error) { finish(error); } }); child.stdin.end(JSON.stringify({url: url.href, body, timeout_ms, maximum_response_bytes})); });
  };
}
