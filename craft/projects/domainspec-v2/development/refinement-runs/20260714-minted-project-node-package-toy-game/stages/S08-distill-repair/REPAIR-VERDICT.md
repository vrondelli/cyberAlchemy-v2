# Distill Repair Verdict

Mode: `validate`  
Status: `pass for non-executed planning`  
Selected unit: `SCU-MINT-NODE-PACKAGE-TOY-001`

## Outcome

Select layout A—one canonical file per node with stable, source-owned outgoing connections—as the L0 mint-contract default under one explicit assumption: an edge does not yet have an owner or evidence lifecycle independent of its canonical source node.

This is a provisional optimization point, not a universal storage law. The normalized graph still contains first-class edges, and layout B remains the named extension when independent edge lifecycle evidence appears.

## Evidence Recomposition

| Evidence unit | Result | What it establishes |
| --- | --- | --- |
| S06 valid candidates | 3/3 pass | all layouts can carry the same four nodes and three edges |
| semantic graph equivalence | byte-identical | authoring layout need not leak into implementer graph semantics |
| Markdown equivalence | byte-identical | human view can derive from graph, not storage shape |
| repeat builds | 3/3 byte-equal | deterministic normalization/generation at toy scale |
| original negative controls | 8/8 expected failures | unique ownership, typed endpoints, view drift, Markdown independence, and root containment |
| repaired navigation | 4 nodes + 3 edges resolved in every layout | implementer can join graph IDs through source manifest to canonical project-local sources, including bundles |
| repaired source binding | all inputs hash-bound; stale source rejected | receipt/source manifest can detect source changes when verified against the project root |
| repaired language binding | wrong digest rejected | factory language authority is pinned without becoming consumer semantics |

Combined negative controls: `10`.  
Repair evidence: `REPAIR-EVIDENCE.json`, SHA-256 `a936352aa7247796a63b26d69b98a8813e64b649f14aa64b6a3328bcb4c29f3a`.

## Review Repair Closure

| Repair | Verdict | Closure |
| --- | --- | --- |
| DR-01 measured vs assessed claims | pass | evidence now labels equality, determinism, counts, failures, and navigation as measured; authority clarity/edit locality remain assessed |
| DR-02 executed navigation join | pass | every graph node/edge resolves to exactly one manifest record and containing source file in A/B/C |
| DR-03 source-aware receipt verification | pass | `stale-source` mutation returns its expected failure |
| DR-04 language digest negative | pass | `language-digest-mismatch` mutation returns its expected failure |
| DR-05 kind-specific formation validation | deferred, non-blocking for layout | production compiler plan must integrate admitted formation/profile validators |
| DR-06 generated-root resolution | deferred, non-blocking for layout | project-mint plan must resolve and contain `generated_root` |

## Selected Contract

```text
project.json
  -> feature manifest
      -> nodes/<one canonical node>.json
          -> connections[] owned by the canonical source node
  -> compile against pinned language authority
      -> graph.json                 # layout-neutral nodes and first-class edges
      -> source-manifest.json       # graph ID -> canonical project-local source
      -> SPEC.md                    # generated human view
      -> build-receipt.json         # source/language/output digest binding
```

An implementer traverses `graph.json`, looks up the selected node/edge ID in `source-manifest.json`, and opens that machine source. It never parses `SPEC.md` to recover semantics.

## Why A, Not B or C

- A and B are equal on the toy's graph semantics, negative controls, determinism, and assessed single-record locality.
- A uses 6 canonical inputs; B uses 9. The three additional edge files buy no witnessed independent owner/evidence lifecycle in this corpus.
- C also uses 6 inputs but groups two behavioral nodes and all three edges into bundles, reducing assessed edit/authority locality without changing graph capability.
- Therefore A is the smallest currently responsible default. The argument expires when its lifecycle assumption expires.

## Validate Technique Trace

| Technique | Result | Repair effect |
| --- | --- | --- |
| `abstraction_level_guard` | pass | kept authoring layout (artifact/interface) distinct from graph semantics (projection) and mint capability |
| `recomposition_proof` | pass | project manifest → node sources → graph/manifest → agent/human consumers is mechanically exercised |
| `evolution_profile` | pass | concrete pressures are cross-feature graphs and independent edge lifecycle; stable IDs and layout-reader boundary preserve extension |
| `cognitive_load_check` | pass | A avoids B's extra files and C's multi-record bundles at current scale |
| `requisite_variety_check` | pass | four kinds, three signatures, ten failures cover local claims; production formation and cross-feature claims remain excluded |
| `boundary_object_check` | pass | graph and source manifest provide stable shared meaning across consumer author, implementer agent, and human learner |
| `concept_vs_knowledge_status` | pass | measured evidence is separated from assessed rubric and unproven product claims |
| `premortem_pass` | pass | likely failure is edges gaining independent lifecycle; guard is stable edge ID plus explicit layout-B rerun trigger |
| `frame_expiry_note` | pass | selection expires on independent edge governance or cross-feature completeness |
| `navigable_result_check` | pass | `selected-design.json` gives S09 the exact default, boundaries, evidence, gaps, and triggers |

## Premortem

Six months later, layout A failed because cross-feature or independently reviewed edges accumulated and no endpoint node could responsibly own their source. Failure category: hidden coupling / too small for expected evolution. Guardrail: edge IDs and normalized edges are already independent of storage; rerun A vs B on a multi-feature corpus before adding an edge registry or service.

## Deferred Complexity and Owners

- Kind-specific formation/profile validation — future compiler/validator implementation SWU.
- `generated_root` resolution and containment — future minter/output SWU.
- Cross-feature graph resolution — later Refine experiment triggered by a cross-feature production claim.
- Independent edge lifecycle — later Refine/Decision Gate triggered by separate ownership/evidence requirements.
- FPR-01 source-home disposition — existing owner Decision Gate; this run supplies evidence but no authority.

## Frame Expiry and Next Route

The frame expires when any edge needs an owner, evidence, version, or review lifecycle independent of its source node, or when the mint contract claims complete cross-feature traversal. Until then, Invoke Plan may use layout A as the L0 default and must preserve B as the explicit extension path.

Next route: `invoke plan` inside the run folder only. No mutation-capable Task Session is authorized by this verdict.

