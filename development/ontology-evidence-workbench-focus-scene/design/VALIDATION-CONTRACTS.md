# Planned Validation Contracts

Status: planned only; no fixture below has been executed for this design

## Exact Fixture Set

### Home

Ordered graph node IDs:

1. `presentation:body-war.business.context.identity-consent`
2. `presentation:body-war.business.context.route-expansion`
3. `presentation:body-war.business.context.geometry-evidence`
4. `presentation:body-war.business.context.score-preview`

Expected: 4 nodes, 0 internal relations, heading `Business capability map`,
exact purpose, count `4 selected contexts — 4 of 12 loaded contexts`, and
heading focus.

### Identity context and portal cards

Internal membership edge:
`presentation-edge:body-war.relation.context-1` /
`body-war.relation.context-1`.

Five crossings:

- `presentation-edge:body-war.relation.capability-dependency-1` /
  `body-war.relation.capability-dependency-1`
- `presentation-edge:body-war.relation.capability-dependency-2` /
  `body-war.relation.capability-dependency-2`
- `presentation-edge:body-war.relation.capability-dependency-9` /
  `body-war.relation.capability-dependency-9`
- `presentation-edge:body-war.relation.capability-dependency-10` /
  `body-war.relation.capability-dependency-10`
- `presentation-edge:body-war.relation.capability-dependency-14` /
  `body-war.relation.capability-dependency-14`

Expected portal groups:

| Target source context | Purpose | Member count | Crossing count | Ownership source relation IDs |
| --- | --- | ---: | ---: | --- |
| `body-war.business.context.activity-evidence` | Owns redacted run summaries and submitted activity evidence. | 2 | 2 | `context-2`, `context-3` |
| `body-war.business.context.route-expansion` | Owns runner-created route suggestions and consented candidate evidence without source-backed promotion. | 3 | 2 | `context-14`, `context-15`, `context-16` |
| `body-war.business.context.geometry-evidence` | Candidate context for ephemeral provider streams and private activity-derived geometry. | 1 | 1 | `context-17` |

### Path A — two source-directed alternatives

From `presentation:body-war.business.context.activity-evidence` to
`presentation:body-war.business.capability.auth-consent`:

- alternative A1 ordered graph/source relation IDs:
  `presentation-edge:body-war.relation.context-2` /
  `body-war.relation.context-2`, then
  `presentation-edge:body-war.relation.capability-dependency-1` /
  `body-war.relation.capability-dependency-1`;
- alternative A2:
  `presentation-edge:body-war.relation.context-3` /
  `body-war.relation.context-3`, then
  `presentation-edge:body-war.relation.capability-dependency-2` /
  `body-war.relation.capability-dependency-2`.

### Path B — reverse traversal under projected-undirected

From `presentation:body-war.business.context.identity-consent` to
`presentation:body-war.business.context.route-expansion`:

- common first step: `presentation-edge:body-war.relation.context-1` /
  `body-war.relation.context-1`, `with`;
- alternative B1: reverse
  `presentation-edge:body-war.relation.capability-dependency-10`, then reverse
  `presentation-edge:body-war.relation.context-15`; both `against`;
- alternative B2: reverse
  `presentation-edge:body-war.relation.capability-dependency-9`, then reverse
  `presentation-edge:body-war.relation.context-14`; both `against`.

Union expectation: 5 nodes and 5 relations. Alternative IDs are SHA-256 over
canonical query, scope fingerprint, policy, algorithm/version, total-order
version, and ordered graph-edge IDs. Reordered input yields identical IDs and
lexicographic alternative order.

### Path C — not found

From `presentation:body-war.business.context.identity-consent` to
`presentation:body-war.business.context.run-validation-anti-cheat` under the
declared fixture scope: status `not-found`, zero alternatives, unchanged
canvas frame, status focus.

### Canonical Path identity fixture

Canonical JSON means UTF-8, sorted object keys, preserved array order, and no
insignificant whitespace. For the frozen Body War graph and an empty filter
selection:

- `graphSnapshotId` = SHA-256 of the canonical complete
  `presentation-graph.json` =
  `d597603849d4e5cfa18df375cf6dc074c682a0e13cf18c3a0709b2274e3ee13e`;
