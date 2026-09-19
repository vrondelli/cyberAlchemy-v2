# BMC-REL-D07 P01 Initial Membership-Kind Contents Candidate

Status: `candidate-pending-owner-selection`

Authority effect: `none`

Decision effect: `none`

## P01 governance-model selection binding

- Selected option: `BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`.
- Decision owner: `user`.
- Decision source: exact `B` response in the active conversation.
- Decision timestamp: `2026-08-23T16:35:24+01:00`.
- P01 candidate SHA-256: `012068ac18dcaced1d5fbcbacb4a1a8505a3d2eed1cae7e1583914b2c01eec04`.
- P01 request raw SHA-256: `a96864ea845824e6374e53cda7b66adb0030c3dbfd06000d0d225d4046604915`.
- P01 canonical request digest: `e25fb8791a4ff3c76c899c48d533e5510d347d9b1843f9569b81422ce24d2ae6`.
- P01 receipt raw SHA-256: `a8b820d60b12b5c67b47c6f24c1a99f27926b626949a127931146d41b8177623`.
- Pre-selection parent record SHA-256: `ae579dc70abdafdf8a586807c7fa5c1b7b4ccdde8645dc1ea14382c9121cd45a`.

P01 selected only the registry governance model. It did not create registry bytes, a definition card, IDs, meanings, aliases, an initial active set, a digest, packet representation, or enforcement.

## Consequential question

Which exact initial active-ID package should seed the governed membership-kind registry while remaining pairwise non-overlapping, fail-closed, and faithful to the canonical `belongs-to` semantic range?

The selected action package will still be a candidate until its exact three-voice definition card, synchronized index entry, machine registry bytes, digest, and drift checks are reviewed and accepted through Definitions Governance. P02 remains blocked until those canonical bytes exist.

## Shared formal boundary

Let `K_active` be the exact finite set selected for the initial registry. Every future kind-bearing canonical `belongs-to` fact must reference one exact active ID. A fact whose intended meaning fits zero active meanings is unknown; a fact that fits more than one is ambiguous. Both fail closed. Free text, aliases, implicit synonym mapping, deprecated IDs, and multi-kind classification of one fact are invalid.

For each Entity `e`, kind `k` in `K_active`, and parents `p1`, `p2`, D07 remains:

```text
belongs_to_k(e, p1) and belongs_to_k(e, p2) implies p1 = p2.
```

There is no existence condition. Different parents under distinct kinds are permitted but not required. No content package decides packet representation, numeric bounds, self/cycle/transitive/closure/duplicates/inverse/runtime behavior, or implementation.

## Candidate meaning: `classification`

Formal voice: `classification(e, p)` means the parent Entity `p` functions as the conceptual classifier or category under which source Entity `e` is classified. It asserts neither membership in `p` as a collection nor assignment of `p` as `e`'s governing home or placement.

Plain-language voice: `e` is treated as an example or member of the kind represented by `p`; this says what category `e` is classified under, not where it is housed or which collection it joins.

DomainSpec-context voice: on canonical `Entity --[belongs-to]--> Entity`, `classification` may classify a source under a target Entity without changing endpoint types or the canonical verb. `Copy --[belongs-to]--> Title` is a hypothetical explanatory fit only when Title actually classifies Copy; the existing example alone does not prove the kind binding.

## Candidate meaning: `home-assignment`

Formal voice: `home-assignment(e, p)` means parent Entity `p` is the explicitly designated organizational, operational, or placement context to which source Entity `e` is assigned as its home for the modeled purpose. It asserts neither that `p` classifies `e` nor that `e` merely participates in `p` as a collection.

Plain-language voice: `p` is the place or governing context where `e` belongs for this assignment, rather than a category describing `e` or a group that simply includes it.

DomainSpec-context voice: on canonical `belongs-to`, `home-assignment` may express an Entity's assigned home while remaining distinct from `owns`. `Copy --[belongs-to]--> Branch` is a hypothetical explanatory fit only when Branch is the modeled home; the existing example alone does not prove the kind binding.

## Candidate meaning: `collection-membership`

Formal voice: `collection-membership(e, p)` means parent Entity `p` denotes a collection or group whose explicit membership criterion admits source Entity `e` as a participant or member. It asserts neither that `p` is a classifier of `e` nor that `p` is `e`'s assigned home, and it grants no lifecycle, custody, or write responsibility.

