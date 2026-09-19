# W2 — Pure and decision behavior

## Status

- Shared architecture accepted as
  `W2-A-DESCRIPTOR-BOUND-NATIVE-BEHAVIORS`.
- Calculation accepted as `W2-CALCULATION-A-BOUND-PURE-VALUE`.
- Rule accepted as `W2-RULE-A-BOUND-BOOLEAN-GUARD`.
- Query accepted as `W2-QUERY-A-BOUND-FULLY-OBSERVED-READ-ONLY`.
- Policy accepted as `W2-POLICY-A-BOUND-EFFECT-FREE-STRATEGY`; the
  declared-read-only Policy exception was not selected.
- All four cards are `tension-reviewed`. Their architecture forms are
  owner-decided, but language forms remain proposed.
- No W2 type is implementation-ready.

## Shared functional architecture

Each W2 realization binds an immutable, content-addressed descriptor to one
language-native callable through `domainspec.behavior-bound-callable/v1`.
Descriptors carry exact concept, input/output, return, effect, dependency,
failure, result-consumption, composition/export, provider, and digest facts.
Folders, export counts, arrow syntax, and return syntax may enforce style but
cannot establish behavioral meaning.

Composition accepts current descriptor-bound contributors of the same
meta-type, targets a pre-existing output concept, and records acyclic
implementation provenance. Independent channel adapters and complete result
consumption observe effect claims. Missing observation support is
indeterminate or unsupported, never proof.

## Calculation

- Exact decision:
  [`../decisions/W2-CALCULATION-001.json`](../decisions/W2-CALCULATION-001.json).
- A Calculation is a deterministic pure value function over explicit inputs.
- Ambient clock, random, global reads, writes, nondeterminism, boolean-return
  impersonation, stale descriptors, and structural-only evidence must fail.
- TypeScript targets a provider-bound arrow, Python a provider-bound function
  or frozen wrapper, and Rust a bound function item, closure, or typed provider.

## Rule

- Exact decision:
  [`../decisions/W2-RULE-001.json`](../decisions/W2-RULE-001.json).
- A Rule returns a boolean, resolves the exact `architecture.guards` target,
  witnesses allow and deny, and performs none of the guarded behavior.
- Always-one-sided guards, foreign targets, performed actions, Policy-like
  strategy returns, and self-issued zero-effect evidence must fail.

## Query

- Exact decision:
  [`../decisions/W2-QUERY-001.json`](../decisions/W2-QUERY-001.json).
- A Query reads only declared targets, returns the declared shape, and performs
  no write.
- Observation remains active through complete result consumption so
  write-then-restore and lazy deferred effects cannot hide behind snapshots.
- Unsupported dynamic or generated source and missing effect channels do not
  close a read-only claim.

## Policy

- Exact decision:
  [`../decisions/W2-POLICY-001.json`](../decisions/W2-POLICY-001.json).
- A Policy is an effect-free pure selector over explicit input facts. It
  returns exactly one identity from a current non-empty content-addressed
  strategy set.
- It is not a boolean Rule, does not read ambient state, and does not execute
  the selected strategy. Selection and membership do not prove execution.
- Edge cases remain explicit inputs and may select strategies such as reject,
  hold, or manual review without granting the Policy read-side effects.

W2 exits with its behavioral architecture and proof targets selected. Candidate
ontology properties, the Policy strategy types/relation, exact language-profile
protocols, providers, descriptors, kits, and executable proofs remain future
materialization work. The implementation queue remains empty.
