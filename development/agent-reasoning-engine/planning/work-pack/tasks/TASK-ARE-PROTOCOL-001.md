# TASK-ARE-PROTOCOL-001 — ACI-subordinate publication/observation protocol

Layer: L1. Depends on G-ARE-L0 and ACI conformance. Status: **revised;
integrated work blocked and unselected**.

Future write scope is limited to private pure mapping code and fixtures. The
task cannot implement an integrated command/event journal.

## Integration entry condition

`G-ARE-ACI-BINDING` selected the ACI-subordinate target. Integrated command
acceptance, events, journal order, join/close state, canonical receipts, replay
cursors, and effect intents are ACI facts. This task consumes verified facts by
reference; it does not persist them locally as a competing lifecycle.

Work Bus and APT mappings remain optional candidate interfaces. SWU-ARE-003
must not import their draft schemas as authority or claim integration from
shape similarity. Bus acceptance remains distinct from evaluator admission.
APT is not used by this task.

## SWU-ARE-002 — superseded local integrated journal draft

Status: **superseded; never selectable**.

The prior draft would have persisted a local `RuntimeJournal` for integrated
actor commands/events. Option A assigns that lifecycle to ACI. The behavior is
not renamed or silently repurposed:

- outbound semantic-reference mapping is `SWU-ARE-017`;
- inbound actor-event read projection is `SWU-ARE-018`;
- ACI journal implementation/evidence remains with the external ACI work-pack.

Verification: plan/Dispatch validation must find no selectable local integrated
journal SWU or write scope.

## SWU-ARE-003 — Work Bus publication to proposed observation mapping

- Execution owner recommendation: `subagent`.
- Inputs: admitted Bus conformance profile, ACI-verified publication candidate/
  submission/receipt refs, issuer/source/transform/time metadata, frozen
  manifest, and challenge policy.
- Outputs: versioned proposed observation/challenge handles for the
  evaluator-owned admitter; no admission, applicability, outcome, or release.
- Dependencies: SWU-ARE-016, SWU-ARE-018, SWU-ARE-011, and an explicit
  post-remediation Bus `PASS`.
- Write scope:
  `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/work-bus-observation-mapper/**`
  and mapping fixtures only.

Algorithm: verify the owner-receipted Bus/ACI mapping profile; select accepted
publication facts; preserve candidate/submission/receipt, generation, source,
transform, and temporal refs; group duplicates without voting; attach
required-lane and challenge-closure posture; reject malformed or unreleased
facts; hand immutable proposed handles to the evaluator boundary. Never convert
`candidate.persisted` or `submission.accepted` into semantic admission.

Failure modes: Bus owner receipt absent/stale, candidate without verified
receipt, forged/mismatched receipt, stale generation, release too early,
malformed provenance, disagreement, duplicate claim, required-lane timeout,
schema-valid unsupported prose, or late challenge.

Done when the Bus happy/negative fixtures pass, every transport output remains
`proposed`, and evaluator-owned admission—not Bus acceptance or transport—
returns admitted/rejected/unresolved posture.

Verification:
`node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/work-bus-observation-mapper/test/*.test.mjs`.

Split analysis: Bus publication mapping is optional and independently
reviewable. ACI actor-event projection and evaluator admission have different
owners and acceptance boundaries.

Handoff context: this task, accepted binding architecture, admitted conformance
manifest, Bus `PASS`, SWU-ARE-018 receipt, and only SWU-ARE-003. No handoff is
ready until exact Task Session closeout synchronization is bound. Return the
result shape in [`../../EXECUTION-PACK.md`](../../EXECUTION-PACK.md).
