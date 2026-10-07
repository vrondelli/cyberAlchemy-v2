# Adapters UX brief

Status: candidate design. Question: **Which ARE adapters are connected and
running?** This is a read-only connection view, not an adapter manager.

## User journey

1. Open Adapters from Overview when a connection is uncertain, or directly from
   navigation. Read the selected host-to-backend path first.
2. For each link in that path, distinguish its configuration, live process or
   endpoint observation, transport connection, and protocol readiness. Read the
   last-check time beside the result.
3. Open one link for the exact check and evidence behind its state. Optional
   integrations appear separately, so a disabled adapter is not a failure.
4. Follow a warning into Evidence for its reason and scope, then return to the
   same link. There is no Start, Stop, Reconnect, or Configure control.

## Minimum effective screen

- One compact **selected path**, for example Host → ARE gateway → selected
  backend adapter, with a separate state on each link. Show only the path
  actually configured; never imply Codex and DSH are both active.
- A short **other integrations** section for configured but unselected,
  disabled, or unavailable extensions such as MCP and prompt hooks. Do not
  count in-process module ports or product-package declarations as live
  connections.
- Each item shows a plain-language state, source, observed time, and one
  expandable diagnostic. Keep process IDs, addresses, version strings, and
  digests in redacted detail unless they explain the problem.
- A quiet, bounded Refresh action. Opening this page may perform bounded
  read-only checks; it must not start adapters, launch models, or maintain
  high-frequency background polling.

## State and evidence contract

| Claim | Minimum evidence before showing it |
| --- | --- |
| Declared | A product profile or implementation names the adapter. This says nothing about installation or activity. |
| Configured | The effective runtime configuration selects a specific adapter and target. |
| Running | A current probe observes its process or endpoint. A startup receipt alone is historical. |
| Connected | A current transport handshake succeeds with that selected target. A listening socket alone is insufficient. |
| Ready | An adapter-specific protocol/preflight check succeeds within its stated scope and time budget. This does not prove every operation will succeed. |
| In use | Recent bounded traffic is observed and attributed to that adapter; do not infer it from a thread count alone. |

These are separate claims, not a single progress bar. A link may be **running ·
connection unverified**, **connected · readiness failed**, **disabled**, **not
configured**, **stale**, or **unavailable**. Show the exact last successful
check and age when a current probe fails; remove current-success styling. An
unknown state is not a failure, and a disabled optional adapter is not broken.
The Overview summary may say “Gateway running; backend connection unverified,”
but must never compress that into “ARE healthy.”

The [product profile](../../../../product.json) declares Core and optional
integrations; it is not a live registry. The [gateway startup receipt](../../../../packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs)
and [gateway inspect state](../../../../packages/codex-app-server-wrapper/src/gateway.mjs)
offer bounded evidence through the Companion's explicit development-only,
authenticated read path. The [backend adapter contract](../../../../packages/codex-app-server-wrapper/src/backend-adapter.mjs)
identifies the selected adapter; the optional [DSH adapter](../../../../packages/dsh-gateway-backend-adapter/README.md)
must remain visibly optional. The [Companion bridge](../../src-tauri/src/main.rs)
keeps this path separate from `doctor --json`; neither a ready backend nor a
passing product diagnostic proves control of this desktop task. The UI rejects
an already-expired reading and removes current-state claims when a later
reading ages out or fails. Refresh is bounded and does not start a model.
The capability grid now carries all six adapter-declared operation postures:
turn start, interrupt, steering, thread resume, compaction, and effect
requests, plus history persistence. These declarations are not independent
proof that the selected installed host supports or enforces each operation.
An older v1 gateway that omits the three newly projected operations reads as
`unknown` for those fields; an explicit invalid value makes the reading
incompatible and removes current-state styling.

Retained protocol receipts now distinguish an accepted manual-compaction
turn from a completed compaction item. They are bounded, content-free
gateway-session counts, not lifetime totals or proof that compaction
finished. An older gateway with no acceptance field displays “not reported”
for that count. Neither receipt establishes control of this desktop task or
removes the separate Windows model-entry pause.

