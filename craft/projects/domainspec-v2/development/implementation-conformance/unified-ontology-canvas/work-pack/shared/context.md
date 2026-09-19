# Shared Context

## Source Anchors

- `../../SPEC.md` — one graph, five bands, invariants, exclusions.
- `../../ARCHITECTURE.md` — graph contracts, six views, profile provenance,
  layout/routing, accessibility boundary.
- `../../UX-PLAN.md` — default Rule trace, popovers, navigator, focus and
  responsive semantics.
- `../../MAPPINGS.md` — exact node IDs and bridge derivations.
- `../../../ontology-experiment/architecture-ontology-view.html` — current
  builders (`buildMetaTypeGraph`, `buildTypeGraph`, `buildProfileGraph`,
  `buildFactsGraph`, `buildFindingsGraph`, `buildGraph`) and renderer.
- `../../../ontology-experiment/ontology.json` and companion JSON — read-only
  data contracts.

## Fixed Boundaries

- Source JSON stays read-only.
- No source adapter is implemented.
- No external dependency or package root is added.
- Facts/findings stay pinned to supplied TypeScript fixtures.
- Candidate/non-authority wording and status-axis separation remain visible.
- Every SWU stops after its own acceptance and closeout.
