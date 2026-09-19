# Decision Ledger

| ID | State | Decision | Consequence |
| --- | --- | --- | --- |
| DEC-UIR-001 | resolved | Use repository-local `canonical-json-v1` with versioned SHA-256. | SWU-001 may freeze golden vectors and publish the replay contract. |
| DEC-UIR-002 | resolved | Preserve `attribute-present`; add `attribute-nonempty/v1`. | Avoid global semantic drift. |
| DEC-UIR-003 | resolved | Fail closed on raw duplicates and contradictory criteria; define no precedence. | SWU-004 may include finite duplicate/conflict extensions after preflight support lands. |
| DEC-UIR-004 | resolved | Use a strict versioned code registry; both validation paths reject unknown rules. | SWU-002 may implement outcome/code parity against one normative registry. |
| DEC-UIR-005 | resolved | Separate content digest from lineage. | Replay can be deterministic without erasing history. |
| DEC-UIR-006 | resolved | Use two-sided evaluation, not inverse/bidirectional identity. | External destination remains owner-pending. |
| DEC-UIR-007 | resolved-policy | Permit `observed-absent` only under a finite exhaustive-search contract. | Current corpus generation remains `not-observed`-only until the versioned extension and successor generation land. |
| DEC-UIR-008 | resolved-policy | Require two independently authored real corpora, two implementation styles, and dual independent review per candidate. | Current Body War/Savvy evidence is below threshold; portability cannot pass in the current dossier generation. |
| DEC-UIR-009 | resolved-owner | Neither Form nor Action has an independent positive in the current evidence generation. | Partial Body War correspondence remains preserved; successor dossier records the conjunct as `missing`; candidate status is unchanged. |
| DEC-UIR-010 | resolved-owner (4/4) | Action-source route opened; Hook-Binding separation, finite Guard Page/Rule targets, and Binding as the current fetches/mutates endpoint retained. | No signature admitted, widened, or mutated; successor records and any future relationship changes require full candidate evidence and owner promotion. |
| DEC-UIR-002-ORDER | resolved | Run SWU-UIR-003 before SWU-UIR-002. | Normative registry and preflight land before nonempty parity consumes them. |

## Decision Records

### DEC-UIR-007 - Finite Exhaustive-Search Absence

- Decision: permit `observed-absent` only when a receipt declares a finite
  search universe, pins source and extractor versions/digests, enumerates all
  selectors, completes without parse or extraction errors, and records zero
  matches.
- Selected option: option 1, finite exhaustive search.
- Alternatives considered: prohibit absence claims throughout v1; defer the
  policy and retain `not-observed` only.
- Rationale: the owner chose to establish a fail-closed typed-negative path now
  rather than reserving it for a later package version. Missing, partial,
  ambiguous, moved, stale, or untestable evidence remains `not-observed`.
- Source: explicit user selection `1` through `decision-gate` on 2026-07-12,
  after the recommendation and downstream costs were explained.
- Downstream impact: add a versioned bounded-search schema/evaluator, positive
  and malformed fixtures, and an immutable successor corpus generation before
  any receipt may emit `observed-absent`. Corpus generation 001 is unchanged.
- Prohibited inference: a zero-result unbounded or partial search is not
  absence; `observed-absent` is not candidate identity or portability.
- Remaining blockers: implementation of the selected absence contract,
  successor evaluation under DEC-UIR-008 and DEC-UIR-009, and DEC-UIR-010.

### DEC-UIR-008 - Per-Candidate Portability Threshold

- Decision: a UI candidate may pass `corpus-bound-portability` only with at
  least two independently authored real corpora that collectively cover at
  least two implementation styles, plus agreement from two independent
  reviewers on candidate correspondence and applicability.
- Selected option: option 1, two independent corpora, two styles, dual review.
- Alternatives considered: one corpus represented in two styles with an
  independent audit; preregistered per-candidate thresholds; defer policy.
- Rationale: prevent framework vocabulary, one-project quirks, or one reviewer
  projection from being relabeled as portability or replication.
- Source: explicit user selection `1` through `decision-gate` on 2026-07-12.
- Current evidence disposition: Body War and Savvy evidence cannot be pooled
  across different candidates. No current candidate satisfies the selected
  threshold, so the portability conjunct remains non-pass.
- Downstream impact: freeze the threshold in a versioned policy record and
  append a successor dossier/index generation that records the current evidence
  as below threshold. Existing corpus and dossier generations remain immutable.
- Prohibited inference: passing this threshold would establish bounded
  portability evidence only, not independent replication, identity, authority,
  activation, or promotion.
- Remaining blockers: DEC-UIR-007 implementation, DEC-UIR-008 successor
  evaluation, DEC-UIR-009 successor classification, and DEC-UIR-010.

