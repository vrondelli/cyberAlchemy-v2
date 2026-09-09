# TASK-ARE-GOVERNANCE-001 — governed reliability

Layer: L2. Depends on G-ARE-L1 and owner admission decisions. Status: planned.

## Integration entry condition

Local content-addressed artifact bytes may remain candidate evidence, but an
artifact index cannot silently duplicate integrated command receipts, event
order, effect intents, or workflow lifecycle facts. Recovery and quarantine handles in an integrated path must map to
the ACI-owned journal authority selected by
[`G-ARE-ACI-BINDING`](../../../decisions/aci-reasoning-binding/BINDING-RECEIPT.json).
The existing `AtomicFileRecordStore` evidence is L0 source evidence only; it
proves neither ACI durability nor compatibility, and local-only use must remain
explicitly non-integrated.

## SWU-ARE-006 — local durability and recovery

- Execution owner recommendation: `subagent`.
- Inputs: versioned local candidate records, canonical bytes/digests, selected
  store contract, retention/admission owner decision.
- Outputs: durable object handles, recovery/quarantine report, verified read.
- Dependencies: G-ARE-L1 and artifact-admission owner decision.
- Write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/local-artifact-store/**` and durability fixtures.

Algorithm: canonicalize; write temp; sync bytes; atomically publish; sync parent
metadata; verify digest; on startup scan/index; quarantine partial/corrupt/
unknown-version objects; recover only complete immutable records. Do not call the
effect gate before receipt durability.

Done when crash cutpoints, corruption, duplicate publish, version, recovery, and
content-address tests pass without canonical-admission claims. Verification:
`node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/local-artifact-store/test/*.test.mjs`.

## SWU-ARE-007 — degraded and incident routing

- Execution owner recommendation: `subagent`.
- Inputs: typed runtime/persistence/effect ambiguity or late-defeat event,
  historical records, incident/compensation owner policy.
- Outputs: explicit degraded/incident/escalation state and owner handoff; never an
  automatic compensation effect.
- Dependencies: SWU-ARE-005/006/014 and BLK-ARE-INCIDENT-001 closure.
- Write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/incident-router/**` and failure fixtures.

Algorithm: classify failure; bind source/historical digests; reject blind retry
for ambiguous delivery; persist incident; select owner route; if compensation is
approved later, require a new exact effect envelope/gate; preserve history.

Done when persistence failure, partial/ambiguous delivery, late defeat,
unresolved owner, and compensation-request fixtures pass. Verification:
`node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/incident-router/test/*.test.mjs`.

Split analysis: durability can pass without incident-policy behavior.

Handoff after L1 promotion and artifact/incident
owner decisions. Handoff context is this task, terminal L1 receipts, owner
records, and one selected SWU. Return the result shape in
[`../../EXECUTION-PACK.md`](../../EXECUTION-PACK.md).
