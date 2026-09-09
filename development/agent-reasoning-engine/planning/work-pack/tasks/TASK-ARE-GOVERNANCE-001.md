# TASK-ARE-GOVERNANCE-001 — governed reliability

Layer: L2. Depends on G-ARE-L1 and owner admission decisions. Status:
**revised; integrated work blocked and unselected**.

## Integration entry condition

Local content-addressed artifact bytes may remain candidate evidence, but an
artifact index cannot silently duplicate integrated command receipts, event
order, effect intents, or workflow lifecycle facts. Recovery and quarantine handles in an integrated path must map to
the ACI-owned journal authority selected by
[`G-ARE-ACI-BINDING`](../../../decisions/aci-reasoning-binding/BINDING-RECEIPT.json).
The existing `AtomicFileRecordStore` evidence is L0 source evidence only; it
proves neither ACI durability nor compatibility, and local-only use must remain
explicitly non-integrated.

## SWU-ARE-006 — semantic artifact admission and recovery

- Execution owner recommendation: `subagent`.
- Inputs: finalized semantic artifact candidate bytes/digests, selected artifact
  store contract, retention/admission owner decision, and ACI reference
  conformance manifest.
- Outputs: admitted immutable semantic artifact handle/digest,
  recovery/quarantine report, and verified read; no command receipt, event,
  journal cursor, or effect-intent state.
- Dependencies: G-ARE-L1, SWU-ARE-016/017, and artifact-admission owner decision.
- Write scope:
  `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-artifact-store/**`
  and durability fixtures.

Algorithm: canonicalize; write temp; sync bytes; atomically publish; sync parent
metadata; verify digest; on startup scan/index; quarantine partial/corrupt/
unknown-version objects; recover only complete immutable artifacts; validate
the returned ref/digest against the admitted ACI reference mapping. Do not write
ACI lifecycle state or call the effect gate before artifact durability.

Done when crash cutpoints, corruption, duplicate publish, version, recovery, and
content-address/reference tests pass without journal or canonical-acceptance
claims. Verification:
`node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-artifact-store/test/*.test.mjs`.

## SWU-ARE-007 — degraded and incident routing

- Execution owner recommendation: `subagent`.
- Inputs: typed ACI runtime/acceptance, artifact persistence, effect-delivery
  ambiguity, or late-defeat event; historical ACI/semantic records; and
  incident/compensation owner policy.
- Outputs: explicit degraded/incident/escalation state and owner handoff; never an
  automatic compensation effect.
- Dependencies: SWU-ARE-005/006/014, accepted ACI incident/event mapping, and
  BLK-ARE-INCIDENT-001 closure.
- Write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/incident-router/**` and failure fixtures.

Algorithm: classify failure; bind ACI and semantic source/historical digests;
reject blind retry for ambiguous delivery; submit incident lifecycle changes
only through the admitted ACI command boundary; select the owner route; if
compensation is approved later, require a new exact effect envelope/gate and a
new ACI command; preserve history.

Done when persistence failure, partial/ambiguous delivery, late defeat,
unresolved owner, and compensation-request fixtures pass. Verification:
`node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/incident-router/test/*.test.mjs`.

Split analysis: durability can pass without incident-policy behavior.

Handoff after L1 promotion, ACI conformance, and artifact/incident owner
decisions. Handoff context is this task, terminal L1 receipts, admitted ACI
manifest, owner records, and one selected SWU. No handoff is ready until exact
closeout synchronization is bound. Return the result shape in
[`../../EXECUTION-PACK.md`](../../EXECUTION-PACK.md).
