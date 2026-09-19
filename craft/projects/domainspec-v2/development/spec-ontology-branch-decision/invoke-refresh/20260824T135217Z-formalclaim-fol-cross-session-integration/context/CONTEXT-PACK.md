# Strict Context Pack — FormalClaim/FOL Cross-session Refresh

## Identity

- Mode: Context Builder `standard`, strict runtime handoff
- Sources: 14 exact files
- Obligation coverage: 12 of 12 covered or explicitly resolved
- Evidence status: run-local, non-authority

## Objective

Integrate only the evidence-backed residue of the pasted response into a fresh
`dsv2-formalclaim-fol-profile-extension@2` successor. Preserve @1 and frozen @4,
separate authored meaning from capability and evidence, and describe future
integration honestly without implementing it.

## Evidence Synthesis

1. @1 already separates expressive source FOL from the immutable capability
   assessment and makes projection preservation purpose-, direction-, domain-,
   assumption-, and evidence-scoped.
2. The ontology candidate owns `FormalClaim` in the formal-claims/specification
   branch. It authors `FormalClaim --formalizes--> BusinessMeaning`; validation
   governance authors `ProofObligation --derived_from--> FormalClaim`.
3. EVF currently owns an evidence-chain architecture and bounded L0/L1 plus one
   selected L2 reachability result. Semantic and theorem lanes are extension
   directions, not general implemented capability.
4. The Z3 5.0.0 runtime and QF_LIA profile are admitted candidate-locally for
   bounded process/profile evidence. The admission grants no query result or
   release state.
5. The current graph provider receipt schema admits only `datalog` and `alloy`.
   An SMT receipt family and end-to-end EVF SMT handle are absent.
6. The EVF-to-factory adapter is a candidate owner-gated design and explicitly
   absent. It supplies a useful identity/currentness/ceiling pattern, not an
   implemented seam.
7. DS-SFOL presently designs `body.logic` on a canonical behavioral node and a
   lossless node-logic envelope, while also stating that canonical files and the
   node adapter are absent. A future single-authority migration is therefore
   required before both that field and FormalClaim can coexist safely.

## Resolutions

- `FormalClaim` is canonical for the exact formal statement and a selected
  logic-semantics profile. The profile may be FOL, temporal, fixed-point, or a
  future separately governed family; the current extension specifies one
  standard many-sorted FOL-with-equality profile, not all logic.
- `executable_profile` belongs only to the validation-owned capability
  assessment. It is rejected from the authored source payload.
- The canonical relation chain is direction-correct:
  `ProofObligation --derived_from--> FormalClaim --formalizes--> BusinessMeaning`.
- Future DS-SFOL input is a digest-bound projection of one FormalClaim source.
  `body.logic` must cease being an independent semantic authority when that
  migration is eventually admitted. No current DS-SFOL bytes change here.
- EVF is the evidence coordinator, the adapter maps exact identities, the
  factory owns execution/replay/currentness, a provider owns solver semantics,
  and the EVF evidence handle owns only a bounded consumer-facing result.
- The theorem-provider lane stays distinct from SMT, TDE, and bounded model
  evidence.

## Fixed Boundaries

- Exact successor apply scope: thirteen create-only paths under `successor/`.
- No @1, @4, EVF, adapter, DS-SFOL, TDE, product, Craft, Inventory, Arcanum,
  telemetry, Git, admission, provider registration, implementation, migration,
  execution, proof/discharge, promotion, publication, release, or deployment
  mutation.
- All planned witnesses remain unimplemented and unexecuted.
- A local Refresh and Design pass does not open the domain gate.

## Validation Surface

- Inventory lookup readiness
- exact context source rehash
- claim matrix and RefreshSignal coverage
- exact approval/material/target-inventory set equality
- staged material-package validator and file-bound handoff resolver
- staged validation before apply and post-apply byte equality
- fresh Design extractor and two independent selection executions
- schema/meta-digest checks, JSON parse, Markdown whitespace, regular-file and
  no-symlink checks, exact allowlist, source preservation, witness and claim
  ceilings

## Fallback

No fallback search was required. Any later uncovered obligation must search only
inside a listed source directory and record the extra source, selector, and
reason before use.