### DEC-UIR-009 - Current Form And Action Independent Positives

- Decision: neither Form nor Action has an independent positive in the current
  evidence generation.
- Selected option: option 1, neither passes.
- Alternatives considered: Form passes while Action does not; both pass; defer
  the owner classification.
- Rationale: Body War provides useful partial behavioral correspondence, but
  reviewer correspondence is not independence by declaration, label and
  criterion erasure are missing, and Action-source remains externally owned.
- Source: explicit user selection `1` through `decision-gate` on 2026-07-12,
  after requesting and receiving the expanded evidence explanation.
- Evidence preservation: Body War literal facts and reviewer projections remain
  valid and immutable. This decision classifies the independent-positive
  requirement as `missing`; it does not classify either candidate as killed,
  disproved, or absent.
- Downstream impact: append a successor dossier/index generation that replaces
  the owner-disputed state with `missing`. Both candidates remain deferred on
  independent positive, contrast, erasure, and portability.
- Prohibited inference: missing an independent positive does not prove the
  candidate impossible, collapsed, demoted, or non-existent.
- Remaining blockers: selected-policy implementation/evaluation obligations
  and DEC-UIR-010.

### DEC-UIR-010 - DS-D8 Relationship Subdecisions

Authority input: DS-D8 version 1 at
`sha256:567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41`.
The SWU-007 packet remains immutable transport; selections are recorded here
and require successor evidence before any authority mutation.

#### DEC-UIR-010.1 - Action-Source

- Decision: open a candidate route for one distinct Action-source signature.
- Selected option: option 2, admit only after the exact verb, target, positive
  and negative examples, validation obligations, and changed DS-D8 consequence
  are supplied and reviewed.
- Alternative considered: retain Action only as the target of `submits`; defer
  the subquestion.
- Rationale: preserve a governed path for source participation without
  inventing the actual edge from partial handler correspondence.
- Source: explicit user selection `2` through `decision-gate` on 2026-07-12.
- Current authority consequence: none. No signature, verb, target, or validator
  rule is admitted by this decision.
- Required successor evidence: exact signature proposal, at least one positive
  and one negative witness, finite endpoint constraints, and a changed property
  under domainspec-v2-D20 through D25.
- Remaining DEC-UIR-010 subdecisions: none.

#### DEC-UIR-010.2 - Hook-Binding

- Decision: retain Hook and Binding as separate candidate concepts without a
  canonical Hook-Binding edge in the current finite authority.
- Selected option: option 1, retain separation.
- Source: explicit user confirmation after evidence review on 2026-07-12.
- Rationale: current observed behavior is already represented by `consumes`,
  `fetches`, and `mutates`; co-occurrence does not supply an exact edge or a
  changed domainspec-v2-D20 through D25 consequence.
- Authority effect: none. DS-D8 version 1 and its 30 signatures remain
  unchanged.
- Future route: require candidate definition, positive and negative witnesses,
  adversarial review, independent replication, exact signature semantics,
  validator obligations, and owner promotion before admitting a new edge.
- Prohibited inference: this decision neither promotes Hook or Binding nor
  proves universal non-collapse; it closes only the unsupported direct edge.
- Remaining DEC-UIR-010 subdecisions: none.

#### DEC-UIR-010.3 - Guard Target Set

- Decision: retain `Guard --[protects]--> Page` and
  `Guard --[mirrors]--> Rule` as the finite current Guard target set.
- Selected option: option 1, retain Page and Rule.
- Source: explicit user confirmation through `decision-gate` on 2026-07-12.
- Rationale: the current signatures cover the evidenced UI-access and
  cross-layer-authority roles; no additional exact target, verb,
  positive/negative witnesses, or changed domainspec-v2-D20 through D25
  consequence is supplied.
- Authority effect: none. No signature is widened, admitted, or mutated.
- Future route: require the full candidate, experiment, adversarial-review,
  replication, and owner-promotion process for an additional Guard target.
- Prohibited inference: the finite current set is not proof that no future
  target can qualify.
- Remaining DEC-UIR-010 subdecisions: none.

#### DEC-UIR-010.4 - Binding Node Or Relation

- Decision: retain Binding as the current source endpoint for
  `Binding --[fetches]--> Query` and
  `Binding --[mutates]--> Operation`.
- Selected option: option 1, retain Binding as the current endpoint.
- Source: explicit user confirmation through `decision-gate` on 2026-07-12.
- Rationale: retention preserves active DS-D8 validation, composition,
  projection, and owner routes; no successor endpoint model or coordinated
  migration for both signatures currently exists.
- Authority effect: none. DS-D8 version 1 and its 30 signatures remain
  unchanged; no DS-D1 candidate is activated or promoted.
- Boundary: edge-only connections remain relations rather than proof of a
  durable Binding node. Binding identity remains an experimental DS-D1 evidence
  question.
