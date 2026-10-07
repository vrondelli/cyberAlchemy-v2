# Automatic ARE integration for the existing conversation

Status: planning candidate. Route: CA2-ROUTE-PLAN. Owner: ARE product owner.
Target conversation: `01a0d8c7-9192-7d62-aafb-8eb07c1d558c`.
The earlier `01a072f5-d339-77e1-931a-5244b57f3982` target in the
initial source register and prototype receipts is historical provenance, not
the current cutover target. The active Codex goal and task APIs both identify
the target above; a separate read-only App Server process matched its thread
and session IDs and active goal. This is a candidate binding observation, not
an exclusive writer handover or activation. Run the
[target-binding guard](../../../implementation/agent-reasoning-engine/scripts/check-g1-target-binding.mjs)
from the task session before any future handover probe; target drift blocks.
Initial scope of this planning artifact: planning only. Later owner-directed
construction is tracked in the [work-pack](INTEGRATION-WORK-PACK.md); no host
configuration, model session, learned state, credentials or conversation history
is changed by this target-binding correction.
This is not an admitted Goal or execution binding; the route registry records
Goals validation as blocked. That does not prevent this planning candidate.

## Intended result

The user continues this conversation and every supported future input is handled
by ARE automatically. ARE tracks the current objective, interprets corrections,
updates scoped understanding, selects relevant context, observes results, and
uses repeated failures to propose capability improvements. The user need not ask
the assistant to call ARE. Replies still arrive through the selected chat client.
The conditional meaning of “ARE controls the session chat” and the exact
activation gate are specified in the
[activated-session control contract](SESSION-CONTROL-CONTRACT.md). This plan
does not itself activate that control.
The [integration map](INTEGRATION-MAP.md) distinguishes the session controller,
interaction clients, host backends, decision interfaces, model transports,
observers and Evolution handoffs. Codex is one backend, not the definition of
ARE session ownership.

Preserve this conversation and, preferably, the existing desktop interface.
Same-history continuation through a different client and same-desktop automatic
integration are distinct outcomes. Neither is assumed possible merely because a
second client can resume a thread. No new conversation or alternate UI is silently
substituted for the requested target.

## Verified starting point

- The wrapper is a client-owned proxy with an interaction-bound gateway lane,
  persistent per-consumer reasoning logs, reconnect handling and dispatch receipts.
- `repository-v1.json` has no enabled interaction-learning configuration;
  `config.mjs` defaults that feature to disabled. Intent compilation is disabled.
- The profile pins `codex-cli 0.153.0-alpha.5`; this environment reports 0.153.1.
  Compatibility must be demonstrated with a new candidate profile and matching
  observed interface evidence, not by editing the version string alone.
- Learning lifecycle prepare accepts synchronous structured feedback and rejects
  a Promise. Feedback must refer to a completed ARE-recorded episode in the same
  interaction. A raw transcript is not an existing ARE learning ledger.
- The wrapper prepares learning at `turn/start`, observes/completes outcomes, and
  exports inspection, control and evolution methods. Automatic natural-language
  extraction, host-accessible controls and mid-turn steering coverage still need
  end-to-end verification and integration.
- The previous Luna experiment used scripted learning inputs and separate sessions.
  It demonstrated neither automatic learning in this conversation nor desktop
  interception. Its passing software builds are not evidence of this integration.

