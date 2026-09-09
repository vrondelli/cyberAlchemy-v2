# Ontology Knowledge Lifecycle Authority - Explorer Returns

Dispatch: `2026-06-21-ontology-knowledge-lifecycle-authority`
Status: read-only explorer transcript

This file mechanically preserves the explorer returns used for the synthesis.
Inventory references are breadcrumbs/read models only; underlying source anchors
remain required for findings.
Raw explorer labels are not adopted definitions or promotion decisions; see
`findings.md` for the repaired synthesis.

## Shannon, Claude

Read-only pass completed; no files edited.

Inventory breadcrumbs used:

- `.arcanum/inventory/index.md:10-19,40-45`
- `.arcanum/inventory/schema.md:83-96`
- `.arcanum/inventory/entries/evidence-sets/2026-06-18-dispersed-knowledge-sets.md:45-68`

These were used only as breadcrumbs/read models, not authority.

| ID | Claim | Evidence anchors |
| --- | --- | --- |
| S-C01 | Governed ontology has semantic and traceability scope inside its declared branch: business meaning/intent/rules, system realization, and bridge alignment/drift. | `arcanum/arcana/ontology-vault/README.md:47-57`; `arcanum/BUSINESS-ONTOLOGY.md:5-12`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:855-899` |
| S-C02 | Current ontology maps/candidates may condense meaning, type relations, preserve provenance/confidence, guide retrieval, and request promotion. | `.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md:25,84-90,101-103,134-137`; `cyberAlchemy/agentic-system-inventory-ontology-pipeline.md:229-258,302-323`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:922-933` |
| S-C03 | Ontology does not own raw source truth, inventory authority, glossary/definition authority, lifecycle transitions, runtime contracts, public claims, or promotion by proximity. | `cyberAlchemy-v2/authority/boundaries.md:18-31`; `cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md:68-79`; `cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:11-24,38-52`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:935-940` |
| S-C04 | The movement path is source selector/raw source -> inventory evidence -> ontology candidate -> owner gate / `PromotionRecord` -> governed projection/read model. `PromotionRecord` records/anchors the transition decision; it does not replace the owner route. | `projects/ontology/ARCHITECTURE.md:13-19,57-66,87-96,146-155`; `cyberAlchemy-v2/development/research/2026-06-21-authority-movement-ontology-relations/findings.md:11-43,57-64`; `arcanum/arcana/ontology-vault/development/schema-validation-plan/decision-gates/OVS-GATE-002-promotion-record-companion-boundary.md:245-250` |
| S-C05 | Candidate -> definition goes through `definitions-governance`, after import/evidence staging when needed; contested scope/ownership goes to `decision-gate`. | `cyberAlchemy-v2/authority/promotion-policy.md:20-29`; `arcanum/arcana/definitions-governance/README.md:40-71,90-92`; `cyberAlchemy-v2/authority/imports/definitions/MANIFEST.md:37-43` |
| S-C06 | Candidate -> constitution goes through `constitution-governance`, after import staging; rules need scope, owner, examples, non-examples, and validation mode. | `cyberAlchemy-v2/authority/imports/README.md:20-31`; `arcanum/arcana/constitution-governance/README.md:37-45,55-63,79-89`; `cyberAlchemy-v2/authority/imports/constitutions/MANIFEST.md:140-148` |
| S-C07 | Candidate -> axiom has no separate `axiom-governance` route in this source set. Axiom-like material is staged with constitution imports, reviewed as premise/confidence/bridge evidence, then promoted through constitution-governance or decision-gate when it becomes load-bearing. | `cyberAlchemy-v2/authority/imports/constitutions/MANIFEST.md:7-19,140-148`; `arcanum/BUSINESS-ONTOLOGY.md:21-29`; `cyberAlchemy/ontology/entries/knowledge-governance-authority-ladder.md:100-127,220-223` |

Dissent: lifecycle/provenance witnesses may insist ontology is only projection
and owner routes decide synthesis; formal witnesses may give promoted Business
Ontology stronger semantic scope; implementation witnesses may require
schema/fixture proof before treating `PromotionRecord` beyond record-kind
governance.

## Bateson, Gregory

Read-only dispatch result: no files edited.

Inventory breadcrumbs used:

- `.arcanum/inventory/raw/manifests/2026-06-18-dispersed-knowledge-sources.md:17-18`
- `.arcanum/inventory/raw/manifests/2026-06-18-dispersed-knowledge-sources.md:35-43`

Verdict: ontology is not the lifecycle authority. It is a governed
meaning/candidate/projection layer over an owner-routed lifecycle envelope.

| ID | Claim | Evidence anchors |
| --- | --- | --- |
| B-C1 | Lifecycle movement belongs to artifact owner routes, gates, and `PromotionRecord`; ontology may represent state, provenance, confidence, requests, and projections. | `cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:11-24`, `cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:28-39`, `cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:54-91` |
| B-C2 | Multi-provenance is expected: many sources can support one authority artifact, but the owner route decides synthesis; ontology shows the support graph. | `cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:101-113`; `cyberAlchemy-v2/authority/promotion-policy.md:10-29` |
| B-C3 | Source/read-model boundary is explicit: raw sources outrank inventory pages, ontology maps, memory, sessions, and observability signals; those carriers do not self-promote. | `cyberAlchemy-v2/authority/boundaries.md:16-23`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:922-940` |
| B-C4 | Human+AI interface work follows the same envelope: LLM proposes, pure validators admit, human accepts the exact staged artifact by hash, and the core owns the write path. | `implementation/domainspec/docs/features/ui-prototyping-studio/development/refinement-runs/20260615T205403Z-mutation-execution-mechanics/stages/06-design.md:61-70`, `implementation/domainspec/docs/features/ui-prototyping-studio/development/refinement-runs/20260615T205403Z-mutation-execution-mechanics/stages/06-design.md:248-288`, `implementation/domainspec/docs/features/ui-prototyping-studio/development/refinement-runs/20260615T205403Z-mutation-execution-mechanics/stages/06-design.md:344-352`, `implementation/domainspec/docs/features/ui-prototyping-studio/development/refinement-runs/20260615T205403Z-mutation-execution-mechanics/stages/06-design.md:445-459` |
| B-C5 | Research and proof witnesses are gate inputs, not sovereign movers: research proposes terms/maps; specs own contracts only after promotion; Lean/Tower checks validate structure/origin within stated limits. | `cyberAlchemy-v2/authority/boundaries.md:39-43`; `implementation/domainspec/internal_tools/lean-code-validator/README.md:52-60`, `implementation/domainspec/internal_tools/lean-code-validator/README.md:87-91`; `implementation/domainspec/internal_tools/tower_explorer/README.md:16-23`, `implementation/domainspec/internal_tools/tower_explorer/README.md:91-98` |
| B-C6 | Operational DAG results split execution audit from ontology reuse: execution is append-only; ontology points at it; event updates may propose, but only owner decisions confer reuse. | `projects/ontologize/DAG-AND-METRICS.md:15-28`, `projects/ontologize/DAG-AND-METRICS.md:146-168` |
| B-C7 | Telemetry is evidence/control feedback, not meaning authority: AEO owns route execution, terminal outcomes, telemetry envelopes, and signal rows; OIL appends evidence and routes reflection. | `implementation/domainspec/docs/features/agent-execution-orchestrator/SPEC.md:31-33`, `implementation/domainspec/docs/features/agent-execution-orchestrator/SPEC.md:79-99`; `implementation/domainspec/docs/features/agent-execution-orchestrator/rules.md:240-263`; `arcanum/spells/observed-invocation-loop/README.md:12-19`, `arcanum/spells/observed-invocation-loop/README.md:63-70` |
| B-C8 | Memory/domain work feed the ladder but do not skip it: raw interaction moves through session evidence, inventory, ontology candidate, review, confidence, constitution/axiom only by owning capability. | `arcanum/spells/necronomicon/development/KNOWLEDGE-SUBSTRATE-FLOW.md:15-28`, `arcanum/spells/necronomicon/development/KNOWLEDGE-SUBSTRATE-FLOW.md:31-43`, `arcanum/spells/necronomicon/development/KNOWLEDGE-SUBSTRATE-FLOW.md:228-238`; `cyberAlchemy/ontology/entries/knowledge-governance-authority-ladder.md:75-80`, `cyberAlchemy/ontology/entries/knowledge-governance-authority-ladder.md:114-127` |
| B-C9 | DomainSpec's product thesis is knowledge reconciliation across people, docs, and code, with provenance, gates, owner/action/evidence, and session-to-knowledge feedback as invariants. | `implementation/domainspec/PRODUCT-COMPONENTS-IDEA.md:21-25`, `implementation/domainspec/PRODUCT-COMPONENTS-IDEA.md:31-47`, `implementation/domainspec/PRODUCT-COMPONENTS-IDEA.md:56-82` |

