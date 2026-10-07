# Native hosted-client CLI hook canary — 2026-10-03

Status: bounded, isolated construction evidence. Authority effect: none.
Owner: ARE runtime and Codex host integrators. This does not activate or
control the current Codex desktop task.

The [repeatable canary](../../../../implementation/agent-reasoning-engine/scripts/test-native-hosted-cli-hook.mjs)
ran the actual `are-codex-windows-client.mjs` entry point, not only its
`startHostedHookControl` module, through one persistent ARE gateway and the
installed WSL Codex App Server. The pinned host was
`codex-cli 0.155.0-alpha.16.4`, executable SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
The canary used a disposable `CODEX_HOME`, exact trust hashes for three
generated hooks, a private callback connection, one loopback HTTP client,
and a fixed local Responses provider. No external model, active task,
global hook configuration, or user account state was used.

The final native run returned `PASS`: the CLI created one disposable hosted
thread; `UserPromptSubmit` context appeared on the first provider request;
the fixture's one `exec_command` proposal was blocked by `PreToolUse` before
its success marker could appear; and the turn reached a native terminal
completion. The CLI-owned callback file and temporary Codex configuration
were removed on shutdown. A second run after removing raw startup stderr
from the failure report passed the same checks. The earlier direct-controller
canary and this CLI path are now distinct evidence.

During an initial parallel recheck using `/tmp`, both native canaries failed
their prompt-callback assertion while Codex reported `No space left on device`
installing system skills in disposable profiles. `/tmp` was a 3.9 GiB tmpfs
with about 5.4 MiB free; the checkout filesystem had ample space. Moving only
the canaries' temporary root to a newly created directory under the user cache
made both prior denial modes pass in parallel. The new CLI canary then passed
there. Its parent temporary directory was empty and removed. No unrelated
temporary directories were deleted. This is an environmental precondition and
observed failure mode, not evidence of a product hook regression or a general
host-space repair.

The focused callback suite initially exposed one test assumption: it expected
`os.tmpdir()` itself to be a public, unsafe connection parent. With a private
`TMPDIR`, that assertion failed and left its test bridge alive. The test now
creates its own mode-0755 parent for the negative case. Rerunning all four
focused callback/session files with a private temporary root passed 36/36.
The one stale callback file from the failed test was reclaimed only after its
recorded owner PID was confirmed dead and its exact connection identity
matched; its parent test directory was then removed. No non-test state was
deleted.

## Claim ceiling

This proves one supported local shell tool and one hosted-client CLI thread on
the pinned version. It does not prove that every tool path emits `PreToolUse`,
that errors before hook invocation fail closed, that a stock Codex desktop New
Chat invokes this client, or that the desktop relinquishes its writer. The
documented [Hooks](https://learn.chatgpt.com/docs/hooks) boundary supplies
context and named-event blocking, not an exclusive transport-controller API.
G0/D4 desktop activation and full effect coverage remain open.

## Open Questions

- Which selected-host paths can execute effects without this hook callback?
- Can the installed desktop app route a new chat through the ARE gateway with
  exact identity and exclusive writer ownership?
- What resource preflight should native canaries require before creating a
  disposable Codex home on a tmpfs?
