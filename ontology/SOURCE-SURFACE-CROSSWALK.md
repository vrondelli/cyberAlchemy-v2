# Source Surface Crosswalk

Status: candidate witness map
Owner: CyberAlchemy v2 ontology route
Boundary: source-context only; not a promotion record

This crosswalk maps the private `projects/ontology` witness surface into the
CyberAlchemy v2 ontology package. It preserves useful materialization patterns
without moving files, promoting project artifacts, or treating the project
folder as current CAV2 ontology authority.

## Source-Surface Rows

| Source path | Source role | Allowed reading | Forbidden reading | Owner route | Harvest action | Validation evidence |
| --- | --- | --- | --- | --- | --- | --- |
| [../../projects/ontology/README.md](../../projects/ontology/README.md) | source boundary / witness notice | Use as the visible status bridge for project-local witness/incubator material. | Do not treat as base ontology authority, definition owner, spec owner, schema owner, or migration approval. | domainspec-core parent workspace plus future owner routes | Keep linked from [ARTIFACT-TREE.md](ARTIFACT-TREE.md); use as non-authority orientation. | SWU-OCON-001 receipt in [TASK-SESSION-SWU-OCON-001.md](development/2026-06-30-ontology-folder-consolidation/TASK-SESSION-SWU-OCON-001.md). |
| [../../projects/ontology/ARCHITECTURE.md](../../projects/ontology/ARCHITECTURE.md) | design witness / materialization architecture | Harvest the ladder `source selector -> InventoryEvidence -> OntologyCandidate -> PromotionRecord -> governed projection / retrieval view`, artifact classes, node eligibility, failure rules, and public/private constraints. | Do not copy the architecture as current package law or use it to promote branch-as-view, B3 run-view, schemas, or live node types. | CAV2 ontology route for package modeling; decision-gate for consequential naming or promotion choices. | Reuse concepts as candidate/package guidance only when a CAV2 artifact cites this row and preserves forbidden readings. | Crosswalk row plus path-scoped diff check in SWU-OCON-002. |
| [../../projects/ontology/GLOSSARY-CONSISTENCY.md](../../projects/ontology/GLOSSARY-CONSISTENCY.md) | glossary collision evidence | Use checked terms and conflict resolutions to avoid naming drift around source selector, InventoryEvidence, OntologyCandidate, PromotionRecord, governed projection, branch-as-view, run-view, and bridge-view. | Do not promote flagged names such as branch-as-view, meaning-view, engineer-view, run-view, or residue-view as canonical CAV2 names. | Relevant owner route for each term; decision-gate for OD-1/OD-2/OD-3 naming. | Use as a warning surface when authoring future CAV2 crosswalks or domain-local instantiation examples. | Crosswalk row plus path-scoped diff check in SWU-OCON-002. |
| [../../projects/ontology/research/2026-06-18-materialization-model/findings.md](../../projects/ontology/research/2026-06-18-materialization-model/findings.md) | research evidence behind the witness design | Use through `ARCHITECTURE.md` when a future task needs the research packet behind materialization claims. | Do not bypass the architecture's status, gate result, or owner decisions by citing research directly as package authority. | research route for evidence; CAV2 ontology route for candidate synthesis; decision-gate for owner decisions. | Keep as secondary evidence unless a later task explicitly selects it. | Covered by `ARCHITECTURE.md` source contracts; no direct harvest in SWU-OCON-002. |

## Harvestable Pattern Map

| Pattern | Project witness source | CAV2 package use | Required guardrail |
| --- | --- | --- | --- |
| `source selector` | `ARCHITECTURE.md` architecture intent; `GLOSSARY-CONSISTENCY.md` checked terms. | Source/evidence pointer for future candidate records. | Selector is not ontology authority. |
| `InventoryEvidence` | `ARCHITECTURE.md` high-level structure; dependency interface rules. | Evidence-card or evidence-set bridge into candidate modeling. | Inventory evidence is non-authority until owner acceptance. |
| `OntologyCandidate` | `ARCHITECTURE.md` artifact classes and node eligibility. | Candidate concept or node-record shape guidance. | Candidate must be thick enough and still cannot promote itself. |
| `PromotionRecord` | `ARCHITECTURE.md` PromotionRecord fields; glossary conflict row. | Transition/owner-decision companion concept. | PromotionRecord governs movement; it is not the ontology node content. |
| governed projection | `ARCHITECTURE.md` view flow; `GLOSSARY-CONSISTENCY.md` checked terms. | Read-model/projection guidance after owner gates. | Projection is not source authority or promotion by proximity. |
| `branch-as-view` | `ARCHITECTURE.md` D-002 and R-006; glossary flag. | Candidate projection caution only. | OD-1 must resolve before any canonical branch-as-view claim. |
| `run-view` / B3 evidence | `ARCHITECTURE.md` D-004 and RK-004; glossary flag. | Runtime-evidence caution only. | Legal subject-run evidence is required before run-view promotion. |
| generated read model | `ARCHITECTURE.md` artifact classes and R-007. | Read-model boundary language for CAV2 projections. | Generated output cannot overwrite project-owned architecture or source truth. |

## Package Use Rule

Future CAV2 ontology files may cite this crosswalk for witness material, but
the citation must name the source role it uses:

- evidence source
- candidate pattern
- projection caution
- boundary rule
- owner-route warning
- blocked residue

If a future citation only points at `projects/ontology` as a folder, it is
candidate context only and cannot influence promotion.

## Non-Goals

- No file migration.
- No deletion or retirement of `projects/ontology`.
- No live schema amendment.
- No new node type, vault edge, movement edge, or promotion verdict.
- No public `arcanum/` update.

## Gate Result

Status: pass for source-surface mapping.

Reason: the crosswalk is path-backed, preserves forbidden readings, and keeps
`projects/ontology` as witness/source context only.
