---
title: Ontology Materialization Architecture
status: design-flag
mode: invoke-design
created: 2026-06-18
source_packet: research/2026-06-18-materialization-model/findings.md
---

# Ontology Materialization Architecture

## Architecture Intent

Create a build-from-owned architecture for `projects/ontology` that materializes the already-owned ontology ladder without promoting a new convention:

```text
source selector -> InventoryEvidence -> OntologyCandidate -> PromotionRecord -> governed projection / retrieval view
```

The architecture makes one thing possible first: a small, addressable fixture pack proving how a source claim moves through evidence, candidate meaning, governance, and projection without treating a file path or generated inventory page as ontology authority.

## Source Contracts

| Contract ID | Source | Required | Notes |
| --- | --- | --- | --- |
| SC-001 | `projects/ontology/research/2026-06-18-materialization-model/findings.md` | yes | Approved research synthesis and reviewer-gated witness model. |
| SC-002 | `projects/ontology/research/2026-06-18-materialization-model/research.md` | yes | Raw explorer returns; source-preserving evidence bundle. |
| SC-003 | `arcanum/development/cyberalchemy-ontology-lifecycle/ONTOLOGY-ARCHITECTURE.md` | yes | PromotionRecord boundary, authority levels, adapter rules, branch authority model. Public Arcanum source; do not write private evidence back into it. |
| SC-004 | `arcanum/development/cyberalchemy-ontology-lifecycle/PROMOTION-LIFECYCLE.md` | yes | Promotion lifecycle gates and confidence/commitment separation. |
| SC-005 | `projects/ontologize/ONTOLOGY-BRANCHES.md` | yes | B1 meaning, B2 system, B3 run-context, B4 bridge source contract; candidate design only. |
| SC-006 | `projects/ontologize/DAG-AND-METRICS.md` | yes | Node/edge law, drift vs contradiction, no-auto-promotion rule. |
| SC-007 | `projects/ontologize/development/view-triad-method/BRANCH-MATERIALIZATION.md` | yes | Built triad materialization precedent and non-goal against standalone branch-view before owner decision. |
| SC-008 | `.arcanum/inventory/README.md`, `.arcanum/inventory/schema.md`, `.arcanum/inventory/index.md` | yes | Existing local inventory conventions; generated read model, not source authority. |
| SC-009 | `cyberAlchemy/agentic-system-inventory-ontology-pipeline.md`, `cyberAlchemy/agentic-system-ontology-entry-model.md` | yes | Thick-entry and anti-pointer ontology contract. |
| SC-010 | `research/cyber-alchemy-space/findings.md` | yes | Owner-decision ledger for branch-as-view, run-view producer, residue extraction, artifact catalog class, authority tie-break. |

## View 1: Context View

`projects/ontology` sits in the private `domainspec-core` parent as a project-local ontology materialization surface. It composes evidence from public Arcanum, private DomainSpec/Ontologize research, CyberAlchemy agent ontology material, and the local `.arcanum` runtime substrate.

Boundary rules:

- Raw source files remain source evidence.
- `.arcanum/inventory/` remains the generated compiled read model and evidence-card substrate.
- `.arcanum/ontology-vault/` may hold generated maps, validation reports, drift reports, and confidence/promotion reviews.
- `projects/ontology/` holds human-visible witness artifacts, schemas, candidate nodes, blocked promotion records, projections, and owner-decision stubs.
- `arcanum/` is public. Private parent evidence must not be written into public Arcanum artifacts without a separate public-boundary pass.

Actors:

- Owner/operator: resolves OD decisions and approves any convention or public-facing promotion.
- Authoring agent: uses invoke/design artifacts to prepare architecture and plan-ready handoff.
- Inventory runtime: catalogs evidence and selector-level cards.
- Ontology Vault runtime: maps branches, validates bridge claims, reviews confidence and promotion.
- Context Builder runtime: proves downstream agents can retrieve only the needed context.
- Future task-session: materializes the fixture pack when the architecture is accepted.

## View 2: High-Level Structure View

```text
source contracts
  -> source manifest
  -> inventory evidence cards / optional CSV evidence index
  -> ontology candidate nodes
  -> PromotionRecord governance objects
  -> governed projections
  -> candidate OD-1 branch-as-view projection
  -> context-builder retrieval proof
```

Major parts:

| Part | Responsibility | Status |
| --- | --- | --- |
| `sources/manifest.md` | Declares source corpus, source roles, and source authority notes. | planned |
| `inventory/evidence.csv` | Optional compiled evidence index for raw/tabular lookup. Not authority. | planned |
| `inventory/evidence-cards/` | Selector-level Markdown evidence cards with source refs, authority level, promotion owner, trace, and residue. | planned |
| `candidates/` | Thick ontology candidates with claim, branch target, evidence, confidence, invalidation, review owner, and agent-use payload. | planned |
| `promotions/` | PromotionRecord fixtures governing candidate transition state. | planned |
| `views/` | Governed projections over candidates and evidence. | planned |
| `candidate-projections/branch-as-view-OD-1/` | Four-view candidate projection only if/while OD-1 remains unresolved. | planned |
| `decisions/` | Owner decision stubs and later decision-gate outputs. | planned |

