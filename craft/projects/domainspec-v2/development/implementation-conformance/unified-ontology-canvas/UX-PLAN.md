# UX Plan: Unified Ontology Canvas

## User Goals

| Goal | Actor | Success signal |
| --- | --- | --- |
| Understand how one concept travels from meaning to finding | ontology reader | one selection exposes the complete available Rule path and named gaps |
| Browse every graph family without losing place | ontology reader | pan/zoom/focus/filter retain one graph identity and reversible state |
| Inspect exact meaning and evidence posture | ontology reader | Details shows plain language, exact IDs, source family, statuses, owner, and claim ceiling |
| Operate without precise pointer input | keyboard/assistive reader | structured navigator and roving focus reach every graph object and restore focus |

## Actors

| Actor | Needs | Constraints |
| --- | --- | --- |
| learner | plain-language story before raw JSON | may not know ontology, maturity, coverage, or evaluation vocabulary |
| architecture/domain reader | exact provenance and distinct relation kinds | visual proximity must not imply identity or authority |
| keyboard/assistive reader | predictable order, relationships, focus recovery | spatial SVG cannot be the only representation |

## Journeys

| Journey | Start | Success | Failure/recovery | Reversibility |
| --- | --- | --- | --- | --- |
| Follow Rule | overview with default Rule emphasis | DS-D1.7 -> candidate realization -> constraint/property -> supplied fact -> finding is highlighted | missing hop becomes a visible gap with owner route | Clear focus returns to overview/previous transform |
| Explore a family | Explore popover | search/filter selects any object without replacing graph | no match preserves query and explains active filters | reset/clear restores full graph |
| Change profile emphasis | TypeScript emphasized | Python/Rust expectations become primary while fixed TypeScript fixture stays labeled/dim | “no supplied observation/evaluation” prevents false comparison | reselect TypeScript |
| Inspect contract | selected node/edge | Details exposes plain language and raw contract | malformed/unresolved content shows source selector and error | close restores opener focus |
| Keyboard navigation | canvas or navigator focus | arrows move spatially, relation command follows typed edges, list reaches all objects | help explains command; Esc reverses | deterministic focus origin retained |

## Surfaces

| Surface | Purpose | Entry | Exit |
| --- | --- | --- | --- |
| canvas | spatial overview and trace navigation | page load, navigator result, fit commands | Details, Explore, clear focus |
| Explore popover | search, family/profile/maturity controls, structured object list | Explore button or `N` | select item or close to opener |
| Details popover | plain-language and exact contract inspection | node/edge activation | close to originating object |
| Help dialog | mental model, relation legend, keyboard commands, evidence ceiling | Help button | close to opener |

## Visible State And Meaning

| Visible state | Meaning | Must not imply |
| --- | --- | --- |
| candidate alignment | explicit experiment mapping with no authority effect | semantic equality, admission, or binding |
| unsupported/profiled-unmapped | implementation coverage gap | invalid or inactive DomainSpec type |
| profile constraint | selected language/project expectation | universal architecture or property meaning |
| supplied TypeScript fact | hand-authored example in adapter-shaped form | executed adapter or current source truth |
| finding | mismatch in expected TypeScript evaluation | runtime defect, waiver, or release blocker |
| dim node | present but outside current focus | absent from graph or unimportant |
| hidden by explicit filter | user-chosen visibility state | deleted or unsupported |

## Interaction Model

- Default overview contains every graph family and opens with the Rule journey
  emphasized; unrelated nodes remain present and dimmed.
- Pan/zoom works only when canvas focus/pointer intent is active and must not trap
  ordinary page scrolling outside it.
- Fit-all, fit-selection, and reset are distinct controls.
- Search indexes exact ID, label, plain language, family, and status.
- Node activation highlights real incident paths; edge activation explains
  relation direction and derivation.