- Future route: replacement requires full candidate formalization, positive and
  negative witnesses, adversarial review, independent replication, coordinated
  DS-D1/DS-D8 owner decisions, and migration evidence.
- Remaining DEC-UIR-010 subdecisions: none.

### DEC-UIR-002-ORDER - W0 Dependency Repair

- Decision: preserve task ownership and execute `001 -> 003 -> 002`.
- Alternatives considered: move registry ownership into SWU-002; use
  provisional codes and rewrite persisted evidence later.
- Rationale: keeps one normative registry, avoids broadening SWU-002, and
  repairs the live dependency contradiction before validator mutation.
- Source: user selection `1` through `decision-gate` on 2026-07-11.
- Decision artifact: `runs/SWU-UIR-002/DECISION-DEPENDENCY-ORDER.md`.
- Remaining blocker for SWU-UIR-003: none.

### DEC-UIR-001 - Canonical Serialization And Digest

- Decision: use repository-local `canonical-json-v1` with versioned SHA-256.
- Selected option: recursively sort object keys, preserve array order, encode
  UTF-8 JSON, reject unsupported numeric values, and digest only the declared
  semantic projection.
- Alternatives considered: RFC 8785 JCS; schema-ordered semantic tuples.
- Rationale: gives the repair package a small, dependency-free contract with
  reviewable golden vectors while retaining explicit version ownership.
- Source: user selection `1` through `decision-gate` on 2026-07-11.
- Downstream impact: SWU-UIR-001 must specify exact scalar normalization,
  semantic-field projection, golden vectors, and algorithm versioning. A future
  change requires a new canonicalization version; existing digests remain valid.
- Remaining blockers: DEC-UIR-003 and DEC-UIR-004 for the W0/W1 contract path.

### DEC-UIR-003 - Duplicate And Conflict Policy

- Decision: detect duplicate keys in raw input and reject them before structured
  parsing; reject contradictory criteria during schema preflight.
- Selected option: fail closed with no first-value or last-value precedence.
- Alternatives considered: ordered duplicate criteria with explicit precedence;
  last-value-wins normalization with diagnostics.
- Rationale: preserves discarded evidence, makes outcomes parser-independent,
  and avoids legitimizing malformed ambiguity through precedence rules.
- Source: user selection `1` through `decision-gate` on 2026-07-11.
- Downstream impact: validator input paths need a raw duplicate-preservation
  check; schemas need a finite contradiction classifier; existing tolerated
  malformed inputs may become invalid. SWU-UIR-004 must enumerate both duplicate
  orders and applicable conflicts without treating them as part of the 165 base.
- Remaining blocker: DEC-UIR-004 for the W0/W1 contract path.

### DEC-UIR-004 - Violation Codes And Unknown Rules

- Decision: both validation paths reject unknown rule identifiers and emit
  stable codes from `ui-repair-violations/v1`; human-readable messages are
  non-normative.
- Selected option: strict versioned code registry.
- Initial required codes: `ATTRIBUTE-MISSING`, `ATTRIBUTE-EMPTY`,
  `ATTRIBUTE-WHITESPACE`, `DUPLICATE-KEY`, `CRITERIA-CONFLICT`,
  `FIXED-VALUE-MISMATCH`, `NONSTRING-VALUE`, and `UNKNOWN-RULE`.
- Alternatives considered: preflight-only staged strictness; generic
  accepted/rejected/invalid outcomes with free-form reasons.
- Rationale: makes Markdown/generated-instance parity testable, fails closed on
  unsupported semantics, and permits messages to improve without breaking
  evidence identity.
- Source: user selection `1` through `decision-gate` on 2026-07-11.
- Downstream impact: SWU-UIR-002 must register codes atomically in both paths;
  code additions or meaning changes require a registry version change. Legacy
  unknown-rule tolerance is not preserved.
- Remaining W0 policy blockers: none.

## Decision Gate Result - W0 Contract Policy

- Target scope: `WP-UIR-001` W0 contract policy.
- Result: PASS.
- Decisions resolved: DEC-UIR-001, DEC-UIR-003, DEC-UIR-004.
- Blockers remaining for SWU-UIR-001: none.
- Deferred decisions: DEC-UIR-007 through DEC-UIR-010; these require corpus,
  dossier, DS-D1, or DS-D8 evidence and do not block W0.
- Assumptions recorded: canonical strings remain byte-significant after UTF-8
  encoding; numeric semantic fields are restricted to JSON safe integers unless
  SWU-UIR-001 discovers a source-backed need for a new canonicalization version.
- Validation required next: golden vectors, malformed vectors, outcome/code
  parity, raw duplicate ordering, and conflict-classifier tests.
- Next step: Task Session on SWU-UIR-001.
