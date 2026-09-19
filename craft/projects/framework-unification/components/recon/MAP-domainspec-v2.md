# MAP — domainspec-v2

`projects/domainspec-v2/` is DomainSpec's next-generation implementation home: it governs and
enforces a 25-meta-type domain-modeling language ("Ontology A") on evidence, while running a
parallel research-tower program that questions its own foundations.

## Role in the three-pillar model

- **DomainSpec** — this *is* the DomainSpec pillar's active-development seat. `README.md` states
  v2 is "becoming the implementation home"; v1 (`implementation/domainspec/`) is being frozen as a
  read-only evidence source.
- **Arcanum** — not this pillar; referenced only as consumer/tooling (research towers run under the
  `research-tower` skill; `impl/test-derivation-engine/src/rules/` is explicitly called out as a
  **private moat never to publish to public `arcanum/`**).
- **Saturn** — named only as a *future actuator*: `authority/AUTHORITY-MODEL.md` says drift
  governance's signals are "acted on (not defined) by Saturn" — Saturn itself is not implemented here.
- **authority-spine** — this project has minted its *own* local L1 authority spine
  (`authority/AUTHORITY-MODEL.md`, `promotion-policy.md`, `source-spine.md`), explicitly declared
  independent of cyberAlchemy-v2 (Obs-B localization invariant: cav2/v1 are "harvested precedent," never
  a resolution path). (inferred: cav2 v2 is the umbrella minting mechanism, per CLAUDE.md route 3.)

## Top-level folders

| Folder | Contents |
| --- | --- |
| `authority/` | Local L1 authority spine: authority kinds, promotion policy, source spine, ratification decisions |
| `definitions/` | Canonical local definition cards (`domainspec-v2-D1..D15`), index, drift audit, localization route |
| `definitions/meta-types/` | DS-D1 meta-type system: human cards (`meta-types.md`) + machine registry (`meta-types.yml`) |
| `development/` | Work-pack folders per initiative (define/design/work-pack/handoff docs) — the project's task tracker |
| `impl/` | The forked, buildable implementation: engine, spec docs, tools, governance tags |
| `ontology/` | Candidate local ontology-instantiation surface (CAV2 shape, no authority of its own) |
| `research/` | Research-tower program: seeds, findings, DCB/Alloy/TLA+ towers, spec-as-ontology, v1 import triage |
| `.craft/` + `CRAFT.md` | Craft ledger — scoped project-tracking system (contexts, decisions, blockers, gaps) |
| `IMPORT-MANIFEST.md` | v1→v2 migration ledger (verdict/status/batch per doc or tool) |
| `README.md` | Entry point: implementation-home status + active research towers table |
| `RELATED-FRAMEWORK-CROSSWALK.md` | Cross-references to related external frameworks (not read in depth) |

## Capability inventory

