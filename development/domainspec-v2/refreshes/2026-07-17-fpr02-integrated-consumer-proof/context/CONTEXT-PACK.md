---
task: INVOKE-REFRESH-FPR02-INTEGRATED-CONSUMER-PROOF
mode: deep
strict: true
coverage: 14/14
status: pass
evidence_date: 2026-07-17
mutation_mode: proposal-only
---

# Context Pack: FPR-02B BTE and consumer-proof refresh

## Identity and selection

- Target: synchronize the backend type-test-engine completeness plan, the
  interactive ontology learning-map consumer contract, the Body War consumer
  handoff, and Craft/inventory continuation pointers with the accepted
  `DEC-FPR02-SUPPORTED-PROFILE` decision.
- Target integration home: `cyberAlchemy-v2/development/domainspec-v2/`.
- Authority remains in `projects/domainspec-v2/`; the integration home is
  candidate/working material and must not become a second engine or graph
  authority.
- Mutation mode: proposal-only. Existing target plans, consumer plans, Craft
  ledgers, inventory indexes, schemas, profiles, fixtures, and runtime are not
  changed by this refresh.
- No SWU is selected and no Task Session is executed.

## Obligation matrix

| ID | Obligation | Required evidence | Status |
|---|---|---|---|
| O1 | Treat the accepted FPR-02B decision as the current gate input. | Decision gate `PASS`, 16 decisions, production false. | covered |
| O2 | Preserve independent backend and UI lanes. | Decision D1; BTE work-pack lane boundary. | covered |
| O3 | Replace the stale 13-node/relationship-deferred plan model. | Decisions D2, D3, D5-D11; current BTE plan/work-pack. | covered |
| O4 | Use YAML formation authority plus node JSON and independent edge JSON sources. | Decisions D4-D7; node-layering findings. | covered |
| O5 | Require causal node and edge proofs, not parse/compile-only evidence. | Decisions D8-D9; node-layering phased witness. | covered |
| O6 | Keep `O_spec` independent and compare exact `O_spec = O_gen = T_gen = E_run`. | Decision D10; BTE contracts README. | covered |
| O7 | Make the fail-closed 13/16 evidence and negative surface explicit. | Decision D11; BTE validation strategy. | covered |
| O8 | Route IOLM as an independent read-only consumer proof. | Decisions D12; IOLM SPEC, architecture, compiler task. | covered |
| O9 | Keep candidate versus authoritative posture explicit and preserve IOLM gates. | IOLM SPEC gates; node-layering findings. | covered |
| O10 | Place Body War consumer artifacts under the DomainSpec v2 working home without moving its source authority. | Decisions D13-D14; Body War SPEC/interfaces; working-home README. | covered |
| O11 | Require one integrated BTE + IOLM + Body War + Craft evidence manifest. | Decision D15; Craft ledgers. | covered |
| O12 | Preserve conservative claims, revocation, rollback, and role accountability. | Decision D16. | covered |
| O13 | Record Craft and inventory synchronization as proposed follow-up, not silent mutation. | Scoped and umbrella Craft ledgers; inventory index. | covered |
| O14 | Surface engine-path/authority drift and do not copy or merge duplicate engines. | BTE references; DomainSpec v2 working-home boundary. | covered |

## Selected evidence

### [S01] Accepted FPR-02B decision

`projects/domainspec-v2/development/first-production-release/decisions/2026-07-17-fpr02-supported-profile-decision.md`

Selectors: frontmatter; `Resolved Decision 1` through `Resolved Decision 16`;
`Remaining Sequential Blockers`; `Gate State`.

Key excerpts: the backend lane admits/exercises exactly 13 node kinds and 16
backend signatures; independent edge records and the profile family
`feature-with-independent-node-and-edge-files@1` are selected; causal node and
edge proofs are required; `O_spec` is validation-owned; IOLM and Body War are
read-only consumer proof lanes under the DomainSpec v2 working home; production
remains unauthorized.

### [S02] Current BTE plan

`projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/PLAN.md`

Selectors: frontmatter; `Intent Interpretation`; `Problem Statement`; `Delivery
Boundary`; `Proposed Contract`; `Execution Order`.

Key excerpts: current text still describes node-owned outgoing connections,
explicitly excludes all-relationship completeness and independent edge
lifecycle, and keeps the gate blocked on decisions that are now resolved.

### [S03] Current BTE work-pack

`projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md`

Selectors: `Control Fields`; `Task Status Board`; `SWU Manifest`; `Validation
Strategy`; `Blocker And Gap Ledger`; `Gate Checks`.

Key excerpts: `workPackGateStatus: block`, B-BTE-001/B-BTE-002 are still marked
active, and the six-task/eight-SWU route has no edge-proof or integrated consumer
manifest unit.

### [S04] BTE contract placeholder

`projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/contracts/README.md`

Selectors: whole file; `O_spec` ownership and candidate profile notes.

Key excerpts: the independent denominator is a planning target but no
`O_spec.yml`/`O_spec.json` exists yet; the refresh must add edge, consumer, and
manifest obligations without allowing the engine to define its own denominator.

### [S05] IOLM product contract

