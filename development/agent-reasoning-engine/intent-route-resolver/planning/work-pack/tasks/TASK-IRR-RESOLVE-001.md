# TASK-IRR-RESOLVE-001 — Route resolution

## Objective and mapping

- Slice: S-IRR-02
- Layer/wave: L0 / W2
- Goal: produce the exhaustive advisory disposition algebra from admitted
  inputs.

## Source contracts

- `../../../define/SPEC.md#deterministic-resolution-rules`
- `../../../design/ARCHITECTURE.md#view-5--decision-flow`
- `../../../design/COMPONENT-CONTRACTS.md#predicate-contract`
- `../../../design/STATE-EVENT.md`

## SWU-IRR-003 — eligibility and dominance

- Primary behavior: classify every route as eligible, conditional, or rejected,
  then reduce eligible routes only by explicit dominance.
- Independent boundary: complete trace and reduced set can be asserted before a
  terminal disposition is assembled.
- Split analysis: predicate evaluation and dominance were considered; dominance
  has no independently meaningful input before the eligible set exists, so the
  relation stays one SWU.
- Dependencies: SWU-IRR-002 owner receipt.
- Write scope:
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/src/eligibility.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/eligibility.test.mjs`
  - package `index.mjs` export block
- Algorithm:
  1. traverse routes by stable ID;
  2. evaluate exclusions first using finite typed operators;
  3. evaluate required predicates and collect unresolved material keys;
  4. mark route `rejected`, `conditional`, or `eligible`;
  5. build eligible subgraph and remove only nodes dominated by another
     eligible node;
  6. return complete sorted trace, conditional set, and non-dominated set.
- Edge cases: exclusion and requirement both match; unresolved exclusion;
  empty predicate list; transitive dominance; dominance from rejected route;
  catalog permutation.
- Done when: precedence, conditionality, dominance, completeness, and order
  invariance fixtures pass.
- Validation:
  `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/eligibility.test.mjs`
- Execution owner: local-fallback.

## SWU-IRR-004 — disposition and clarification

- Primary behavior: assemble one canonical `RouteDisposition@1`.
- Independent boundary: the returned bytes can be accepted without the witness
  materializer.
- Split analysis: classification and clarification were considered; ambiguity
  without its required one-question payload is not an acceptable terminal
  result, so they remain together.
- Dependencies: SWU-IRR-003 owner receipt.
- Write scope:
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/src/resolve.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/resolve.test.mjs`
  - package `index.mjs` export block
- Algorithm:
  1. call request and catalog admission;
  2. return `invalid` immediately for either invalid subject;
  3. consume the complete eligibility trace;
  4. return ambiguity for outcome-sensitive unresolved keys before counting
     eligible routes;
  5. classify zero/one/many non-dominated routes;
  6. derive one clarification from the smallest sorted differentiating key set;
  7. assemble canonical envelope with authority effect, traces, and digest.
- Edge cases: invalid request plus invalid catalog precedence; conditional plus
  one eligible route; multiple routes with no single discriminator; no match;
  route permutation; evidence removal.
- Done when: all four result kinds, one-question invariant, monotonic
  uncertainty, digest verification, and permutation invariance pass.
- Validation:
  `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/resolve.test.mjs`
- Execution owner: local-fallback.

## Synchronization and completion

Each SWU closes independently. Task completion requires both owner receipts and
the unchanged `authority_effect: none` boundary.

Open questions are owned in
[../../../OPEN-QUESTIONS.md](../../../OPEN-QUESTIONS.md).
