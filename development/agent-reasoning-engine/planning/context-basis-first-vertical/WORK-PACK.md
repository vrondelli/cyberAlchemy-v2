---
work_pack_id: WP-ARE-CONTEXT-BASIS-001
status: candidate-blocked-before-implementation
selected_swu: SWU-ARE-CONTEXT-001
planning_baseline_digest: 4680d9b87c4dd06c77381fb70f97f16841a4130b4ab04f91c030fc50033765c4
implementation_authorized: false
authority_effect: none
---

# First Context Basis implementation vertical

## Outcome

Create one pure deterministic local package that composes the already verified
request router with request-relative definition closure, declared ontology
selector locking, Necessary Context Basis construction, and dual-lane Context
Window View binding.

```text
RequestContext
  -> verified CapabilitySelection
  -> DefinitionClosure
  -> OntologySelectorLock
  -> NecessaryContextBasis
  -> ContextWindowView
```

This vertical ends at the immutable view. It does not create a route-owned
strategy, invoke a tool, persist a durable Context, evaluate semantic judgment,
continue work, or attempt an effect.

## Accepted planning inputs

| Input | SHA-256 / identity | Posture |
|---|---|---|
| Context Basis Definition Pack | `9218a2181edbab2ebc99cda80f1b26760a8b0e4548acc871a6bcff806ba7e061` | candidate meaning selected for planning |
| Context Basis semantic decision | `67626f15d96442b5b6c336a71eac727127ea9aae22c8e01201ea52dfc3abf` | owner-confirmed semantic selections |
| ARE specification | `de595a1bd6bdd1f72864c636a4bbab8e43fbd87ead7cdb7a45d58ab72eaa4b81` | candidate specification |
| ARE architecture | `69ed32833906d397040b4fa06011edd7b3990fb75f8c65dcde1d7e9f81bf9837` | candidate architecture |
| Generated system ontology | `96dd87499f2bfb45af51d3f4f8c549d6aca71f467ceac6fc051cee14b139e90a` | deterministic unadmitted candidate |
| Ontology validation receipt | `413d456f86d51d19d6e3970a4fbb68313a57f91768938cf9d94df06c0e0a0a63` | PASS, non-authorizing |
| Implementation-start selection | `7d7569067ec8bf68d04a44294f435050b3559b9659f09d445c5d2f4c1cadfeff` | planning-baseline-only |

Changed acceptance-bound bytes invalidate this Work Pack and require a
successor planning baseline.

## SWU-ARE-CONTEXT-001

### Package boundary

Future target:
`cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/context-basis-runtime/`

The package consumes `request-decision-router` through its public API. It may
not duplicate the canonical route registry, accept caller-invented verified
profiles, or use Goal as a fallback.

### Exact future write allowlist

- `package.json`
- `index.mjs`
- `src/canonical.mjs`
- `src/definition-closure.mjs`
- `src/ontology-selector-lock.mjs`
- `src/context-basis.mjs`
- `src/context-window-view.mjs`
- `src/compose.mjs`
- `test/context-basis.test.mjs`
- `test/fixtures/definition-catalog.json`
- `test/fixtures/ontology-snapshot.json`
- `generated/SWU-ARE-CONTEXT-001-receipt.json`

No existing implementation package is writable in this SWU. Candidate
implementation-binding and ontology rematerialization are separate successor
work after this package and its tests exist.

### Input contracts

- admitted `are.request-context/v1` value and digest;
- loader-produced verified DecisionProfile;
- finite definition catalog with identity, revision/version, digest, authority
  posture, typed outgoing relations, and route-profile additions;
- finite ontology snapshot with ontology/source identities, node and edge IDs,
  types, directions, endpoint IDs, and source digests;
- owner-declared initial node and required-edge selectors;
- explicit view lane, consumer, window/interaction identity, purpose, and source
  epoch;
- optional predecessor view and plan-bound reuse predicate inputs.

Runtime-native values, duplicate identities, unknown versions, missing digests,
ambiguous lanes, and cyclic object graphs fail before composition.

### Deterministic behavior

1. Route through `routeRequest` with a loader-produced verified profile.
2. Continue only from one `direct` capability selection; propagate `gate` or
   `block` without definition or ontology work.
3. Compute the route-profiled definition least fixed point. Visit each
   `(definition_id, version_or_revision, digest, authority_posture)` once.
4. Reject unknown normative relation classes, missing targets, ambiguous
   canonical identities, and unresolved required references.
5. Recursively close only owner-declared required ontology edges and their
   endpoints. The omission audit reports candidates but cannot widen the lock.
6. Construct and digest the Necessary Context Basis from the exact request,
   route, closure, lock, authority/effect posture, constraints, gaps, and
   residue.
7. Require exactly one explicit view lane:
   - `plan-bound`: reuse identity only when every governed predicate is equal
     and current; emit a per-turn reuse receipt;
   - `interaction-bound`: always create an immutable successor view, even when
     the basis digest is unchanged.
8. Deep-freeze every successful output and preserve `authority_effect: none`.

### Verification matrix

- obvious Research input routes directly without Goal fallback;
- ambiguous routing yields a gate and zero closure/selector calls;
- route-profiled definition closure reaches the same least fixed point under
  catalog and relation permutation;
- missing definition target blocks basis construction with typed residue;
- declared edge closure includes recursively required endpoints and excludes
  unrelated adjacent edges;
- omission audit output cannot change the binding lock digest;
- unrelated ontology drift leaves the current lock/basis valid;
- selected dependency drift requires a successor view;
- unchanged plan-bound input retains view identity only with a reuse receipt;
- every interaction-bound turn creates a successor identity;
- lane ambiguity blocks rather than defaulting;
- canonical output and digest bytes are stable across two runs;
- all failure paths produce zero strategy, tool, filesystem, network, model,
  ontology-runtime, and effect calls.

### Done criteria

- all verification vectors pass with zero skipped tests;
- two clean runs emit identical receipt bytes except no wall-clock field is
  permitted in the canonical payload;
- the receipt binds every authored package file and every planning input digest;
- package README/API comments preserve candidate and non-authorizing wording;
- no source outside the allowlist changes;
- a separate review finds no route-registry duplication, authority collapse,
  ambient ontology dependency, or context-lane identity collapse.

## Explicit exclusions

- Codex app-server wrapper and transport;
- durable Context/session storage;
- repository-wide definition or ontology discovery;
- suspended Python ontology-runtime enforcement;
- semantic evaluator integration;
- route strategy creation or route execution;
- ACI journal, publication, replay, effect, or deployment integration;
- Product Capability or DomainSpec admission;
- ConstructionBinding registration;
- conformance or whole-engine claims.

## Gates

| Gate | Current state | Required closure |
|---|---|---|
| Product Capability adoption | blocked | exact owner decision bound to current capability bytes |
| Business ontology admission | blocked | exact owner decision bound to current ontology bytes |
| DomainSpec source/system candidate admission | blocked | exact owner decision bound to current generated digests and validation receipt |
| ConstructionBinding | blocked/not representable | Goals package successor that no longer requires an empty registry, plus complete exact-stage evidence |
| Implementation authorization | blocked | explicit user/owner authorization naming `SWU-ARE-CONTEXT-001` and the write allowlist |
| Publication/deployment/runtime | blocked | outside this Work Pack |

## Claim ceiling

This Work Pack is a digest-bound planning candidate. It selects no executable
handoff and supplies no Product Capability adoption, ontology admission,
ConstructionBinding, implementation authority, conformance, publication,
deployment, runtime authority, or external effect.