| Name | Kind | What it does | Path |
| --- | --- | --- | --- |
| test-derivation-engine | engine (pipeline) | Deterministic, no-LLM parse→derive→obligation_key→emit pipeline turning Markdown feature docs into byte-stable test obligations; `src/rules` is the private moat | `impl/test-derivation-engine/src/` |
| validate-content.ts | validator | Content validator: checks each concept in an aspect file against its meta-type's `.schema.yml` criterion (shape only, no engine import) | `impl/tools/validate-content.ts` |
| validate-relationships.ts | validator | Checks declared edges against RELATIONSHIPS.md edge-law (imported from v1, reformulation-pending) | `impl/tools/validate-relationships.ts` |
| validate-doc-links.ts | validator | Checks doc cross-links resolve (imported from v1, reformulation-pending) | `impl/tools/validate-doc-links.ts` |
| instances.ts (generate) | tool | MT-INST: generates canonical example `<type>.example.instance.yml` per meta-type schema (normalized, not δ-derived) | `impl/tools/instances.ts` |
| instances.ts (validate) | tool/validator | Validates machine-generated instance YAML against its meta-type schema criterion | `impl/tools/instances.ts` |
| DS-D1.1 Entity | meta-type card | Persisted, identity-bearing domain object; criterion = ≥1 identity field + typedness | `definitions/meta-types/meta-types.md`, `impl/spec/meta-types/structural/entity.schema.yml` |
| DS-D1.2 Value Object | meta-type card | Identity-by-value object; criterion = no identity field + typedness + declared Equality | `impl/spec/meta-types/structural/value-object.schema.yml` |
| DS-D1.3 Enum | meta-type card | Fixed finite named-value set; criterion = value table present | `impl/spec/meta-types/structural/enum.schema.yml` |
| DS-D1.4 Operation | meta-type card | State-changing business action; criterion = declared `state_change=yes` | `impl/spec/meta-types/behavioral/operation.schema.yml` |
| DS-D1.5 Query | meta-type card | Read-only retrieval; criterion = declared `state_change=no` | `impl/spec/meta-types/behavioral/query.schema.yml` |
| DS-D1.6 Calculation | meta-type card | Pure value-deriving function; criterion = declared `formal_return_type=value` | `impl/spec/meta-types/behavioral/calculation.schema.yml` |
| DS-D1.7 Rule | meta-type card | Boolean guard on an operation; criterion = declared `formal_return_type=boolean` | `impl/spec/meta-types/behavioral/rule.schema.yml` |
| DS-D1.8 Policy | meta-type card | Strategy-selecting decision logic; criterion = declared `formal_return_type=strategy` | `impl/spec/meta-types/behavioral/policy.schema.yml` |
| DS-D1.9 Workflow | meta-type card | Intra-feature multi-step orchestration; criterion = declared `scope=intra-feature` | `impl/spec/meta-types/behavioral/workflow.schema.yml` |
| DS-D1.10 Saga | meta-type card | Cross-feature orchestration with compensation; criterion = declared `scope=cross-feature` | `impl/spec/meta-types/behavioral/saga.schema.yml` |
| DS-D1.11 Interface | meta-type card | API boundary; criterion = declared `interface_kind` (external/internal) | `impl/spec/meta-types/connective/interface.schema.yml` |
| DS-D1.12 Event | meta-type card | Past-tense state-change notification; criterion = declared `temporal=past` | `impl/spec/meta-types/connective/event.schema.yml` |
| DS-D1.13 Mapping | meta-type card | Field-by-field shape transform; criterion = declared `direction` | `impl/spec/meta-types/connective/mapping.schema.yml` |
| DS-D1.14 State Machine | meta-type card | States + legal transitions; criterion = declared `has_transitions=yes` | `impl/spec/meta-types/lifecycle/state-machine.schema.yml` |
| DS-D1.15-25 (UI types) | meta-type (deferred) | 11 UI meta-types (Page, Layout, Component, Hook, Form, Action, Guard, Binding, Adapter, View Model, State Indicator) cataloged in TAXONOMY but not yet formalized as schema cards | `impl/spec/TAXONOMY.md` |
| RELATIONSHIPS edge-law | contract/taxonomy | 29 typed edges (15 backend, 8 intra-UI, 6 cross-layer) connecting meta-types into a navigable graph | `impl/spec/RELATIONSHIPS.md` |
| DRIFT-CONVERGENCE.md | governance doc | Canonical operational definition of drift (5 surfaces) and convergence for the implementation surface | `impl/spec/DRIFT-CONVERGENCE.md` |
| TEST-PIPELINE.md | contract | Maps DFDS doc sections (states/operations/interfaces/events/queries/workflows/mappings) to specific derived test types | `impl/spec/TEST-PIPELINE.md` |
| AXIOMS.md / CONSTITUTION.md | governance doc pair | 6 axioms (A1-A6) bound to 11 enforceable rules (C1-C11) with gates; Via Negativa policy (each axiom exists because its absence caused harm) | `impl/spec/AXIOMS.md`, `impl/spec/CONSTITUTION.md` |
| code-tag governance tooling | governance/tooling | Schema + waivers + composability-pattern docs for source-code tagging (drift-governance method), imported v1, reformulation-pending | `impl/governance/tags/` |
| LEARNING-ORDER.md | comprehension aid | Tiers the 25 meta-types into 6 core / 6 supporting / 13 generic as an optional per-domain "declarable lens" (M1 of spec-comprehension model) | `impl/spec/meta-types/LEARNING-ORDER.md` |
| mt fixtures (28 files) | validator fixtures | ok/bad positive-negative fixture pairs per backend meta-type, the single validator source of truth | `impl/spec/__fixtures__/mt/` |
| sample aspect file | example artifact | Minimal worked example of a Concept Registry + concept tables + edges | `impl/spec/features/sample/SPEC.md` |
| Authority Model | governance artifact | Defines 3 domain-originated, owner-ratified authority kinds (validation/layering/drift governance) as a recursive law→check→trend chain | `authority/AUTHORITY-MODEL.md` |
| definitions cards D1-D15 | definition cards | Governance/method vocabulary (drift, validation-governance, edge-law admissibility, executable typed graph, two-plane boundary, meta-type, category, formal criterion, content validator, instance, aspect file, Concept Registry, etc.) | `definitions/DEFINITIONS.md` |
| spec-comprehension model (M1-M4) | design/model | 4 moves (learning order, crossed-pair surfacing, weak-pair upgrades, target-state oracle) to reduce novice authoring stalls, data-prioritized by a novice-test dataset | `development/spec-comprehension-model/` |
| comprehension-novice-test | experiment harness | Baseline/treatment novice-authoring test producing a "stall-dataset" that prioritizes comprehension fixes | `development/comprehension-novice-test/` |
| make-it-green initiative | build-proof effort | Drove `impl/` to all-green (G1-G3 done; G4 CI-wiring deferred) | `development/make-it-green/` |
| reformulate-batch1 | migration initiative | Plan to reformulate the 6 imported v1 spec docs (R1-R6b) for v2's govern+enforce mandate; unexecuted | `development/reformulate-batch1/` |
| meta-type-formalization | build initiative | Delivered MT0-MT3 node types + MT-INST machine-instance generate/validate (14 backend types, tests green); MT3b edges deferred | `development/meta-type-formalization/` |
| research towers (target-state, spec-ontology-unification, dcb-correctness, dcb-saga-correctness, alloy-tla-modeling) | research program | Each an independent hypothesis-driven tower under Two-Lane Discipline (zig-zag build vs alternatives) with its own findings/synthesis/residue | `research/<tower>/` |
| v1-import-triage | research artifact | Verdicts (3 IMPORT / 25 REFORMULATE / 4 DROP) driving the whole migration | `research/2026-06-29-v1-import-triage/findings.md` |
| recursive-governance-model research | research artifact | Grounds the 3-governance law/check/trend recursive schema (μF/νF application) now baked into AUTHORITY-MODEL.md | `research/2026-06-29-recursive-governance-model/` |
| spec-as-ontology research | research artifact | Resolved into domainspec-v2-D5 two-plane boundary (authoring plane vs contract plane) | `research/2026-07-01-spec-as-ontology/` |

