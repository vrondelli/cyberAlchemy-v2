# Design Distill Validation

- Target context: DomainSpec-v2 FormalClaim expressive-FOL profile extension
- Objective: preserve expressive source meaning while keeping downstream
  capability, execution, evidence, proof, and lifecycle authority separate
- Output artifact: two-contract six-view Design bundle
- Mode and budget: compact role simulation, one proposal track, one recursive round
- Verdict: pass
- Evidence emission: not configured
- Telemetry: not emitted because this run forbids telemetry mutation

## Discovery baseline

The existing architecture already has the right ontology branch and owner for
`FormalClaim`. TDE already owns its deterministic decidability map, EVF owns
solver routing, and the current SMT profile is only QF_LIA. The new pressure is
source expressiveness, not a missing general solver.

## Proposer

Use one coherent unit containing:

1. `FormalClaimSourcePayload/v1`, owned by formal-claims semantics; and
2. `FormalClaimCapabilityAssessment/v1`, owned by validation governance, with
   exact profile states and optional `ExecutableProjectionBinding/v1`.

## Balancer objections

| Category | Objection | Reconciliation |
| --- | --- | --- |
| ownership | Derived decidability or provider evidence may leak into meaning. | Separate identity, schema, owner, version, digest, currentness, and supersession. |
| totality | Unsupported claims may be mislabeled as proof-required or indeterminate. | Add explicit `unsupported`; require an admitted proof route for proof-required; reserve indeterminate for evidence defects. |
| decidability | Projection preservation may imply a general FOL equivalence checker. | Scope purpose, preservation kind/direction, domain, assumptions, and evidence; otherwise emit no projection. |
| execution | Full source FOL may silently expand TDE or SMT support. | TDE consumes only an admitted projection; current QF_LIA exclusions remain exact. |
| logic boundary | Temporal or graph-closure meanings may be smuggled into predicates. | Reject them as this FOL profile and route to separately specified temporal/closure logic. |

## Smallest coherent unit

The smallest coherent unit is the source contract plus capability-assessment
contract. The projection binding is an optional subordinate component of the
assessment, not a third independently meaningful feature.

Further splitting loses the join that prevents source expressiveness from being
mistaken for execution support. Merging loses separate ownership. Adding an
engine, provider adapter, or proof workflow would exceed Design and require Plan
evidence.

## Closure and recomposition proof

- Responsibility closes: author exact FOL meaning and assess downstream
  capability without semantic rewrite.
- Inputs close: exact source, owner, profile, policy, domain, assumptions, and digests.
- Outputs close: immutable assessment, typed `needs_formal` reasons, and optional
  evidence-scoped projection binding.
- Recomposition closes: source remains the existing `FormalClaim`; existing
  `formalizes` and `derived_from` relations remain unchanged; TDE, EVF, SMT, and
  proof routes consume only their owner-scoped contracts.
- Hidden glue: none. Every crossing is an exact versioned interface with a named owner.

## Evolution profile

Expected evolution is new source theories, new executable profiles, additional
solver providers, and separately admitted proof/temporal/closure routes. The
smallest extension boundary is a new immutable assessment/profile version;
source meaning changes only through formal-owner supersession.

## Deferred complexity

Schemas, relationship admission, projection certificates, classifier
implementation, provider adapters, proof integration, migrations, and execution
are deferred because this run has no owner admission or Plan authority.

## Premortem

Most likely failure: a future consumer reports a bounded solver or projection
result as truth of the global source claim. Guardrail: every binding repeats its
purpose, preservation kind/direction, exact bound, assumptions, evidence owner,
and claim ceiling; missing preservation evidence emits no projection.

## Frame-expiry note

Re-run Design if the selected ontology branch architecture changes, the formal
claim owner scope changes, the TDE decidability policy changes, or a canonical
temporal/closure/full-FOL execution profile is separately admitted.

## Navigation

Start with `define/SPEC.md`, then `design/SOURCE-CONTRACTS.md`, then the six views
in `design/ARCHITECTURE.md`. The local Design selection passes. The next owner
route remains successor exact-byte owner and verifier admission, not Plan or
implementation.
