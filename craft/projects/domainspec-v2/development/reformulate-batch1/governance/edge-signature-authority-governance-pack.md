---
node_type: governance-pack
is_session: false
status: candidate
created: 2026-07-02
target: DomainSpec v2 R3 relationship / edge-signature authority
mutation_mode: proposal-only
owner_route: constitution-governance -> task-session SWU-R3A
discipline_route: discipline-governance subagent scan, private-parent
craft_scope: projects/domainspec-v2/.craft/ledger.yml
---

# Edge-Signature Authority Governance Pack

## Purpose

Capture the operator decision pressure:

> Root surfaces own DomainSpec v2 authority. `impl/` contains only the
> implementation surfaces and projections needed to execute, validate, or render
> that authority.

This is a project-wide DomainSpec v2 authority principle, with R3 as the first
application. For R3 this means the canonical relationship / edge-signature law
should not be born under `impl/spec/`. The root `definitions/` and `authority/`
surfaces own meaning and governance; `impl/spec/RELATIONSHIPS.md` is an
implementation-facing view or generated projection.

## Constitution Governance Result

- Mode: `compose` plus proposed `add-rule`
- Target: `projects/domainspec-v2` R3 edge-signature authority
- Status: `flag`
- Constitutions inspected:
  - `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md`
  - `projects/domainspec-v2/authority/AUTHORITY-MODEL.md`
  - `projects/domainspec-v2/development/reformulate-batch1/WORK-PACK.md`
  - `projects/domainspec-v2/development/reformulate-batch1/refreshes/2026-07-02-r3-edge-law-artifact-refresh/REFRESH-REPORT.md`
- Rules selected or changed:
  - Selected existing rules: C1, C4, C6, C11, C(meta-4)
  - Proposed local rule: `domainspec-v2-C-R3-root-authority-projection`
- Composition pack: this file
- Validator impact: required
- Conflicts:
  - Resolved by decision: C1 was amended so root `authority/` and
    `definitions/` own DomainSpec v2 authority while `impl/` contains
    implementation consumers/projections/views.
- Decisions needed:
  - resolved: this root-authority rule applies to every future DomainSpec
    language authority surface, with R3 relationships as the first application;
  - decide exact canonical paths for the root relationship human and machine
    views;
  - decide whether `impl/spec/RELATIONSHIPS.md` is generated from root authority
    or manually maintained with a sync check;
  - resolved: C1 is amended now; R6a/R6b should preserve the amended
    root-authority boundary during constitution crosswalk and split.
- Validation: review-only for this candidate pack; deterministic validator work
  is a follow-up under SWU-R3A/R3C.
- Next route: `task-session` on SWU-R3A, then `definitions-governance` and
  validator work.

## Selected Constitution Rules

### C1 - Primary Source Boundary

Use as the current conflict source. It says the official primary source is the
DomainSpec language spec under `impl/spec/` plus definitions and per-feature
packs. R3 now needs a narrower distinction: canonical edge-law authority belongs
at the project root; implementation views consume it.

### C4 - Separation Of Concerns

Use as support. It already keeps spec, implementation, and governance authority
separate unless an owner decision binds them.

### C6 - Forbidden Edges Are Unconstructible

Use as the law owner. The layer-law / edge-law decides which endpoint pairs are
admissible. A forbidden edge must not be constructible by the signature surface.

### C11 - Relationship / Edge-Law Conformance

Use as the check owner. The validator confirms declared relations conform to the
edge-law; it does not own the law.

### C(meta-4) - Load-Bearing Term Tracking

Use for DS-D2 and DS-D8. Edge verbs and edge signatures are load-bearing terms
and must resolve to tracked definition IDs before promotion.

## Proposed Local Constitution Rule

### domainspec-v2-C-R3-root-authority-projection

Validation mode: hybrid

Canonical DomainSpec v2 edge-signature authority lives outside `impl/`.

The root authority/definition surface owns edge verbs, endpoint signatures,
cardinality, scope, status, and promotion posture. Implementation artifacts under
`impl/` may expose only implementation-facing projections or generated views
needed by validators, examples, code tags, or developer reading. An
implementation view must not originate, override, or silently diverge from the
root edge-law authority.

Valid examples:

- `definitions/relationships/relationships.yml` owns the machine-readable
  signature relation.
- `definitions/relationships/relationships.md` owns the human view using
  `Source --[edge]--> Target`.
- `impl/spec/RELATIONSHIPS.md` is generated from, or explicitly checked against,
  the root relationship authority.
- `validate-relationships.ts` reads root authority directly or rejects a stale
  implementation projection.

Invalid examples:

- `impl/spec/relationships.signatures.yml` is the canonical authority.
- `impl/spec/RELATIONSHIPS.md` changes an edge signature without a root
  definition/authority change.
- `validate-relationships.ts` proves only label membership while claiming C11
  endpoint conformance.
- DS-D2 or DS-D8 definitions are promoted from implementation schemas alone.

Promotion boundary:

- This rule is candidate until SWU-R3A records the exact root authority paths and
  R6a/R6b preserves the amended C1 boundary in the planned constitution split.
- Deterministic enforcement is blocked until a validator can check either direct
  root reads or projection sync.

## Discipline Governance Result

- Mode: `scan` with route recommendation, dry-run/no edits
- Target discipline/candidate: `domainspec-v2-edge-signature-authority-boundary`
- Status: `flag`
- Public/private tag: `private-parent`
- Target catalog: project-local `projects/domainspec-v2`, not public
  `arcanum/disciplines`