Plain-language voice: `e` is included in the group represented by `p`; joining the group does not say what kind of thing `e` is, where its home is, or who owns it.

DomainSpec-context voice: this ID is a candidate narrowing of the canonical phrase “is a member of.” It stays on the canonical `belongs-to` edge and does not become containment or ownership. No current canonical example independently proves that this third kind is needed.

## Pairwise non-overlap and fail-closed rule

- `classification` answers “what classifier/category is applied to the source?”
- `home-assignment` answers “what explicit home or placement context is assigned to the source?”
- `collection-membership` answers “what collection/group admits the source as a member?”
- Evidence satisfying more than one answer for the same fact is ambiguous and rejected; author intent may not choose an arbitrary ID to bypass overlap.
- The generic word `membership` is not an ID and cannot serve as a catchall.
- None of the meanings aliases another, implies `owns`, or creates a positive participation minimum.

## Caller-supplied structural assessment

<a id="bmc-rel-d07-p01-contents-a-minimal-two-kind"></a>
### `BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND` — Minimal two-kind initial package

Exact active IDs: `classification`, `home-assignment`.

Complete candidate meanings: exactly the formal, plain-language, and DomainSpec-context voices for `classification` and `home-assignment` above, plus the shared boundary and pairwise non-overlap rule. `collection-membership` is not active under A.

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `definitions-governance:owner-decision`
- Evidence: canonical `belongs-to` explicitly covers classification and home assignment and supplies Title/Branch examples that make both readings structurally presentable without proving their bindings.
- Rejection reasons: none at structural prefilter.
- Benefit: smallest precise initial registry; fewer overlap and migration obligations.
- Risk: a legitimate “member of” fact that is neither classification nor home assignment cannot be represented and must fail closed until a later owner-gated registry addition.
- Downstream dependencies: exact canonical three-voice card for both IDs, two-ID registry bytes/digest, index synchronization, drift audit, positive/hostile vocabulary fixtures, then a separate P02 representation gate.

<a id="bmc-rel-d07-p01-contents-b-disjoint-three-kind"></a>
### `BMC-REL-D07-P01-CONTENTS-B-DISJOINT-THREE-KIND` — Disjoint three-kind initial package

Exact active IDs: `collection-membership`, `classification`, `home-assignment`.

Complete candidate meanings: exactly all three formal, plain-language, and DomainSpec-context voices above, plus the shared boundary and pairwise non-overlap rule.

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `definitions-governance:owner-decision`
- Evidence: canonical `belongs-to` separately says member of, classified by, or assigned to; `collection-membership` narrows “member of” to a collection/group criterion instead of promoting generic `membership` as a catchall.
- Rejection reasons: none at structural prefilter.
- Benefit: represents all three currently named semantic pressures without treating the generic word `membership` as an overlapping ID.
- Risk: the third distinction lacks an independent canonical example, adds overlap pressure, and needs stronger hostile evidence separating a collection from a classifier or home.
- Downstream dependencies: exact canonical three-voice card for all three IDs, three-ID registry bytes/digest, index synchronization, drift audit, pairwise non-overlap fixtures, then a separate P02 representation gate.

<a id="bmc-rel-d07-p01-contents-c-defer"></a>
### `BMC-REL-D07-P01-CONTENTS-C-DEFER` — Defer initial registry contents

- Option kind: `defer`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: P01 selected only the registry model and left the active contents unresolved.
- Rejection reasons: none at structural prefilter.
- Trade-off: avoids premature meanings but keeps the registry, definitions package, and P02 blocked.
- Downstream effect: preserve canonical definitions, index, packet, and relationship bytes unchanged.

<a id="bmc-rel-d07-p01-contents-d-stop"></a>
### `BMC-REL-D07-P01-CONTENTS-D-STOP` — Stop the D07 projection route

- Option kind: `stop`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: Decision Gate preserves stop as an explicit route outcome.
- Rejection reasons: none at structural prefilter.
- Trade-off: makes no semantic change and terminates D07 projection with no registry contents or P02.

## Rejected constructions

