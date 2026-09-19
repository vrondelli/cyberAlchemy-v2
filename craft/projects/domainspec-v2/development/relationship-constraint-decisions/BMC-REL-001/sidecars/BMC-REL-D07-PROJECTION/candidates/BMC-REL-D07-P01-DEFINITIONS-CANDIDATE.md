# BMC-REL-D07 P01 Membership-Kind Vocabulary Candidate

Status: `candidate-pending-owner-selection`

Authority effect: `none`

Decision effect: `none`

## D07 selection binding

- Selected option: `BMC-REL-D07-C-ONE-DIRECT-MEMBERSHIP-PER-GOVERNED-KIND`.
- Decision owner: `user`.
- Decision source: exact `C` response in the active conversation.
- Decision timestamp: `2026-08-23T16:17:11+01:00`.
- D07 candidate SHA-256: `18ed4c699c53924bb054050a741efa857c1fe8b256d21868748d0387e402cbda`.
- D07 request raw SHA-256: `fa90d189baca57ac6cc6d8e6c8b983b6da68fe210eefdb21d62aa4ff5b8fc1b8`.
- D07 canonical request digest: `b74624d515c7052eb5b5bcc56a2f783b182eac28a424db64636c0152a337c7c7`.
- D07 receipt raw SHA-256: `94bac73b0d7746d5c5d2e8651b80bce1cd83fb6a686ae848d279c857ee2e83b0`.
- Pre-selection parent record SHA-256: `44aed4cd2db88f094a02d6cce267f320360df68967ada3c130e1dafc9b29a307`.

## Selected D07 boundary

```text
Let K_admitted be the membership kinds admitted by a later Definitions Governance decision.
Let belongs_to_k(e, p) classify a direct canonical belongs-to fact under k without deciding representation.

For every Entity e, kind k in K_admitted, and parent Entities p1 and p2:
  belongs_to_k(e, p1) and belongs_to_k(e, p2) implies p1 = p2.

No existence condition follows. Different parents in distinct admitted kinds are permitted but not required.
```

The words membership, classification, and home assignment remain illustrative prose only. D07 did not admit them as IDs.

## P01 consequential question

Which governed vocabulary model should make `K_admitted` finite, stably referenceable, and fail-closed, while keeping every membership-kind label and meaning subject to exact Definitions Governance owner acceptance?

P01 selects only a vocabulary governance model. The selected model still requires a separately validated definitions package containing the exact IDs, meanings, three colocated voices, registry digest, index synchronization, and drift checks before any ID is active.

## Strict boundary

- No option in this candidate admits a membership-kind ID or meaning.
- `membership`, `classification`, and `home-assignment` are not candidate tokens.
- The ownership-dimension registry is independent and cannot be reused or generalized into membership kinds.
- Unknown, free-text, aliased, ambiguous, or inactive references fail closed under either action option.
- P01 does not select typed packet representation, per-fact storage, numeric bounds, mandatory membership, self/cycle/transitive/closure/duplicates/inverse/runtime behavior, or implementation.
- P02 must not be materialized or prefiltered before exact P01 selection and a validated three-voice definitions package exist.

## Caller-supplied structural assessment

<a id="bmc-rel-d07-p01-a-fixed-closed-enumeration"></a>
### `BMC-REL-D07-P01-A-FIXED-CLOSED-ENUMERATION` — Fixed closed enumeration

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `definitions-governance:owner-decision`
- Evidence: D07 requires a finite admitted set; Definitions Governance requires stable IDs and three colocated voices; DS-D8 keeps relationship meaning canonical.
- Rejection reasons: none at structural prefilter.
- Benefit: smallest lifecycle and simplest equality/reference validation once the exact enum is accepted.
- Risk: every addition, revision, deprecation, or removal requires replacement of the complete enumeration through a fresh owner decision; evolution and migration are coarse.
- Downstream effect if selected: prepare one exact closed ID set and three-voice definitions package for owner acceptance. P02 remains blocked until that package is accepted.

<a id="bmc-rel-d07-p01-b-governed-extensible-registry"></a>
### `BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY` — Governed extensible registry

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `definitions-governance:owner-decision`
- Evidence: D07 requires a finite admitted set but does not claim it is eternally closed; Definitions Governance supplies owner-controlled stable-ID evolution and drift checks.
- Rejection reasons: none at structural prefilter.
- Benefit: keeps the active set finite and digest-bound while supporting explicit owner-gated add, revise, deprecate, and remove operations.
- Risk: adds registry lifecycle, version/digest binding, deprecation, migration, and drift-audit obligations.
- Downstream effect if selected: prepare a registry contract and exact initial ID definitions for owner acceptance. P02 remains blocked until those canonical bytes are accepted.

<a id="bmc-rel-d07-p01-c-defer"></a>
### `BMC-REL-D07-P01-C-DEFER` — Defer membership-kind vocabulary

- Option kind: `defer`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: D07 explicitly leaves membership kinds to later Definitions Governance.
- Rejection reasons: none at structural prefilter.
- Benefit: avoids premature labels and lifecycle policy.
- Risk: D07 cannot be projected or enforced and P02 remains blocked.
- Downstream effect: preserve all current canonical and packet bytes unchanged.