- Card: none
- Catalog row: none
- Route: `constitution`, then `validator`
- Status change: none
- Validator result: not-run
- Evidence:
  - `projects/domainspec-v2/README.md`
  - `projects/domainspec-v2/definitions/DEFINITIONS.md`
  - `projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md`
  - `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md`
  - `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md`
  - `projects/domainspec-v2/impl/tools/validate-relationships.ts`
  - `projects/domainspec-v2/development/reformulate-batch1/refreshes/2026-07-02-r3-edge-law-artifact-refresh/REFRESH-REPORT.md`
  - `projects/domainspec-v2/development/reformulate-batch1/refreshes/2026-07-02-r3-edge-law-artifact-refresh/REFRESH-PATCH-PROPOSAL.md`
- Decisions needed:
  - signature surface form;
  - final edge count;
  - Entity-to-Entity association;
  - Saga signature vs Workflow folding;
  - DS-D8 vs `domainspec-v2-D9`;
  - when to promote DS-D2/DS-D8.
- Validation: read-only local inspection. No public discipline catalog edit.
- Next route: `task-session` on SWU-R3A, then `definitions-governance`, then
  validator work.

## Craft Result

- Target project: `projects/domainspec-v2`
- Ledger: `projects/domainspec-v2/.craft/ledger.yml`
- Operation: `state`
- Result: `flag`
- Contexts touched: none
- Evidence:
  - Craft scope exists and owns DomainSpec v2 state.
  - `CTX-DSV2-REFORMULATE-BATCH1` owns the batch-1 reformulation route.
  - `GAP-DSV2-EDGE-CATALOG` routes catalog edge gaps to R3.
  - `DEC-DSV2-EDGE-ADMISSIBILITY` is closed and already governs edge-type
    admissibility.
- Pending by node:
  - `CTX-DSV2-REFORMULATE-BATCH1`: R1-R6b not executed; R3 is the edge-law
    reconciliation unit.
  - `CTX-DSV2-META-TYPE-FORMALIZATION`: MT3b edge signatures are deferred to
    R3.
- Residue:
  - Craft should be used before mutation-capable execution to record the new
    root-authority decision and any opened/closed R3 blockers.
  - No Craft mutation was applied in this governance pass because the ledger was
    read as existing authority and this packet is proposal-only.
- Next move: run SWU-R3A with this pack as source evidence.
- Boundary check: `.craft/ledger.yml` and `CRAFT.md` were not mutated.

## Decision Queue Before Implementation

### DEC-R3-AUTH-1 - Scope of Root Authority Rule

Question: Does `root owns authority; impl owns projections` apply only to
relationship/edge signatures for R3, or to every future DomainSpec language spec
surface?

Decision: applies to every future DomainSpec language authority surface.

Rationale: user selected the broader root-authority principle. R3 remains the
first concrete application, but the constitution/source-boundary work should not
frame it as an R3-only exception.

### DEC-R3-AUTH-2 - Canonical Relationship Paths

Question: What exact paths own the human and machine relationship authority?

Decision:

- Machine: `definitions/relationships/relationships.yml`
- Human: `definitions/relationships/relationships.md`
- Projection: `impl/spec/RELATIONSHIPS.md`

Rationale: user selected the definitions relationship folder. Relationship
authority stays with the root definitions surface; implementation keeps only a
projection/view.

### DEC-R3-AUTH-3 - Projection Strategy

Question: Should implementation read root authority directly, or should
`impl/spec/RELATIONSHIPS.md` be generated and sync-checked?

Decision: validators read root authority directly.

Rationale: user selected direct root read. `validate-relationships.ts` should
consume `definitions/relationships/relationships.yml` as canonical machine
authority. `impl/spec/RELATIONSHIPS.md` may remain a human/developer projection,
but it is not a trusted source for endpoint-signature authority.

### DEC-R3-AUTH-4 - C1 Amendment Timing

Question: Should the constitution C1 primary-source wording change now, or wait
for R6a/R6b?

Decision: amend C1 now.

Rationale: user selected immediate amendment after choosing the project-wide
root-authority principle. C1 now states that root `authority/` owns governance,
root `definitions/` owns canonical language terms and relationship/edge-signature
authority, and `impl/` contains implementation surfaces, consumers, and
projections/views unless explicitly promoted by a root owner decision.

### DEC-R3-EDGE-1 - Entity Associations

Question: Are Entity-to-Entity associations first-class edge signatures, and if
so should they be a small semantic relation family instead of one generic edge?

Decision: add a first-class semantic Entity relation family.

Rationale: user selected this option after rejecting `references` as less
intuitive. Candidate verbs are `owns`, `belongs-to`, and `depends-on`; SWU-R3A
must define direction, examples, non-examples, and whether `owns` / `belongs-to`
are inverse views or distinct admissible signatures.

### DEC-R3-EDGE-2 - Saga Connectability

Question: Does Saga get its own signatures, or fold into Workflow plus
cross-feature metadata?

Recommended default: add `Saga --[orchestrates]--> Operation[]` with
`scope: cross-feature` if it composes differently from Workflow; otherwise fold
Saga into Workflow plus a cross-feature flag and remove it as a separate
connectable meta-type.

## Next Route

1. Refresh the R3 package using this governance pack as a new source signal.
2. Run `task-session` on SWU-R3A:
   - choose root signature authority paths;
   - reconcile edge decisions;
   - record the Craft decision/update if mutation begins;
   - produce the post-reconciliation edge count.
3. Run `definitions-governance` for DS-D2 and DS-D8 only after SWU-R3A chooses
   the authority surface.
4. Run validator work after the authority surface exists:
   - `validate-relationships` checks endpoint signatures, not labels only;
   - projection sync is checked if `impl/spec/RELATIONSHIPS.md` remains a view;
   - negative fixtures include `Operation --[enforces]--> Value Object`.
