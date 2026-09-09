# UX Plan

## Selected UX Surface

UX is required because natural persons navigate, inspect, compare, recover from
errors, and use assistive technology through a new rendered semantic contract.

## User Goals

| Actor | Goal | Success signal |
| --- | --- | --- |
| ontology reviewer | understand why a finding is grounded | traces exact lineage without opening raw JSON |
| domain owner | see conflict and unresolved ownership | identifies D2 conflict and owner-unbound relation |
| auditor | prove what bytes and verifier produced the view | opens receipt and exact source mappings |
| learner | understand the graph in a safe order | completes Poker guided tour |

## Critical Journeys

1. Select a verified local run and see trust state before graph state.
2. Search for O13/F1 and trace grounding.
3. Compare graph, outline, and table without losing selection.
4. Inspect exact relation, disposition, diagnostics, source path, and digest.
5. Recover from a rejected/tampered run.
6. Optionally reveal code context while keeping evidence-only mode available.

Automated journeys may begin only from an independently accepted
`oew.l1-build-handle.v1`. The browser runner owns exact browser binaries, a
minimal allowlisted environment, loopback ports, child PIDs, network
observation, and `finally` teardown. It must not reuse an ambient server.

## Information Hierarchy

1. Trust and authority ceiling.
2. Selected evidence and exact relation state.
3. Composition path and conflict residue.
4. Search/filter/navigation.
5. Reproducibility detail.
6. Optional code context.

## Accessibility Contract

- WCAG 2.2 AA target for implemented surface.
- Every graph fact has an outline/table equivalent.
- Full critical journey is keyboard-operable.
- Focus order follows navigator → surface → inspector → receipt drawer.
- Exact status uses text/icon/shape in addition to color.
- Reduced-motion mode disables path/layout animation.
- Screen-reader labels include node kind, exact relation, disposition, and
  connection count.
- Automated checks are necessary but cannot set manual accessibility to pass.

## Responsive Contract

- 1280px+: persistent navigator and inspector.
- 768–1279px: one side drawer at a time.
- below 768px: outline/table first, graph opt-in.
- Trust rail and exact selected status remain visible at all widths.

## Error and Recovery

| Failure | UI response | Recovery |
| --- | --- | --- |
| terminal receipt fail | hard block, exact diagnostic | select another run or repair upstream |
| adapter mapping incomplete | hard block, unmapped IDs/verbs | update explicit mapping contract |
| upstream pin mismatch | build/runtime block | restore pin or review upgrade |
| optional code graph stale | disable code lane only | regenerate scoped graph |
| invalid deep link | return to verified overview | preserve run selection |

## Validation

- component/unit checks for shared selection and state labels;
- parity oracle across graph/outline/table;
- Playwright Firefox and Chromium critical journeys;
- axe automated scan;
- keyboard-only script;
- named manual screen-reader/usability result kept separate;
- screenshots at desktop/tablet/mobile as evidence, not sole acceptance.
- independent verification of the browser receipt, owned PIDs/ports, port
  release, protected equality, and cleanup residue;

## Handoff Boundary

UX Plan owns semantic behavior and acceptance contracts. Implementation owns
components/CSS; Task Session owns one selected SWU; human reviewers own manual
accessibility/usability results.

Automated evidence remains `NOT_RUN` until the L1 bootstrap, feature units,
browser producer, and distinct verifier pass in dependency order. Manual
screen-reader/usability remains independently `NOT_RUN` even then.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
