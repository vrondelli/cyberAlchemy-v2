# SWU-VIS-005 — validation and recomposition

Owner: task-session

## Outcome

Prove the dispatch, generator, tests, HTML interaction, Craft integration, and source
boundary recompose into one maintained feature.

## Read/write surface

Read all feature outputs and the scoped Craft ledger. Write the final receipt only,
except for defect repairs within earlier declared surfaces.

## Validation

- Dispatch validator.
- Unit suite including negative controls.
- Generator `--check`.
- Browser inspection of overview, filtering, node detail, frontier, critical sequence,
  source links, responsive layout, and console.
- Craft id/path/reference validation and parent-state assertion.
- Git diff inspection for public/private boundary and unrelated mutations.

## Result rule

Pass only if every required check passes. Otherwise block with exact residue and next
owner. A pass closes the visibility feature only; it does not advance FPR-01.
