# Interfaces: OEW Semantic Navigation

## External: Project Profile (`semantic-navigation-profile.v1`)

Read-only JSON containing identity/digests, tasks, surfaces, states, modes,
semantic fields, relation mappings, projected contexts, Path policy,
restoration targets, copy/count/icon policies, negative assertions, evidence
ceilings, fixtures, and unresolved owner decisions. Validation rejects unknown
or owner-pending values only for the dependent behavior; it never fills them.

## Internal: SemanticNavigationSurface Interface

| Method | Maps to | Description |
| --- | --- | --- |
| `readHome()` | ReadProjectedHome | bounded entry model |
| `readRelation(edgeId)` | ReadRelationDetails | exact relation identity |
| `enterPortal(portalId)` | EnterProjectedCluster | restorable projected navigation |
| `readPath(query)` | ReadPathExplanation | complete route explanation |
| `restore(reason)` | RestoreNavigationFrame | deterministic recovery |

## Internal: Comparable Audit Runner

Consumes the frozen profile/baseline and an exact current build handle. Emits
browser artifacts and a delta receipt under a unique generated run path. It
uses the shared Playwright runtime, loopback only, no external network, and no
token persistence.
