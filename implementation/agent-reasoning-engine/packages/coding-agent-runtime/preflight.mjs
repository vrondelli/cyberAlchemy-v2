import {createHash} from "node:crypto";
import {accessSync, constants, existsSync, readFileSync, realpathSync, statSync} from "node:fs";
import {dirname, resolve, sep} from "node:path";
import {spawnSync} from "node:child_process";

import {parseCodexScopeConfig} from "./codex-proposal.mjs";
import {parseCodingAgentRunConfig} from "./runtime-config.mjs";

function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function check(check_id, status, reason_codes = [], detail = null) { return freeze({check_id, status, reason_codes, detail, authority_effect: "none"}); }

function executable(path, id) {
  if (typeof path !== "string" || !path) return check(id, "BLOCK", [`preflight.${id}-required`]);
  try { accessSync(resolve(path), constants.X_OK); return check(id, "PASS", [], resolve(path)); }
  catch { return check(id, "BLOCK", [`preflight.${id}-unavailable`], resolve(path)); }
}

export function runCodingAgentPreflight({provider, config, repository_root, codex_command = null, codex_profile = null, proposal_output = null, session_path = null, resume = false, runner = spawnSync, probe_container = true} = {}) {
  const checks = [];
  let parsed = null;
  const codex = provider === "codex-app-server";
  try {
    parsed = codex ? parseCodexScopeConfig(config) : parseCodingAgentRunConfig(config);
    checks.push(check("configuration", "PASS", [], parsed.schema_version));
  } catch (error) {
    checks.push(check("configuration", "BLOCK", ["preflight.configuration-invalid"], error.message));
  }

  let root = null;
  try {
    root = realpathSync(repository_root);
    if (!statSync(root).isDirectory()) throw new Error("not-directory");
    checks.push(check("repository", "PASS", [], root));
  } catch {
    checks.push(check("repository", "BLOCK", ["preflight.repository-unavailable"], typeof repository_root === "string" ? resolve(repository_root) : null));
  }

  if (codex) {
    checks.push(executable(codex_command, "codex-command"));
    try {
      const profile = JSON.parse(readFileSync(resolve(codex_profile), "utf8"));
      if (typeof profile?.protocol_binding?.observed_codex_version !== "string") throw new Error("binding-missing");
      checks.push(check("codex-profile", "PASS", [], resolve(codex_profile)));
    } catch { checks.push(check("codex-profile", "BLOCK", ["preflight.codex-profile-invalid"], codex_profile ? resolve(codex_profile) : null)); }
  } else if (typeof session_path !== "string" || !session_path) {
    checks.push(check("session-path", "BLOCK", ["preflight.session-path-required"]));
  } else {
    const session = resolve(session_path);
    if (root && (session === root || session.startsWith(`${root}${sep}`))) checks.push(check("session-path", "BLOCK", ["preflight.session-path-inside-repository"], session));
    else if (existsSync(session) && resume !== true) checks.push(check("session-path", "BLOCK", ["preflight.session-existing-requires-resume"], session));
    else if (!existsSync(session) && resume === true) checks.push(check("session-path", "BLOCK", ["preflight.session-resume-source-missing"], session));
    else {
      try { accessSync(dirname(session), constants.W_OK); checks.push(check("session-path", "PASS", [], session)); }
      catch { checks.push(check("session-path", "BLOCK", ["preflight.session-parent-unwritable"], session)); }
    }
  }

  if (proposal_output) {
    const output = resolve(proposal_output);
    if (root && (output === root || output.startsWith(`${root}${sep}`))) checks.push(check("proposal-output", "BLOCK", ["preflight.proposal-output-inside-repository"], output));
    else if (existsSync(output)) checks.push(check("proposal-output", "BLOCK", ["preflight.proposal-output-exists"], output));
    else {
      try { accessSync(dirname(output), constants.W_OK); checks.push(check("proposal-output", "PASS", [], output)); }
      catch { checks.push(check("proposal-output", "BLOCK", ["preflight.proposal-output-parent-unwritable"], output)); }
    }
  } else checks.push(check("proposal-output", "PASS", [], "not-requested"));

  if (!parsed) {
    checks.push(check("sandbox-engine", "not_evaluable", ["preflight.configuration-invalid"]));
    checks.push(check("sandbox-image", "not_evaluable", ["preflight.configuration-invalid"]));
  } else if (!parsed.sandbox) {
    checks.push(check("sandbox-engine", "BLOCK", ["sandbox.required"]));
    checks.push(check("sandbox-image", "not_evaluable", ["sandbox.required"]));
  } else {
    checks.push(executable(parsed.sandbox.engine, "sandbox-engine"));
    const engineReady = checks.at(-1).status === "PASS";
    if (!probe_container) checks.push(check("sandbox-image", "not_evaluable", ["preflight.container-probe-not-requested"], parsed.sandbox.image));
    else if (!engineReady) checks.push(check("sandbox-image", "not_evaluable", ["preflight.sandbox-engine-unavailable"], parsed.sandbox.image));
    else {
      const inspected = runner(parsed.sandbox.engine, ["image", "inspect", parsed.sandbox.image], {encoding: "utf8", timeout: 10_000, env: {LANG: "C", LC_ALL: "C"}});
      checks.push(inspected?.status === 0
        ? check("sandbox-image", "PASS", [], parsed.sandbox.image)
        : check("sandbox-image", "BLOCK", ["preflight.sandbox-image-unavailable"], parsed.sandbox.image));
    }
  }

  const status = checks.some((item) => item.status === "BLOCK") ? "BLOCK" : "PASS";
  const reason_codes = [...new Set(checks.flatMap((item) => item.status === "BLOCK" ? item.reason_codes : []))].sort();
  const material = {schema_version: "are.coding-agent-preflight/v1", status, reason_codes, provider: codex ? "codex-app-server" : "openai-compatible", checks, model_invoked: false, repository_effects: 0, authority_effect: "none"};
  return freeze({...material, result_digest: sha256(stable(material))});
}
