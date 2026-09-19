# BMC-REL-D07 Membership Topology Candidate

Status: `candidate-pending-owner-selection`

Authority effect: `none`

Decision effect: `none`

## Exact evidence bindings

- Parent decision record before this D07 presentation: `decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md`, SHA-256 `e3b11348cd6271f27ab7b0cd69467c139991f343f8c1ddbe478427acc5b76352`.
- Candidate packet: `BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json`, SHA-256 `3d2f7695197b1e8eaa1b2cfd0c2662ad0355888604ee7ad0e6e9dd34ce0107b3`.
- Packet schema: `BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json`, SHA-256 `eabaeb7c9f37dc3d016873fa30e2dd86c6e09903f5f7bcbf3b072b2adb8ddbde`.
- Packet validator: `validate-bmc-rel-001-decision-packet.mjs`, SHA-256 `03ed61edc240478430a9c5a1eaf2297682beea63d76ac6c44a792172c738def9`.
- Definition authority: `projects/domainspec-v2/definitions/DEFINITIONS.md`, SHA-256 `cdbe251015bb6387fe0283b4d058b4fa85b048b253c7e65845e43fd2170b6006`.
- Relationship authority: `projects/domainspec-v2/definitions/relationships/relationships.yml`, SHA-256 `82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1`.
- Ownership-dimension registry, bound only to prove the independent `owns` axis: `projects/domainspec-v2/definitions/ownership-dimensions/ownership-dimensions.json`, SHA-256 `91898f538b49f29a1be659560f6b442644a34b3ecb3f0a8916b7a0e53680bad4`.

## Consequential question

When one Entity canonically `belongs-to` another through membership, classification, or home assignment, is direct membership grouped into one parent slot overall, left as multiple undifferentiated memberships, or grouped independently by membership kinds admitted through a later Definitions Governance decision?

This blocks only the membership-topology policy for canonical `belongs-to`. It does not decide how a selected policy is represented or enforced.

## Strict boundary

- `belongs-to` remains a canonical `Entity -> Entity` relationship distinct from `owns` and is never interpreted as `owns^-1`.
- The `many_to_one` token is compatibility vocabulary, not numeric authority.
- No option establishes a positive minimum or mandatory membership.
- No option decides generic numeric bounds, self edges, cycles, transitivity, closure, duplicates, inverse behavior, serialized representation, runtime cardinality, or implementation.
- The prose terms `membership`, `classification`, and `home-assignment` describe the current semantic range. They are not a closed machine vocabulary.
- The current packet has no membership-topology facet. Any selected action therefore needs a separate representation decision before packet projection or executable validation.

## Caller-supplied structural assessment

Decision Gate consumes these structural statuses; it does not manufacture their application-specific validity or satisfy the named authority gate.

<a id="bmc-rel-d07-a-one-direct-membership-parent"></a>
### `BMC-REL-D07-A-ONE-DIRECT-MEMBERSHIP-PARENT` — One direct membership parent overall

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `definitions-governance:owner-decision`
- Evidence: the active signature is a direct canonical `Entity -> Entity` edge; `many_to_one` supplies historical compatibility pressure but no numeric authority.
- Rejection reasons: none at structural prefilter.
- Benefit: one simple, unambiguous membership-parent slot.
- Risk: collapses membership, classification, and home assignment into one grouping rule and may force a model to choose between independently meaningful targets.
- Downstream effect if selected: authorize only the one-slot topology policy; separately decide representation, fixtures, and enforcement. No mandatory membership follows.

<a id="bmc-rel-d07-b-multiple-undifferentiated-memberships"></a>
### `BMC-REL-D07-B-MULTIPLE-UNDIFFERENTIATED-MEMBERSHIPS` — Multiple undifferentiated direct memberships

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `definitions-governance:owner-decision`
- Evidence: the canonical card lists both `Copy --[belongs-to]--> Title` and `Copy --[belongs-to]--> Branch`, while the human companion keeps `belongs-to` distinct from ownership.
- Rejection reasons: none at structural prefilter.
- Benefit: preserves the current single verb and permits several independently useful membership targets without adding vocabulary.
- Risk: cannot distinguish complementary memberships from accidental or conflicting assignments.
- Downstream effect if selected: authorize only untyped plurality at the topology axis; separately decide representation, duplicates, numeric bounds, and enforcement.

<a id="bmc-rel-d07-c-one-direct-membership-per-governed-kind"></a>
### `BMC-REL-D07-C-ONE-DIRECT-MEMBERSHIP-PER-GOVERNED-KIND` — One direct membership parent per separately governed kind

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `definitions-governance:owner-decision`
- Evidence: the canonical semantics distinguishes membership, classification, and home assignment in prose; D01 requires independent semantic axes; D18 preserves `belongs-to` as independently meaningful from `owns`.
- Rejection reasons: none at structural prefilter.
- Benefit: preserves distinct membership purposes without allowing competing parents inside the same later-admitted kind.
- Risk: creates explicit follow-up dependencies on a governed membership-kind vocabulary, an exact packet representation, and validation fixtures. No current vocabulary proves which kinds should exist.
- Downstream effect if selected: authorize only conditional uniqueness inside each later-admitted membership kind. A separate Definitions Governance decision must admit the kinds, and a separate representation decision must bind them before packet projection or enforcement.

<a id="bmc-rel-d07-d-defer"></a>
### `BMC-REL-D07-D-DEFER` — Defer membership topology