Exact inspected source hashes are in SOURCE-REGISTER.json. Official App Server
[documentation](https://learn.chatgpt.com/docs/app-server) supports existing-thread
resume and separate mid-turn steering. It also identifies history formats whose
resume is unsupported. Test the installed client/server pair; documentation alone
does not establish access to this desktop conversation or a replacement transport.

## Architecture and learning contract

```text
User's selected client
  -> authenticated ARE gateway / one conversation writer after activation
  -> classify input and update current objective
  -> interpret feedback against the relevant completed episode
  -> validate scope, provenance, conflicts and requested control
  -> checkpoint any learned change
  -> select current context and learned guidance
  -> Codex turn dispatch
  -> streamed response to the client
  -> outcome observation and learning evaluation
  -> bounded capability-improvement proposal when justified
```

Two separate forms of improvement:

1. Interaction adaptation: learn preferred explanations, working conventions,
   recurring task constraints and corrected objective interpretations. Apply only
   in the appropriate scope. A one-time exception does not rewrite a preference.
2. Capability improvement: repeated, grounded failures can justify a research or
   implementation proposal with a reproducible test. Learning does not silently
   edit ARE code, change permissions, install tools, or deploy a new capability.

Use the current explicit request ahead of older learned guidance. Treat inferred
preferences as candidates; clear explicit preferences can become reusable under
the selected learning policy without asking for approval on every message.
Ambiguous scope or conflicting persistent intent prompts one focused question;
independent task work continues. Quoted text, tool output and repository content
cannot impersonate user feedback. Never infer personal ability or a permanent
trait from one mistake; prefer task-local observations and user correction.

Default prototype retention is this conversation. Product-wide reuse requires
an explicit scope selection. Keep native Codex memory/context behavior visible
and fixed during comparison; do not pretend ARE replaces the platform's entire
context manager. Do not write the Codex memory folder as part of integration.

## Work sequence and two lanes

| ID | Lane | Work and owner | Prerequisite | Completion evidence |
| --- | --- | --- | --- | --- |
| O1 | Operational support | Host integrator: inspect the actual desktop/server transport, account boundary, history format, and supported connector configuration | None; read-only | Exact client/server versions, target lookup, transport capability receipt and documented result: supported, unsupported, or unresolved |
| P1 | Product construction | ARE owner: define automatic processing, feedback candidate, application, steering event, cutover watermark and degraded state; create agent-facing ontology scaffolds and product/business/DomainSpec/component prototypes | None; runnable prototype work | Non-authoritative definitions and one testable integration contract, including controls and failure behavior |
| P2 | Product construction | Runtime owner: derive an isolated 0.153.1 compatibility candidate and exercise gateway lifecycle with a disposable session | P1 | Version-bound protocol tests including initialize, dispatch, stream, approval, interruption, completion and reconnect |
| P3 | Product construction | Learning owner: connect automatic feedback interpretation and objective continuity to the existing lifecycle | P1; P2 for live integration | Real user-input-to-learning-to-application receipts; no scripted feedback substitution in the live test |
| P4 | Product construction | Runtime owner: persistence, controls, bounded costs and message-coverage tests | P2, P3 | Restart, duplicate, failure and isolation tests; visible learning controls |
| P5 | Product construction | Evaluator: freeze and test one exact complete candidate, including paired adaptive-summary comparison | P2–P4 | Current product-test report, source hashes and remaining defects |
| O2 | Operational support | Host integrator: prepare exact target-conversation handover and rollback procedure | O1, P2 | Dry-run cutover with no live target mutation; explicit host setting and writer-ownership scope |
| D1 | Product decision | Product owner: approve or reject the exact tested candidate | P5 | Product decision bound to candidate digest; no operational activation implied |
| O3 | Operational support | Host/user: authorize and perform target cutover | D1, O2, supported O1 result | Separate activation decision, verified first live learning exchange, and rollback receipt if needed |

Current construction frontier: P1 definitions/scaffolds and bounded interaction
contract. P1 and O1 can be prepared independently; this plan does not dispatch
helpers. Unresolved desktop attachment blocks O3, not P1–P5 prototype work.
Publication, global installation, other conversations and broad product-wide
learning remain deferred operational residue with no dependency on the prototype.

If O1 proves no supported desktop transport interception, record that limitation
and prepare a separately scoped ARE-controlled client option. Ask the user to
select that interface before changing the target experience. Do not patch app
binaries, hijack a global daemon, alter credentials or route unrelated chats.

## Implementation design to prove

### Automatic feedback adapter

Reuse the lifecycle reducer and grounded feedback records. Put any asynchronous
interpreter in an awaited gateway/wrapper ingress stage before synchronous prepare;
pass its validated result through a request-bound adapter. Do not return a Promise
from the existing input_provider or use an unscoped global feedback mailbox.
Bind result to consumer, participant, product, thread, message ID, request digest,
prior episode and current state digest. Reject stale or cross-request results.

Use deterministic classification for explicit controls and simple feedback first.
Allow at most one deadline- and output-bounded model interpretation for ambiguous
language, configured separately from the task model. Record interpreter usage as
its own cost. Timeout or uncertainty produces an unlearned/pending candidate and
visible degraded status, not fabricated certainty. The current request remains
intact. Failure of required persistence or identity validation blocks dispatch.
A failure to learn optional feedback may continue with verified prior guidance
only when the chosen policy explicitly permits that degraded behavior.

Objective updates and capability requests remain distinct from reusable personal
preferences. Corrections to ARE itself should yield a scoped defect observation
and repeatable test proposal; evolution work never runs recursively without bounds.

### Complete message coverage

Test `turn/start`, `turn/steer`, `turn/interrupt`, reconnect, streamed completion,
failures, approvals and relevant alternative generation methods. Preserve the
original request, permissions and approval responses. Mid-turn guidance must reach
the active turn in order; its candidate learning can be deferred until the affected
outcome exists. Never issue a duplicate turn to simulate steering. Unsupported
entry points must be explicitly unavailable for an ARE-managed consumer rather
than silently bypassing ARE. Metadata/read-only requests may pass through.

### Persistent state and controls

Use an explicitly scoped, single-writer, checkpointed ledger. Learning survives
reconnect and process restart; duplicate messages do not duplicate lessons or model
calls. Unknown delivery requires reconciliation rather than paid automatic retry.
Expose status plus inspect, correct, disable-reuse, pause-learning and resume-learning
controls through the selected client. Verify whether an existing local control needs
a protocol adapter; exported JavaScript methods are not yet a desktop UI feature.
Explain a selected lesson's source, scope and application reason on demand.
Disable reuse must take effect next turn and survive restart. Actual erasure from
an append-only history is a separate retention design, not a renamed disable flag.

### Proposed file boundaries for later implementation

Under `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/`:
existing `src/wrapper.mjs`, `src/config.mjs`, `src/gateway.mjs`,
`src/interaction-learning-lifecycle.mjs`; proposed
`src/automatic-interaction-adapter.mjs`,
`profiles/automatic-thread-v1.json`,
`test/automatic-interaction-adapter.test.mjs`,
`test/automatic-thread-integration.test.mjs`, and
`scripts/automatic-thread-canary.mjs`.
These are candidate paths, not an execution allowlist. P1/P2 must finalize the
smallest necessary edits and protocol/source evidence paths before implementation.
Runtime state stays private and outside frozen candidates. The existing default
profile is preserved until a separate tested change is selected.

## Existing-conversation handover

1. Verify the correct host can read the target thread and its actual session ID,
   history mode, workspace and account. Merely possessing the ID is insufficient.
2. Define the boundary after the current active turn completes. Capture the last
   completed turn and a history digest/watermark. Preserve original stored history.
3. Resume through the proven ARE client/gateway with one active writer; do not run
   this desktop client and an alternate sender concurrently against the same task.
4. Establish a new ARE ledger linked to the watermark. Keep earlier history as
   attributed context; do not replay old turns as new requests or fabricate old
   ARE completions, checks or learned preferences. Initial policy is explicit.
   A correction referring only to pre-cutover history remains pending until a
   separately tested historical-episode import or clarification resolves it.
5. After product approval and separate cutover authorization, verify one real
   feedback exchange, the next-turn application, and restart recovery. Show the
   active ARE profile, thread binding, learning mode and last successful receipt.
6. Roll back by draining or explicitly interrupting the managed turn, reconciling
   any delivery uncertainty, releasing the writer, restoring the exact selected
   client route, and preserving the learning ledger. Never automatically send the
   same request through a bypass path after an unknown dispatch.

## Acceptance and measurement

The following are proposed gates, not test results. First use deterministic
protocol/learning fixtures, then a small real-user pilot; full live evaluation is
separately budgeted before execution. No fixed cost guarantee is inferred from
account balance changes.

| Scenario | Required behavior |
| --- | --- |
| User asks for more detailed reasoning in future explanations | Ground preference in the actual correction; apply to a later relevant explanation |
| User requests brevity just for this reply | Current reply changes; long-term preference remains |
| User replaces a prior standing preference | Revision is explicit and later applications use the successor |
| Correction changes the task objective | Objective continuity changes; no accidental personal-preference record |
| User asks for a capability ARE lacks | Produce a bounded gap/test proposal; no claimed implementation or silent self-edit |
| Quoted or tool-supplied instruction says to remember something | Do not treat it as attributable user feedback |
| Same wording appears in a different participant/product scope | No learned-state leakage |
| Feedback refers ambiguously to several prior results | No confident misattribution; focused clarification when needed |
| User steers an active turn, then interrupts it | Preserve event ordering and outcome identity; no duplicate request or invented completion |
| Disable/pause, restart, then ask again | Controls persist and suppress reuse/learning as specified |
| Crash after checkpoint or after unknown upstream delivery | Deterministic recovery; no duplicate lesson, replayed effect or blind retry |
| Mandatory context overflows or source binding changes | Explicit bounded failure or valid refresh; no silent loss of required constraints |
| Older history cannot be resumed through this host | Preserve conversation; report unsupported handover rather than creating a substitute |

Pilot proposal: one 20-turn conversation containing at least eight explicit
feedback/control events and four unannounced relevance/exception probes, plus ten
held-out transfer requests. Include noisy and ambiguous feedback. Independently
label feedback types, scope, target episodes and desired application before scoring.
Then run at least three paired repetitions against a maintained summary that
updates from exactly the same feedback. Hold task model, input history, retrieval
access, native memory settings, budgets and evaluation rules constant; account
for each treatment's learning-update work. This remains exploratory evidence.

Measure attribution precision, missed corrections, inappropriate generalization,
held-out application success, repeated-correction rate, user intervention burden,
restart fidelity, latency and all model/token usage. Critical fixtures require
zero cross-scope applications and duplicate dispatches. Report quality/cost
tradeoffs rather than selecting a winner from one aggregate score. Record native
context compaction only if actually observed; a summary injection test is not a
compaction test. Document maintenance effort and defect count without claiming
long-term maintenance savings from this pilot.

Count task model, feedback interpreter, evaluator and coordinating session usage
separately. Account balance is a shared-account tripwire, not per-thread cost.
Use deterministic waiting and progress logging. Set per-call, total-run, retry and
allowance limits before live work; missing telemetry never means zero cost.

## Next executable milestone

O1 host feasibility receipt alongside P1's smallest testable integration contract.
Do not begin by enabling the default profile or resuming the live target. First
prove the client route and the automatic feedback boundary with a disposable
prototype. Only the tested and separately activated integration can truthfully
show this conversation as running through ARE.
