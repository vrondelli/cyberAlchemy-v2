# UOVA Reference Repair — Implementation-Selection Work Pack

Pack ID: `UOVA-RR-20260805`  
Admission profile: `selected-unit-at-task-session`  
Authority effect: none until a Task Session selects one unit and admits its material package  
Implementation state: not started

## Outcome

Implement the repaired ontology viewer from a source-bound `KnowledgeScene v1.2`
through portals, paths, synchronized relation presentation, static fallback, the
complete Body War whole-system adapter, and browser/reuse acceptance.

This is the current execution-selection surface. The completed R06 design, R09
plan, and R11 UI-description refresh remain historical inputs and are not rewritten.
The live readiness result is the sibling
`readiness/audit-output/work-pack-readiness-report-v2.json`.

## Preserved laws

- `SourceGraph` remains the only owner of relation meaning.
- Every consumer resolves exact relation ID plus scene revision/digest; tuple
  fallback is forbidden.
- Portals and paths own traversal state, geometry owns geometry, and display
  encodings own presentation only.
- Detached output must validate a self-contained `RelationSnapshot` before use.
- DomainSpec v2 UI types are development-only descriptions. Runtime imports from
  `projects/domainspec-v2/` are forbidden.
- Body War integration uses the generic pipeline and introduces no project branch.
- Candidate-local evidence grants no deployment, release, promotion, or production
  authority.

## Deterministic unit order

| Order | Unit | Outcome | Dependency gate | Canonical successor |
| ---: | --- | --- | --- | --- |
| 1 | UOVARR-001 | KnowledgeScene v1.2, digest laws, immutable relation index | none | UOVARR-002 |
| 2 | UOVARR-002 | source-bound v1/v1.1 migration | UOVARR-001 | UOVARR-003 |
| 3 | UOVARR-003 | reference-first grouped portals | UOVARR-001 | UOVARR-004 |
| 4 | UOVARR-004 | reference-first bounded paths | UOVARR-001 | UOVARR-005 |
| 5 | UOVARR-005 | navigation, relation view models, OEW-owned UI profile/inventory | UOVARR-003 and UOVARR-004 | UOVARR-006 |
| 6 | UOVARR-006 | live loader/app/renderer/cards/inspector/index integration | UOVARR-005 | UOVARR-007 |
| 7 | UOVARR-007 | static SVG/print/no-JS projection and accessibility fallback | UOVARR-006 | UOVARR-008 |
| 8 | UOVARR-008 | complete Body War whole-system adapter | UOVARR-002 and UOVARR-007 | UOVARR-009 |
| 9 | UOVARR-009 | regression, browser, determinism, UI conformance, reuse fixture | UOVARR-008 | owner acceptance decision |

The canonical successor order is deliberately linear even where the dependency
graph permits parallel work. This prevents two units from racing on shared
integration surfaces and gives Task Session one unambiguous continuation cursor.

## Ownership repairs applied by this refresh

- UOVARR-001 solely owns shared relation reference/index/digest types.
- UOVARR-003 owns the later portal integration delta to `sceneQuery.ts` and must
  rehash the closed UOVARR-001 output at selection.
- UOVARR-005 owns the OEW-local UI profile snapshot, compiler, validator, and
  58-record inventory; it consumes rather than rewrites shared relation types.
- UOVARR-006 solely owns the live loader, app shell, presentation integration, and
  related styles.
- UOVARR-007 uses `staticProjection.ts` as the explicit static serializer seam.
- UOVARR-008 owns the Body War adapter and whole-system generator/validator changes.
- UOVARR-009 owns attempt-scoped browser output, its verifier, and the generic
  non-Body-War reuse fixture.

Exact targets, audit-time present/absent baselines, commands, output templates,
closeout laws, and forbidden scopes are machine-bound in
`ADMISSION-CONTRACT.json` and `TARGET-BASELINES.json`. A selected unit must rehash
all targets and instantiate `{attempt_id}` before any material handoff; downstream
units never inherit stale audit-time hashes.

## Body War denominator decision

UOVARR-008 targets the validated Body War whole-system ontology:

- 276 nodes = 237 business nodes + 39 system nodes;
- 301 relations = 231 business + 45 system + 25 bridge relations;
- 577 Full Index rows = 276 nodes + 301 relations;
- 39 predicate-specific presentation encodings.

The historical `237/231` figures remain the business-only compatibility subset.
They are not accepted as the complete UOVARR-008 denominator. Exact owner evidence
is bound in `BODY-WAR-DENOMINATOR-DECISION.json`.

## Validation order

Every selected unit must run, in order:

1. its focused positive and negative tests through Node
   `--experimental-strip-types` where TypeScript imports are involved;
2. the full OEW `npm test` regression;
3. scoped `git diff --check` over that unit's exact material targets;
4. any unit-specific cross-owner, deterministic generation, UI-profile, or browser
   witness declared in `ADMISSION-CONTRACT.json`.

UOVARR-009 additionally requires an active global Playwright API/CLI and executable
Chromium. The 2026-08-05 authoring environment has cached Chromium but no active
global Playwright package. Task Session must fail closed at UOVARR-009 selection
unless an exact runtime is present and recorded; no repository package root may be
added merely to obtain it.

## Selection and closeout

The readiness audit executes no configured product command. A passing Plan Semantic
Manifest means the nine-unit plan is ready for selection, not mutation-ready.

Task Session must select exactly the canonical cursor, create a fresh material
package and producer receipt against byte-current baselines, bind one immutable
attempt root, validate the mutation admission receipt, and only then implement.
On failure it retains evidence and the same cursor. On pass, Invoke Refresh joins
the terminal receipt, checks allowed deltas, and advances to the canonical successor.

## Hard stops

Stop for semantic drift, a missing or stale relation reference, guessed ontology
counts, an unbound write, target-baseline drift, missing material/producer receipt,
failed acceptance-critical validation, cross-project runtime dependency, credentials,
network/dependency mutation, public/private boundary crossing, deployment, release,
promotion, or production claims.
