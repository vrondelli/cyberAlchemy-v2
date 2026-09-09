# TASK-ARE-PACKAGING-001 — private ACI-subordinate packaging and rollout

Layer: L3. Status: deferred until G-ARE-L2.

## SWU-ARE-008 — versioned private ACI-subordinate adapter interface

- Execution owner recommendation: `subagent`.
- Inputs: terminal L2 package APIs/receipts, admitted ACI conformance manifest,
  exact ACI runtime contract/receipts, and private interface decision.
- Outputs: versioned private library/CLI/API adapter and bounded ACI conformance
  receipt; it does not own ACI acceptance or journal state.
- Dependencies: G-ARE-L2, G-ARE-ACI-CONFORMANCE, and
  BLK-ARE-ROLLOUT-001 interface scope.
- Write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/interfaces/private/**`.

Algorithm: map versioned private request to candidate ACI commands through the
admitted binding contract; receive accepted ACI facts/receipts through read
adapters; preserve typed semantic outcomes, artifact digests, full gate records,
and non-authority metadata; reject unknown versions, missing authorization,
owner receipt drift, and envelope mismatch; expose no direct journal writer or
real effect port.

Done when cross-repository conformance, sole-writer, invalid-version,
authorization, privacy, replay, and zero-effect contract tests pass.
Verification: `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/interfaces/private/test/*.test.mjs`.

## SWU-ARE-009 — operational readiness

- Execution owner recommendation: `subagent`; rollout itself remains a separate
  `manual` owner gate.
- Inputs: versioned private interface, expected load/failure/security envelope,
  observability and rollback policy.
- Outputs: load/security/privacy results, runbooks, staged rollout proposal, and
  owner decision.
- Dependencies: SWU-ARE-008 and BLK-ARE-ROLLOUT-001.
- Write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/operations/**`.

Algorithm: run bounded load matrix; inject allowed failures; verify resource and
privacy ceilings; check trace/redaction; rehearse rollback; stage canary; require
manual owner verdict. No test count or throughput admits a broader capability.

Done when load, failure, secret/privacy, observability, rollback, and owner-gate
evidence passes. Verification commands are pinned with the future deployment
profile before this SWU is selected; minimum command:
`node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/operations/test/*.test.mjs`.

Future write scope is selected only after L2 and current ACI conformance. Public
Arcanum, general engine promotion, ACI runtime lifecycle, and real effect
enablement are separate owner routes.

Split rationale: a versioned compatibility contract and operational rollout
evidence have independently reviewable acceptance and may not be bundled.
Handoff context is this task, terminal L2 and ACI conformance receipts, private
rollout decision, and one selected SWU. No handoff is ready until exact closeout
synchronization is bound. Return the result shape in
[`../../EXECUTION-PACK.md`](../../EXECUTION-PACK.md).