The gateway also projects whether its process has a hosted-input attestation
key configured. The read-only screen shows `configured`, `not-configured`, or
`unknown` for an older source. This is key-presence metadata only: it exposes
no key, does not prove that a particular request carried a valid proof, does
not identify a physical person, and does not establish control of this desktop
task. It remains separate from backend readiness and the Windows model-entry
pause.

The Adapters view also shows two independent, content-free aggregate stop
signals from the selected gateway: a durable session fault and an incomplete
history-audit quarantine. Each is `observed`, `not observed`, or `unknown`;
an older source that omits a signal is `unknown`, not healthy. An observed
quarantine means reconnect is blocked for at least one affected session, but
the aggregate reveals no consumer, thread, prompt, or exact desktop-task
identity. Overview stops using a ready-path headline when either stop signal
is observed. A stale or failed observation removes current-state claims.

The three link states are gateway aggregates and can refer to different
sessions. A separate content-free `selected_path` fact is `ready` only when
one attached session has a running, initialized backend. Overview uses this
same-session fact before saying “Backend path ready”; an older gateway that
omits it becomes `unknown`, never ready. Even this does not identify or
activate the current desktop task.

The path summary also counts mutually exclusive states within the selected
gateway: ready, initializing, attached without backend, detached backend,
and inactive. Its total is bounded and must equal their sum. This helps a
person see why aggregate links differ from same-session readiness, without
exposing session identities, prompts, or credentials. An older gateway that
omits the counts shows “Not reported”; invalid or contradictory counts make
the observation incompatible. Neither a ready count nor a detached-backend
count proves desktop-task ownership or worker liveness.

The current first view keeps the selected backend path, model-entry posture,
hosted-command and Windows sandbox postures, incomplete host-effect coverage,
desktop-task control, and aggregate fault/quarantine warnings visible. Four
additional guard/configuration readings and the adapter-declared capability
and retained-receipt grids sit in two native, keyboard-operable disclosures.
This reduces first-view density without suppressing the core limitations or
turning a declaration into proof. The source unit suite and an isolated
Chromium browser journey passed the collapsed, Enter-to-open, and narrow-width
states. This is a UI-source result, not installed WebView2/WebKitGTK or
screen-reader validation.

For the opt-in Windows guarded text-only candidate, show model-entry ingress
as a combined state: the gateway reports `not-paused`, while the managed
launcher declares the guard boundary. Label that boundary **candidate** and
**launch-declared**; the Companion cannot independently verify the live guard
or infer full host-effect coverage from a connected backend. A contradictory
gateway pause, selected non-Codex backend, or enabled hosted-effect tool makes
the reading incompatible. The default Windows path remains visibly paused,
and source loss removes either current-state claim.

The [current-source guard heartbeat check](../WINDOWS-OVERVIEW-GUARD-CURRENT-2026-09-29.md)
adds a bounded managed-parent liveness observation. `parent-heartbeat-observed`
supports only a guarded text-only candidate label; `not-observed` withdraws
that label in Overview even while the gateway and backend remain connected.
It does not verify the provider, every host effect path, or this desktop task.

## Experience checks

- With `doctor` PASS and no connection probe, the page says **not observed**,
  not “connected” or “ready.”
- With a running gateway and failed backend handshake, the gateway and backend
  show different states; the failure links to its exact diagnostic.
- A disabled DSH or MCP integration appears as disabled or not configured, not
  red. A stale startup receipt never becomes a current running claim.
- A reader can identify the selected adapter, last check, and next relevant
  evidence within five seconds; keyboard and screen-reader users receive the
  same state distinctions without relying on color.
- An authenticated gateway observation with a pending history audit shows
  quarantine as observed even if no durable fault was written. An older or
  unavailable observation never reports quarantine as clear.

## Open Questions

- Which trusted, authenticated read surface may expose the effective adapter
  path and bounded liveness checks to Companion on Linux and Windows?
- What per-adapter probe defines “ready,” and what timeout and freshness budget
  avoid waking idle services or performing model work?
- Which endpoint, path, and version details can be shown or copied after
  redaction, and who owns that privacy policy?
