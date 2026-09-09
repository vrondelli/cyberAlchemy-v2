# Bridge decisions — DNG to Ponder ontology evaluation

The target bridge says proximity is not hierarchy and requires independently
governed typed-relation proposal, order/facet operations, projection, alignment,
and validation. DNG supplies none of those semantic operators.

| ID | Candidate transfer | Status | Decision and evidence boundary |
| --- | --- | --- | --- |
| B01 | Encode a declared, fixed computation/projection pipeline as ordered graph events. | `borrow-carefully` | DNG’s events follow layerwise forward computation (PDF p.5). Borrow only the pattern of named ordering; define Ponder event semantics separately. |
| B02 | Edge-conditioned message passing over a frozen typed-graph projection. | `borrow-carefully` | Equations 4–6 support the architectural mechanism (PDF pp.6–7), not target utility. Adapter must preserve predicates/direction/provenance and forbid authority mutation. |
| B03 | Learn candidate relation scores from ontology graphs. | `future-work` | Paper learns INR classes and accuracy, not relation labels (PDF pp.10–11). Requires gold predicates, review, calibration, and hard negatives. |
| B04 | Infer parenthood, facets, or hierarchy from DNG state. | `block` | The source never supplies ontology semantics; bridge requires distinct C2a/C2b policies and evidence. |
| B05 | Use DNG permutation proof for Ponder IDs. | `block` | The proof covers hidden-neuron reindexing with corresponding weight transformations (PDF pp.19–23), not stable identifiers/references. |
| B06 | Treat `t_l` as conceptual abstraction level or ontology history. | `block` | `t_l` is forward-pass schedule (PDF p.5); no such semantic interpretation is given. |
| B07 | Use image-reconstruction supervision as a recipe for grounded target training. | `analogy-only` | INR2JLS shows task-specific joint supervision (PDF pp.8–12). Ontology target, labels, and leakage boundaries remain unprovided. |
| B08 | Claim DNG is better than static/set encoder for Ponder. | `block` | Tables test specific weight-space datasets and baselines only (PDF pp.10–13, 18, 26). |
| B09 | Build an adapter/data/training evidence package. | `future-work` | Required to test B01/B02. Route to `research-evidence-harness`. |

## Required adapter/data/training obligations

1. Freeze an input schema and projection version; retain stable IDs, predicate
   direction, provenance, review state, and `authority_effect:none` separately
   from model features.
2. State exactly what creates an event timestamp. Legitimate examples might be
   a projection compiler stage or a deliberately authored evaluation traversal;
   “hierarchy level” is invalid until an order policy/gold fixture exists.
3. Declare which attributes are features, which are prediction labels, and which
   are forbidden to prevent leakage (especially authority/review outcomes).
4. Pin train/validation/test splits by source/provenance/time and include
   structurally similar negatives, not merely random non-edges.
5. Compare static typed-GNN, set/record encoder, simple relation-rule baseline,
   and ordered DNG-like encoder at matched capacity/data budget.
6. Pre-register relation-level metrics (e.g. predicate precision/recall,
   calibration, per-predicate failure slices), deterministic replay, and human
   adjudication. Do not use a scalar cross-hierarchy score.

## Smallest decision

Adopt no architecture yet. Preserve B01–B02 as design hypotheses only; route
B09 to evidence harness before any implementation/promotion claim.
