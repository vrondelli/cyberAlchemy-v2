# Mappings: OEW Semantic Navigation

## SourceEdgeToPresentationRecord

| Source field | Target field | Transform |
| --- | --- | --- |
| graph edge ID | `graphEdgeId` | exact |
| source relation ID | `sourceRelationId` | exact |
| source/target concept IDs | endpoints | exact, no reordering |
| predicate | `sourcePredicate` | exact |
| source direction | `sourceDirection` | exact or explicit unavailable |
| projected endpoints | `projectedDirection` | derived, separately labeled |
| presentation relation | `presentationRelation` | admitted adapter value |
| predicate mapping | `colorToken` | stable lookup by exact predicate |
| presentation mapping | `linePattern` | stable lookup by presentation relation |
| source evidence | `provenance[]` | exact path/selector/digest |
| source authority | `sourceAuthorityEffect` | exact |
| constant | `projectionAuthorityEffect` | `none` |

Missing exact identity, direction, evidence, authority or mappings fails
closed. Color/pattern never substitutes for text and direction.

## ProjectProfileToHomeProjection

Admitted project context IDs and source-backed labels become ordered portal
cards. Counts use the active projection and state that scope. Zero-count
behavior is taken only from the approved project policy.

## PathResultToExplanation

Each route result maps to named endpoints and ordered hops. A hop reuses the
relation presentation record and adds traversal orientation; it never rewrites
source or projected direction.

## BaselineCurrentToQualityDelta

Join claims only by stable claim ID and frozen profile/scenario/runtime
bindings. Emit atomic deltas; changed bindings create a new series rather than
an incomparable delta.
