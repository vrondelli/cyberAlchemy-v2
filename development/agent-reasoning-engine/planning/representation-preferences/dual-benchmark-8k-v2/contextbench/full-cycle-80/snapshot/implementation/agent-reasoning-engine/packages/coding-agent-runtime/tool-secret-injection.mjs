import {createHash} from "node:crypto";

import {projectSecretReference} from "./secret-provider.mjs";

const ID = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/u;
const ENV = /^[A-Z_][A-Z0-9_]{0,126}$/u;
function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }

export function createToolSecretBinding({binding_id, command_name, secrets} = {}) {
  if (typeof binding_id !== "string" || !ID.test(binding_id)) throw new TypeError("binding_id is invalid.");
  if (typeof command_name !== "string" || !/^[A-Za-z0-9._+-]+$/u.test(command_name)) throw new TypeError("command_name is invalid.");
  if (!Array.isArray(secrets) || secrets.length === 0) throw new TypeError("secrets must be non-empty.");
  const names = new Set();
  const exact = secrets.map(({environment_name, secret_ref}) => {
    if (typeof environment_name !== "string" || !ENV.test(environment_name) || names.has(environment_name)) throw new TypeError("secret environment name is invalid.");
    names.add(environment_name);
    return {environment_name, secret_ref, projection: projectSecretReference(secret_ref)};
  });
  const projection = {schema_version: "are.tool-secret-binding/v1", binding_id, command_name, secrets: exact.map(({environment_name, projection: reference}) => ({environment_name, secret_reference: reference})), authority_effect: "none"};
  return freeze({binding_id, command_name, entries: exact, projection: freeze(projection), binding_digest: sha256(stable(projection))});
}

export async function runSecretBoundSandboxCommand({binding, secret_registry, sandbox, command} = {}) {
  if (!binding || !Array.isArray(binding.entries) || typeof secret_registry?.consume !== "function" || typeof sandbox?.run !== "function") return freeze({ok: false, reason_codes: ["tool.secret-binding-unavailable"], authority_effect: "none"});
  if (!Array.isArray(command) || command[0] !== binding.command_name) return freeze({ok: false, reason_codes: ["tool.secret-binding-command-mismatch"], authority_effect: "none"});
  const environment = {};
  let execution = null;
  const requestDigest = sha256(stable({binding_digest: binding.binding_digest, command}));
  async function consumeAt(index) {
    if (index === binding.entries.length) { execution = sandbox.run(command, {environment}); return; }
    const entry = binding.entries[index];
    await secret_registry.consume({
      secret_ref: entry.secret_ref,
      consumer_id: "sandbox-tool",
      request_digest: requestDigest,
      consumer: async (material) => {
        environment[entry.environment_name] = Buffer.from(material).toString("utf8");
        try { await consumeAt(index + 1); }
        finally { environment[entry.environment_name] = ""; delete environment[entry.environment_name]; }
      },
    });
  }
  try { await consumeAt(0); }
  catch { return freeze({ok: false, reason_codes: ["tool.secret-resolution-denied"], authority_effect: "none"}); }
  return freeze({...execution, secret_binding: binding.projection, secret_request_digest: requestDigest, authority_effect: "none"});
}
