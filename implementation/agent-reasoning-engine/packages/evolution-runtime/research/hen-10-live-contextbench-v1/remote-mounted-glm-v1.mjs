import {spawn} from "node:child_process";

import {
  createInjectedSecretProvider,
  createSecretProviderRegistry,
  createSecretReference,
} from "../../../coding-agent-runtime/secret-provider.mjs";

const REMOTE_PROGRAM = String.raw`
const {readFile}=await import('node:fs/promises');
let input=''; for await (const chunk of process.stdin) { input+=chunk; if(Buffer.byteLength(input)>300000) process.exit(41); }
const request=JSON.parse(input); const secret=(await readFile('/run/secrets/model_api_key','utf8')).trim();
const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),request.timeout_ms);
try {
 const response=await fetch(request.url,{method:'POST',headers:{'content-type':'application/json',accept:'application/json',authorization:'Bearer '+secret},body:request.body,signal:controller.signal,redirect:'error'});
 const bytes=Buffer.from(await response.arrayBuffer()); if(bytes.length>request.maximum_response_bytes) process.exit(42);
 const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 process.stdout.write(JSON.stringify({status:response.status,payload,bytes:bytes.length}));
} catch(error) { process.stderr.write(error?.name==='AbortError'?'deadline-exceeded':'request-failed'); process.exit(43); }
finally { clearTimeout(timer); }
`;

const encodedProgram = Buffer.from(REMOTE_PROGRAM).toString("base64");
const remoteCommand = `docker exec --user 65532:65532 -i are-keld-presentation-provider-gateway-1 /nodejs/bin/node --input-type=module -e "await eval('(async()=>{'+Buffer.from('${encodedProgram}','base64').toString('utf8')+'})()')"`;

function failure(code, diagnostic = null) {
  const error = new Error(`remote-mounted-glm.${code}`);
  error.code = code;
  if (diagnostic) error.remote_diagnostic = String(diagnostic).replace(/[^\x20-\x7e]/g, " ").slice(0, 512);
  return error;
}

export function createRemoteMountedCredentialBinding() {
  const provider = createInjectedSecretProvider({provider_id: "remote-mounted-secret", resolve: async () => Buffer.from("remote-owned-marker")});
  return Object.freeze({
    registry: createSecretProviderRegistry({providers: [provider]}),
    reference: createSecretReference({provider_id: provider.provider_id, locator: "container:/run/secrets/model_api_key"}),
  });
}

export function createRemoteMountedPost({host = "187.77.163.194", spawnProcess = spawn} = {}) {
  if (host !== "187.77.163.194" || typeof spawnProcess !== "function") throw failure("binding-invalid");
  return async function remoteMountedPost(url, body, {apiKey, timeout_ms, maximum_response_bytes, signal}) {
    if (apiKey !== "remote-owned-marker") throw failure("credential-marker-invalid");
    if (signal?.aborted) throw failure("cancelled");
    const child = spawnProcess("ssh", ["-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ConnectTimeout=10", `root@${host}`, remoteCommand], {stdio: ["pipe", "pipe", "pipe"]});
    let stdout = Buffer.alloc(0), stderr = Buffer.alloc(0), settled = false, closed = false, deadline, escalation;
    const completion = new Promise((resolve, reject) => {
      const finish = (error, value) => {
        if (settled) return; settled = true; clearTimeout(deadline); signal?.removeEventListener("abort", abort);
        if (error) reject(error); else resolve(value);
      };
      const terminate = code => {
        child.kill("SIGTERM");
        escalation = setTimeout(() => { if (!closed) child.kill("SIGKILL"); }, 2_000); escalation.unref?.();
        finish(failure(code));
      };
      const abort = () => terminate("cancelled");
      signal?.addEventListener("abort", abort, {once: true});
      deadline = setTimeout(() => terminate("deadline-exceeded"), timeout_ms + 15_000);
      child.on("error", () => finish(failure("request-failed")));
      child.stdin.on("error", () => finish(failure("request-failed")));
      child.stdout.on("data", chunk => { stdout = Buffer.concat([stdout, chunk]); if (stdout.length > maximum_response_bytes + 65536) child.kill("SIGTERM"); });
      child.stderr.on("data", chunk => { if (stderr.length < 4096) stderr = Buffer.concat([stderr, chunk]).subarray(0, 4096); });
      child.on("close", code => {
        closed = true; clearTimeout(escalation);
        if (settled) return;
        if (signal?.aborted) return finish(failure("cancelled"));
        if (code !== 0) return finish(failure(stderr.toString().includes("deadline-exceeded") ? "deadline-exceeded" : "request-failed", `exit=${code};stderr=${stderr.toString()}`));
        try {
          const value = JSON.parse(stdout.toString("utf8"));
          if (!Number.isInteger(value.status) || value.bytes > maximum_response_bytes || value.payload === undefined) throw new Error();
          finish(null, value);
        } catch { finish(failure("response-json-invalid")); }
      });
      if (signal?.aborted) abort();
    });
    try { child.stdin.end(JSON.stringify({url: url.href, body, timeout_ms, maximum_response_bytes})); }
    catch { child.kill("SIGTERM"); throw failure("request-failed"); }
    return completion;
  };
}

export const REMOTE_MOUNTED_GLM_BINDING = Object.freeze({
  schema_version: "are.remote-mounted-glm-binding/v1",
  host: "187.77.163.194",
  container: "are-keld-presentation-provider-gateway-1",
  secret_path: "/run/secrets/model_api_key",
  secret_crosses_host_boundary: false,
  remote_artifacts_retained: false,
  authority_effect: "none",
});
