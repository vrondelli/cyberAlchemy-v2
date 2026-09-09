# TASK-ARE-EVALUATOR-001 — witness semantic-judgment evaluator@1

Layer: L0. Status: **selected, ready; execution authorized by the current Task Session**.

Future write scope:

- `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/**`
- `cyberAlchemy-v2/implementation/agent-reasoning-engine/fixtures/evaluator-v1/**`
- `cyberAlchemy-v2/implementation/agent-reasoning-engine/generated/runs/evaluator-v1-*/**`

Forbidden: actor runtime, mutable model/tool providers, real effects,
AntiBiasVector, authority definitions, public Arcanum.

## SWU-ARE-001

Primary behavior: deterministically reduce one frozen request to exactly one
typed outcome and bind it in a receipt.

Execution owner recommendation: `subagent`.

Inputs: versioned frame, authority snapshot, finite catalog, observations,
challenge closure, test entry decision, fixed effect-test envelope, all digests.

Outputs: applicability decision, terminal outcome, derivation, reasoning receipt,
event-order record, effect-test-double receipt. Records use canonical UTF-8 JSON
with recursively sorted object keys, explicit arrays, no insignificant
whitespace, and SHA-256 over exact bytes. A provisional injectable local store
supports atomic temp-write/sync/rename behavior and failure injection; it is L0
acceptance infrastructure, not the L2 durability implementation.

Algorithm: implement the ordered reducer in
[`../../../design/COMPONENT-CONTRACTS.md`](../../../design/COMPONENT-CONTRACTS.md):
input validation; catalog authority/time; domain match; applicability,
precedence/exceptions/conflicts; support/defeat/challenge closure; typed result.
No external calls occur inside the evaluator.

Two fixture families are authored from separately owned source records and must
pass through the same exported private evaluator entrypoint without
family-specific code.
Fixtures vary one condition at a time: supported, missing fact, defeater,
challenge timeout, irrelevant consensus, no rule, mutation, expiry, revocation,
cycle, self-judgment, entry block/defer/flag, effect-gate non-pass, repeat
delivery, and a second independently authored rule family.

Edge cases: unknown schema/version, digest mismatch, duplicate facts, conflicting
precedence, temporal boundary equality, unresolved owner, incomplete challenge,
receipt persistence failure, repeated idempotency key.

Done when all fixtures produce the required algebra, historical replay matches
byte-for-byte with zero provider/effect calls, persisted order is correct, and
only positive outcome plus exact gate pass yields one test-double attempt.

Verification:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/test/*.test.mjs
```

Split analysis: reducer stages, receipt, fixtures, replay, order recorder, and
effect test double cannot independently prove the one semantic witness; each is
acceptance instrumentation for the single reduction behavior. Full protocol,
revalidation, durability, and real effects are separable and excluded.

Handoff context: this task, `design/COMPONENT-CONTRACTS.md`,
`design/DECISION-AND-EFFECT-FLOW.md`, the three owner policy records, and only
`SWU-ARE-001`. Return the exact result shape in
[`../../EXECUTION-PACK.md`](../../EXECUTION-PACK.md); do not begin another SWU.
