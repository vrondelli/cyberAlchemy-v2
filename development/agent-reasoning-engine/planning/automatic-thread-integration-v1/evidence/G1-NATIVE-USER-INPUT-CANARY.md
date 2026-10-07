# G1 installed-host user-input delivery canary

Status: passed on an isolated disposable task, 2026-09-26. Authority effect:
none. This is native host-request delivery evidence, not desktop-task handover.

## Boundary exercised

The [canary script](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs) starts the exact installed
`codex-cli 0.155.0-alpha.16.4` binary with SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`
under a disposable `CODEX_HOME`. A fixed loopback Responses provider returns
one `request_user_input` function call and then a terminal message; it makes
zero external model calls. The actual ARE wrapper and persistent gateway own
the App Server connection. The hosted Windows client starts a disposable
thread through its authenticated HTTP API; the canary starts a plan-mode turn
on that same connection to make the user-input tool available.

The installed App Server emitted `item/tool/requestUserInput` with matching
thread and turn IDs. The hosted client's authenticated `/api/state` exposed
the pending prompt, `/api/user-input/:id` accepted the exact choice, the
provider's second request contained the answer, App Server emitted
`serverRequest/resolved`, and the turn completed. The pending prompt count
returned to zero. The UI HTML asset returned HTTP 200. Temporary configuration
was removed and the native child was reaped.

The canary's `--browser` mode held the same native prompt open for a real
Chromium session driven through `playwright-cli`. The browser snapshot showed
the active thread identity and an accessible combobox named by the question.
ArrowDown, Enter, Tab and Enter selected and submitted the answer without a
mouse click on the action button. The canary then returned `PASS` with
`host_ui.browser_interaction: true`, and the page showed the fixed terminal
message. No console error occurred while the temporary server was running;
closing the fixture later naturally ends its event stream. This browser run
exposed and led to a repair of lost active-thread selection on page load and
missing question-control labels. A local SVG favicon removed an unrelated
404 diagnostic.

## Validation

```sh
node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs \
  /mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex \
  'codex-cli 0.155.0-alpha.16.4'
```

The final run returned `are.native-user-input-canary/v1`, `status: PASS`,
`provider_requests: 2`, `answer_observed_by_provider: true`,
`server_request_resolved: true`, `turn_status: completed`,
`host_ui.pending_prompt_observed: true`, and
`host_ui.authenticated_answer_accepted: true`. An initial probe correctly
failed because the gateway requires a stable mutation key; a second probe
correctly failed preflight for a prompt with no repository route. The passing
probe used the existing UNDERSTAND-route fixture prompt and stable keys.
The rendered-browser run also passed after the UI repair. A previous browser
attempt timed out while the browser runtime dependencies were being located;
browser mode now uses longer bounded prompt deadlines and the passing run
completed through keyboard submission well before that deadline.
The broker also now honors a valid `autoResolutionMs` deadline with an empty
answer map when the user does not respond; a focused fixture passed this
non-blocking path. The current focused RPC and Windows-host suites passed
29/29, and the non-browser native canary passed again after that change.

## Claim ceiling

This proves one non-secret, single-choice native request through the installed
binary, ARE gateway, hosted HTTP API, and rendered Chromium browser. It does
not prove Windows WebView behavior, a human click, secret/free-text variants,
other client hosts, MCP elicitation, current desktop task ownership, account
continuity, all ingress/effect interception, or rollback. The isolated host
attempted ordinary plugin discovery and received an unauthorized response;
the zero-call claim concerns the model provider only, not all possible network
activity. G1 and O1 remain unapproved.

## Open Questions

- Can the installed Windows WebView complete the same interaction, including
  secret/free-text variants, with no answer text in diagnostics?
- Which supported desktop action relinquishes this exact task's writer and
  redirects new user input and host requests to ARE without a gap?