- `filterFingerprint` = SHA-256 of
  `{"schemaVersion":"oew.filters.v1","nodeTypes":[],"edgeTypes":[],"complexities":[],"layers":[]}` =
  `75f5d75826822e62e2026eb6ee91e93e42b8882f1f906c39a7aa416f32013059`;
- the `oew.path-scope.v1` scope is
  `full-admitted-presentation-before-scene-projection` and has fingerprint
  `9a433367fc73c78ce18b3d192ca9f10143c8bbf084cd0b951b838e5feed65032`;
- query schema is `oew.path-query.v1`, algorithm is
  `all-shortest-paths@1`, and total order is `graph-edge-id-lex-v1`;
- A result ID is
  `5eee1a8bd60ef53dbeb72fe6ab2950d859ad4244f1e7e722cba28deadca73d20`;
  A1/A2 alternative IDs are
  `9eeac9d1e67e48bf9954a8ea69f09d171f1da030c04f24a4f1bc3372a525c554`
  and
  `1f1a42b0f797acaac8ee2a2cde8a18929c56331d46cfd7d6f147528a07e8c15f`;
- B result ID is
  `27730eb0f283aa5460125df01085ff5c568cb93f4fd456539c5031c500f01573`;
  B1/B2 IDs are
  `cfff3e3d0ba3423206ab6bc4c760a82aed467301778764cf797947c5bfebf82b`
  and
  `907791dcf340dd9ec4e6654efd40a9741c2774dc2ab35685b98bf9e9a4086708`;
- C result ID is
  `49427a650d5ed0bf97d1e7a3af37a8b138c9b0763de27114d90071591a8ff179`.

These digests are independently reproducible from the declared canonical
objects. A future source or filter digest intentionally invalidates them.

## Deterministic Selector Contract

### Scope and headings

- `[data-testid="knowledge-scope"][data-scope-kind][data-scope-id][data-graph-snapshot-id][data-filter-fingerprint][data-rule-version]`
- `[data-testid="knowledge-context-home"][data-selected-context-count="4"][data-loaded-context-count="12"]`
- `[data-testid="area-heading"][data-scope-kind="home"][tabindex="-1"]`
- `[data-testid="area-heading"][data-scope-kind="context"][data-context-id][tabindex="-1"]`
- `[data-testid="area-heading"][data-scope-kind="all_loaded"][tabindex="-1"]`
- `[data-testid="graph-counts"][data-node-count][data-relation-count]`

### Cards and exact relations

- `[data-testid="knowledge-node"][data-graph-node-id][data-source-concept-id]`
- `[data-testid="node-role-icon"][data-concept-role][data-icon-token]`
- `[data-testid="node-role-label"]`
- `[data-testid="node-business-kind"]`
- `button[data-testid="knowledge-context-portal"][data-portal-card-id][data-source-context-id][data-target-context-id][data-unique-crossing-count][data-target-owner-count]`
- `[data-testid="portal-target-purpose"][data-target-context-id]`
- `[data-testid="portal-target-member-count"][data-target-context-id][data-member-count]`
- `[data-testid="knowledge-edge"][data-graph-edge-id][data-source-predicate][data-predicate-color-token][data-presentation-relation][data-pattern-token]`
- `[data-testid="context-portal-relation"][data-graph-edge-id][data-source-relation-id][data-source-predicate][data-predicate-color-token][data-presentation-relation][data-pattern-token][data-projected-direction][data-source-direction][data-source-authority-effect][data-projection-authority-effect]`
- `[data-testid="portal-target-membership-proof"][data-ownership-graph-edge-id][data-ownership-source-relation-id][data-owner-context-id][data-owned-capability-id]`
- `button[data-testid="knowledge-node-portal"][data-target-graph-node-id][data-graph-edge-id][data-source-relation-id]`

Context portal accessible names are exactly `Open {target label}: {visible
member count} capabilities, {visible crossing count} connecting relations`.
Back is `Back to {source scene label}`. If an invoker disappears, focus moves
to the restored area heading and `[data-testid="navigation-status"]` announces
`Previous control is unavailable; returned to {scene label}`.

