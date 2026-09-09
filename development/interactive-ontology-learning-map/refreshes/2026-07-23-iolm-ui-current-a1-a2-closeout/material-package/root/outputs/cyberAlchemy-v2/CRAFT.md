# CyberAlchemy v2 Craft Ledger

Human-readable view of [.craft/ledger.yml](.craft/ledger.yml). The ledger is
the source of truth; this page is a linked status and navigation surface.

## Quick Links

- Root context: [CTX-CAV2-ROOT](#context-ctx-cav2-root)
- Definition tower work: [CTX-CAV2-DEF-TOWERS](#context-ctx-cav2-def-towers)
- Authority imports: [CTX-CAV2-AUTHORITY-IMPORTS](#context-ctx-cav2-authority-imports)
- Constitution towers: [CTX-CAV2-CONSTITUTION-TOWERS](#context-ctx-cav2-constitution-towers)
- Craft execution surface: [CTX-CAV2-CRAFT-SURFACE](#context-ctx-cav2-craft-surface)
- Boundary review: [CTX-CAV2-BOUNDARY](#context-ctx-cav2-boundary)
- Mint feature (new 2026-06-29): `CTX-CAV2-MINT` + 6 sub-contexts in [.craft/ledger.yml](.craft/ledger.yml) · resolved design + plan: [refine RESULT](development/refinement-runs/20260629T0000Z-cav2-mint-feature/RESULT.md) _(full human-view section regenerable from ledger)_
- DomainSpec v2 (new 2026-06-29): [CTX-CAV2-DOMAINSPEC-V2](#context-ctx-cav2-domainspec-v2) — v2 rework of the DomainSpec pillar · v1→v2 import triage done ([findings](../projects/domainspec-v2/research/2026-06-29-v1-import-triage/findings.md))
- Interactive Ontology Learning Map: [CTX-CAV2-IOLM](#context-ctx-cav2-iolm) — `SWU-IOLM-00C-A` and fresh UI-A1 rebind pass; [workable-example child](#context-ctx-cav2-iolm-workable-example) selects UI-A2; independently, 00C-B awaits a passing upstream support receipt
- Blocking decisions: [DEC-CAV2-VISIBLE-SPACES-001](#decision-dec-cav2-visible-spaces-001), [DEC-CAV2-PUBLIC-PRIVATE-001](#decision-dec-cav2-public-private-001)
- Active blockers: [BLK-CAV2-SOURCE-TRUTH-001](#blocker-blk-cav2-source-truth-001), [BLK-CAV2-PUBLIC-PRIVATE-001](#blocker-blk-cav2-public-private-001), [BLK-CAV2-VISIBLE-SPACES-001](#blocker-blk-cav2-visible-spaces-001)
- Active IOLM authority gate: [GATE-CAV2-IOLM-SG-001](#gate-gate-cav2-iolm-sg-001)
- Applied IOLM posture refresh: [2026-07-20 receipt](development/interactive-ontology-learning-map/refreshes/2026-07-20-candidate-posture-apply/REFRESH-REPORT.md)
- Definition towers artifact: [authority/definitions/DEFINITION-TOWERS.md](authority/definitions/DEFINITION-TOWERS.md)
- Definition localization route: [authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md](authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md)
- Primordial definition cluster: [authority/definitions/source-clusters/primordial.md](authority/definitions/source-clusters/primordial.md)
- Arcanum definition cluster: [authority/definitions/source-clusters/arcanum.md](authority/definitions/source-clusters/arcanum.md)
- Invoke report: [development/invoke/definition-towers/INVOKE-RESULT.md](development/invoke/definition-towers/INVOKE-RESULT.md)

## Contexts

### <a id="context-ctx-cav2-root"></a>CTX-CAV2-ROOT - CyberAlchemy v2 Stable Repository Consolidation

- Stage: `define`
- Gate: `flag`
- Purpose: keep the next stable repository work source-ledgered, authority-bounded, and executable from Craft.
- Current next move: cluster, deduplicate, and localize the 149 staged definition candidates after promoting D29-D39 from the primordial basis.

### <a id="context-ctx-cav2-spaces"></a>CTX-CAV2-SPACES - Project, Source, And Execution Spaces

- Stage: `define`
- Gate: `flag`
- Purpose: map every relevant project area, source corpus, and Craft execution node before deeper promotion work.
- Current next move: review the project/source/Craft space map and close or defer [DEC-CAV2-VISIBLE-SPACES-001](#decision-dec-cav2-visible-spaces-001).
- Evidence: [authority/definitions/DEFINITION-TOWERS.md](authority/definitions/DEFINITION-TOWERS.md), [SOURCE-MAP.md](SOURCE-MAP.md), [.arcanum inventory index](../.arcanum/inventory/index.md), [.arcanum ontology map](../.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md)

### <a id="context-ctx-cav2-def-towers"></a>CTX-CAV2-DEF-TOWERS - Definition Towers And Promotion Queue

- Stage: `define`
- Gate: `flag`
- Purpose: organize high-to-low definition towers for CyberAlchemy, Arcanum, DomainSpec, Craft, knowledge governance, research/product, and validation/ops terms.
- Current next move: classify `artifact` as the last explicit T-1 candidate, then cluster remaining definition candidates by tower, source family, authority posture, and promotion action.
- Evidence: [authority/definitions/DEFINITION-TOWERS.md](authority/definitions/DEFINITION-TOWERS.md), [authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md](authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md), [authority/definitions/source-clusters/primordial.md](authority/definitions/source-clusters/primordial.md), [authority/definitions/source-clusters/arcanum.md](authority/definitions/source-clusters/arcanum.md), [authority/definitions/DEFINITIONS.md](authority/definitions/DEFINITIONS.md), [authority/imports/definitions/MANIFEST.md](authority/imports/definitions/MANIFEST.md)

### <a id="context-ctx-cav2-authority-imports"></a>CTX-CAV2-AUTHORITY-IMPORTS - Authority Imports And Candidate Clustering

- Stage: `define`
- Gate: `flag`
- Purpose: classify staged definitions, constitutions, axioms, and rule candidates before local promotion.
- Current next move: convert the 149 definition candidates into v2-local representation clusters by tower, source family, authority posture, and promotion action.
- Evidence: [authority/imports/definitions/MANIFEST.md](authority/imports/definitions/MANIFEST.md), [authority/imports/constitutions/MANIFEST.md](authority/imports/constitutions/MANIFEST.md)

### <a id="context-ctx-cav2-constitution-towers"></a>CTX-CAV2-CONSTITUTION-TOWERS - Constitution, Axiom, And Rule Towers

- Stage: `define`
- Gate: `flag`
- Purpose: group constitution and rule sources into towers before composing any CyberAlchemy v2 constitution pack.
- Current next move: cluster 106 constitution and axiom candidates into rule towers before composing a v2 constitution pack.
- Evidence: [authority/imports/constitutions/MANIFEST.md](authority/imports/constitutions/MANIFEST.md), [authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md](authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md)

### <a id="context-ctx-cav2-craft-surface"></a>CTX-CAV2-CRAFT-SURFACE - Craft Execution Surface

- Stage: `execute`
- Gate: `flag`
- Purpose: make Craft the local executable ledger for definition towers, blockers, decisions, gaps, next moves, and later recomposition.
- Current next move: prepare a bounded Craft schema-migration task for [GAP-CAV2-CRAFT-SCHEMA-DRIFT-001](#gap-gap-cav2-craft-schema-drift-001), while keeping [.craft/ledger.yml](.craft/ledger.yml), [.craft/index.json](.craft/index.json), and this view synchronized.
- Evidence: [.craft/ledger.yml](.craft/ledger.yml), [.craft/index.json](.craft/index.json)

### <a id="context-ctx-cav2-boundary"></a>CTX-CAV2-BOUNDARY - Public/Private And Visibility Boundary

- Stage: `validate`
- Gate: `flag`
- Purpose: prevent private implementation evidence, validation evidence, and read-model surfaces from becoming public or canonical by proximity.
- Current next move: resolve public/private and visible-space decisions before standalone extraction.
- Evidence: [SOURCE-MAP.md](SOURCE-MAP.md), [authority/promotion-policy.md](authority/promotion-policy.md)

### <a id="context-ctx-cav2-execution"></a>CTX-CAV2-EXECUTION - Work-Pack And Task-Session Execution Path

- Stage: `plan`
- Gate: `flag`
- Purpose: convert classified tower work into bounded implementation or governance tasks only after promotion and boundary gates are clear enough.
- Current next move: after import clustering, create a bounded work-pack or task-session slice from this ledger.
- Evidence: [development/invoke/definition-towers/INVOKE-RESULT.md](development/invoke/definition-towers/INVOKE-RESULT.md)

### <a id="context-ctx-cav2-domainspec-v2"></a>CTX-CAV2-DOMAINSPEC-V2 - DomainSpec v2 — Pillar Rework

- Stage: `define`
- Gate: `flag`
- Parent: [CTX-CAV2-ROOT](#context-ctx-cav2-root) (recomposes into root) · sibling of the Mint feature (`CTX-CAV2-MINT`)
- Purpose: a fresh v2 design effort for the DomainSpec pillar (the *what* — typed intent → engine / Lean kernel), reworked as a peer cav2 workstream. Opened 2026-06-29 on user request; not yet scoped into blockers, decisions, gaps, or owned artifacts.
- Current next move: DomainSpec v2 live state is owned by its [scoped Craft ledger](../projects/domainspec-v2/.craft/ledger.yml). The [2026-07-23 BTE L0A/L0B route](../projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/PLAN.md) is validated; `SWU-BTE-L0A-001` is the sole dependency-ready, unselected candidate. It publishes complete contracts before the validation owner freezes matching red cases for L0B. UI remains independent; IOLM and Body War consumer execution waits for the shared core.

### <a id="context-ctx-cav2-iolm"></a>CTX-CAV2-IOLM - Interactive Ontology Learning Map

- Stage: `plan`
- Gate: `block`
- Parent: [CTX-CAV2-ROOT](#context-ctx-cav2-root)
- Purpose: govern the private, deterministic, source-preserving learning-map project that renders one shared read model as graph, hierarchy, and table without converting projection or pedagogy into source authority.
- Current next move: fresh A1 rebind `20260723T002902Z-current-fixture-rebind` passed and returned a current-generation `iolm-fixture-boundary/v1`; select exactly one A2 regeneration in the A2 implementation subset and a new regeneration-evidence directory while A3 and A4 remain gated. Separately, 00C-B remains selected and blocked pending upstream cross-feature support, 00C-C remains unselected, and [GATE-CAV2-IOLM-SG-001](#gate-gate-cav2-iolm-sg-001) remains open for later authority rebind.
- Evidence: [context](development/interactive-ontology-learning-map/CONTEXT.md), [active work-pack](development/interactive-ontology-learning-map/WORK-PACK.md), [A2 result](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/RESULT.md), [A2 receipt](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/execution-receipt.json), [00C-B decision](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/DECISION-GATE.md)

### <a id="context-ctx-cav2-iolm-workable-example"></a>CTX-CAV2-IOLM-WORKABLE-EXAMPLE - IOLM Fixture-Backed Workable Example

- Stage: `execute`
- Gate: `ready`
- Parent: [CTX-CAV2-IOLM](#context-ctx-cav2-iolm)
- Purpose: deliver one private, pinned-fixture, runnable learning-map sidecar through four sequential risk-domain SWUs without weakening the compiler-backed candidate proof, DomainSpec authority, or publication boundary.
- Current next move: build a strict Context Pack and compact Goal for one `SWU-IOLM-00C-UI-A2` regeneration; bind the exact fresh A1 receipt and guarded Key-and-Door bundle immediately before mutation, write only the A2 subset plus a new regeneration lifecycle, and stop at a fresh `iolm-demo-snapshot/v1`.
- Owned planning artifacts: [task](development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md) and [wave](development/interactive-ontology-learning-map/work-pack/waves/W0C-UI.md).
- Evidence inputs: [accepted findings](development/research/2026-07-22-iolm-workable-example/findings.md), [A2 result](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/RESULT.md), [A2 receipt](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/execution-receipt.json), and the versioned A1 boundary plus A2 snapshot artifacts.

## Decisions

### <a id="decision-dec-cav2-tower-altitude-001"></a>DEC-CAV2-TOWER-ALTITUDE-001 - Tower Altitude

- Question: Should CyberAlchemy v2 be the umbrella, Arcanum and DomainSpec be pillars, and Craft be an Arcanum-owned execution sub-tower with local priority?
- Status: `active`, non-blocking
- Current selection: `umbrella-pillars-craft-subtower`
- Default direction: `umbrella-pillars-craft-subtower`
- Impact: lets mapping continue while definitions-governance remains responsible for term promotion.
- Evidence: [authority/definitions/DEFINITION-TOWERS.md](authority/definitions/DEFINITION-TOWERS.md)

### <a id="decision-dec-cav2-visible-spaces-001"></a>DEC-CAV2-VISIBLE-SPACES-001 - Visible Inventory/Ontology Spaces

- Question: Should CyberAlchemy v2 keep visible `inventory/` and `ontology/` spaces, or hide them under `.arcanum` with exported docs before standalone extraction?
- Status: `closed`, non-blocking
- Current selection: `code-first-candidate-later-authority-rebind`
- Default direction: `keep-visible-project-spaces`
- Impact: blocks standalone extraction and final architecture authority, but not local tower mapping.
- Evidence: [SOURCE-MAP.md](SOURCE-MAP.md)

### <a id="decision-dec-cav2-public-private-001"></a>DEC-CAV2-PUBLIC-PRIVATE-001 - Public/Private Evidence Boundary

- Question: Which private implementation and validation evidence may influence public or standalone CyberAlchemy v2 artifacts?
- Status: `closed`, `non-blocking`
- Current selection: `code-first-candidate-later-authority-rebind`
- Default direction: `public-safe-pattern-cards-after-scrub`
- Impact: blocks public-facing reuse and extraction, but not private local classification.
- Evidence: [SOURCE-MAP.md](SOURCE-MAP.md)

### <a id="decision-dec-cav2-definition-localization-001"></a>DEC-CAV2-DEFINITION-LOCALIZATION-001 - Definition Localization Route

- Question: Should imported definitions remain external references, or should CyberAlchemy v2 hold project-local representations for all definition material?
- Status: `closed`, non-blocking
- Current selection: `v2-local-definition-space`
- Default direction: `v2-local-definition-space`
- Impact: changes the next definition step from reference-only linking to v2-local source-cluster representation with provenance and authority posture.
- Evidence: [authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md](authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md)

### <a id="decision-dec-cav2-iolm-posture-001"></a>DEC-CAV2-IOLM-POSTURE-001 - Learning-Map Execution Posture

- Question: should the Interactive Ontology Learning Map preserve the assurance-first route, or adopt a code-first candidate graph with later authority rebind?
- Status: `closed`, non-blocking
- Current selection: `code-first-candidate-later-authority-rebind`
- Default direction: `code-first-candidate-later-authority-rebind`
- Rationale: the operator selected option 1 through Decision Gate on 2026-07-20 to gain reversible private learning evidence while preserving one pipeline and the later owner-issued authority gate.
- Impact: L0C is active and `SWU-IOLM-00C-A` passed; no next unit is selected and authoritative labeling/rebind still requires G-DSV2-SG.
- Evidence: [proposal-only refresh](development/interactive-ontology-learning-map/refreshes/2026-07-15-minted-runtime-route/REFRESH-REPORT.md), [patch proposal](development/interactive-ontology-learning-map/refreshes/2026-07-15-minted-runtime-route/REFRESH-PATCH-PROPOSAL.md), [applied refresh](development/interactive-ontology-learning-map/refreshes/2026-07-20-candidate-posture-apply/REFRESH-REPORT.md), [active work-pack](development/interactive-ontology-learning-map/WORK-PACK.md)

### <a id="decision-dec-cav2-iolm-00c-b-cross-feature-001"></a>DEC-CAV2-IOLM-00C-B-CROSS-FEATURE-001 - Cross-Feature Candidate Graph Route

- Question: how should IOLM obtain the cross-feature candidate graph required by 00C-B without weakening its proof or mutating DomainSpec outside authority?
- Status: `closed`, non-blocking decision; implementation still blocked upstream
- Current selection: `route-upstream-cross-feature-support`
- Default direction: `route-upstream-cross-feature-support`
- Rationale: the operator selected option 1 on 2026-07-20, preserving the two-feature criterion and the DomainSpec compiler as conformance authority.
- Impact: blocks 00C-B prototype mutation and 00C-C selection; does not affect 00C-A or the independent L0A authority gate.
- Evidence: [Decision Gate](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/DECISION-GATE.md), [blocked receipt](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/execution-receipt.json)

## Blockers

### <a id="blocker-blk-cav2-source-truth-001"></a>BLK-CAV2-SOURCE-TRUTH-001

- Lane: `governance`
- Status: `active`, `refined`
- Role: `definitions_governance`
- Human required: `true`
- Closure: definition candidates have v2-local representation records with provenance, authority posture, and promotion route before promotion.
- Linked decision: [DEC-CAV2-TOWER-ALTITUDE-001](#decision-dec-cav2-tower-altitude-001)
- Evidence: [authority/imports/definitions/MANIFEST.md](authority/imports/definitions/MANIFEST.md)

### <a id="blocker-blk-cav2-public-private-001"></a>BLK-CAV2-PUBLIC-PRIVATE-001

- Lane: `governance`
- Status: `active`, `refined`
- Role: `decision_gate`
- Human required: `true`
- Closure: [DEC-CAV2-PUBLIC-PRIVATE-001](#decision-dec-cav2-public-private-001) closes with public/private derivative rules and evidence links.
- Evidence: [SOURCE-MAP.md](SOURCE-MAP.md)

### <a id="blocker-blk-cav2-visible-spaces-001"></a>BLK-CAV2-VISIBLE-SPACES-001

- Lane: `architecture`
- Status: `active`, `typed`
- Role: `decision_gate`
- Human required: `true`
- Closure: [DEC-CAV2-VISIBLE-SPACES-001](#decision-dec-cav2-visible-spaces-001) closes or defers with explicit extraction-stage rationale.
- Evidence: [SOURCE-MAP.md](SOURCE-MAP.md)

## IOLM Gate And Enabler

### <a id="gate-gate-cav2-iolm-sg-001"></a>GATE-CAV2-IOLM-SG-001

- Type: `authority_gate`
- Lane: `governance`, with auditor and validator review
- Status: `block`
- Scope: blocks authoritative FPR graph labeling and L0A rebind only; selected L0C candidate work may proceed, but its receipts cannot satisfy this gate.
- Closure: existing FPR owners issue the exact prerequisite and bounded `Sg` receipts, then `TASK-IOLM-000B` verifies the bound read-only handle.
- Evidence: [active work-pack](development/interactive-ontology-learning-map/WORK-PACK.md)

### <a id="enabler-ena-cav2-iolm-owner-001"></a>ENA-CAV2-IOLM-OWNER-001

- Type: `authority_enabler`
- Status: `pass`
- Owner route: `private-learning-map-product-owner`
- Boundary: owns private projection fields and lifecycle only; it does not own DomainSpec semantics, CAV2 canonical kinds, Craft authority, or publication.
- Evidence: [G-OWNER decision](development/interactive-ontology-learning-map/work-pack/shared/G-OWNER-DECISION.md)

## Gaps

### <a id="gap-gap-cav2-term-clustering-001"></a>GAP-CAV2-TERM-CLUSTERING-001

- Severity: `flag`
- Treatment: `plan`
- Owner route: `definitions-governance`
- Summary: the 149 definition candidates are staged but not clustered by tower, source family, term type, or authority posture.

### <a id="gap-gap-cav2-duplicate-detection-001"></a>GAP-CAV2-DUPLICATE-DETECTION-001

- Severity: `flag`
- Treatment: `plan`
- Owner route: `definitions-governance`
- Summary: duplicate and conflicting terms across Arcanum, DomainSpec, CyberAlchemy, MARS, Ontologize, project glossaries, and research towers have not been detected.

### <a id="gap-gap-cav2-constitution-clustering-001"></a>GAP-CAV2-CONSTITUTION-CLUSTERING-001

- Severity: `flag`
- Treatment: `plan`
- Owner route: `constitution-governance`
- Summary: constitution, axiom, quality-bar, and anti-pattern sources are staged but not clustered into rule towers or composition packs.

### <a id="gap-gap-cav2-workpack-001"></a>GAP-CAV2-WORKPACK-001

- Severity: `deferred`
- Treatment: `split`
- Owner route: `invoke plan then task-session`
- Summary: no bounded work-pack or task-session slice exists yet for executing definition clustering from the Craft surface.

### <a id="gap-gap-cav2-local-representation-001"></a>GAP-CAV2-LOCAL-REPRESENTATION-001

- Severity: `flag`
- Treatment: `plan`
- Owner route: `Craft + definitions-governance`
- Summary: the Arcanum and primordial source clusters are represented; remaining source definition candidates need project-local representation records before promotion or non-promotion decisions can be compared.

### <a id="gap-gap-cav2-craft-schema-drift-001"></a>GAP-CAV2-CRAFT-SCHEMA-DRIFT-001

- Severity: `block`
- Treatment: `plan`
- Owner: Craft maintenance via a bounded task-session
- Summary: canonical Craft core validation reports 41 pre-existing legacy-shape issues across artifact statuses, gap fields, relation fields, one enabler type, and one decision type. The indexes are now fresh and exhaustive, but they do not waive source-ledger schema drift.
- Evidence: [.craft/ledger.yml](.craft/ledger.yml), [canonical ledger-core schema](../arcanum/arcana/craft/templates/schemas/ledger-core.schema.yml)

## Promoted Definitions

- **CyberAlchemy v2** - [CAV2-D9](authority/definitions/DEFINITIONS.md#cav2-d9-cyberalchemy-v2)
- **definition tower** - [CAV2-D10](authority/definitions/DEFINITIONS.md#cav2-d10-definition-tower)
- **tower space** - [CAV2-D11](authority/definitions/DEFINITIONS.md#cav2-d11-tower-space)
- **Craft execution surface** - [CAV2-D12](authority/definitions/DEFINITIONS.md#cav2-d12-craft-execution-surface)
- **authority promotion queue** - [CAV2-D13](authority/definitions/DEFINITIONS.md#cav2-d13-authority-promotion-queue)
- **source space** - [CAV2-D14](authority/definitions/DEFINITIONS.md#cav2-d14-source-space)
- **project space** - [CAV2-D15](authority/definitions/DEFINITIONS.md#cav2-d15-project-space)
- **typed coupling invariant** - [CAV2-D16](authority/definitions/DEFINITIONS.md#cav2-d16-typed-coupling-invariant)
- **reflection tower method** - [CAV2-D17](authority/definitions/DEFINITIONS.md#cav2-d17-reflection-tower-method)
- **residue** - [CAV2-D18](authority/definitions/DEFINITIONS.md#cav2-d18-residue)
- **ontology** - [CAV2-D19](authority/definitions/DEFINITIONS.md#cav2-d19-ontology)
- **Craft method** - [CAV2-D20](authority/definitions/DEFINITIONS.md#cav2-d20-craft-method)
- **four-facet action method** - [CAV2-D21](authority/definitions/DEFINITIONS.md#cav2-d21-four-facet-action-method)
- **orthogonal classification** - [CAV2-D22](authority/definitions/DEFINITIONS.md#cav2-d22-orthogonal-classification)
- **authority lifecycle axis** - [CAV2-D23](authority/definitions/DEFINITIONS.md#cav2-d23-authority-lifecycle-axis)
- **provenance-first navigation** - [CAV2-D24](authority/definitions/DEFINITIONS.md#cav2-d24-provenance-first-navigation)
- **schema amendment witness** - [CAV2-D25](authority/definitions/DEFINITIONS.md#cav2-d25-schema-amendment-witness)
- **append-only event ledger** - [CAV2-D26](authority/definitions/DEFINITIONS.md#cav2-d26-append-only-event-ledger)
- **residue entropy** - [CAV2-D27](authority/definitions/DEFINITIONS.md#cav2-d27-residue-entropy)
- **value-cycle edge guard** - [CAV2-D28](authority/definitions/DEFINITIONS.md#cav2-d28-value-cycle-edge-guard)
- **axis orthogonality invariant** - [CAV2-D29](authority/definitions/DEFINITIONS.md#cav2-d29-axis-orthogonality-invariant)
- **bounded recursive self-application** - [CAV2-D30](authority/definitions/DEFINITIONS.md#cav2-d30-bounded-recursive-self-application)
- **primitive type** - [CAV2-D31](authority/definitions/DEFINITIONS.md#cav2-d31-primitive-type)
- **method** - [CAV2-D32](authority/definitions/DEFINITIONS.md#cav2-d32-method)
- **definition** - [CAV2-D33](authority/definitions/DEFINITIONS.md#cav2-d33-definition)
- **authority** - [CAV2-D34](authority/definitions/DEFINITIONS.md#cav2-d34-authority)
- **provenance** - [CAV2-D35](authority/definitions/DEFINITIONS.md#cav2-d35-provenance)
- **traceability** - [CAV2-D36](authority/definitions/DEFINITIONS.md#cav2-d36-traceability)
- **gate** - [CAV2-D37](authority/definitions/DEFINITIONS.md#cav2-d37-gate)
- **claim <= proof** - [CAV2-D38](authority/definitions/DEFINITIONS.md#cav2-d38-claim-proof-bound)
- **intent** - [CAV2-D39](authority/definitions/DEFINITIONS.md#cav2-d39-intent)

## Pending By Node

| Node | Pending |
| --- | --- |
| CTX-CAV2-ROOT | Cluster, deduplicate, and localize the 149 staged definition candidates now that Operational Ontology and the D29-D39 primordial-basis terms are resolved. |
| CTX-CAV2-SPACES | DEC-CAV2-VISIBLE-SPACES-001 remains blocking for extraction readiness. |
| CTX-CAV2-DEF-TOWERS | Classify `artifact` as the last explicit T-1 candidate, then cluster remaining definition candidates by tower, source family, authority posture, and promotion action; BLK-CAV2-SOURCE-TRUTH-001, GAP-CAV2-DUPLICATE-DETECTION-001, and GAP-CAV2-LOCAL-REPRESENTATION-001 remain active. |
| CTX-CAV2-AUTHORITY-IMPORTS | GAP-CAV2-TERM-CLUSTERING-001; convert candidates into v2-local representation clusters. |
| CTX-CAV2-CONSTITUTION-TOWERS | GAP-CAV2-CONSTITUTION-CLUSTERING-001. |
| CTX-CAV2-CRAFT-SURFACE | **Block:** GAP-CAV2-CRAFT-SCHEMA-DRIFT-001 records 41 pre-existing canonical core-schema issues. Index integrity is repaired; source-row migration remains a separate bounded task. |
| CTX-CAV2-BOUNDARY | DEC-CAV2-PUBLIC-PRIVATE-001 and DEC-CAV2-VISIBLE-SPACES-001. |
| CTX-CAV2-EXECUTION | GAP-CAV2-WORKPACK-001; create a work-pack after import clustering. |
| CTX-CAV2-DOMAINSPEC-V2 | PIVOT: v2 = implementation home, v1 to be frozen. Batch 1+2 forked engine+docs+validators → impl/ + IMPORT-MANIFEST. **impl/ FULLY GREEN 2026-06-30** (npm; engine:test 97/97 · tags:test 8/8 · validate RC 0 · typecheck RC 0). Pending: Batch 3 (audit/layering reformulate); reformulate 6 imported-verbatim docs; v1-freeze; G4 gate-in-CI. Residue: C10/lint vacuous until a real feature lands; attestation fire-point + provability-as-moat bet (commercialization decision-gate); the Lean-positioning question still open. |
| CTX-CAV2-IOLM | **Block:** 00C-B still lacks a passing upstream cross-feature-support receipt and GATE-CAV2-IOLM-SG-001 remains open for L0A only. Independently, fixture policy is resolved, fresh A1 rebind `20260723T002902Z-current-fixture-rebind` passed, A2 regeneration is selected, A3-A4 are gated, and historical A1-A4 evidence remains immutable. |
| CTX-CAV2-IOLM-WORKABLE-EXAMPLE | **Ready:** bind the fresh A1 receipt and guarded current Key-and-Door bundle through one A2 Task Session; stop at `iolm-demo-snapshot/v1`. |

## Artifacts

- [.craft/ledger.yml](.craft/ledger.yml) - machine source of truth.
- [.craft/index.json](.craft/index.json) - derived lookup index.
- [CRAFT.md](CRAFT.md) - this human view.
- [authority/definitions/DEFINITION-TOWERS.md](authority/definitions/DEFINITION-TOWERS.md) - candidate tower map.
- [authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md](authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md) - route for localizing imported definitions inside v2.
- [authority/definitions/source-clusters/primordial.md](authority/definitions/source-clusters/primordial.md) - primordial source cluster; D29-D39 are promoted from this cluster and `artifact` remains the next T-1 review candidate.
- [authority/definitions/source-clusters/arcanum.md](authority/definitions/source-clusters/arcanum.md) - v2-local representation rows for Arcanum-wide definitions.
- [development/invoke/definition-towers/INVOKE-RESULT.md](development/invoke/definition-towers/INVOKE-RESULT.md) - Invoke define report.
- [authority/imports/definitions/MANIFEST.md](authority/imports/definitions/MANIFEST.md) - definition import ledger.
- [authority/imports/constitutions/MANIFEST.md](authority/imports/constitutions/MANIFEST.md) - constitution import ledger.
- [development/interactive-ontology-learning-map/CONTEXT.md](development/interactive-ontology-learning-map/CONTEXT.md) - private learning-map context contract.
- [development/interactive-ontology-learning-map/WORK-PACK.md](development/interactive-ontology-learning-map/WORK-PACK.md) - active work-pack; superseded UI-A is non-runnable, historical A1-A4 evidence is preserved, fresh A1 rebind passed, A2 regeneration is selected, A3-A4 are gated, and 00C-B remains selected and blocked.
- [development/interactive-ontology-learning-map/EXECUTION-PACK.md](development/interactive-ontology-learning-map/EXECUTION-PACK.md) - bounded execution handoff with the independent four-unit W0C-UI wave active.
- [development/interactive-ontology-learning-map/DISPATCH.json](development/interactive-ontology-learning-map/DISPATCH.json) - route shape with sequential A1–A4 Task Session siblings and unchanged compiler/authority gates.
- [development/interactive-ontology-learning-map/work-pack/shared/G-OWNER-DECISION.md](development/interactive-ontology-learning-map/work-pack/shared/G-OWNER-DECISION.md) - accepted bounded projection-owner decision.
- [development/interactive-ontology-learning-map/refreshes/2026-07-15-minted-runtime-route/REFRESH-REPORT.md](development/interactive-ontology-learning-map/refreshes/2026-07-15-minted-runtime-route/REFRESH-REPORT.md) - proposal-only candidate-first refresh.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-A/RESULT.md](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-A/RESULT.md) - passing candidate-contract Task Session receipt.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/DECISION-GATE.md](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/DECISION-GATE.md) - closed option-1 route decision.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/execution-receipt.json](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/execution-receipt.json) - Task Session block receipt; no prototype mutation.
- [development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md](development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md) - active parent contract split into A1–A4; fresh A1 current-fixture rebind passed, A2 regeneration is selected, A3-A4 are gated, and all historical receipts remain immutable.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A1/RESULT.md](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A1/RESULT.md) - passing A1 Task Session result and `iolm-fixture-boundary/v1` handle.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A1/execution-receipt.json](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A1/execution-receipt.json) - machine A1 receipt used to select A2.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/RESULT.md](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/RESULT.md) - passing A2 Task Session result and `iolm-demo-snapshot/v1` handle.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/execution-receipt.json](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A2/execution-receipt.json) - machine A2 receipt used to select A3.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A3/RESULT.md](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A3/RESULT.md) - passing A3 Task Session result and `iolm-interactive-viewer/v1` handle.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A3/execution-receipt.json](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A3/execution-receipt.json) - machine A3 receipt used to select A4.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A4/RESULT.md](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A4/RESULT.md) - terminal A4 `BLOCK/FAIL`; no browser-acceptance handle emitted.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A4/execution-receipt.json](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A4/execution-receipt.json) - machine A4 block receipt and exact fail-fast residue.
- [development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A4/DEFECT-RECEIPT.md](development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A4/DEFECT-RECEIPT.md) - Firefox text-node event-target defect routed to A3.
- [development/interactive-ontology-learning-map/work-pack/waves/W0C-UI.md](development/interactive-ontology-learning-map/work-pack/waves/W0C-UI.md) - independent four-unit sequential wave after 00C-A.

## Boundary Check

This Craft update records the four-unit execution route inside the existing child
context while retaining the closed option-1 Decision Gate and upstream-receipt
block. It created no workable-example implementation or 00C-B prototype source
and did not mutate public Arcanum, DomainSpec compiler/source authority, FPR state,
production, or publication state.