Dissent: governance-layer witnesses may argue ontology-vault owns confidence
promotion/demotion review; formal witnesses may withhold assent until relation
schemas and Tower/Lean checks prove the envelope; implementation witnesses may
insist AEO/DAG/telemetry run-state authority outranks ontology projections.

## Lawvere, F. William

Read-only result. No files edited.

| ID | Claim | Evidence anchors | Test |
| --- | --- | --- | --- |
| L-C01 | Typed relation is admissible only when verb family, endpoint signature, owner/source, evidence, and effect are explicit; a typed edge is not promotion. | `arcanum/definitions/DEFINITIONS.md` DS-D2 lines 328-373 and DS-D8 lines 425-445; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` CAV2-D16 lines 626-686; `.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md` lines 83-102 | Validator/proof can reject bad endpoint pairs and hidden coupling. |
| L-C02 | Schema validity is shape evidence, not execution proof, behavior proof, or authority transfer. | `arcanum/definitions/DEFINITIONS.md` DEF-ARC-SCHEMA lines 86-114; `projects/framework-unification/CONCEPT-MAP.md` invariants lines 143-145 | A schema may support a contract, but the contract must name meaning, ownership, and behavioral witness. |
| L-C03 | Axiom is admissible only for an invariant-bearing, dependency-bearing claim with harm evidence, contradiction review, explicit commitment, and enforcement trace. | `domainspec-formalization/docs/domainspec-paper.md` lines 142-146 and 218-225; `cyberAlchemy/research/2026-06-18-thinking-method-ontology/findings.md` lines 217-220 | Operational defaults are principles until those witnesses exist. |
| L-C04 | Constitution is admissible when it governs artifact form/model, allowed transformations, and review/enforcement gates. | `domainspec-formalization/docs/domainspec-paper.md` lines 142-146 and 220-225; `cyberAlchemy/research/2026-06-18-thinking-method-ontology/findings.md` lines 217-219; `cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md` lines 3-12 | It constrains future artifacts and has a validation model. |
| L-C05 | A formal invariant must name a preserved predicate, action/step, and layer. | `domainspec-lean-formalization/lean-formalization/SymmetryInvariant.lean` lines 79-99; `domainspec-lean-formalization/lean-formalization/ReflectionTower.lean` lines 343-353; `projects/framework-unification/CONCEPT-MAP.md` lines 132-152 | Operational invariant if designed/reviewed but not mechanically enforced. |
| L-C06 | Deterministic derivation is admissible with fixed graph/rule inputs and reproducible output/cardinality, not as proof of test effectiveness. | `domainspec-formalization/docs/domainspec-paper.md` lines 390-404, 408-481, 803-813; `domainspec-formalization/lean-formalization/DomainSpec.lean` T0'_C1 lines 152-161 | Same inputs and derivation rules reproduce outputs; effectiveness is separate. |
| L-C07 | Idempotency is mostly an operational reliability default unless formalized as an algebraic or lifecycle property. | `domainspec-formalization/docs/domainspec-paper.md` lines 468 and 745-758; `domainspec-lean-formalization/research/A2-noether/waves/phase-3-redteam/r2-t0-noether.md` lines 36-40 and 94 | Rerun/no-duplicate witness plus metric, or a typed algebraic statement. |
| L-C08 | Recursivity is admissible only as bounded self-application at a different altitude with artifact, gate, and next owner; orthogonality means axes vary independently unless explicit typed coupling says otherwise. | `domainspec-formalization/docs/domainspec-paper.md` lines 253-257; `projects/framework-unification/CONCEPT-MAP.md` lines 37-42; `cyberAlchemy-v2/authority/definitions/source-clusters/primordial.md` lines 57-90; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` CAV2-D16 lines 642-658 | Bound recursion and require typed coupling when axes are not orthogonal. |
| L-C09 | Monotonicity is formal only in scoped finite/discrete or append-only settings; residue must name layer and treatment route. | `domainspec-lean-formalization/lean-formalization/SecondLawDiscrete.lean` lines 6-33, 276-301, 472-480, 545-568; `domainspec-formalization/docs/domainspec-two-layer-framework.md` lines 51-64, 96-123, 270-284; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` residue lines 797-824 | Name scope, layer, and treatment route. |
| L-C10 | Promotion is admissible only with anchoring, faithfulness/iso-reflection where claimed, non-retroactive lower-layer preservation, and visible residue. | `implementation/domainspec/vault/conceptual/reflection-tower-in-domainspec.md` lines 38-52; `domainspec-lean-formalization/lean-formalization/ReflectionTower.lean` lines 191-202 and 343-353; `domainspec-lean-formalization/lean-formalization/ReflectionTowerAnchored.lean` lines 307-339 and 511-518; `cyberAlchemy-v2/authority/promotion-policy.md` lines 10-18 and 31-37 | Show anchor, preservation, and residue. |

Dissent: governance witnesses may disagree at `cyberAlchemy-v2/authority/promotion-policy.md`
because it is still candidate local policy, and implementation witnesses may
disagree where framework-unification invariants are explicitly designed, not
built.

## Turing, Alan

Read-only explorer return. Inventory breadcrumbs were used only to orient the
search, not as authority.

Claims:

- T-C01: Appender/dedup primitives are operational in dispatch registration and Arcanum observation.
- T-C02: Append-only replay appears as "append facts, replay/project later," not mutate old authority.
- T-C03: Deterministic projection is strongest where a canonical ledger/source owns state and generated views are rebuildable.
- T-C04: Confluence is mostly typestate/lifecycle discipline, not a formal confluence proof.

| ID | Primitive | Owner | Mechanism + Source Anchor | Failure Mode | Support |
| --- | --- | --- | --- | --- | --- |
| T-W01 | appender/dedup | `implementation/domainspec` subagents form layer | Dispatch ledger uses exactly two appends and `dispatch_id` / `close_of` dedup; appender self-checks ledger and no-ops duplicates. `implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/register-dispatch/SKILL.md:8-12,47-64,115-120`; `implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/register-dispatch/append-dispatch.cjs:295-359`. | Schema violation exits 2; corrupt ledger exits 1; orphan close warns; duplicate row skips. | implemented owner-scoped behavior |
| T-W02 | appender/dedup | Arcanum observability package | `observe-invocation.sh` validates envelope, derives `dedupe_key`, checks hook and central ledger duplicates, then appends one JSONL row. `arcanum/framework/observability/scripts/observe-invocation.sh:9-12,151-152,205-231,262-294,344-355`; `arcanum/framework/observability/scripts/record-hook-operation.sh:118-132,153-168`. | Invalid envelope fails; duplicate observer emission skips; strict mode can fail closeout on hook/dedupe commit failure. | implemented owner-scoped behavior |
| T-W03 | append-only replay | `implementation/domainspec` dispatch governance | Direct ledger edits are blocked; closing dispatch is an appended `close_of`, never mutation of the dispatch row. `implementation/domainspec/internal_tools/subagents-dispatch-hooks/skills/register-dispatch/SKILL.md:188-216`; `implementation/domainspec/internal_tools/subagents-dispatch-hooks/hooks/enforce-append-only-dispatch.cjs:4-29,34-38,89-96`. | Hook is a guardrail, fail-open, not a security boundary; authorized repair still needs care. | documented owner-scoped guardrail |
| T-W04 | append-only replay | `projects/poker-agent-arena` | Private transcript JSONL is replayed to reconstruct hands and verify payouts; public replay is a redacted projection. `projects/poker-agent-arena/src/poker_agent_arena/runner/match.py:195-220,225-250`; `projects/poker-agent-arena/src/poker_agent_arena/replay/redact.py:13-43,46-93`; `projects/poker-agent-arena/tests/test_local_arena_cli.py:32-47`. | Missing start/result, non-terminal replay, payout mismatch, or redaction hit fails diagnostics. | evidence candidate |
| T-W05 | deterministic generation/projection | `implementation/domainspec` test-derivation engine | Pure `parse -> G -> derive -> obligation_key -> emit`; `sha1` over stable canonical params; emit rows ordered by key. `implementation/domainspec/tools/test-derivation-engine/README.md:3,10-21`; `implementation/domainspec/tools/test-derivation-engine/src/index.ts:1-3,22-33`; `implementation/domainspec/tools/test-derivation-engine/src/keys/index.ts:13-29`; `implementation/domainspec/tools/test-derivation-engine/src/emit/spec.ts:6-23`; `implementation/domainspec/development/deterministic-test-derivation-engine/L0-ROUNDTRIP-REPORT.md:18-25,197-211`. | Non-canonical docs reject; prose becomes `needs_formal`; second-feature identity drift is surfaced, not guessed. | implemented owner-scoped deterministic behavior |
| T-W06 | deterministic generation/projection | Arcanum Craft | `.craft/ledger.yml` owns state; `CRAFT.md` and `.craft/index.json` are derived; stable IDs required. `arcanum/arcana/craft/templates/schemas/ledger-core.schema.yml:1-16,18-27`; `arcanum/arcana/craft/ARCHITECTURE.md:55-79,218-229,245-259`. | Editing derived views as authority causes drift; deterministic row updater/index builder is explicitly absent today. | documented owner-scoped precedent |
| T-W07 | deterministic generation/projection | Arcanum observability package | Central ledger is source of truth; by-sigil/by-capability indexes are rebuildable ledger references. `arcanum/framework/observability/scripts/rebuild-observability-indexes.sh:7-12,43-48,53-105`; `arcanum/framework/observability/ARCHITECTURE-OVERVIEW.md:121,261-269`. | Missing central ledger errors; invalid JSONL rows are skipped; stale indexes require rebuild. | implemented owner-scoped projection behavior |
| T-W08 | confluence/typestate | Arcanum Craft | Blockers have ordered lifecycle states, prohibited direct resolution, and evidence-required closure. `arcanum/arcana/craft/templates/schemas/ledger-core.schema.yml:194-257`. | Raw/typed blockers cannot jump to resolved; route validation is not execution proof. | documented owner-scoped lifecycle rule |
| T-W09 | confluence/typestate | Arcanum experiment harness | Loop converges only after bounded attempts and two consecutive passes; worse patches roll back; generated evidence is ignored. `arcanum/arcana/experiment-harness/development/ARCHITECTURE.md:5-21,60-68,123-172,176-185,228-237,250-258`. | Live Codex nondeterminism can be flaky; weak tests could self-satisfy; rollback must avoid user changes. | documented owner-scoped precedent |
| T-W10 | confluence/typestate | CyberAlchemy v2 authority owner | Promotion ladder separates source evidence, imports, inventory, ontology, local authority, implemented behavior, and stable repository asset. `cyberAlchemy-v2/README.md:8-16,58-67,86-94`; `cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md:68-74,101-114,146-151,177-184`; `cyberAlchemy-v2/authority/promotion-policy.md:8-18,20-37`. | Ontology/inventory can over-promote; generated projections can drift; implementation before validation is blocked. | candidate local authority model |
| T-W11 | append-only replay | GoldenQuill promotion governance proposal | Typed event journal with `idempotency_key` is replayable source for DAG, lifecycle, KPI, candidates, and approved reuse projections. `projects/goldenquill/docs/features/goldenquill-promotion-governance/development/refresh-runs/20260605T000000Z-grant-work-dag-cycle/REFRESH-PATCH-PROPOSAL.md:24-50,103-111,157-162,173-198`. | Duplicate same key/content is no-op; same key/different content becomes contradiction/residue; proposal-only, not implemented authority. | proposal-only evidence candidate |

Dissent: constitution-governance may downgrade CyberAlchemy v2 because it is
still candidate; Craft lifecycle may object that row-update/projection tooling is
absent; GoldenQuill is proposal-only; formal methods witnesses may reject
"confluence" until model-checked; observed-invocation-loop docs themselves note
direct `$skill` observation gaps.