### Path

- `button[data-testid="open-path"]`
- `[data-testid="path-dialog"][role="dialog"][aria-modal="true"]`
- `[data-testid="path-from"]`
- `[data-testid="path-to"]`
- `[data-testid="path-policy-source-directed"][value="source-directed"]`
- `[data-testid="path-policy-connections-either-way"][value="projected-undirected"]`
- `button[data-testid="path-find"][data-prerequisite-state]`; allowed values are
  exactly `missing-endpoint`, `same-endpoint`,
  `source-direction-unavailable`, and `ready`
- `[data-testid="path-invalid"][data-invalid-reason]`
- `[data-testid="path-status"][data-status][tabindex="-1"]`
- `[data-testid="path-result"][data-path-result-id][data-status][data-route-alternative-count][data-scope-fingerprint]`
- `button[data-testid="path-route-alternative"][data-route-alternative-id][aria-pressed]`
- `[data-testid="knowledge-path-projection"][data-path-result-id][data-selected-route-alternative-id][data-node-count][data-relation-count]`
- `[data-testid="path-step"][data-graph-edge-id][data-source-relation-id][data-source-predicate][data-predicate-color-token][data-presentation-relation][data-pattern-token][data-projected-direction][data-source-direction][data-traversal-direction][data-direction-agreement][data-source-authority-effect][data-projection-authority-effect]`

Rules: Find is disabled for all prerequisite states except `ready`; same
endpoints produce `same-endpoint`; selecting source-directed while preservation
is incomplete produces `source-direction-unavailable`; direct derivation input
with invalid IDs returns `invalid-query`, never `not-found`.

### Legend, layout, provenance, and escape

- `[data-testid="knowledge-scene-legend"][data-scope-kind][data-scope-id]`
- `[data-testid="legend-presentation-relation"][data-presentation-relation][data-pattern-token]`
- `[data-testid="legend-source-predicate"][data-source-predicate][data-predicate-color-token]`
- `[data-testid="legend-direction"][data-direction-kind][data-direction-value]`;
  direction kind is exactly `projected`, `source`, or `traversal`
- `[data-testid="legend-authority"][data-authority-field][data-authority-effect]`;
  authority field is exactly `sourceAuthorityEffect` or
  `projectionAuthorityEffect`
- `[data-testid="legend-no-authority-disclaimer"]`
- `[data-testid="knowledge-workspace"]`
- `[data-testid="knowledge-canvas"]`
- `[data-testid="knowledge-context-rail"]`
- `[data-testid="knowledge-sheet"][aria-modal="true"]`
- `[data-testid="prototype-provenance"][data-projection-authority-effect="none"]`
- `[data-testid="prototype-build-ref"]`
- `[data-testid="prototype-adapter-ref"]`
- `button[data-testid="show-all-loaded-graph"]`
- `button[data-testid="focus-back"]`

Ambiguous `data-edge-id`, `data-source-relation`, and `data-authority` are
forbidden.

## Scene-specific Legend Expectations

| Scene | Presentation pattern rows | Source predicate color rows | Direction rows | Authority rows | Disclaimer |
| --- | --- | --- | --- | --- | --- |
| home, 4/0 | none | none | none | none | present |
| Identity context, 2/1/5 | `related` / `edge-pattern-related` | `owns` / `edge-predicate-owns` | projected `forward`; source `directed` | source `none`; projection `none` | present |
| Path A selected | `builds_on` / `edge-pattern-builds-on`; `related` / `edge-pattern-related` | `depends_on` / `edge-predicate-depends-on`; `owns` / `edge-predicate-owns` | projected `forward`; source `directed`; traversal `forward`; agreement `with` | source `none`; projection `none` | present |
| Path B selected | `builds_on` / `edge-pattern-builds-on`; `related` / `edge-pattern-related` | `depends_on` / `edge-predicate-depends-on`; `owns` / `edge-predicate-owns` | projected `forward`; source `directed`; traversal `forward` and `backward`; agreement `with` and `against` | source `none`; projection `none` | present |

