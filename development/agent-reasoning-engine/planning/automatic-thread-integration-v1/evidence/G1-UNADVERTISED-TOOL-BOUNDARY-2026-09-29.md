# G1 restricted-host unadvertised native tool probe — 2026-09-29

Status: bounded installed-host development evidence; authority effect: none.
The TUI is discontinued and outside this path. No active Codex configuration,
desktop task, external model provider, or Companion installation was changed.

## Question and method

The native Windows command-hook callback receives no JSON on stdin in the
current pinned host. Before considering a different model/effect boundary, test
one narrower premise: when the restricted Codex profile omits a built-in tool
from the model request, will the host nevertheless execute a function call for
that tool if a provider returns one?

The [disposable canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-unadvertised-tool-canary.mjs)
creates its own temporary `CODEX_HOME`, disables shell/unified-exec, apps,
multi-agent, goals, and plugins, and directs one App Server turn to a fixed
loopback Responses fixture. The fixture deliberately returns an
`exec_command` function call for harmless `echo` output even though that tool
is absent from the request catalog. The canary records the host's returned
function result and removes only its own temporary state. The model is a
fixed fixture, not a real provider.

## Exact observations

| Host | Binary SHA-256 | Advertised function names | Injected `exec_command` result |
| --- | --- | --- | --- |
| Pinned WSL `codex-cli 0.155.0-alpha.16.4` | `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520` | `request_user_input`, `view_image` | `unsupported call: exec_command`; no echo execution marker in returned output |
| Pinned native Windows `codex-cli 0.155.0-alpha.16.4` | `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f` | `request_user_input`, `view_image` | `unsupported call: exec_command`; no echo execution marker in returned output |

Each run made two requests to its private loopback provider, returned one
function-call output to that provider, completed without a turn error, made
zero external model calls, and reported that the current desktop task was
untouched. The WSL run used the installed WSL binary; the Windows run invoked
the installed native binary under Windows Node. The first invocation used an
incomplete expected-version argument and stopped before launching the host;
the corrected exact-version runs above are the evidence.

## Advertised `view_image` follow-up

The [current official configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
lists `tools.view_image` as a Boolean enablement key. An isolated A/B run
therefore added `[tools] view_image = false` to the canary's dedicated
`CODEX_HOME` without changing active settings. Both pinned binaries still
advertised `view_image` and `request_user_input`; neither effective
`config/read` response exposed the requested `view_image` value. The canary's
disable assertion failed on both hosts. This is an exact pinned-version
observation, not a claim about other Codex versions or configurations.

The native Windows canary then returned one advertised `view_image` call for
an image copied from the repository into its disposable temp directory. The
host returned an `input_image` item with an image URL of 14,034 characters to
the second loopback-provider request. Repeating the same call **with**
`tools.view_image = false` produced the same image item. Both runs made zero
external model calls and read no user-selected private file. The initial
fixture path was wrong and stopped before host launch; the corrected path is
the evidence. This proves a real model-visible local image read in the
restricted native Windows profile, including under the attempted disable
setting. It does not prove arbitrary filesystem reach, cross-user access, or
behavior for a live provider.

An additional native Windows run passed the same setting as a documented
one-off CLI override, `-c tools.view_image=false`, rather than in the config
file. The exact pinned binary still advertised `view_image` and returned the
same `input_image` item to the loopback provider. Both attempted disable
mechanisms are ineffective for this binary and test profile; no active
configuration was changed.

## MCP `PreToolUse` image-read boundary

The [isolated MCP hook transport canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/mcp-hook-transport-canary.mjs)
now has `restricted-view-image-deny` and
`restricted-view-image-missing-tool` modes. It copies the repository Companion
icon into its own temporary directory, enables only the fixture MCP hook,
keeps shell/unified exec, apps, multi-agent, goals, and plugins disabled, and
returns one fixed `view_image` function call from a loopback model fixture.
It never targets a user-selected image or the current desktop task. Both modes
remove their own temporary configuration at teardown.

| Pinned host | Available MCP `PreToolUse` hook | Missing hook tool |
| --- | --- | --- |
| WSL SHA-256 `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520` | `view_image` event with object arguments delivered; deny reported to model; no `input_image` returned | Hook invocation failed; no fixture event; `input_image` returned to model |
| Native Windows SHA-256 `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f` | Same event, deny, and no image result | Same failed hook and model-visible image result |

Each corrected mode completed one disposable host turn with two loopback
provider requests, no external model call, and no active configuration change.
The first missing-tool fixture accidentally answered its own unlisted tool
call, so it produced a denial rather than a missing-tool result; after the
fixture was corrected to return method-not-found, both hosts showed the
fail-open image read above. These results are bound to the exact binaries and
test mode. They do not prove a hosted ARE relay receives or owns this event,
that every future specialized tool path invokes the hook, or that a hook
stays available throughout a turn.

The available-hook result narrows the image-read problem to a transport and
availability boundary; it does not remove it. The missing-tool result is a
direct counterexample to using MCP `PreToolUse` alone as fail-closed effect
control. Normal managed Windows model entry remains paused.

`request_user_input` is separately carried through the hosted client's
[authenticated prompt/answer broker](G1-NATIVE-USER-INPUT-CANARY.md); its
remaining issue is exact activated-session ownership, not absence of a
bounded client pathway. `view_image` has no equivalent ARE-owned read broker
in this profile.

## Claim ceiling and next gate

For these exact binaries and this restricted profile, a model-originated
`exec_command` returned by the fixed provider while unadvertised was rejected
by the host. This narrows one potential bypass; it does **not** prove that all
unadvertised names are rejected, that every model request uses the restricted
profile, or that an actual upstream provider cannot produce an effect through
another path. `view_image` remains advertised and has now returned a local
image to the fixed model fixture even when its documented switch is false.
The [official OpenAI hook contract](https://learn.chatgpt.com/docs/hooks#tool-coverage)
explicitly excludes some specialized paths from default hook coverage and
does not re-run `PreToolUse` on `write_stdin`. MCP-hook errors and missing
servers are also fail-open. The separately observed Windows command-hook
stdin defect remains. Normal Windows managed model entry therefore stays
paused at both hosted client and gateway.

The next construction proof should prevent or mediate the model-visible
`view_image` read without relying on this ineffective pinned-host switch,
including when the hook tool is missing or fails, then test a fail-closed
host/provider boundary across normal,
resume, compaction, and restart. A provider-side catalog filter alone cannot
substitute for proving host dispatch, tool-specific effects, and profile
binding. Exact desktop-task writer/ingress handover remains a separate gate.

## Open Questions

- Can `view_image` be excluded or brokered in this pinned host without relying
  on its ineffective file/CLI config switch or missing-input Windows command
  hooks?
- Does the hosted user-input broker retain exact ARE session ownership across
  restart and later activation of an external desktop task?
- Does the installed host reject other unadvertised effect tool names and
  specialized invocation paths under the same restricted profile?
- How can the managed launcher attest that every model request, including
  resumed and compacted turns, used the verified restricted profile?
