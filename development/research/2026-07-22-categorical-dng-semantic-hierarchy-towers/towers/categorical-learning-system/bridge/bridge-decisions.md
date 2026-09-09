# Semantic-Hierarchy Bridge Decisions

Target boundary:
`cyberAlchemy-v2/development/research/2026-07-22-semantic-hierarchy-bridge/findings.md`.

| Proposal operation | Source | Decision | Exact bridge use | Guardrail |
| --- | --- | --- | --- | --- |
| instance/pattern embeddings and ANN | PDF pp. 8, 11–13, 27 | `borrow-carefully` | C1 neighborhood candidate generation | pin model/metric/index; proximity only |
| `gap_distance` and confidence thresholds | PDF pp. 5, 8–9, 12 | `borrow-carefully` | prioritize uncertain candidates | call coverage gap, not morphism/semantic gap |
| graph instance and edge records | PDF pp. 11–12, 20 | `borrow-carefully` | stable candidate endpoints and explicit direction | type predicates; no authority from storage |
| provenance and example records | PDF pp. 12, 20, 31 | `borrow-carefully` | evidence lineage and replay | record digests, owners, status, rejected cases |
| `composes_after` suggestions | PDF pp. 13–14, 28–29 | `future-work` | input to separate operational-order candidate policy | validate types/cycles; never infer taxonomy |
| graph traversal of composition paths | PDF pp. 13, 27 | `borrow-carefully` | named operational projection | projection is not induction |
| curiosity strategies | PDF pp. 8, 17–19, 28–31 | `future-work` | acquire positives, negatives and labels for C1/C2 | baseline, privacy, teacher disagreement, adversarial tests |
| LLM decomposition/labeling | PDF pp. 13–14, 27–29 | `future-work` | produce reviewable relation/order/facet proposals | LLM output remains candidate evidence |
| clusters/frontiers/interpolation | PDF pp. 12–13 | `analogy-only` | hypothesis discovery | no cluster-to-level/facet semantic conversion |
| free wiring category | local reconstruction from pp. 1, 11–12 | `borrow-carefully` | formalize named operational paths | syntax only; not learned semantics |
| backbone functor / variant naturality | PDF pp. 1, 11 | `block` | none until typed/lawful | notation cannot upgrade capability |
| three adjunctions / growth functor | PDF pp. 2–3 | `block` | none until finite formal witness | feedback loops are not adjunctions |
| DNG latent and generated specialist | PDF pp. 14–17, 32 | `future-work` | possible proposal generator only | requires reproducible generation/evaluation |
| minted model | PDF pp. 23–26, 32 | `block` | no semantic-hierarchy contribution today | source-derived snapshot claim untested |
| promotion candidate | — | `block` | none | all vocabulary remains local-only |

## Algorithm delta

The proposal can contribute these exact new candidate operations:

1. `generate_model_neighborhood(input, pinned_encoder, metric, index)`;
2. `record_coverage_gap(input_digest, neighborhood, gate_evidence)`;
3. `propose_composition_edge(source_id, target_id, evidence, direction)`;
4. `acquire_gap_fixture(strategy, budget, privacy_policy)`;
5. `append_training_lineage(gap → examples → candidate_instance)`;
6. `project_named_operational_paths(accepted_typed_edges)`.

It cannot contribute:

- `infer_semantic_relation`;
- `infer_parent_or_ancestor`;
- `assign_semantic_facet`;
- `construct_hierarchy`;
- `align_hierarchies`;
- `prove_semantics_preservation`.

Those six positive operations stop at candidates/evidence. Promotion and
authority remain outside this tower.