## View 3: Low-Level Components View

### Artifact Classes

| Class | Owns | Does Not Own |
| --- | --- | --- |
| `source` | Original evidence and authored context. | Ontology meaning or promotion. |
| `evidence` | Selector, summary, authority note, promotion owner, trace, residue. | Final meaning. |
| `candidate_node` | Thick draft claim with branch, evidence, confidence, invalidation, review owner, and agent use. | Promotion. |
| `promotion_record` | Governed transition for one claim or decision. | Ontology node content or raw source dump. |
| `branch_view` | Thick projection over candidate/promoted nodes. | Source authority. |
| `decision` | Owner choice, rationale, rejected alternatives, blocker state. | Implicit promotion. |
| `generated_read_model` | Compiled lookup and synthesis. | Canonical source truth. |

### Node Eligibility

A file materializes an ontology node only when it carries:

- `kind`
- `claim`
- `branchTarget`
- `status`
- `evidence`
- `confidence`
- `promotionGate` or `promotionRecord`
- `reviewOwner`
- `invalidation`
- `agentUse`

Otherwise, it is a source, evidence card, decision, promotion record, projection, or generated read model.

### PromotionRecord Fixture Fields

The first fixture uses the schema names from the source architecture:

- `claim`
- `claimType`
- `branchTarget`
- `status`
- `sourceInputs`
- `provenance`
- `evidenceConfidence`
- `commitmentConfidence`
- `reviewOwner`
- `gateResult`
- `contradictionPath`
- `rollbackOrRetirement`
- `bridgeValidation`

Use `branchTarget: Bridge` for the initial four-branch substrate candidate and `gateResult: block` while OD-1 and OD-2 remain unresolved.

## View 4: Workflow Process View

### Authoring Flow

```text
invoke design
  -> architecture bundle
  -> glossary consistency report
  -> plan-ready handoff notes
  -> task-session or invoke plan
```

### First Materialization Flow

```text
source contract selected
  -> source manifest row
  -> evidence card IE-0001
  -> candidate node OC-0001
  -> PromotionRecord PR-0001
  -> bridge projection example
  -> context-builder proof
```

Failure and compensation:

- If evidence lacks source refs, stop before candidate creation.
- If a candidate lacks node-eligibility fields, keep it as evidence or draft notes.
- If branch-as-view is needed, keep it under `candidate-projections/branch-as-view-OD-1/`.
- If B3 run evidence is missing, keep bridge validation `insufficient` and route OD-2.
- If a generated read model conflicts with source evidence, source evidence wins and the read model records contradiction/residue.

## View 5: Decision Flow View

| Decision ID | Decision | Default | Escalate When |
| --- | --- | --- | --- |
| D-001 | Is a canonical file a node? | No. It is source/evidence unless it satisfies node eligibility. | A file is proposed as agent-usable ontology without thick content. |
| D-002 | Is branch-as-view canonical? | No. It is OD-1 candidate projection. | Owner wants four-view tree as doctrine. |
| D-003 | What is B2 artifact name? | Use neutral substrate naming until OD-1; candidate projection may use `engineer-view`. | `system-view` vs `engineer-view` affects downstream method docs. |
| D-004 | Can B3 be filled from research-session traces? | No. B3 needs legal subject-run traces. | A context lacks runtime evidence but wants `run-view`. |
| D-005 | Is CSV enough? | CSV is optional evidence index only. Markdown carries human-readable evidence and candidate artifacts. | Machine validation needs a structured schema. |
| D-006 | Can a candidate promote? | No while `gateResult: block`. | OD-1/OD-2 resolved and bridge validation has two-sided evidence. |
| D-007 | Where does runtime output live? | `.arcanum/inventory/` and `.arcanum/ontology-vault/` for generated runtime state; `projects/ontology/` for project-owned witness artifacts. | Runtime output would leak private evidence to public Arcanum. |

Open owner decisions inherited from the research packet:

- OD-1: branch-as-view ratification.
- OD-2: legal B3 run-view producer.
- OD-3: residue-view embedded vs extracted.
- OD-4: artifact catalog primary class vs multi-tag.
- OD-5: authority tie-break algorithm.
- Operational Ontology acceptance.

## View 6: Dependency Interface View

| Dependency | Interface | Rule |
| --- | --- | --- |
| `inventory` | Evidence-card authoring, lookup, validation, index/log maintenance. | Inventory evidence is non-authority until a downstream owner accepts it. |
| `ontology-vault` | Branch mapping, premise/confidence review, bridge validation, drift report. | Bridge claims require two-sided evidence or explicit insufficiency. |
| `ontology-harness` | Composes inventory, ontology-vault, context-builder. | Use when moving from architecture to runtime proof. |
| `context-builder` | Context proof for downstream agent task. | Select obligation-linked slices; do not substitute whole research packet. |
| `decision-gate` | Owner decisions OD-1/OD-2/OD-3 and any promotion/convention decision. | Consequential unresolved choices must not be silently promoted. |
| `invoke plan` | Plan-ready continuation from this architecture. | Must add implementation layering and work-pack before execution. |
| `task-session` | Bounded execution of first fixture materialization. | Owns edits after approved plan/work-pack. |