## Key ideas / vocabulary

- **meta-type** — one of 25 fixed concept types (the node alphabet); every concept declares exactly one.
- **category** — top-level grouping of meta-types (Structural/Behavioral/Connective/Lifecycle/UI).
- **formal criterion** — a decidable, schema-encoded predicate for "is concept C a well-formed T."
- **edge-participation signature (DS-D8)** — endpoint typing for each edge verb (`verb: source.type -> target.type`).
- **edge-law admissibility** — an edge type earns its name only if it composes into different code (build-from-owned CAV2-D22/D29/D16).
- **executable typed graph** — the spec as one graph: nodes (TAXONOMY) + edges (RELATIONSHIPS) + composability (code-pattern realization), governed on 3 axes.
- **two-plane boundary** — authoring plane (ontology tooling while writing) vs contract plane (crisp engine-facing spec); authority flows contract → authoring only.
- **three domain-originated governances** — validation governance (build-time fidelity/CHECK), layering governance (structural law/LAW), drift governance (temporal trend/WHEN) — a recursive law→check→trend chain with Saturn as the return edge.
- **instance / instance validator** — machine-YAML twin of an authored concept, validated against the same schema criterion (MT-INST surface).
- **aspect file / Concept Registry** — the human-authored markdown spec unit and its concept→meta-type declaration table.
- **declared-attributes convention** — concepts self-declare discriminators (e.g. `state_change`, `formal_return_type`) rather than the validator parsing prose — keeps semantic parsing behind the engine moat.
- **Two-Lane Discipline** — every research tower runs Lane Z (build the idea out) and Lane A (hold the problem fixed, propose a genuinely different solution).

