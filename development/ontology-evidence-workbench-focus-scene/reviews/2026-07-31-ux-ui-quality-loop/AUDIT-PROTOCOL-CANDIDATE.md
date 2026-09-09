# Candidate UX/UI Quality Loop

Status: proposal only; uncalibrated and not a promoted cross-project capability

## Purpose

Run the same frozen, evidence-bounded UX/UI audit before and after an interface change. Port it by replacing a parameterized project profile, not by embedding one project's vocabulary or design decisions in the reusable core.

The protocol produces no universal UX score. It publishes atomic evidence, ranked change requests, bounded KEEP findings, coverage residues, owner decisions, and baseline-to-current deltas.

## Core and profile boundary

The reusable core owns profile/baseline freezing, atomic evidence classes, attack/reconciliation/verification order, interaction-state matrices, relation-encoding matrices where applicable, calibration gates, and evidence ceilings.

The project profile owns target/users/tasks, project vocabulary/mappings, projected contexts and portals, Path presentation choice, palette/density/order/copy, authority/privacy ceilings, and unresolved owner decisions.

## Parameterized project profile

| Section | Required parameters |
| --- | --- |
| Identity | `project_id`, profile version, owner, rationale, frozen timestamp |
| Target | Exact URL/artifact, build/content digest, source/adapter digest, data-fixture digest |
| Runtime | Browser/version/revision, executable digest, viewport, fonts, locale, motion, isolation/network policy |
| User boundary | Primary user description and excluded user claims |
| Task set | Owner-declared bounded outcome-bearing tasks, selection rationale, start state, success/failure assertion |
| Surfaces | Controls, results, dialogs, disclosures, graph, portals, Path, Back, search, help |
| States | Default, selected node/relation, portal, Path, Back return, error and empty states |
| Modes | Desktop, narrow, keyboard-only, reduced motion, grayscale, forced colors where supported |
| Semantic fields | Node role/kind, exact predicate, source direction, projected direction, traversal orientation, status, provenance, authority |
| Relation mapping | Exact `sourcePredicate` to stable color; `presentationRelation` to stable pattern; visible/accessibly named text |
| Projection model | Approved projected clusters, portal entrances, count scope, full-graph escape |
| Path policy | `comparator`, `route_local_presentation`, or `owner_pending`; route/non-authority semantics remain invariant |
| Restoration | Declared focus after Close, Escape, Back, cancel, completion and error |
| Negative assertions | No invented membership, direction, sequence, causality, execution, promotion, authority, or freshness |
| Evidence ceilings | Authority, privacy, human-study, accessibility, release and production ceilings |
| Fixtures | Known-good, known-bad, domain and false-positive locators |
| Owner decisions | Unresolved choices reviewers and automation must not silently settle |

Changing a frozen profile field after baseline capture starts a new audit series.

## Body War profile delta

Body War alone owns its projected context set and the four-versus-twelve reconciliation; portal cards and order; predicate vocabulary and presentation mappings; freshness/provenance and mode copy; Overview/Learn/Deep Dive/Filter/Export/Path/Theme/search/help tasks; Path presentation choice; projection-count/zero-count policy; redundant category icons plus adjacent role text; full-graph escape; and Back/selection/direction/focus-restoration targets.

Neither profile-approved clusters nor route-local presentation create ontology branch membership.

## Atomic evidence classes

Each atomic claim receives exactly one class; mixed claims are split before reconciliation.

| Class | Permitted claim | Forbidden leap |
| --- | --- | --- |
| `hard_gate` | Deterministic behavior failure or standards-backed measurement tied to exact surface/state | Comprehension, preference, unmeasured tokens, unexercised recovery |
| `soft_flag` | Conservative observation requiring interpretation | Promotion to failure without an owner rule or stronger evidence |
| `screenshot_review` | Frozen visual comparison of hierarchy, density, whitespace, collision, clustering | Comprehension or accessibility proof |
| `human_study` | Authorized human evidence for comprehension, trust, workload, preference, task success | Substitution with agent task completion |
| `owner_decision` | Product, semantic, membership, authority, palette, presentation choice | Automated resolution |
| `coverage_residue` | Required cell not exercised, supported, or implemented | Reporting it as pass or observed failure |

Gate scope is independently `universal`, `profile`, or `none`. Each claim records identity, task, exact surface/state/action/observation, class/scope, evidence locator and digests, severity/disposition, repair or KEEP assertion, deterministic acceptance or residue, contrast/readability/navigation impact, authority/privacy/human ceiling, and verifier correction.

Automated accessibility is partial evidence. Agent task reachability is a structural pretest, not human comprehension.

## Frozen baseline

Freeze profile/rationale; scenario/task order; target/source/adapter/data digests; browser/runtime/executable/fonts/viewport/motion/color mode/locale; network/isolation; screenshots, accessibility output, DOM measurements, console/network summary and keyboard trace; interaction matrix; relation matrix; negative fixtures; and known residue. Digest the manifest. Unexercised cells remain `coverage_residue`.

## Repeatable round

