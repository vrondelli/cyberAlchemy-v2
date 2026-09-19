---
dispatch_id: 2026-07-10-ui11-metatype-review
dispatch_type: review
status: auditor-accepted
created: 2026-07-10
---

# UI11 Meta-Type Review - Attacks

## Dispatch

This review attacked whether the 11 UI labels (`DS-D1.15..25`) should become
first-class DS-D1 meta-types now, should force a narrowed authority claim, or
should remain explicitly deferred.

The confirmed decision options are owned by
`TASK-DSD1-UI11`: `add-ui`, `narrow-claim`, or `explicit-defer`. The review
converged on `explicit-defer` now, with `narrow-claim` cleanup for any surface
that implies all 25 DS-D1 labels are currently formation-authoritative.

## Evidence Boundary

- `projects/domainspec-v2/development/ds-d1-improvement-plan/work-pack/tasks/TASK-DSD1-UI11.md`
- `projects/domainspec-v2/development/ds-d1-improvement-plan/work-pack/shared/context.md`
- `projects/domainspec-v2/development/ds-d1-improvement-plan/work-pack/shared/cross-task-gaps.md`
- `projects/domainspec-v2/development/meta-type-definitions/CANDIDATES.md`
- `projects/domainspec-v2/development/meta-type-formalization/research/2026-07-02-formalism-and-primitives/findings.md`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/impl/spec/TAXONOMY.md`

## Attacker Initial Positions

### Fong, Brendan - Schema-Construction Lens

Initial verdict: `add-ui` is plausible only if the UI types get explicit
`.schema.yml` criteria and fixtures. The current candidate list still marks UI
criteria as pending, so the structural ideas below are promotion gates, not
existing authority.

| Type | Structural/table-walk criterion | Required fixtures | Confidence | Change request |
| --- | --- | --- | --- | --- |
| Page `DS-D1.15` | `route_path` is path-like; has `layout_ref`; has at least one `renders` edge to `Component`; optional guard refs type-check. | Positive: `/players` with layout and component. Negative: no route, no layout, or `Component -> renders -> Page`. | High | Require `Layout -> wraps -> Page` or `page.layout_ref`; do not leave both informal. |
| Layout `DS-D1.16` | Has named content slot; declared chrome/regions; wraps at least one `Page`. | Positive: `DashboardLayout` with slot and pages. Negative: shell with no content slot or wraps non-page. | Medium | Define whether "reusable" means two or more pages or merely reusable structure. |
| Component `DS-D1.17` | Has `component_kind`; typed props/callback table; appears in `Page renders Component` or `Component composes Component`. | Positive: `PlayersTable` typed props. Negative: untyped utility/hook mislabeled component. | Medium | Add controlled `component_kind`; "single responsibility" is not structural. |
| View Model `DS-D1.18` | All fields typed; has `derives` edge to `Entity`; displayed by `Component` or shaped by `Adapter`; marks computed/formatted fields if present. | Positive: `PlayerOverview` derives `Player`. Negative: backend value object with no UI display edge. | Medium | Need discriminator from Value Object: `display_context` or required UI relation. |
| Hook `DS-D1.19` | Name matches `useX`; has return type; declares state/API behavior; API hook references binding/cache/invalidation rows. | Positive: `usePlayers()` return and cache key. Negative: plain utility or hook without return type. | Medium-low | Add Hook-Binding relationship or required `binding_ref`; current signatures only validate component consumes hook. |
| Form `DS-D1.20` | Field table has name/type/input/validation/error; has schema block/ref; has `submits` edge to `Action`; has `contracts` edge to `Interface`. | Positive: `CreatePlayerForm`. Negative: plain component, no validation, or reversed `Action -> Form`. | High | Make API error mapping required or explicitly optional. |
| Action `DS-D1.21` | Has trigger; target is mutation hook/binding or route; declares success and error outcomes. | Positive: submit/login action. Negative: passive render event or hook itself. | Medium-low | Add Action target signature, e.g. `Action -> Binding/Hook/Page`; otherwise target remains prose. |
| Guard `DS-D1.22` | Has protected target; condition table for auth/role/permission; fallback redirect/hidden; `protects` edge type-checks. | Positive: `AdminGuard -> protects -> /admin`. Negative: backend `Rule` alone or missing fallback. | Medium | Current signature only protects `Page`; decide if component guards are allowed. |
| Binding `DS-D1.23` | Has hook/name, method/path or backend operation/query ref; exactly one of `fetches Query` or `mutates Operation`; cache key; trigger; invalidation for mutations. | Positive: `usePlayers` fetches `GetAllPlayers`. Negative: reversed edge or both fetches/mutates without mode. | Medium | Add explicit Binding-Hook signature; current relation proves endpoint half only. |
| Adapter `DS-D1.24` | Has source shape, target shape, field mapping table, transform rules; `shapes` edge to `View Model`; declares `boundary=ui`. | Positive: API response to `PlayerOverview`. Negative: API-boundary `Mapping` or no field rules. | High-ish | Treat purity as declared structure, not semantic proof. |
| State Indicator `DS-D1.25` | For domain state only: source Enum/State Machine; value-to-visual table covers all source values; each row has label plus color/icon/badge. | Positive: `PaymentStatusBadge` covers every status. Negative: missing state values or generic loading spinner. | Low-medium | Resolve conflict: candidate says loading/error/empty; taxonomy says enum/state-machine visual encoding. |

Initial bottom line: do not approve all 11 as-is. The strongest possible first
slice looked like Page, Form, Adapter, maybe Layout, but blockers remained
missing discriminators and missing relationship signatures.

### Wittgenstein, Ludwig - Language-Use Collapse Lens

Initial verdict: `add-ui` is not ready as first-class DS-D1. The strongest move
is `explicit-defer` unless a later SWU writes hard criteria and negative
fixtures for the collapse pairs.

| Type | Collapse attack | Change request pressure |
| --- | --- | --- |
| Page | "Routable complete view" collapses under route-framework conventions; a route file can be page, shell, modal, nested segment, or component. | Require terminal navigable route, primary content ownership, layout ref, auth, and component inventory. |
| Layout | "Shared shell" is common UI jargon for any arrangement; reuse is accidental, not semantic. | Require slot ownership, navigation chrome, no domain content, route composition role, and reuse/app-shell justification. |
| Component | Too broad; Page, Layout, Form, Guard, and State Indicator are all components in normal React speech. | Either demote to umbrella/fallback or define as non-routable visual unit with typed props and no independent route/data/access authority. |
| View Model | "Display-shaped data" overlaps Value Object, DTO, query projection, and adapter output. | Require source refs, adapter derivation, display-only fields, and non-domain-authoritative equality/validation. |
| Hook | React-specific label; overlaps Binding, Action, Guard, and local component state. | Keep as framework vocabulary or define framework-neutral reactive contract. |
| Form | Taxonomy admits forms are components with schema-validated input. | Promote only as aggregate contract: fields, validation schema, submission action, target interface, error mapping. |
| Action | "Click changes state or navigates" includes almost every event handler. | Require named user intent, trigger, target kind, effect boundary, and observable outcome. |
| Guard | Client-side access gate is a Rule projection, not authority. | Require protected surface, source authorization rule/permission, fallback, and non-authority statement. |
| Binding | "Hook to endpoint connection" is a relationship, not a noun. | Move to DS-D2/DS-D8 edge or require source hook, target interface operation, param map, cache key, invalidation. |
| Adapter | Mapping with a UI-boundary adjective. | Prefer Mapping scoped to UI, or require pure transform, source/target schemas, direction, lossiness, formatting rules. |
| State Indicator | Candidate wording mixes loading/error/empty with domain enum/state-machine visual encoding. | Split domain-state indicator from async UI-state indicator, or demote to component role. |

### Peirce, Charles Sanders - Relation-Consequence Lens

Initial verdict: DS-D8 creates operational pressure for all 11 UI labels, but no
DS-D8 endpoint relation should be treated as DS-D1 formation authority.

| Type | DS-D8 pressure | Authority now? |
| --- | --- | --- |
| Page | `renders -> Component`; target of `Layout wraps` and `Guard protects`. | No. |
| Layout | `wraps -> Page`. | No. |
| Component | Target of `Page renders`; source/target of `composes`; source of `consumes Hook` and `displays View Model`. | No. |
| View Model | Target of `Adapter shapes` and `Component displays`; source of `derives -> Entity`. | No. |
| Hook | Target of `Component consumes`. | No. |
| Form | `submits -> Action`; `contracts -> Interface`. | No. |
| Action | Target of `Form submits`. | No. |
| Guard | `protects -> Page`; `mirrors -> Rule`. | No. |
| Binding | `fetches -> Query`; `mutates -> Operation`. | No. |
| Adapter | `shapes -> View Model`. | No. |
| State Indicator | `reflects -> State Machine`. | No. |

Initial bottom line: choose `add-ui`, `narrow-claim`, or `explicit-defer` before
allowing any UI label as `domainspec.concept.type` in code tags. If not adding
UI now, SWU-DSD1-006 must make the endpoint-label-not-category boundary visible.

## Robot-Talks Final Positions

### Fong Final

The structural proposal survives only as a future schema-construction sketch,
not enough evidence for `add-ui` now.

| Type | Final position |
| --- | --- |
| Page | Survives conditionally as a future first-slice candidate. |
| Layout | Survives conditionally, but "reusable" needs a finite rule. |
| Component | Demote; too supertype-like unless narrowed with negative fixtures. |
| View Model | Survives conditionally. |
| Hook | Drop/demote; current criterion is React/TanStack-specific. |
| Form | Survives strongest. |
| Action | Demote; target signatures are missing. |
| Guard | Demote; target scope and Rule boundary unresolved. |
| Binding | Demote to DS-D8/data-flow row unless explicit binding records exist. |
| Adapter | Drop as DS-D1 for now; collapses into `Mapping` with `boundary=ui`. |
| State Indicator | Drop/defer; current meaning conflicts. |

Final recommendation: `explicit-defer`. Preserve UI labels as deferred
candidates, narrow any live 25-authority claim, and block code tags until
`GAP-SH-UI11-MIGRATE` or an equivalent schema+fixture pass exists.

### Wittgenstein Final

Fong's `.schema.yml` path can make some labels usable, but only as
shape-candidates. Peirce proves operational pressure, not category authority.
Endpoint-use is evidence of need, not evidence of meaning.

Final recommendation: choose `explicit-defer`. A later pilot may start with
Page/Form/View Model/maybe Adapter, but this is non-authoritative candidate
texture, not a verified add-ui route.

### Peirce Final

Fong is right that some UI labels have real operational pressure; Wittgenstein
is right that the current names are not yet category-safe.

No DS-D8 endpoint relation should be treated as DS-D1 formation authority now.
`renders`, `wraps`, `submits`, `shapes`, `fetches`, `mutates`, and related
signatures prove that the graph wants names for UI endpoints. They do not prove
that those names have discriminators, fixtures, negative cases, correction
contracts, or stable formation laws.

Final recommendation: `explicit-defer`. Run the SWU-006 path: preserve UI11 as
named candidate pressure, narrow any full 25-type authority claim, and require a
later add-ui package to prove each selected UI type through `.schema.yml`,
positive/negative fixtures, and boundary tests.

## Synthesizer Draft And Verifier Correction

Noether's first draft kept the correct core (`explicit-defer` plus
`narrow-claim` cleanup) but over-preserved two attacker-side ideas as findings:

- a collapse-test finding based on taxonomy separators;
- a future pilot-ordering finding that suggested Page/Form/View Model/Adapter.

Russell required dropping both as verified findings and tightening F3/F4 to the
actual SWU owner route. Searle agreed that the collapse table is useful only as
future negative-fixture material, not validation authority, and that pilot
ordering must not be presented as an `add-ui` finding.

Noether revised accordingly. Russell and Searle both passed the revised packet.
Russell requested one citation tightening: the pressure-not-promotion finding
should cite shared context lines 22-25 and 40-43 alongside `TASK-DSD1-UI11`.

## Verifier Outcomes

| Finding | Russell | Searle | Final disposition |
| --- | --- | --- | --- |
| UI11-F1 | Survives | Survives | Keep. |
| UI11-F2 | Survives | Survives | Keep, with shared-context citation. |
| UI11-F3 | Revise | Survives | Keep revised; route to SWU-DSD1-006 and do not treat `CANDIDATES.md` as canonical authority. |
| UI11-F4 | Revise | Survives | Keep revised; conditional add-ui gate through SWU-DSD1-004/005. |
| UI11-F5 | Drop | Revise | Drop as surviving finding; keep only as future negative-fixture material if needed. |
| UI11-F6 | Drop | Revise | Demote; do not present per-type sequencing as a verified finding. |

## Refuted Arguments

- DS-D8 endpoint use alone is not DS-D1 formation authority.
- `TAXONOMY.md` UI prose is descriptive/candidate input, not validated DS-D1 law.
- Per-type pilot ordering is not a verified change request in this review.

## Auditor Outcome

Lakatos accepted the packet: all 11 UI types are covered, surviving findings cite
evidence, F5/F6 are dropped or demoted, DS-D8 endpoint pressure is not promoted
into DS-D1 authority, and the route for `DEC-DSD1-UI11-PATH` is concrete.