## Constraints

| Constraint | Source | Impact |
| --- | --- | --- |
| Build-from-owned, not net-new doctrine. | Research findings | Architecture must cite owned sources and demote novel projection. |
| Branch-as-view remains OD-1. | Research findings / cyber-alchemy-space | Four-view tree stays candidate projection. |
| B3 run-view needs legal subject-run evidence. | Research findings | No B3 promotion from research/doc-production traces. |
| Source files are not ontology nodes by default. | Research findings / entry model | Node eligibility must be explicit. |
| Markdown first; CSV evidence only. | Runtime substrate explorer return | CSV cannot own authority or promotion state. |
| Public/private boundary. | AGENTS.md and submodule discipline | No private evidence patches into public Arcanum. |

## Dependency And Interface Rules

| Rule ID | Rule | Applies To | Enforcement |
| --- | --- | --- | --- |
| R-001 | Every material claim cites source evidence or is marked synthesis/open. | All artifacts | Review and inventory lint. |
| R-002 | Evidence cards are non-authority read models. | `inventory/evidence-cards/` | Promotion owner required. |
| R-003 | Candidate nodes must satisfy node eligibility. | `candidates/` | Schema/review check. |
| R-004 | PromotionRecord governs one primary claim. | `promotions/` | No bundled unrelated claims. |
| R-005 | `gateResult: block` prevents promotion. | `promotions/` and projections | Decision-gate required before promotion. |
| R-006 | OD-1 candidate projection cannot be treated as canonical branch-as-view. | `candidate-projections/` | Keep path and status explicit. |
| R-007 | Runtime-generated outputs do not overwrite project-owned architecture. | `.arcanum/*`, `projects/ontology/` | Generated output remains read model/report. |

## Decision Log

| Decision ID | Decision | Options Considered | Reason |
| --- | --- | --- | --- |
| D-ARCH-001 | Use invoke discovery-mode design. | Block for missing define outputs; proceed from approved research packet. | User explicitly requested architecture and source packet is reviewer-approved. |
| D-ARCH-002 | Put architecture in `projects/ontology/ARCHITECTURE.md`. | Put under research packet; put under public Arcanum. | Target is project-local materialization; public boundary stays clean. |
| D-ARCH-003 | Treat first output as fixture pack. | Full migration; canonical branch-as-view tree. | Research audit approved report-level witness but blocked materialized substrate. |
| D-ARCH-004 | Use `views/bridge-projection-example.md` plus `candidate-projections/branch-as-view-OD-1/`. | Default four branch-view files. | Prevents OD-1 overpromotion. |
| D-ARCH-005 | Record implementation layering as a design gap. | Emit full layering now. | Invoke design may record a gap; plan mode owns full layering/work-pack. |

## Risks

| Risk ID | Risk | Mitigation | Owner |
| --- | --- | --- | --- |
| RK-001 | Filesystem mirror collapse: directories are mistaken for ontology. | Node eligibility and artifact classes. | ontology-owner |
| RK-002 | Inventory index collapse: evidence cards are mistaken for meaning. | Non-authority notice and PromotionRecord boundary. | inventory/ontology-vault |
| RK-003 | Premature branch-as-view promotion. | OD-1 candidate projection path and `gateResult: block`. | owner/operator |
| RK-004 | B3 false evidence. | OD-2 legal run producer before `run-view` content. | owner/operator |
| RK-005 | Public/private leakage. | Keep architecture and fixtures in private `projects/ontology`; public-boundary pass before Arcanum edits. | parent repo maintainer |
| RK-006 | CSV becomes governance. | Limit CSV to raw evidence/index export. | ontology-owner |

## Downstream Planning Notes

Implementation-plan inputs:

- This architecture.
- `research/2026-06-18-materialization-model/findings.md`.
- First-slice write scope.
- Decision routing for OD-1 and OD-2.

Work-pack implications:

- Create one SWU for source manifest and evidence card.
- Create one SWU for candidate node and PromotionRecord fixture.
- Create one SWU for bridge projection and candidate OD-1 projection stubs.
- Create one SWU for context-builder proof and validation notes.

Validation implications:

- `git diff --check`.
- Markdown link/path review.
- Schema conformance review for `OC-0001` and `PR-0001`.
- Inventory validation after evidence-card materialization.
- Context-builder dry run after fixture pack exists.

## Design Transport Notes

This architecture is invoke-authored design evidence. It is not an execution work-pack and does not authorize promotion. The next lifecycle owner is either:

- `invoke plan`, to produce implementation layering and a work-pack; or
- `task-session`, only after a plan/work-pack exists or the user explicitly accepts a very small bounded fixture task.

## Gate Result

- Status: flag
- Reason: six design views are present and source contracts are explicit, but define outputs are absent, branch-as-view remains OD-1, B3 producer remains OD-2, and implementation layering/work-pack are intentionally deferred to plan mode.