1. Freeze and validate profile, scenario, target, runtime, data and isolation.
2. Capture the byte-identical baseline.
3. Run independent whole-interface attacks for contrast/non-color, readability/task hierarchy, and navigation/orientation/recovery.
4. Reconcile atomic findings without erasing disagreements.
5. Verify each against literal behavior and semantic/authority ceilings.
6. Drop refuted and correct over-broad findings.
7. Publish ranked requests, bounded KEEP findings, owner decisions and residue.
8. Apply fixes in a separate implementation work pack.
9. Rerun the frozen profile and scenario.
10. Publish delta and regressions without a universal score.

A review may close `resolved` while FIX requests remain because its product is the verified request set. Product acceptance is separate.

## Activation, result, dismissal and restoration matrix

Every interactive surface receives four independently asserted cells. `N/A` needs rationale; blocked cells are residue.

| Surface | Activation | Result | Dismissal | Restoration |
| --- | --- | --- | --- | --- |
| Startup modal | Focus enters declared target | Named modal owns content | Escape/Close once | Declared graph-entry control |
| View modes | Trigger announces activation | Exactly one selected mode owns named result | Pattern-defined | Declared target |
| Filter/Export | Pattern-appropriate state/relationship | Labeled owned surface and result/error | Escape/Close | Trigger |
| Path | Owned surface, named From/To, announced state | Complete directed hop records and route boundary | Cancel/Escape | Path trigger |
| Theme | Trigger/current theme announced | Declared theme applied | Pattern-defined | Declared target |
| Search | Labeled control | Results/empty/selection announced | Clear/Escape | Search or selected result |
| Help | Labeled trigger/surface | Commands match actual roles/actions | Escape/Close | Help trigger |
| Portal | Names projected cluster | Focus scene announces scope and entrance provenance | Back/Close | Prior scope, relation, direction and focus |
| Show all loaded graph | Explicit bounded-home escape | Full scope announced | Return declared | Prior bounded scope |
| Edge action | Actionable instance focuses/activates | Exact instance detail | Close/Escape | Activating edge |

Current Body War calibration: modal activation/restoration FAIL; Filter/Export dismissal/restoration KEEP; mode ownership FAIL; Path labeling/result/announcement and one restoration trace FAIL; portal activation absent profile-gate FAIL; portal result/Back/restoration UNEXERCISED; Theme/search/help incomplete residue. `aria-controls` is never universal—the chosen pattern determines the relationship.

## Cross-scene relation-encoding matrix

| Scene | Exact predicate text/identity | Source/projected/traversal direction | Predicate color | Presentation pattern | Non-color/contrast result |
| --- | --- | --- | --- | --- | --- |
| Default graph | Required | Source; projected if different | Stable exact-predicate mapping | Stable `presentationRelation` mapping | Measured |
| Selected relation | Required | Source; projected if different | Same | Same | Measured |
| Portal focus scene | Required | Source and projected | Same | Same | Measured |
| Path forward/reverse | Required per hop | Source, projected, and separately labeled traversal orientation | Same | Same | Measured |
| Narrow/grayscale/forced colors | Required | As active | Mapping/browser resolution recorded | Pattern/text remain recoverable | Measured |
| Reduced motion | Required | As active | Same | Same | Transition parity recorded |

Rules: color belongs to exact `sourcePredicate`; pattern to coarse `presentationRelation`; both are redundant and confer no semantics or authority. Exact text/direction stay visible/accessibly named. Source, projected and traversal directions are distinct. A route establishes no branch, membership, causality, execution, promotion, or authority. Cross-scene stability is claimed only after all required cells pass.

## Re-audit delta

Use the byte-identical profile, scenario, runtime policy and fixtures. Each baseline claim emits stable ID, exact target/state, unchanged class/scope, baseline/current locators and digests, delta (`fixed`, `regressed`, `unchanged_fail`, `unchanged_keep`, `unexercised`), acceptance result, new residue, ceilings, and regression link. Counts may be inventory, never a score or tradeoff against unrelated hard failures.

## Fixture calibration gate

Before a hard gate is reusable, it passes:

- known-good: accepts a conforming implementation;
- known-bad: rejects the intended failure;
- domain: handles representative vocabulary, density and state;
- false-positive: abstains on a legitimate alternative.

Calibrate exact relation identity/separate direction; role-sensitive focus/activation; named contrast measurements; modal focus/restoration; selected-mode ownership; pattern-appropriate disclosure/recovery; portal/Back; forward/reverse Path; provenance/freshness/authority copy; and projection-scoped counts. Screenshot review does not become a hard gate through repetition. Human questions need an authorized study. Owner decisions never become automated fixtures.

## Portability gate

The candidate may enter reusable capability development only after:

1. one complete Body War baseline is frozen;
2. one implementation change set is audited under the unchanged profile;
3. one post-update rerun publishes comparable delta and regressions;
4. every reusable hard gate passes all four fixture families;
5. a second project replaces the profile without modifying the core;
6. Body War vocabulary, contexts, Path choice, palette, copy and zero-count policy stay in its profile;
7. atomic evidence classes and human-study residue survive independent review;
8. authority, privacy, promotion, release and production ceilings remain explicit.

Until then, other projects may copy this only as an experiment. It is not a calibrated, promoted, complete-accessibility, or production-ready audit capability.