<a id="bmc-rel-d07-p01-d-stop"></a>
### `BMC-REL-D07-P01-D-STOP` — Stop the D07 projection route

- Option kind: `stop`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: Decision Gate preserves stop as an explicit route outcome.
- Rejection reasons: none at structural prefilter.
- Benefit: terminates projection work without semantic mutation.
- Risk: the selected D07 policy remains decision-record-only and unenforceable.
- Downstream effect: end this sidecar without P01 or P02 selection.

## Rejected constructions

- `BMC-REL-D07-P01-E-FREE-TEXT-OR-ALIASED-KINDS`: free text and implicit aliases are neither finite nor fail-closed.
- `BMC-REL-D07-P01-F-PROSE-DERIVED-KIND-TOKENS`: D07 expressly forbids turning membership, classification, and home assignment into tokens by inference.
- `BMC-REL-D07-P01-G-REUSE-OWNERSHIP-DIMENSION-REGISTRY`: membership and ownership are independent canonical semantics; registry reuse would collapse their authority surfaces.
- `BMC-REL-D07-P01-H-UNKNOWN-OTHER-CATCHALL`: silently mapping unknown meanings to `other` hides ambiguity instead of failing closed.

## Definitions package required after an action selection

An exact post-selection package must contain, together:

- a stable DomainSpec v2 definition ID chosen through Definitions Governance;
- a formal voice defining the finite active-ID set, exact-reference rule, fail-closed behavior, and owner-controlled evolution law;
- a plain-language voice that does not widen the formal semantics;
- a DomainSpec v2 context voice explaining use only on canonical `belongs-to` facts and non-collapse with `owns`;
- an exact machine registry or enumeration with stable IDs and SHA-256 binding;
- synchronized definitions index entries and downstream drift checks;
- positive and hostile vocabulary fixtures.

No placeholder or design label in this candidate is an active ID.

## Recommendation without selection

Recommend `BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`. It preserves a finite, digest-bound active set while allowing later evidence-backed evolution without pretending the initial vocabulary is exhaustive forever. Its extra lifecycle cost is justified only if owner-gated evolution is desired; choose A for a deliberately frozen vocabulary. This recommendation has no decision effect.

## Explain-path complexity example ladder

All IDs and scenarios below are hypothetical design labels, not admitted vocabulary. The invariant across all rungs is exact reference to a finite owner-admitted set with unknown and ambiguous references rejected; only the evolution model differs.

### Low — one provisional kind

Hypothetical scenario: a future definitions package proposes one placeholder ID, `kind-alpha`.

- A: `kind-alpha` is one member of the accepted complete closed enumeration; any other reference fails.
- B: `kind-alpha` is one active registry entry at an exact registry digest; any other reference fails.
- C: no ID becomes active and P02 remains blocked.
- D: the projection route ends with no active ID.

Demonstrates: exact finite reference under both action models. Does not prove the label, its meaning, or P01 selection.

### Medium — evidence for a second kind

Added complexity: vocabulary evolution after an initial package.

Hypothetical scenario: later evidence proposes `kind-beta` as distinct from `kind-alpha`.

- A: a fresh owner decision replaces the complete closed enumeration with a new exact two-ID enumeration and synchronized definitions.
- B: a fresh owner decision adds `kind-beta` as an active registry entry and produces a new exact digest while retaining stable `kind-alpha`.
- C: both labels remain inactive and P02 stays blocked.
- D: the route is terminated; no vocabulary change occurs.

Demonstrates: coarse replacement versus explicit registry evolution. Does not prove that either placeholder has a valid non-collapse witness.

### Complex — deprecation, ambiguity, and cross-boundary use

Added complexity: one deprecated ID, an ambiguous alias, a new candidate meaning, and a cross-feature `belongs-to` fact.

Hypothetical scenario: `kind-alpha` must retire, `alpha-like` could mean two things, and `kind-gamma` is proposed for a cross-feature fact.

- A: a fresh owner-approved complete enumeration and migration package must remove or replace `kind-alpha`; `alpha-like` remains invalid; `kind-gamma` is unusable until included with exact definitions.
- B: a fresh owner-approved registry revision can deprecate `kind-alpha`, reject `alpha-like`, and add `kind-gamma` only with its definition and a new digest.
- C: no membership-kind reference is active; P02 remains blocked.
- D: the projection route remains terminated.

Demonstrates: lifecycle, ambiguity, migration pressure, and feature-boundary independence. Does not decide feature closure, representation, numeric bounds, graph topology beyond D07, or implementation.

### Ladder coverage

- Rungs: `3/3`
- Action options covered evenly: A, B
- Defer and stop represented only as continuation states: yes
- Unsupported authoritative claims: `0`; every label and scenario is explicitly hypothetical
- Decision effect: `none`

## Claim ceiling

This candidate proves only that two vocabulary governance models plus defer and stop are structurally presentable, and that four unsafe construction patterns are structurally inadmissible. It does not select P01, admit any membership-kind label or meaning, satisfy Definitions Governance, create P02, change canonical or packet bytes, implement validation, or authorize promotion, publication, release, deployment, or production use.
