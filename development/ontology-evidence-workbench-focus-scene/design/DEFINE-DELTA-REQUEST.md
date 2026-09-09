# Successor Define Delta Request

Status: blocking request to Invoke Define
Reason: the approved base OEW Define does not own the new home, context portal,
route alternative, direction, icon, legend, or restoration semantics.

## Proposed Define Decisions

| ID | Decision requiring Define approval | Discovery Design recommendation |
| --- | --- | --- |
| `DD-01` | bounded home identity and semantics | authored presentation set of four exact context IDs; not ontology membership |
| `DD-02` | context scene membership | anchor plus direct outgoing source `owns` capability relations |
| `DD-03` | portal meaning | summary of exact crossings plus target ownership proofs; never a context-to-context source edge |
| `DD-04` | scope taxonomy | `home`, existing `focus`, `context`, `path`, `all_loaded` |
| `DD-05` | complete graph escape | choose raw admitted `all_loaded`; dynamic counts; never “ontology complete” |
| `DD-06` | route meaning | visible `route alternative`; internal projection only; never cluster/ontology branch |
| `DD-07` | traversal policies | `source-directed` and visible `Connections either way` = `projected-undirected` |
| `DD-08` | direction semantics | directed forward only; symmetric both ways; view-only/unavailable excluded from source-directed |
| `DD-09` | authority split | source authority preserved; `projectionAuthorityEffect` owned by projection and constrained to `none` |
| `DD-10` | identity mapping | graph endpoint IDs, source concept IDs, graph edge IDs, and source relation IDs remain distinct and losslessly bound |
| `DD-11` | icon semantic key | primary icon keyed only by `concept_role`; visible role and `business_kind` text required |
| `DD-12` | edge grammar | color keyed by exact source predicate with one stable token per predicate; presentation relation controls only redundant pattern; exact predicate/direction text always recoverable; no unique color per edge instance |
| `DD-13` | navigation ownership | one store state model; exact frames; Path-local return; no second graph/history owner |
| `DD-14` | provenance language | qualified build/adapter/projection provenance replaces unverifiable freshness warning |
| `DD-15` | human claim boundary | browser mechanics and human comprehension remain separate evidence classes |
| `DD-16` | route derivation scope | full admitted presentation graph before scene projection, restricted by captured current filters; not active-scene-only |
| `DD-17` | filter semantics | visible portal counts use captured filters and separately disclose unfiltered source totals; filter changes stale derived views |
| `DD-18` | frame canonicalization and fallback | canonical `oew.navigation-frame.v1`; same-size byte restore; responsive reflow mode; scene-heading fallback when invoker is absent |

## Required Successor Define Outputs

- `SPEC.md` capabilities, requirements, non-goals, acceptance, decisions, and
  gaps for DD-01 through DD-18;
- `domain.md` typed context, portal, membership proof, exact relation, route
  result, frame, role-icon, and legend concepts;
- `operations.md` home/context/Path/all-loaded derivations and recovery;
- `queries.md` scene, portal, route, legend, provenance, and equivalent-list
  reads;
- `interfaces.md` exact adapter fields and UI semantic hooks;
- `states.md` navigation frame, Path session, stale result, and restoration;
- `events.md` transition/announcement events without promotion semantics;
- `mappings.md` graph/source identity and presentation/source direction maps;
- `glossary.md` terms listed in `GLOSSARY-CONSISTENCY.md`.

## Research Repair Required Before Reuse as Accepted Evidence

- close the July 30 deterministic legend selector/browser contract;
- remove stale residue that calls already-bound control contracts unresolved;
- rerun the July 31 writer/auditor admission only after DD-01 through DD-18 and
  the exact fixtures/selectors in `VALIDATION-CONTRACTS.md` are approved;
- retain both original BLOCK receipts; do not overwrite history.

## Gate

After the successor Define is approved and stable, regenerate a closed
`DesignScopeManifest`, run the Design scope extractor, run the selection
validator twice from immutable inputs, and only then revise this discovery
brief into a normal Design. Until then the next route is `invoke define`, not
Plan.
