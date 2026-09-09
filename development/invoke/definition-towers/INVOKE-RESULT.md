# Invoke Result - Definition Towers

Status: flag
Mode: define
Spell: invoke
Canonical ID: invoke
Scope: library
Run date: 2026-06-20
Target artifact: CyberAlchemy v2 definition towers and Craft execution surface

## Intent

Create a high-to-low definition tower map for CyberAlchemy v2 and associate the
work with a Craft ledger so the next sessions can execute from a durable
surface instead of scattered conversation context.

## Mode Contract

- Mode contract: [../../../../arcanum/spells/invoke/define.md](../../../../arcanum/spells/invoke/define.md)
- Discovery evidence: [../../../SOURCE-MAP.md](../../../SOURCE-MAP.md), [../../../authority/imports/definitions/MANIFEST.md](../../../authority/imports/definitions/MANIFEST.md), [../../../authority/imports/constitutions/MANIFEST.md](../../../authority/imports/constitutions/MANIFEST.md), [../../../../.arcanum/inventory/index.md](../../../../.arcanum/inventory/index.md), [../../../../.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md](../../../../.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md)
- Discovery waiver: not needed; scoped discovery/import artifacts already exist.

## Outputs

| Output | Type | Owner |
| --- | --- | --- |
| [../../../authority/definitions/DEFINITION-TOWERS.md](../../../authority/definitions/DEFINITION-TOWERS.md) | candidate tower map | definitions-governance |
| [../../../.craft/ledger.yml](../../../.craft/ledger.yml) | Craft source ledger | Craft |
| [../../../.craft/index.json](../../../.craft/index.json) | derived Craft index | Craft |
| [../../../CRAFT.md](../../../CRAFT.md) | Craft human view | Craft |
| [INVOKE-RESULT.md](INVOKE-RESULT.md) | invoke define report | invoke |

## Template Selection

Selected shape: local definition-tower define packet.

Rationale: the target is not a normal product/module spec yet. It is an
authority-classification surface that must preserve import candidates, owner
routes, boundary posture, and next execution steps. The DomainSpec template
family remains compatible downstream, but applying the full spec template here
would blur the current task: classify and route definitions before promotion.

## Dispatch Technique Trace

| Technique | Applied to | Validation expectation |
| --- | --- | --- |
| `sequence` | Craft discovery, tower authoring, ledger export, validation. | Outputs appear in ordered dependency shape. |
| `frame_handoff` | Definition towers hand off to Craft contexts. | Each tower maps to a Craft context or queue. |
| `handle_handoff` | Invoke result names next owner routes. | Definitions, constitutions, boundary, and task-session owners stay separate. |
| `residue_ledger` | Open questions and gaps stay in `.craft/ledger.yml`. | Pending work is explicit by node. |
| `owner_boundary_check` | Arcanum public, DomainSpec private, research-local, and validation evidence boundaries. | No source is silently promoted. |
| `artifact_contract_bridge` | Tower map links to canonical definitions, import manifests, and Craft source ledger. | Artifacts cite owner surfaces instead of redefining them. |
| `validation_loop` | Parse/link checks after artifact creation. | Validation results are recorded in final response and Craft status. |
| `concrete_path_evidence` | Every tower uses concrete source paths. | Tower claims point to files or are marked candidate. |
| `observability_grouping` | Craft ledger records route and pending nodes. | Future runs can continue from context IDs. |

Full dispatch JSON was not required for this define pass because the route does
not spawn subagents, mutate upstream canonical sources, or enter execution.

## Distill Validation

Verdict: flag.

The broad request was reduced to a smallest coherent define-stage unit:

```text
definition tower map + Craft execution ledger
```

This is small enough to continue from, but not promotion-ready because import
candidate clustering, duplicate detection, and owner review remain open.

## Decisions

| Decision | Status | Rationale |
| --- | --- | --- |
| Treat CyberAlchemy v2 as the umbrella stable repository/amalgamation. | provisional | Existing CyberAlchemy v2 definitions and source map already use this shape. |
| Treat Arcanum and DomainSpec as pillars. | provisional | Arcanum owns public framework terms; DomainSpec owns private semantic/modeling evidence. |
| Treat Craft as an Arcanum-owned execution sub-tower with a high-priority local role. | provisional | Craft provides the ledger surface for this work but does not promote definitions by itself. |
| Keep import manifests as candidate authority ledgers. | selected | The current manifests stage 149 definition-like candidates and 106 constitution/axiom candidates without promotion. |

## Unresolved Gaps

| Gap | Owner route | Status |
| --- | --- | --- |
| Classify definition candidates by tower, source family, term type, and authority posture. | Craft + definitions-governance | active |
| Detect duplicate/conflicting terms across Arcanum, DomainSpec, CyberAlchemy, MARS, Ontologize, project glossaries, and research towers. | definitions-governance | active |
| Compose constitution/rule towers from 106 constitution/axiom candidates. | constitution-governance | active |
| Decide visible `inventory/` and `ontology/` project spaces before standalone extraction. | decision-gate | active |
| Public/private boundary review for private DomainSpec and validation evidence. | decision-gate | active |

## Next Route

Next route: deferred from Invoke into Craft.

Craft owns the next execution surface:

1. Start with `CTX-CAV2-DEF-TOWERS`.
2. Close or defer `DEC-CAV2-TOWER-ALTITUDE-001`.
3. Cluster Q1 top anchors and produce the first promotion-ready definition
   candidates.
4. Route promotion through definitions-governance, not Craft alone.

## Invoke Result

- Mode: define
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: flag
- Mode contract: `arcanum/spells/invoke/define.md`
- Outputs: `authority/definitions/DEFINITION-TOWERS.md`, `.craft/ledger.yml`, `.craft/index.json`, `CRAFT.md`, `development/invoke/definition-towers/INVOKE-RESULT.md`
- Template selection: local definition-tower define packet
- Dispatch techniques: sequence, frame_handoff, handle_handoff, residue_ledger, owner_boundary_check, artifact_contract_bridge, validation_loop, concrete_path_evidence, observability_grouping
- Distill validation: flag; broad request reduced to tower map plus Craft execution ledger, but promotion work remains open
- Decisions: provisional altitude model, import-first authority posture
- Unresolved gaps: definition clustering, duplicate detection, constitution clustering, visible inventory/ontology decision, public/private boundary review
- Next route: deferred to Craft, then definitions-governance and constitution-governance