- `BMC-REL-D07-P01-CONTENTS-E-GENERIC-MEMBERSHIP-CATCHALL`: generic `membership` overlaps classification, home assignment, and narrower group membership.
- `BMC-REL-D07-P01-CONTENTS-F-FREE-TEXT-OR-ALIASES`: free text and implicit aliases are not exact finite references.
- `BMC-REL-D07-P01-CONTENTS-G-UNKNOWN-OTHER`: mapping unknown meanings to `other` hides ambiguity rather than failing closed.
- `BMC-REL-D07-P01-CONTENTS-H-OWNERSHIP-REGISTRY-REUSE`: membership and ownership remain independent authority surfaces.
- `BMC-REL-D07-P01-CONTENTS-I-OVERLAPPING-MEANINGS`: a package whose predicates overlap cannot support unambiguous one-kind classification.
- `BMC-REL-D07-P01-CONTENTS-J-MANDATORY-MEMBERSHIP`: D07 selected no existence condition.

## Validation implications after content acceptance

- Bind every registry-bearing validation to the exact active registry digest.
- Require one exact active ID for each future kind-bearing `belongs-to` fact.
- Reject unknown, free-text, aliased, deprecated, duplicated, multi-classified, or ambiguously overlapping IDs.
- Reject two distinct direct parents for the same source Entity and kind.
- Permit different parents for distinct kinds without requiring any membership.
- Reject copying ownership-dimension IDs or treating `belongs-to` as `owns^-1`.
- Do not infer numeric, self/cycle/transitive/closure/duplicate/inverse/representation/runtime behavior.

These implications are non-executable until P02 and separately authorized validator work.

## Recommendation without selection

Recommend `BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND`. It is the smallest initial package directly illustrated by the current Title and Branch examples while failing closed on an unproven third meaning. B is structurally defensible from the explicit “member of” phrase, but its `collection-membership` distinction should be selected only if the owner accepts the additional overlap and fixture burden. This recommendation has no decision effect.

## Explain-path complexity example ladder

Every graph and kind binding below is hypothetical. The invariant is exact one-kind classification of each fact, pairwise non-overlap, D07 uniqueness within each kind, no mandatory membership, and no effect on `owns`.

### Low — classification only

Hypothetical scenario: `Copy --[belongs-to]--> Title` carries evidence that Title classifies Copy.

- A: bind the fact to `classification`.
- B: bind the same fact to `classification`; the third ID is unused.
- C: no ID is active and P02 remains blocked.
- D: the projection route terminates unchanged.

Demonstrates: equal treatment of a clearly classified fact. Does not prove the example's real binding or owner acceptance.

### Medium — classification plus assigned home

Added complexity: a second direct parent under a distinct meaning.

Hypothetical scenario: Copy is classified by Title and explicitly assigned to Branch as its modeled home.

- A: bind Title to `classification` and Branch to `home-assignment`; distinct kinds permit distinct parents.
- B: use the same two bindings; `collection-membership` remains unused.
- C: neither binding is active and P02 remains blocked.
- D: the route remains terminated.

Demonstrates: D07 permits different parents across disjoint kinds. Does not prove numeric degree, closure, or representation.

### Complex — collection pressure and ambiguity

Added complexity: a group-membership claim, an ambiguous target, and a cross-feature edge.

Hypothetical scenario: Copy is classified by Title, assigned home to Branch, and admitted to ArchiveSet by an explicit collection criterion; a separate Consortium edge could mean either group membership or home assignment.

- A: Title and Branch bind normally; ArchiveSet fails closed because neither active meaning fits, and Consortium fails as ambiguous.
- B: ArchiveSet may bind `collection-membership`; Consortium still fails because it fits more than one candidate meaning.
- C: all kind bindings remain inactive and P02 remains blocked.
- D: no content decision occurs.

Demonstrates: the substantive difference between the two- and three-kind packages and the shared ambiguity rejection. Does not prove that ArchiveSet or Consortium exists, that collection membership is canonical, or that cross-feature closure is satisfied.

### Ladder coverage

- Rungs: `3/3`
- Action options covered evenly: A, B
- Defer and stop represented only as continuation states: yes
- Unsupported authoritative claims: `0`; all facts and bindings are explicitly hypothetical
- Decision effect: `none`

## Claim ceiling

This candidate proves only that two exact initial active-ID packages plus defer and stop are structurally presentable and that six unsafe constructions are inadmissible. It does not select contents, create canonical definitions/index/registry bytes, bind a digest, create P02, change packet or relationship authority, implement enforcement, or authorize promotion, publication, release, deployment, or production use.
