# MAP — cyberAlchemy-v2

Private authority spine consolidating dispersed `domainspec-core` work into one governed base: canonical vocabulary, constitutions, disciplines, decisions, and a promotion lifecycle that gates when evidence becomes authority.

## Role in the three-pillar model

- **Authority spine** — primary role (per project CLAUDE.md and this repo's own README: "intended to become the next stable repository... starts here as a source-ledgered project so authority, evidence, and promotion boundaries are visible before extraction").
- **DomainSpec (private, the *what*)** — adjacent, not owned: `development/domainspec-v2/` is a v2 rework *workstream* of the DomainSpec pillar, explicitly "not authority," peer to the Mint feature under the same Craft root.
- **Arcanum (public, the *how*)** — consumed, not authored: Arcanum definitions/method are cited as public source cohort (`SOURCE-MAP.md`); CAV2 references Arcanum terms and must not redefine or leak into it (`arcanum/` boundary rule repeated in `authority/boundaries.md`).
- **Saturn (the loop)** — not directly represented; closest analog is the promotion ladder (source evidence → authority → implementation → validation) in `authority/AUTHORITY-MODEL.md`, which is CAV2's own intent↔authority loop, not Saturn itself (inferred).

## Top-level folders

| Folder | Contents |
| --- | --- |
| `authority/` | Definitions, constitutions, decisions, imports, promotion-policy, boundaries, authority model (the core spine) |
| `disciplines/` | Discipline catalog + 3 candidate practice cards + dev handoffs |
| `ontology/` | Candidate authority-object model (node/relation/lifecycle/kinds/postures), views, projections, promotion-requests |
| `development/` | In-flight workstreams: mint, attestation-capability, domainspec-v2, invoke, refinement-runs, research (16 folders), reviews, task-sessions, handoffs |
| `research/` | Boundary README + link to external `resonantos-economy-research` surface |
| `architecture/` | Placeholder + one governance-interface doc |
| `ux-ui/` | Placeholder + one governance-interface doc |
| `capabilities/` | Placeholder only — reserved for promoted CAV2-specific capability contracts |
| `specs/` | Placeholder only — reserved for promoted contracts |
| `implementation/` | Reserved for post-gate code (per README table; not independently inspected) |
| `validation/` | Boundary README + 1 candidate (unbuilt) validator spec |
| `observability/` | Boundary README only, no signals yet |
| `inventory/` | Boundary README, points to parent `.arcanum/inventory/` |
| `discovery/` | Empty/unpopulated at top level |
| `ops/` | Boundary README only |
| `.craft/` | Craft ledger (`ledger.yml` + `index.json`) — the execution/context tracking substrate |
| `TO-VICTOR/`, `TO-VLAD/` | Point-in-time handoff notes to named collaborators |

## Capability inventory

| Name | Kind | What it does | Path |
| --- | --- | --- | --- |
| Mint | sigil (in-development, private/moat-adjacent) | Mints a new domain repo: composes `domainspec-new-repo` scaffold + casts the cav2 authority spine onto it | `development/mint/` |
| Attestation / Signer | sigil (in-development, private/moat-adjacent) | Upgrades git-convention "signed" decisions into tamper-evident, third-party-verifiable attestation tuples | `development/attestation-capability/` |
| Authority-Kind Closure Validator | spec (candidate, explicitly **not built** — blocked on AUTHORITY-MODEL OQ-1) | Deterministic check that the authority-kind enumeration stays closed/default-deny | `validation/authority-kind-closure-validator-SPEC.md` |
| Stable Repository Constitution | constitution (candidate) | Governs CAV2 structure/authority behavior while staged inside `domainspec-core` (source-ledgering, layer separation, etc.) | `authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md` |
| Vault Concept Adoption Constitution | constitution (candidate) | Governs how imported-vault concepts become CAV2 definitions/constitutions/etc. (adoption, not copying) | `authority/constitutions/VAULT-CONCEPT-ADOPTION-CONSTITUTION.md` |
| Constitution Import Pack | constitution/template pack | Staging pack for importing constitution-like source material | `authority/constitutions/CONSTITUTION-IMPORT-PACK.md` |
| Promotion Policy | gate/ladder | 7-stage promotion ladder (source evidence → standalone asset) + required-gate table + pass/flag/block vocabulary | `authority/promotion-policy.md` |
| Authority Model | governing framework | Defines authority kinds, postures, narrowest-owner routing, non-collapse rules | `authority/AUTHORITY-MODEL.md` |
| Definitions ledger (DEFINITIONS.md) | ledger | 50 canonical `CAV2-D*` definitions (D1–D50) | `authority/definitions/DEFINITIONS.md` |
| Definitions Index / Drift Audit / Towers | ledgers | Lookup index, semantic-drift tracking, layered definition-tower structure | `authority/definitions/DEFINITIONS-INDEX.md`, `DEFINITION-DRIFT-AUDIT.md`, `DEFINITION-TOWERS.md` |
| Definitions import manifest | ledger | Stages 149 definition-like candidates + 28 auxiliary sources for promotion review | `authority/imports/definitions/MANIFEST.md` |
| Constitutions import manifest | ledger | Stages 106 constitution/axiom candidates + 3 templates | `authority/imports/constitutions/MANIFEST.md` |
| house_project import | ledger | Staged import ledger for an external "house project" vault source | `authority/imports/house_project/` |
| resonantos-economy-research import | ledger | CAV2 method/provenance-only authority posture over a standalone external research repo | `authority/imports/resonantos-economy-research/` |
| Discipline catalog + cards | ledger + 3 cards | Candidate recurring-practice registry: stable-repo stewardship, provisional-model stewardship, tracking | `disciplines/DISCIPLINES.md`, `disciplines/cards/*` |
| Decisions ledger | ledger | 6 signed decision records (HMI promotion, engine-moat/free-paid boundary, Saturn/DomainSpec disclosure, ResonantOS standalone, authority-kind closure catch-all, Mint signer/boundary) — README index table only lists 4, stale by 2 | `authority/decisions/` |
| Ontology authority-object model | candidate model package (~13 docs) | Node/relation/lifecycle model, authority kinds/postures, branch-as-view rule, artifact tree, 3 crosswalks, 3 views (ontology/system/bridge), projections + promotion-requests staging | `ontology/*.md`, `ontology/views/`, `ontology/projections/`, `ontology/promotion-requests/` |
| UX/UI Knowledge Governance | governance interface (candidate) | Defines how `ux-lessons`/`ux-evidence-validator`/`ui-prototyping-studio` compose as a UX/UI governance interface w/o becoming authority | `ux-ui/UX-UI-KNOWLEDGE-GOVERNANCE.md` |
| Architecture Knowledge Governance | governance interface (candidate) | Defines `architecture-pattern-inventory` as the architecture-view governance interface | `architecture/ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md` |
| Craft ledger | ledger/execution-tracking substrate | Context/blocker/decision tracking (`CTX-CAV2-*`, `BLK-*`, `DEC-*`) surfacing Mint, DomainSpec v2, definition-tower, import, and boundary work | `.craft/ledger.yml` (+ human view `CRAFT.md`) |
| DomainSpec v2 workstream | candidate workstream (not a capability itself) | v1→v2 import triage for the DomainSpec pillar; explicitly "candidate/working material; not authority" | `development/domainspec-v2/` |
| Long tail: dev process folders | mixed (handoffs/research/reviews/refinement-runs/task-sessions) | 16 dated research folders, 4 refinement-runs, 3 reviews, 1 task-session, 2 discipline-dev handoffs, 1 ontology-dev handoff — process trail, not authority | `development/{research,reviews,refinement-runs,task-sessions,handoffs}/` |

## Key ideas / vocabulary

- **Authority moves by owner route, not proximity** — the repo's central rule; evidence/usefulness/repetition never substitute for the narrowest responsible owner deciding.
- **Authority kind** — closed (default-deny), enumerable classification of what counts as authority (definition, constitution, discipline, decision, spec, runtime contract, projection, evidence, residue); unenumerated kinds are blocked until added via decision-gate + constitution-governance (`CAV2-D49`).
- **Authority posture** — how reliable/usable a source is pre-promotion (original authority, evidence, template, research, generated projection, private evidence, public framework, unknown).
- **Promotion ladder** — source evidence → import candidate → inventory/ontology candidate → local authority → implemented/validated behavior → stable repository asset → standalone extraction.
- **Non-collapse rules** — 7 explicit rules preventing evidence/ontology/inventory/discipline/constitution/implementation from silently becoming authority they are not (e.g., "a successful implementation run does not redefine the term it exercised").
- **Invariant → axiom → constitution rule → validator/gate → artifact behavior** — the default derivation chain for how a "must remain true" claim becomes an enforced rule.
- **pass / flag / block / defer** — the CAV2 gate-result vocabulary (`CAV2-D37`).
- **Source-ledgered amalgamation** — consolidate by governance/citation, not by copying source material wholesale.
- **Moat / intended-not-shipped** — Mint and Attestation are explicitly private, moat-adjacent capabilities never meant for `arcanum/`.

## Entry / orientation docs

- `README.md` — project objective, repository shape table, start-here links, current gate (flag). Primary orientation doc.
- `AGENTS.md` — working rules for agents inside this repo (canonical sources, route defaults, "research proposes, authority decides").
- `SOURCE-MAP.md` — the source-cohort table this whole project ingests from (inventory, cyberAlchemy, Arcanum, framework-unification, DomainSpec v2, implementation, validation, ux-ui, ResonantOS).
- `CRAFT.md` — human-readable Craft ledger view (contexts, blockers, decisions).
- `VALUE-AND-PHILOSOPHY-PROPOSITION.md` — the "synergetic cybernetic human-machine integration" philosophy framing (private, pre-public-boundary-review).
- `ontology/README.md`, `authority/AUTHORITY-MODEL.md` — second-tier orientation for their respective subtrees.

## Status floor

- **Built / active**: definitions ledger (50 entries), decisions ledger (6 records), discipline catalog (3 candidate cards), import manifests (149 + 106 candidates staged), constitutions (2 substantive + 1 pack, status "candidate"), Craft ledger tracking live contexts.
- **In-development, unbuilt/unpromoted**: Mint and Attestation sigils (both explicitly "in-development," "promotes nothing"), authority-kind closure validator (spec only, build blocked), DomainSpec v2 rework (triage stage).
- **Placeholder / boundary-only, no content**: `capabilities/`, `specs/`, `implementation/` (not inspected but README-only per top-level pass), `observability/`, `inventory/`, `ops/`, `architecture/` and `ux-ui/` (each has exactly one governance-interface doc and otherwise empty), `discovery/` (empty).
- Overall repo self-assessment: "started and navigable... not yet a standalone repository... none of its source-map claims are promoted architecture decisions" (README, Current Gate: flag).

## Git state

- Not a separate submodule — lives inside `domainspec-core`, same history.
- Remote: `https://github.com/cyberAlchemyAI/domainspec-core.git`
- HEAD: `3cc61adc`, branch: `master`
- Working tree clean w.r.t. `cyberAlchemy-v2/` (one unrelated modified file outside this folder: `telemetry/agents/subagents-dispatch.yaml`).

## Open questions

- Decisions README index table (`authority/decisions/README.md`) lists only 4 of the 6 decision files present on disk — stale index (inferred, not itself flagged in-repo).
- OQ-1 in `SOURCE-MAP.md`: should `inventory/` and `ontology/` stay visible top-level folders or move to hidden `.arcanum/`-style implementation detail? Still OPEN.
- OQ-1 in `authority/AUTHORITY-MODEL.md`: should authority kinds become validator-backed (deterministic), or stay review-governed? Still OPEN; the one designed validator (`authority-kind-closure-validator-SPEC.md`) is explicitly blocked pending this.
- OQ-2 in `authority/AUTHORITY-MODEL.md`: should `invariant` and `axiom` become first-class authority kinds (currently folded under `Definition`)? OPEN.
- README "Current Gate" (repo-wide) is `flag`, pending owner review of whether `inventory/`/`ontology/` should be public-facing top-level areas.
- Two active blockers referenced in `CRAFT.md` (`BLK-CAV2-PUBLIC-PRIVATE-001`, `BLK-CAV2-VISIBLE-SPACES-001`) were named but not opened/read in this pass — worth follow-up if the public/private boundary or folder-visibility question becomes load-bearing for framework-unification.
