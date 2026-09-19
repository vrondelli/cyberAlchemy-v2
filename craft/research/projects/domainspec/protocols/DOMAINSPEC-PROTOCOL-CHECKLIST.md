# DomainSpec Protocol Validation Checklist

This checklist is used before any experiment execution in `research/projects/domainspec`.

## Criteria

| Check | Pass/Fail | Notes |
|---|---|---|
| Objective and claim mapping are defined |  |  |
| Methodology profile is linked (`definitions/METHODOLOGY-PROFILE.md`) |  |  |
| Tier selection (foundation or full) is declared and justified |  |  |
| Hypothesis or success criteria are measurable |  |  |
| Required data schema fields are defined |  |  |
| Metadata fields are complete (`experiment_id`, `run_id`, `timestamp`, `model`, `operator`) |  |  |
| Dependency requirements are declared |  |  |
| Source requirements are explicit |  |  |
| Primary references are listed with source IDs and version pins in `sources.md` |  |  |
| Reference IDs used as authority exist in `sources/REFERENCE-LEDGER.md` |  |  |
| Inventory entry-type requirements are explicit |  |  |
| Context bundle path (`experiments/<experiment-key>/context.md`) is declared |  |  |
| Context bundle maps claim IDs, key definitions, and source-role matrix |  |  |
| Definition anchors (from `definitions/DEFINITIONS.md`, referenced by IDs in `definitions/DEFINITIONS-INDEX.md`) are listed in protocol |  |  |
| Technique/specialization protocols anchor DS-M13 and declare promotion mode (`method-only`, `promotion-candidate`, or `ontology-change`) |  |  |
| Layer/taxonomy/edge-stress protocols explicitly anchor DS-D5..DS-D10 when applicable |  |  |
| Expected row volume or sampling plan is explicit |  |  |
| Analysis path is consistent with selected tier |  |  |
| Claim-to-paper traceability section is present |  |  |

## Decision

- PASS: all required checks pass.
- NEEDS-REVISION: non-critical checks fail.
- BLOCKED: methodology linkage, measurable criteria, schema, or dependency requirements are missing.