- Option kind: `defer`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: the packet already keeps the `belongs-to` row and all ordinary facets unresolved.
- Rejection reasons: none at structural prefilter.
- Benefit: avoids premature semantics.
- Risk: keeps dependent relationship-constraint generation blocked.
- Downstream effect: preserve current candidate and authority bytes unchanged.

<a id="bmc-rel-d07-e-stop"></a>
### `BMC-REL-D07-E-STOP` — Stop this decision route

- Option kind: `stop`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: Decision Gate preserves stop as an explicit route outcome.
- Rejection reasons: none at structural prefilter.
- Benefit: makes no semantic change and terminates this decision route explicitly.
- Risk: membership topology and dependent constraint work remain unresolved.
- Downstream effect: stop the BMC relationship-constraint decision route without selecting D07.

## Rejected constructions

- `BMC-REL-D07-F-TOKEN-DERIVED-NUMERIC-MANY-TO-ONE`: inadmissible because D01 and the packet validator prohibit deriving numeric bounds from compatibility vocabulary.
- `BMC-REL-D07-G-COLLAPSE-INTO-OWNS-INVERSE`: inadmissible because DS-D8 and D18 require `belongs-to` to remain first-class and distinct from `owns^-1`.
- `BMC-REL-D07-H-MANDATORY-MEMBERSHIP-FOR-EVERY-ENTITY`: inadmissible because current evidence supplies no membership-eligibility/root selector and D07 may not infer a positive minimum.
- `BMC-REL-D07-I-PROSE-DERIVED-FIXED-MEMBERSHIP-KINDS`: inadmissible because descriptive prose cannot silently become a closed machine vocabulary.

## Recommendation without selection

Recommend `BMC-REL-D07-C-ONE-DIRECT-MEMBERSHIP-PER-GOVERNED-KIND` because it best preserves D01 orthogonality and the current semantic distinction among membership purposes while keeping `belongs-to` independent from `owns`. The recommendation is conditional: selection would not admit any membership-kind vocabulary or authorize packet projection. If the owner does not want that governance and representation dependency, B is the smallest non-collapsing alternative. This recommendation has no decision effect.

## Explain-path complexity example ladder

All scenario details below are hypothetical. Within each rung, every action option is applied to the same authored `belongs-to` facts. The shared invariant is that D07 changes only how direct membership targets are grouped; it never changes `owns`, creates mandatory membership, or decides any other topology axis.

### Low — one local membership fact

Hypothetical scenario: `Copy --[belongs-to]--> Title`.

- A: the Title occupies Copy's one overall direct-membership parent slot.
- B: the edge is one member of Copy's undifferentiated direct-membership set.
- C: the edge is admissible only after a later-governed kind classifies it; it then occupies that kind's slot.
- D: the edge stays as current canonical example evidence; topology remains unresolved.
- E: the decision route terminates; no topology is selected.

Demonstrates: all action options can describe one fact. Does not prove a minimum, maximum, vocabulary, or representation.

### Medium — two interacting membership purposes

Added complexity: a second target that may express a different purpose.

Hypothetical scenario: the same `Copy` has `belongs-to` edges to `Title` and `Branch` in one graph.

- A: the two edges compete for the single overall parent slot; one would need to be removed or modeled outside the selected topology.
- B: both edges remain direct undifferentiated memberships; their compatibility or conflict is not distinguished by kind.
- C: both may remain only if later governance admits distinct kinds and each edge binds exactly one appropriate kind; two targets inside one kind would conflict.
- D: both hypothetical edges remain unevaluated for D07 topology.
- E: the route terminates without classifying their interaction.

Demonstrates: the practical distinction between one slot, untyped plurality, and per-kind uniqueness. Does not prove that the two canonical YAML examples must coexist in one real graph or that the prose words are stable kind IDs.

### Complex — cross-boundary ambiguity plus independent ownership

Added complexity: a third membership target across a feature boundary, one ambiguous purpose, and a separate `owns` fact.

Hypothetical scenario: `Copy` belongs to `Title`, `Branch`, and cross-feature `ArchiveCollection`; the ArchiveCollection purpose is ambiguous. Separately, `Library --[owns]--> Copy` under a governed ownership dimension.

- A: all three `belongs-to` edges compete for the one overall membership slot; the independent `owns` edge is unaffected.
- B: all three memberships remain undifferentiated; ambiguity is preserved rather than resolved, and the independent `owns` edge is unaffected.
- C: each `belongs-to` edge needs one exact later-admitted membership kind; the ambiguous ArchiveCollection edge fails closed until its kind is resolved. The `owns` edge continues under its separate D06 vocabulary and policy.
- D: membership grouping stays unresolved, while the existing `owns` policy remains independently unchanged.
- E: the D07 route terminates without altering either relation.

Demonstrates: kind ambiguity, a feature boundary, and the non-collapse boundary between membership and ownership. Does not prove cross-feature closure, self/cycle policy, transitivity, duplicates, inverse behavior, representation, runtime semantics, or implementation validity.

### Ladder coverage

- Rungs: `3/3`
- Action options covered evenly: A, B, C
- Defer and stop represented only as continuation states: yes
- Unsupported authoritative claims: `0`; all invented graph details are labelled hypothetical
- Decision effect: `none`

## Claim ceiling

This candidate proves only that three action shapes plus defer and stop are structurally presentable for owner choice, and that four overreaching constructions are structurally inadmissible under current evidence. It does not select D07, satisfy the authority gate, admit membership-kind vocabulary, change packet/schema/validator/canonical bytes, establish numeric or other topology semantics, implement enforcement, promote, publish, release, deploy, or prove production use.