`cyberAlchemy-v2/development/interactive-ontology-learning-map/SPEC.md`

Selectors: `Success contract`; `DomainSpec graph consumer boundary`; `Independent
gates`; `Acceptance criteria`; `Authority and lifecycle`.

Key excerpts: IOLM is GET-only and read-only, must preserve imported graph
identity and semantic hash, and currently has `G-DSV2-SG: BLOCKED`; it cannot
infer FPR closure, engine admission, production, or authority promotion.

### [S06] IOLM architecture bundle

`cyberAlchemy-v2/development/interactive-ontology-learning-map/ARCHITECTURE-BUNDLE.md`

Selectors: read-only importer; semantic/learner/navigation planes; projection
invariants; source-owner boundary.

Key excerpts: the map projects one owner-produced graph into multiple views and
does not reconstruct DomainSpec meaning from feature tables or learner material.

### [S07] IOLM compiler task

`cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-002-COMPILER.md`

Selectors: objective; inputs; write scope; deterministic projection checks;
negative controls.

Key excerpts: future writes are bounded to `prototype/src/**` and
`prototype/tests/**`; imported node/edge IDs and provenance are unchanged; stale,
unknown, or semantic-mutating overlays fail closed.

### [S08] Node-layering research

`projects/domainspec-v2/research/2026-07-17-spec-ontology-node-layering/findings.md`

Selectors: `Architecture decision`; `Required and optional gaps`; `Falsifiable
phased witness`; Recommendations 6-8.

Key excerpts: one semantic graph with generated learner/navigation overlays is
the sound boundary; independent connection files require schema, digest,
compiler, traversal, and receipt binding; compilation is not traversal and
traversal is not implementation causality.

### [S09] Body War feature authority

`projects/body-war/docs/features/parque-taquaral-online-mvp/SPEC.md`

Selectors: `What This Module Owns`; `Concept Registry`; `Feature Concept Graph`;
`Non-Goals`.

Key excerpts: Body War owns SuggestedTrack and consented, redacted
ActivityEvidenceCandidate behavior; it does not own source-backed geometry,
scoring, or pilot-ready promotion.

### [S10] Body War interfaces

`projects/body-war/docs/features/parque-taquaral-online-mvp/interfaces.md`

Selectors: API routes and field tables.

Key excerpts: mutation routes require authentication and CSRF/origin protection;
the consumer proof must remain read-only and must not reuse raw provider payloads.

### [S11] DomainSpec v2 consumer-home boundary

`cyberAlchemy-v2/development/domainspec-v2/README.md`

Selectors: opening boundary; “candidate / working material”; build-from-owned and
private engine statements.

Key excerpts: this is a working integration home, not authority; engine/profile
meaning stays in `projects/domainspec-v2/`.

### [S12] Scoped Craft ledger

`projects/domainspec-v2/.craft/ledger.yml`

Selectors: `CTX-DSV2-FPR02-BACKEND`; artifact mappings; FPR next moves.

Key excerpts: the live continuation pointer still says to resume the old four
decision groups; the refresh must propose a new consumer-proof context/artifact
mapping without editing the ledger in proposal-only mode.

### [S13] CyberAlchemy umbrella Craft ledger

`cyberAlchemy-v2/.craft/ledger.yml`

Selectors: `CTX-CAV2-DOMAINSPEC-V2`; parent-space and artifact mappings.

Key excerpts: the umbrella points to the scoped DomainSpec ledger and must remain
an index/continuation surface, not a semantic graph store.

### [S14] Repository inventory index

`.arcanum/inventory/index.json`

Selectors: index metadata and relevant entries for IOLM, BTE gap inventory,
node-layering synthesis, FPR roadmap, and Body War.

Key excerpts: the index is parseable but `source_coverage` is partial and has no
current direct BTE/consumer-proof entry; the refresh therefore proposes an
inventory backfill after review rather than claiming it already happened.

## Authority precedence

1. Accepted FPR-02B decision for current resolved choices and claim boundaries.
2. DomainSpec v2 definitions/compiler/profile owners for engine meaning.
3. IOLM and Body War source contracts for their own consumer behavior.
4. Craft ledgers for continuation/indexing only.
5. Inventory for discovery handles, never for promotion.

## Excluded candidates and residue

- Existing `feature-with-independent-node-files@1` evidence remains historical;
  it is not widened in place.
- UI lane artifacts are not joined to FPR-02B.
- Legacy and v2 engine directories are not merged or copied during refresh.
- IOLM `G-DSV2-SG` is not silently closed.
- Body War provider/deployment/callback work is not reintroduced as an FPR-02B
  dependency.
- No source schema, profile, fixture, compiler, consumer implementation, Craft
  ledger, inventory index, or generated artifact is mutated by this package.

## Validation surface

- JSON parse for the context index and refresh report.
- SHA-256 preimage check for every selected source.
- Strict obligation coverage: 14/14, no selected source without an obligation.
- Dispatch-spec validation for `REFRESH-DISPATCH.json`.
- Scoped `git diff --check` for the refresh package.
- Explicit assertions: `production_authorized: false`, `mutation_mode:
  proposal-only`, no SWU selected, IOLM `G-DSV2-SG` remains blocked.
