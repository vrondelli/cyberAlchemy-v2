# TASK-ARE-REPLAY-001 — ACI-backed replay and revalidation

Layer: L1/L2. Status: **revised; integrated work blocked and unselected**.
Historical replay depends on admitted ACI facts and immutable semantic
artifacts. Revalidation additionally depends on current-source adapters and ACI
command acceptance.

## SWU-ARE-004 — historical replay

- Execution owner recommendation: `subagent`.
- Inputs: verified ACI command receipt, accepted event/journal cut and cursor,
  retained frame/snapshot/catalog/observations/challenge/evaluator bytes,
  finalized semantic artifact, and all expected digests/versions.
- Outputs: byte-stable replay outcome/derivation/receipt comparison or typed
  `not-replayable` report.
- Dependencies: G-ARE-L0, SWU-ARE-016, SWU-ARE-017, SWU-ARE-018, and ACI
  TASK-010 replay/canonical/crash receipts.
- Write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/replay/**` and replay fixtures only.

Algorithm: disable network/model/tool/resolver/effect and ACI write ports; verify
the ACI acceptance receipt, journal span/cursor, event order/aggregate versions,
artifact refs, and exact retained bytes; fold the accepted ACI facts into the
immutable evaluator cut; invoke the unchanged deterministic evaluator; compare
semantic outcome, derivation, and artifact bytes; emit replay report. Missing
or invalid input returns `not-replayable` and never calls revalidation.

Done when deterministic, missing fact/byte, journal gap, version, digest, and
zero-mutable-call fixtures pass against the admitted ACI vectors. Verification:
`node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/replay/test/*.test.mjs`.

## SWU-ARE-005 — current revalidation

- Execution owner recommendation: `subagent`.
- Inputs: historical semantic artifact/ACI receipt handles, current governed
  source handles, new as-of time, confirmed dispatch, and current provider
  adapters.
- Outputs: candidate new ACI command, later accepted ACI command/run refs, new
  semantic snapshots/artifact, comparison, and optional `Invalidated`;
  historical facts remain immutable.
- Dependencies: SWU-ARE-010/011/012/013/015, SWU-ARE-016/017/018,
  SWU-ARE-003 when fresh Work Bus evidence is required, ACI command acceptance,
  and incident owner policy for post-effect drift. `SWU-ARE-002` is superseded.
- Write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/revalidation/**` and drift fixtures only.

Algorithm: resolve current intent/authority/catalog/evidence and time; construct
a candidate command through SWU-ARE-017; let ACI allocate/canonicalize/accept
the new command/run; read current accepted facts through SWU-ARE-018; execute
the evaluator; compare governed digests/outcomes; mark the prior semantic result
invalidated when pinned rules require; route post-effect cases to the incident
owner without historical overwrite or automatic compensation.

Failure modes: scope expansion, expiry, revocation, catalog mutation, late
defeat, unavailable current source, unresolved incident owner.

Done when the drift matrix proves new ACI command/run identity, no historical
overwrite, typed invalidity, and explicit incident routing. Verification:
`node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/revalidation/test/*.test.mjs`.

Split rationale: immutable replay and fresh revalidation have opposite provider-
call contracts and independently reviewable acceptance.

Handoff context is this task, admitted ACI conformance manifest, retained
ACI/semantic receipts, replay/revalidation design rules, and one selected SWU.
No handoff is ready until exact closeout synchronization is bound. Return the
result shape in
[`../../EXECUTION-PACK.md`](../../EXECUTION-PACK.md).