- Profile selection never changes underlying graph identity.
- Semantic zoom hides secondary labels/edge text before hiding nodes; all objects
  remain reachable in Explore.

## Accessibility Contract

| Concern | Required response | Acceptance evidence |
| --- | --- | --- |
| tab order | one roving canvas entry plus normal popup controls; no node-per-tab flood | keyboard journey and active-element trace |
| spatial navigation | arrows select deterministic nearest neighbors; modified arrows traverse typed relations | positive/edge-case fixture |
| equivalent representation | Explore list/tree exposes kind, statuses, incoming/outgoing relations, and selection | canvas/navigator ID equivalence |
| popover/dialog focus | focus moves intentionally; hidden surface is inert; close restores opener | focus trace |
| names/relationships | every object and relation has a meaningful accessible name and direction | DOM inspection/screen-reader-oriented snapshot |
| contrast/non-color | shape, text, dash, icon, and label complement color | CSS/DOM inspection |
| motion | honor reduced motion; no force animation | media-query check |
| zoom/reflow | usable at 200% and 400%; structured navigator remains operable | browser viewport journey |

`role="application"` is not accepted until the complete custom keyboard model
passes. Before that point the SVG is a labeled graphic/group and the structured
navigator is the primary keyboard representation.

## Responsive Semantics

| Condition | Retained information/actions | Order/relationship | Recovery |
| --- | --- | --- | --- |
| wide desktop | five bands, full controls, popovers | left-to-right semantic pipeline | fit/reset |
| narrow desktop/tablet | horizontal canvas, compact toolbar, popovers | band order unchanged | focus selection and Explore |
| mobile/400% zoom | focus neighborhood plus structured navigator; all identities searchable | semantic order preserved in navigator | clear focus/fit selection |
| reduced motion/high contrast | all relationships and statuses | no reliance on animation/color | persistent labels/patterns |

The mobile mode does not pretend that every label is legible simultaneously.
It keeps every node in the graph and gives the user focus and list-based access.

## Content Requirements

| Content | Bound |
| --- | --- |
| five-band labels | plain-language pipeline; not new ontology layers |
| meta-type copy | canonical projection plus maturity/coverage distinction |
| architecture copy | candidate realization; no inferred semantic identity |
| profile copy | expectation and origin profile, exact expected value |
| fact copy | “supplied example”; no adapter-executed wording |
| finding copy | expected versus supplied only |
| status legend | maturity, coverage, candidate status, evaluation result separated |

## Acceptance Signals

| Signal | Polarity | Exact selector/evidence | Owner |
| --- | --- | --- | --- |
| all graph source families present in one graph | positive | projection fixture graph family counts | projection owner |
| default Rule trace complete without inferred edges | positive | trace fixture and focused DOM IDs | validation owner |
| Python/Rust selection does not relabel TypeScript findings | negative | profile provenance fixture | validation owner |
| every graph object reachable through navigator | positive | ID-set equivalence | accessibility owner |
| popovers restore focus | positive | active-element browser trace | accessibility owner |
| 200%/400% and mobile remain operable | positive | browser viewport assertions | UX owner |
| zero false authority/source-execution wording | negative | content selector audit | explanation owner |

## Risks

- Dense overview becomes decorative: mitigate with default trace emphasis,
  semantic zoom, fit-selection, and navigator.
- Progressive disclosure accidentally hides coverage gaps: dim by default and
  preserve explicit filters/overview access.
- Custom keyboard model is partial: do not claim application semantics before
  its acceptance SWU passes.

## Handoff Boundaries

- Architecture: required and provided in `ARCHITECTURE.md`.
- Plan: split SWUs for projection, layout, routing, rendering, interaction,
  accessibility/responsive behavior, and recomposition.
- Research: not required; representative usability measurement remains optional
  follow-up, not an implementation blocker.

## Gate Result

- Status: pass for authored UX Design.
- Runtime/browser/accessibility evidence: pending Plan and execution.
