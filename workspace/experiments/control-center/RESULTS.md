# Prototype evidence

Date: 2026-09-05. Status: candidate interaction witness. Authority effect: none.

## Completed sequence

Business refinement and system/bridge ontology files were created first.
PLAN.md was then written in the same initial artifact step before model.mjs,
model.test.mjs, app.mjs, index.html, or styles.css existed. Implementation
followed that plan.

## Observed checks

- All 21 named state-model scenarios passed with Node's test runner.
- Source currency, six interaction contracts, seven system components, bridge
  endpoints and scenario mappings passed the package validator.
- Closed JSON schemas for business, system and bridge passed jsonschema checks.
- Firefox exercised explicit chat targeting, proposal-before-apply, pin conflict
  rejection, apply/restore, draft retention, chat expansion, session layout
  save/load, attention acknowledgement, detail/return navigation, and submission.
- A programmatically triggered attention condition while the essay held keyboard
  focus left that focus on the essay.
- An essay scrolled to 250px retained that scroll position after applying an
  ontology layout and restoring writing mode.
- At 390 × 844, the chat bounds were left 10, right 380, bottom 836. No document
  horizontal overflow was observed.
- Browser console inspection reported zero errors and zero warnings.
- Desktop and mobile screenshots were inspected visually.

## Visual evidence

- [Desktop, 1440 × 1000](output/playwright/desktop.png)
- [Mobile, 390 × 844](output/playwright/mobile.png)

## Interpretation and limits

These are bounded prototype checks. Model scenarios are state-transition
evidence; the browser journey supplies selected interaction and geometry evidence.
The browser checks do not independently cover every model edge case.

Live reasoning and orchestration are not integrated. Research stages, graph
content, attention conditions, and replies are explicitly local fixtures.
The graph visual is an illustrative projection, not an admitted ontology view.

The production Rust and frontend suite, typecheck of the existing app,
WDIO-specific Vite build, unified Tauri smoke, production build restoration,
qualified repeated cold desktop sessions, meaningful latency sample population,
and differential evidence against a previous integrated candidate are
not_evaluable here. Their prerequisite is one integrated frozen Tauri candidate.
No production performance result or product approval is claimed.

## Open Questions

See [the source residue](../../control-center-ontology/residue.json).
The prototype does not close its eight questions or the Definition Pack's
saved-session/context-evaluator gaps.
