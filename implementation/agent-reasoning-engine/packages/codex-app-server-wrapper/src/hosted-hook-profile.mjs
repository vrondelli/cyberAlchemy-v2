import {createHash} from "node:crypto";
import {isDeepStrictEqual} from "node:util";
import {lstatSync, readFileSync, realpathSync, statSync} from "node:fs";
import {isAbsolute, join} from "node:path";

const MAX_HOOK_PROFILE_BYTES = 8192;
const identity = {hook_event_name: "${hook_event_name}", session_id: "${session_id}",
  turn_id: "${turn_id}", cwd: "${cwd}"};
const relay = event => ({type: "mcp_tool", server: "are_hosted_hook_relay",
  tool: "are_hook_observe", input: {event}, timeout: 15});

// One owned relay observes every supported local tool path. Host-hook
// coverage still has documented exceptions and is not a universal effect gate.
export function hostedMcpHookProfile() {
  return {hooks: {
    UserPromptSubmit: [{hooks: [relay({...identity, prompt: "${prompt}"})]}],
    PreToolUse: [{hooks: [relay({...identity, tool_name: "${tool_name}",
      tool_use_id: "${tool_use_id}", tool_input: "${tool_input}"})]}],
    Stop: [{hooks: [relay({...identity, stop_hook_active: "${stop_hook_active}",
      last_assistant_message: "${last_assistant_message}"})]}],
  }};
}

export function hostedMcpHookTrustPosture(listed, sourcePath) {
  const expected = ["pre_tool_use", "user_prompt_submit", "stop"];
  if (typeof sourcePath !== "string" || !isAbsolute(sourcePath)
    || !Array.isArray(listed?.data) || listed.nextCursor != null) return {ok: false};
  const hooks = listed.data.flatMap(row => Array.isArray(row?.hooks) ? row.hooks : []);
  if (hooks.length !== expected.length) return {ok: false};
  const keys = new Set(hooks.map(hook => hook?.key));
  return {ok: hooks.every(hook => hook?.sourcePath === sourcePath
    && hook.trustStatus === "trusted" && hook.enabled === true
    && /^sha256:[0-9a-f]{64}$/.test(hook.currentHash ?? ""))
    && expected.every(event => keys.has(`${sourcePath}:${event}:0:0`))};
}

export function validateHostedMcpHookProfile(codexHome) {
  try {
    if (typeof codexHome !== "string" || !isAbsolute(codexHome)
      || realpathSync(codexHome) !== codexHome || !statSync(codexHome).isDirectory()) {
      throw new Error("home");
    }
    const path = join(codexHome, "hooks.json");
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 2
      || stat.size > MAX_HOOK_PROFILE_BYTES
      || (process.platform !== "win32" && ((stat.mode & 0o077) !== 0
        || stat.uid !== process.getuid()))) throw new Error("file");
    const bytes = readFileSync(path);
    if (bytes.length !== stat.size || !isDeepStrictEqual(JSON.parse(bytes.toString("utf8")),
      hostedMcpHookProfile())) throw new Error("content");
    return {path, sha256: createHash("sha256").update(bytes).digest("hex")};
  } catch {
    throw new Error("managed-session.mcp-hook-profile-invalid");
  }
}
