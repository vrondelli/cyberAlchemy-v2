# G1 managed-session startup candidate — 2026-09-28

Status: candidate implementation evidence, not current desktop-task activation.
Route: `CA2-ROUTE-IMPLEMENT`; effect posture: construction under the `CAV2-D65`
gate. The TUI is discontinued and is not part of this path.

## Boundary and implementation

`implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-managed-session.mjs`
supervises one existing Codex gateway and one hosted browser client. It uses an
explicit absolute repository root, pinned Codex executable, repository profile,
and pre-existing private state directory outside the repository. The gateway's
durable session store, per-consumer Reasoning State, and the hosted client's
recovery file live under that state directory. Readiness is ordered gateway
then client; a child exit or launcher signal stops the other child. Optional
`--hook-bridge` creates the hosted callback endpoint; it does not install or
trust hooks. Optional `--companion-command` starts the read-only Companion with
the gateway's observation socket and private token. Its process start does not
prove that the UI renderer appeared.

The launcher reports `current_desktop_task_control:false`. It creates only
ARE-owned hosted-client sessions, and neither releases the current Codex
desktop writer nor changes active host configuration. The bearer launch URL
appears in one ready record on stdout and must be treated as a secret.

## Checks observed

- Focused argument/private-state tests passed 2/2. After the live-identity
  correction, the full wrapper package suite passed 550 with 14 platform
  skips and zero failures.
  `are doctor --json` reported PASS for
  the local Node/product environment. `are closure --json` included the new
  launcher and test; these checks do not imply activation.
- A no-model installed-host startup authenticated `/api/state`, reported the
  selected gateway backend ready, and shut down without a leftover managed
  process. An optional disposable Companion process read the same gateway's
  observation as `gateway.running`, `backend.ready`, `client_link.connected`,
  and `host_task_control.unverified`; no renderer-readiness assertion was made.
- The installed-host canary with `--managed-session` passed against
  `codex-cli 0.155.0-alpha.16.4` at SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
  It used an isolated Codex home, exact discovered/trusted hashes for three
  disposable hooks, and a fixed loopback Responses provider. The hosted
  client created its own thread and completed one turn through the managed
  gateway; the prompt context reached the provider wire; one tool call was
  blocked; Stop and terminal completion were observed; the callback file was
  removed on shutdown. There were two private provider requests, zero
  external model calls, no active configuration change, and no task handover.
- The original manually composed canary still passed after the managed mode
  was added. It has the same exact-host fixture and no current-task effect.

The first clean-container UI startup exposed an inherited-environment gap:
the gateway had accepted only `Codex Desktop/` in the App Server's
self-reported user agent. Without `CODEX_INTERNAL_ORIGINATOR_OVERRIDE`, Codex
reported the authenticated client's declared name, and startup failed before
the UI could observe a backend. The verifier now binds that exact declared
name and the pinned version, while retaining the Desktop-originator path.
Focused gateway/identity tests passed 133/133. The managed installed-host
turn canary passed with the override explicitly removed; the current-source
Linux UI then passed its [separate no-model rendered check](../../../../../implementation/agent-reasoning-engine/apps/desktop-companion/docs/MANAGED-SESSION-LINUX-UI-2026-09-28.md),
including verified supervision when the disposable Companion exited. A joined
isolated run subsequently completed one managed installed-host turn and
showed its verified completion frontier in Companion Threads and its linked
Decisions row from the same gateway epoch. It made two private provider
requests and zero external model calls; this is not a read-only
current-desktop-task view.
The user agent remains a self-report, not cryptographic identity.

An earlier separate one-turn fixture with no configured trusted hooks created
the thread but `turn/start` returned `ARE preflight block`. The exact
preflight reason was not captured. That negative result is not proof that
every hookless launch is blocked or that hooks alone explain the difference;
the two fixtures must not be conflated.

## Claim ceiling and open questions

This proves bounded *new* ARE-owned client startup and one installed-host
turn when exact callback trust is configured in an isolated home. It does not
prove same-task desktop handover, non-bypassable coverage for all host effects,
Windows installed lifecycle or ACL hardening, installed Companion readiness,
real-provider behavior, long-running supervision, or power-loss recovery.
The advisory-hook tool limit in the parent work-pack remains open.

- What exact preflight reason caused the hookless fixture block?
- Can the installed Codex desktop release its current writer and route all
  task ingress through this client, or must this remain a separate ARE-owned
  conversation surface?
- Which installed-app lifecycle and permissions checks are needed before a
  launcher can be shipped rather than used as a development candidate?
