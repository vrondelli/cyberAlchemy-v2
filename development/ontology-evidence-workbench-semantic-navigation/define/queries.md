# Queries: OEW Semantic Navigation

## ReadProjectedHome

**Actor:** reviewer
**Input:** admitted project profile and active filter fingerprint
**Output:** artifact type/ceiling, approved portal cards, current-projection
counts, provenance, explicit `Show all loaded graph`, and declared first focus.

## ReadRelationDetails

**Actor:** reviewer
**Input:** exact graph edge ID
**Output:** source, exact predicate, source direction, projected direction when
different, target, presentation relation, provenance, source authority,
projection authority none, and active color/pattern labels.

## ReadPathExplanation

**Actor:** reviewer
**Input:** distinct named From/To endpoints, owner-approved Path policy,
captured graph/filter fingerprint
**Output:** named result region and ordered alternatives whose hops each expose
the complete relation fields plus traversal orientation and non-membership,
non-causality, non-execution, non-promotion, and non-authority language.

## ReadQualityDelta

**Actor:** project and UX evidence owners
**Input:** frozen baseline ID and current run ID
**Output:** per-claim `fixed`, `regressed`, `unchanged_fail`,
`unchanged_keep`, or `unexercised`, with exact locators, ceilings, and residue.
