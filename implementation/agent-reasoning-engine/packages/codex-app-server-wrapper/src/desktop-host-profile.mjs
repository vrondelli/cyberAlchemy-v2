const CODE_MODE = "features.code_mode_host=true";
const APP_TOOLS = "plugins.codex-app-tools@openai-bundled.mcp_servers.codex_app.enabled=true";

export const DESKTOP_HOST_PROFILES = Object.freeze({
  "desktop-wsl-base/v1": Object.freeze({prefix_args: ["-c", CODE_MODE],
    app_server_args: ["--analytics-default-enabled"]}),
  "desktop-wsl-app-tools/v1": Object.freeze({prefix_args: ["-c", CODE_MODE],
    app_server_args: ["--analytics-default-enabled", "-c", APP_TOOLS]}),
});

export function desktopHostProfile(id) {
  return Object.hasOwn(DESKTOP_HOST_PROFILES, id) ? DESKTOP_HOST_PROFILES[id] : null;
}

export function desktopHostProfileForInvocation(args) {
  for (const [id, profile] of Object.entries(DESKTOP_HOST_PROFILES)) {
    const expected = [...profile.prefix_args, "app-server", ...profile.app_server_args];
    if (args.length === expected.length && expected.every((arg, index) => args[index] === arg)) return id;
  }
  return null;
}
