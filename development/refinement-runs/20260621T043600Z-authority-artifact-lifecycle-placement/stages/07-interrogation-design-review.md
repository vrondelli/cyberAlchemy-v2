# Stage 07 - Interrogation Design Review

Status: flag
Capability: interrogation
Mode: refine-design-review
Run ID: 20260621T043600Z-authority-artifact-lifecycle-placement

## Review Question

Does the design accidentally let ontology own lifecycle because ontology can
represent lifecycle state?

## Verdict

Flag, repaired in Stage 08.

## Findings

| Finding | Severity | Evidence | Required repair |
| --- | --- | --- | --- |
| Ontology projection could still look authoritative if the lifecycle envelope is not named as owner-held. | medium | subagent provenance-model-skeptic | Say the envelope belongs beside the owning authority artifact; ontology gets refs/projections only. |
| Disciplines lack the same import/source-ledger pattern as definitions and constitutions. | medium | lifecycle-governance-designer receipt | Add next route for discipline-governance to define recurring-practice provenance. |
| Multi-source artifacts need conflict rules. | medium | provenance-model-skeptic receipt | Add precedence, unknown-source blocking, derivative wording, and drift owner requirements. |
| ARR-style metadata could be mistaken for accepted relation schema. | medium | ontology-boundary-critic receipt | Keep ARR design-scope only and block schema mutation. |

## Pass Conditions For Repair

- The final result must use the lifecycle envelope as owner-held governance
  metadata, not ontology schema.
- The result must include multi-provenance fields.
- The result must route definitions, constitutions, disciplines, and conflict
  decisions to their owners.
- The result must block implementation/schema work until owner routes pass.
