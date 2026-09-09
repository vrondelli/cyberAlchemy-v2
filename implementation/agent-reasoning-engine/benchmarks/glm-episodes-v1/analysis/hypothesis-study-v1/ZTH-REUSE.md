# ZTH component reuse decisions

Status: source-reviewed candidates. No GLM treatment executed.

Upstream: Zaphod's Third Hand by David Bitecofer / GardenerDave, commit `62bc29e2846439352a9e1405d3b6226754805a80`. [Selected paths and content hashes](sources.json) preserve provenance. The user explicitly authorized project reuse in this conversation; the upstream attribution and license remain recorded. This package contains our study definitions, not a vendored upstream runtime.

| Component | Decision for ARE | Hypothesis and required adaptation |
|---|---|---|
| [Correction card](https://github.com/GardenerDave/zaphods-third-hand/blob/62bc29e2846439352a9e1405d3b6226754805a80/docs/behavior_correction_cards/file_scope_hold_out_v1.json) | Reuse the explicit applicability/instruction/validator/failure/provenance structure | H2/H3: author GLM-specific candidate cards; upstream file-scope guidance is not a demonstrated fix for our metadata or semantic failures. Bind card hash and explicit assignment per treatment. |
| [Capability comparison](https://github.com/GardenerDave/zaphods-third-hand/blob/62bc29e2846439352a9e1405d3b6226754805a80/local_harness/compare_model_auditions.py) | Adapt reporting concepts; do not directly use rankings | H2–H7: inspected `compare_cards` does not require identical board IDs, ranks metrics descending and defaults missing/non-numeric values to zero. ARE must require exact fixture/scorer/policy identity, preserve unknowns, declare metric directions and identify runs beyond model ID. |
| [Review-to-curriculum conversion](https://github.com/GardenerDave/zaphods-third-hand/blob/62bc29e2846439352a9e1405d3b6226754805a80/local_harness/failure_training/review_to_curriculum_candidates.py) | Reuse explicit review fields as a design pattern; defer training export | H1/H3/H7: classification and likely cause are reviewer claims, not causal evidence. Bind retained source IDs and keep cause as a candidate hypothesis; hold out new cases. Endpoint use alone does not establish an available GLM training path. |
| [Context distiller](https://github.com/GardenerDave/zaphods-third-hand/blob/62bc29e2846439352a9e1405d3b6226754805a80/docs/CONTEXT_DISTILLER_WORKFLOW.md) | Retain as a separate lossy-context treatment candidate | H4/H5: source selection, focused passes and provenance are useful. Summarization adds model calls and can lose facts; it is not a guarantee against provider compaction or a drop-in replacement for recycling. Measure retention and full-call cost. |

The most useful immediate transfer is experimental discipline: named treatment, explicit applicability, reproducible evidence and separate review. ARE already has canonical schema diagnostics, physical-call accounting and a research ontology. A second runner or router would require a demonstrated gap rather than duplication.

## Open Questions

Owned by the [study](README.md#open-questions): treatment selection, generalization, exact comparison contracts and retention coverage. No ZTH result is counted as local GLM evidence.
