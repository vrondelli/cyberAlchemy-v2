---
module: architecture-pattern-enforcement
feature_code: APE
status: candidate-plan-ready
updatedAt: 2026-08-04
docType: implementation-layering
---

# Implementation Layering: Ontology-Guided APE

## Boundary rule

Each layer answers: “After this layer, what do we know that we did not know
before?” Layers preserve earlier guarantees and add one bounded evidence theme.

## Layer decisions

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence | Promotion decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 — Enum ontology closure | After this layer, do we know whether active `DS-D1.3` can be represented as a portable implementation contract without changing canonical meaning? | canonical-bound `EnumImplementation`, typed properties/operators, profiles, provenance/conflict rules, and causal scenario contract | candidate ontology/profile/contracts only | real source adapters, parity, CI, next type | ontology validation; exact discriminator fixtures; `authority_effect: none`; scenario joins total | proceed to TypeScript only if profile owner closes representation and required properties are observable |
| L1 — TypeScript trust | After this layer, do we know whether Enum properties are extractable from real TypeScript and useful for exact-cause enforcement? | one admitted TypeScript Enum representation, real-source projection, positive/negative/unsupported fixtures, one deterministic proof/replay | TypeScript adapter and trust gate | Python, Rust, all other types, project-wide CI | raw AST/native evidence; exact findings; killed mutants; frozen observation digest | freeze shared contract or return to L0; never patch it from later lanes |
| L2 — language parity and proof integration | After this layer, do we know whether the frozen portable contract survives independent Python and Rust realizations and BTE-compatible proof mechanics? | joined Python/Rust lane receipts plus exact obligation parity and bounded Enum closeout | Python, Rust, parity, runtime N/A decision, deterministic closeout | repository-wide adoption, behavioral runtime types | all lanes joined; unsupported total; same obligation IDs; raw evidence reachable; replay deterministic | issue `Enum complete-witnessed` only for selected profiles or remain blocked |
| L3 — repeatable expansion | After this layer, do we know whether the proven cycle can select and prepare the next active type without bespoke all-at-once planning? | exact active-13 coverage projection, evidence-burden ranking, one next-type instance packet, CI aggregation of completed receipts only | coverage generation, next-type recommendation, lifecycle instantiation, bounded CI integration | blanket all-type completion, release, deployment, cross-project mint | no hard-coded counts; one recommended next type; incomplete types visibly red/unsupported | ask owner to select the next type; do not activate automatically |

## Value/cost boundary

- L0 reduces semantic and authority risk before language/tool cost.
- L1 spends implementation cost on one trust-building lane before parallelism.
- L2 pays cross-language coordination only after the shared contract is stable.
- L3 adds scaling mechanisms only after one type has a complete bounded proof.

## Non-regression

- Current DS-D1/DS-D8 validators and existing APE node/edge evidence remain
  valid within their original claim ceilings.
- BTE L0A evidence remains immutable; APE cannot relabel it as Enum proof.
- Later language lanes cannot alter the L1-frozen observation contract.
- Unsupported required observations never become skip, N/A, or pass.
- Runtime claims remain separate from source and static-type claims.
- No layer may promote ontology, profiles, exceptions, releases, or deployment.

## Recommended next layer

L0. The nearest candidate is `SWU-APE-ONT-001`; no SWU is selected. The major
deferred scope is every real source adapter and all non-Enum meta-types.
