# UX Plan — Bounded Context Home, Portals, and Path

Status: discovery companion; planned behavior only

## User Outcome

A new reviewer can answer four questions without first decoding 237 cards:
where am I, what belongs here, why can I go there, and which exact relations
connect two concepts?

## Information Architecture

- **Scope bar:** current scene heading, purpose, node/relation counts, Back, and
  `Show all loaded graph`.
- **Canvas:** only the active scene or selected route projection.
- **Context rail:** labeled portal cards and exact relation disclosure.
- **Inspector:** selected node/relation source fields and evidence.
- **Scene legend:** active presentation relation styles, exact predicates,
  direction meanings, authority fields, and no-authority disclaimer.
- **Provenance row:** pinned build reference, adapter receipt reference, and
  `projectionAuthorityEffect: none`. Remove the unverifiable checkout
  freshness warning; do not replace it with an ontology-validity claim.
- **Path sheet:** endpoints, policy, Find, status, route alternatives, and
  exact selected-route steps. Path is a comparator, not a cluster browser.

## Home

- Heading: `Business capability map`.
- Purpose: `Start with the business contexts and capabilities that organize
  Body War responsibilities.`
- Scope: `4 selected contexts — 4 of 12 loaded contexts`.
- The four source-backed context cards use visible `bounded context` chips and
  role icons with adjacent `authority` text.
- Initial focus lands on
  `[data-testid="area-heading"][data-scope-kind="home"][tabindex="-1"]`.
- `Show all loaded graph` remains visible and enabled on home, context, and
  path surfaces. Counts are derived from the admitted graph, not hard-coded.

## Context Portal Card

A card contains:

1. destination context label and role icon/text;
2. source-backed purpose;
3. `N capabilities` and `M connecting relations`;
4. an expandable list of exact constituent crossings;
5. an expandable list of direct `owns` membership proofs;
6. one native button with a destination-focused accessible name.

Zero owner proofs fall back to an exact node portal. Multiple proven owners
create one deterministically ordered card per owner and say that multiple
owners are present; the UI never chooses silently.

## Path

The sheet uses outcome-bearing labels:

- `From concept`
- `To concept`
- `Follow source direction`
- `Connections either way`
- `Find routes`

Find is disabled until both distinct endpoints exist. `Follow source
direction` is disabled with the visible reason `Source direction is not
available for every relation in this scope` until preservation passes. A found
result shows route alternative cards, not a branch cluster. Selecting one
shows ordered relation steps on the canvas and in an equivalent list.

## Card and Edge Visual Language

- Primary icon is a redundant scanning cue for exact `concept_role`; visible
  role text and `business_kind` chip remain.
- Candidate tokens: authority/landmark, evidence/document-check,
  workflow/route, projection/layers. Final SVG assets require successor Define
  acceptance of the semantic key, then implementation review.
- Edges use one stable color per exact `sourcePredicate`: all `owns` edges share
  one color, all `depends_on` edges share another, and the mapping stays stable
  across scenes. No edge instance receives an arbitrary unique color.
- Coarse `presentationRelation` controls only the redundant solid/dash pattern.
- Exact source predicate appears inline in bounded scenes and is keyboard and
  pointer recoverable elsewhere.
- Arrow markers plus `->`/`<->` text explain projected direction. The legend
  shows the active predicate-to-color mapping and distinguishes projected,
  source, and traversal direction.

## Controls

- `Overview` is not used as a persona label. The explicit graph-scope control
  is `Show all loaded graph`.
- `Learn — guided tour` and `Deep Dive — code-focused view` are persona/view
  controls and must state whether they alter graph scope.
- Search remains. Fuzzy may remain the implementation default. The current
  visible Semantic mode is removed until it has distinct behavior.
- Filter, Export, and Path live under graph tools; Theme and keyboard help live
  under utilities. Diff remains absent while no diff data exists.
- Every visible control must have an accessible name, enabled/disabled state,
  observable result, and focus-restoration target.

## Responsive and Accessibility Contract

Desktop fixture: 1440x1000.

- `[data-testid="knowledge-workspace"]` is a two-column grid.
- `[data-testid="knowledge-canvas"]` and
  `[data-testid="knowledge-context-rail"]` are siblings with non-intersecting
  bounding boxes.
- `[data-testid="knowledge-scene-legend"]` remains contained by the rail and
  does not intersect the canvas, top scope bar, or React Flow controls.
- No visible portal, legend row, scope control, or Path trigger is clipped.

Narrow fixture: 390x844.

- The canvas remains full width with no horizontal overflow.
- Context details and Path open as focus-managed sheets identified by
  `[data-testid="knowledge-sheet"][aria-modal="true"]`.
- Intentional modal coverage is allowed only while the sheet is open; the
  canvas has both `inert` and `aria-hidden="true"` and is hidden from assistive
  navigation during that interval.
- The sheet must be dismissible, scroll internally, expose every control, and
  restore focus to its invoker.
- A non-modal rail may not overlap the canvas, controls, or legend.

Forced-colors operation:

1. load the exact fixture and scene;
2. emulate `forced-colors: active` in Chromium;
3. inspect every active node-role icon, edge, marker, legend sample, focus
   indicator, portal, and route step;
4. require visible text, retained solid/dash pattern, system-color stroke,
   direction marker/text, and a focus outline of at least 2 CSS px;
5. repeat Path selection and portal/Back without using color in assertions.

Reduced motion disables animated traversal; static markers and text remain.
Hover-only disclosure, color-only relation identity, icon-only categories,
and animation-only direction are forbidden.

## Human Validation Ceiling

The earlier eight-participant counterbalanced novice protocol remains the
human acceptance route. Automated tests may prove mechanics, focus, exact
fields, responsive geometry, and forced-color redundancy. They cannot prove
comprehension, screen-reader announcement quality, or accessibility
conformance.
