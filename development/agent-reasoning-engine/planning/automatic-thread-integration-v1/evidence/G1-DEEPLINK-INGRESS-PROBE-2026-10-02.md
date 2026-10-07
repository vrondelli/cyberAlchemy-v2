# G1 desktop New Chat deep-link ingress probe — 2026-10-02

Status: candidate, bounded host evidence. Authority effect: none. No desktop
activation, current-task transfer, model turn, or primary-app configuration
change occurred. TUI is excluded.

## Official capability and limit

The [official desktop command reference](https://learn.chatgpt.com/docs/reference/commands#deep-links)
documents `codex://threads/new?path=<absolute-path>` as a new local chat in a
chosen workspace. A `prompt` parameter can prefill the composer, but the page
explicitly says it does **not** send that prompt. This is a supported ingress
aid for the desktop New Chat flow, not a backend/session-controller hook or a
way to prove that ARE owns a submitted turn. The [Windows app guide](https://learn.chatgpt.com/docs/windows/windows-app#windows-subsystem-for-linux-wsl)
still requires selecting the WSL agent and restarting the app when changing
agent environment.

## Isolated observation

- Installed Windows package remained `OpenAI.Codex_26.917.9434.0`; its
  `app.asar` SHA-256 remained
  `d4234b03eb532fe0f3e9a7d90caad51edb68af45f771cc786d966377e7446f5a`.
  The pinned WSL `codex-cli 0.155.0-alpha.16.4` SHA-256 remained
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
- A separate `ChatGPT.exe` PID 26712 was launched with an isolated Electron
  user-data directory, a private `CODEX_HOME` containing only the WSL-agent
  setting, per-process `CODEX_CLI_PATH`/`CODEX_INSTALL_DIR` and shim variables,
  and a `codex://threads/new?path=` link containing the encoded WSL workspace.
  The primary main process PID 20440 remained running. The installed bundle's
  read-only code still recognizes an explicit `CODEX_ELECTRON_USER_DATA_PATH`
  and guards the ordinary single-instance behavior, but that code is not a
  public stability contract.
- PID 26712 created five child UI processes and private cache/state files. The
  pre-created private WSL shim trace remained zero bytes. No private
  `auth.json` or `sessions/` directory appeared in that isolated Codex home.
  No prompt was submitted, no model call was made, and no WSL shim invocation
  was observed. We did not inspect or automate the graphical app UI.
- `CloseMainWindow` succeeded for exact PID 26712; it and its five children
  exited. PID 20440 remained alive. The isolated temporary profile and empty
  trace were then removed after process exit.

The empty trace is **inconclusive**: the documented link does not submit a
prompt, the isolated profile's authenticated status was not established, and
there was no graphical witness that the intended workspace was selected. It
cannot be used to claim that the app ignores the launch selector or that stock
New Chat is ARE-controlled. It does replace the earlier unsupported
`--open-project` guess with a documented, workspace-targeted New Chat URL for
the next G0 test.

## Next proof

Use a disposable authenticated app profile with WSL agent selected, invoke the
documented new-chat link, then submit one benign turn through the actual app.
Correlate the content-free shim trace with that exact test-owned process,
workspace, backend launch and gateway ingress. If that genuine turn does not
reach the shim, stop the internal-selector path and seek a supported host
integration; do not infer success from direct shim or fixture canaries.

## Open Questions

- Can a safely isolated app profile be authenticated without copying or
  sharing the primary profile's credentials and mutable state?
- Does the deep link select the intended WSL workspace in this pinned build,
  and does the app launch its WSL backend only after the first submitted turn?
- Is there a supported host API that redirects the stock desktop New Chat
  backend/writer, rather than relying on a version-bound launch selector?