## Entry / orientation docs

- `README.md` — path 1: states implementation-home status, links IMPORT-MANIFEST, lists active research towers.
- `CRAFT.md` + `.craft/ledger.yml` — path 2: current state-of-play tracker (contexts, decisions, blockers, gaps, next moves) — the fastest "what's live right now" read.
- `IMPORT-MANIFEST.md` — the v1→v2 migration ledger, the authoritative "the way."
- `authority/AUTHORITY-MODEL.md` — the local authority-kinds contract; needed before trusting any governance claim.
- `definitions/DEFINITIONS-INDEX.md` — registry of every local definition card, with status.

## Status floor

- **Built and green**: `impl/test-derivation-engine` (L0 skeleton, obligation_key + round-trip implemented; parser/δ-rules still typed stubs per its own README); `impl/tools/validate-content.ts` + `instances.ts` (MT0-MT3 backend meta-types, tests green per CRAFT.md); 14 backend meta-type schema+card pairs with fixtures; local authority spine minted and 3 governance kinds owner-ratified.
- **Designed but unexecuted**: reformulate-batch1 (R1-R6b plan authored, not run); the domainspec-v2-research-towers dispatch ("designed and validated, not yet executed" per README).
- **Deferred/aspirational**: 11 UI meta-types (MT5, unformalized); MT3b edge signatures (29 DS-D8 signatures, →R3); L2 cryptographic attestation seal (blocked on capability); drift-engine implementation (`BLK-DSV2-DRIFT-ENGINE`); layering-governance and drift-governance definition cards (owed); CI-wiring of `validate` as a fail-closed gate (G4, deferred).

## Git state

- Remote: `https://github.com/cyberAlchemyAI/domainspec-core.git`
- Branch: `master`
- HEAD (repo-wide, domainspec-v2 has no separate history): `3cc61adc`

## Open questions

- **Relationship to `implementation/domainspec` (v1)** — README/IMPORT-MANIFEST state v1 is "becoming a FROZEN evidence source" but the freeze gate ("all REFORMULATE rows reformulated AND the build-proof green") is explicitly not yet met — v1 is still the *other* live DomainSpec surface today, not fully superseded. (inferred: v1 remains authoritative for anything not yet reformulated into v2.)
- Whether `impl/` (govern+enforce engine) and `research/` (tower program questioning foundations, e.g. Lane Z vs A on fuse-vs-generate) are on a convergent path or could diverge — `DEC-DSV2-LANE-ZA` is explicitly open/deferred pending an unbuilt "agent-cost experiment."
- The `ontology/` folder is declared "candidate/local... no authority effect" — unclear how/when (or whether) it will ever be promoted or whether it's a live workstream vs a placeholder.
- Two parallel definition schemes coexist by design (`domainspec-v2-D*` governance/method vocabulary vs `DS-D*` domain node/edge vocabulary) — not itself ambiguous per the docs, but a likely trap for outside readers conflating the two ID spaces.
- `RELATED-FRAMEWORK-CROSSWALK.md` at project root was not read in depth — may contain further scoping-relevant cross-references to other pillars/frameworks.