Legend rows equal the active scene set exactly: no missing, duplicate, or stale
row is allowed. The no-authority disclaimer is:

> Presentation view only. Scenes, portal cards, and route alternatives organize
> the currently loaded graph. They do not add ontology membership, prove
> validity or completeness, change source authority, or promote any concept or
> relation.

## Responsive Geometry and Modal State

At 1440x1000 the forbidden bounding-box intersection pairs are:

- canvas × context rail;
- canvas × legend;
- context rail × top scope bar;
- legend × top scope bar;
- portal control × React Flow controls;
- all-loaded control × any clipped viewport boundary.

Each pair must have zero positive-area intersection. The legend is intentionally
contained by the rail, so rail × legend is not a forbidden pair.

At 390x844, opening a declared modal sheet requires:

- `[data-testid="knowledge-sheet"][aria-modal="true"][data-open="true"]`;
- `[data-testid="knowledge-canvas"][inert][aria-hidden="true"]`;
- focus contained by the sheet and Escape/Close available;
- no `document.documentElement.scrollWidth > window.innerWidth`;
- closing removes `inert` and `aria-hidden`, then restores invoker focus or the
  exact heading fallback.

Zoom/reflow rules: a same-size Back restores exact viewport values; a changed
viewport restores logical frame state, runs one zero-duration fit, and exposes
`[data-testid="knowledge-scope"][data-restore-mode="reflowed"]`. Reduced motion
must never introduce an animated fit.

## Planned Witness Matrix

| Fixture | Polarity | Target | Expected | Execution owner |
| --- | --- | --- | --- | --- |
| `FX-HOME-EXACT` | positive | home derivation/render | four ordered IDs, 0 relations, exact heading/purpose/count/focus | later Task Session test owner |
| `FX-HOME-UNKNOWN-ID` | negative | home derivation | fail closed; no guessed card | later unit-test owner |
| `FX-IDENTITY-PORTALS` | positive | context derivation/cards | 2/1/5 scene and 2/2/1 grouped cards with exact proofs | later browser owner |
| `FX-MULTI-OWNER` | positive-negative | portal grouping | one stable card per owner; no silent selection | later component owner |
| `FX-PATH-A` | positive | route derivation | two exact two-step source-directed alternatives | later unit/browser owner |
| `FX-PATH-B` | positive | route derivation | two alternatives, 5/5 union, exact `against` values | later unit/browser owner |
| `FX-PATH-C` | negative | route derivation | not-found; frame unchanged | later unit/browser owner |
| `FX-PATH-PREREQ` | negative | Path UI | exact disabled/invalid reasons | later component owner |
| `FX-BACK-BYTES` | positive-negative | store | byte-equivalent frame and focus restoration; stale restore rejected | later state owner |
| `FX-LEGEND` | positive-negative | stateless legend | exact active rows only; disclaimer; no stale rows | later component/browser owner |
| `FX-PREDICATE-COLORS` | positive-negative | predicate style registry | all 23 frozen predicates map one-to-one to unique semantic tokens and unique computed light/dark colors; unknown predicate uses visible unmapped fallback and fails palette totality | later component/browser owner |
| `FX-FORCED-COLORS` | positive | full scene | text/pattern/marker/focus parity without color assertions | later Chromium owner |
| `FX-DESKTOP-BOXES` | positive-negative | 1440x1000 | rail/canvas/legend/control intersection area equals 0 | later browser owner |
| `FX-NARROW-SHEET` | positive-negative | 390x844 | no overflow; only declared modal may cover canvas; restore focus | later browser owner |
| `FX-ALL-LOADED` | positive-negative | scope/history | visible/enabled; 237/231 fixture; heading focus; Back restores | later browser owner |
| `FX-PROVENANCE` | positive-negative | provenance | build/adapter refs + projection none; no freshness/validity claim | later gateway/browser owner |
| `FX-NOVICE-AB` | human | comprehension | run existing counterbalanced protocol; report separately | human-study owner |

## Evidence Ceiling

These are planned contracts. They establish no runtime behavior, browser pass,
human comprehension, accessibility conformance, ontology correctness,
promotion, publication, deployment, release, or production readiness.
