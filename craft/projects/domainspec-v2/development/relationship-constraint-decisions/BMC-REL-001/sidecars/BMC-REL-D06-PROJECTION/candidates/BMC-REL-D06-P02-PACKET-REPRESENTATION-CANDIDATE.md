# BMC-REL-D06-P02 Typed Packet Representation Candidate

Status: `candidate-only-pending-owner-decision`

Authority effect: `none`

Dependency: P01 is satisfied by `BMC-REL-D06-P01-B-GOVERNED-EXTENSIBLE-REGISTRY` and registry SHA-256
`91898f538b49f29a1be659560f6b442644a34b3ecb3f0a8916b7a0e53680bad4`.

## Fixed semantic invariant

Every option represents the same selected D06 policy and P01 registry. It may not change the vocabulary,
require ownership, infer numeric bounds, author `owned-by`, or resolve any other topology facet.

```text
policy = one-owner-per-admitted-dimension
registry = projects/domainspec-v2/definitions/ownership-dimensions/ownership-dimensions.json
active_ids = {lifecycle, custody, write-responsibility}
```

## `BMC-REL-D06-P02-A-GENERIC-FIRST-CLASS-FACET`

Add a required `ownership_topology` decision facet to every packet row. The `owns` row carries the selected
policy token and exact registry reference; every other row carries `not-applicable`.

Benefit: makes ownership topology a first-class facet using the packet's existing uniform-row pattern.

Cost or risk: rewrites all 31 rows for a relation-specific concern and increases the chance that an `owns`-only
token is copied elsewhere.

## `BMC-REL-D06-P02-B-OWNS-SCOPED-TYPED-EXTENSION`

Add a schema-discriminated, `owns`-only `ownership_topology` object to that row. Require exact keys for status,
policy token, registry path and digest, rationale, and evidence. Forbid the object on every other signature.

Benefit: places the independent axis at its semantic locus and avoids unrelated row churn while remaining
closed-schema and fail-closed.

Cost or risk: introduces a conditional row shape that the schema and validator must enforce explicitly.

## `BMC-REL-D06-P02-C-TOP-LEVEL-TYPED-PROJECTION`

Add a closed packet-level `relationship_specific_projections` collection with one ownership-topology entry keyed
to `signature_id: owns`, the selected policy token, and the exact registry path and digest.

Benefit: keeps the uniform row schema unchanged and provides a reusable typed extension boundary.

Cost or risk: separates the decision from its row and adds lookup and cross-reference invariants.

## Deferred and stopped states

- `BMC-REL-D06-P02-D-DEFER`: leave D06 machine projection blocked while retaining the admitted P01 vocabulary.
- `BMC-REL-D06-P02-E-STOP`: terminate the D06 projection sidecar without changing the packet.

## Rejected constructions

- Overloading numeric bounds, closure, multi-endpoint, occurrence, inverse, representation, or compatibility-token facets.
- Storing only an untyped evidence reference without a schema-owned policy and registry binding.
- Omitting the exact registry digest or accepting arbitrary/free-text IDs.
- Authoring `owned-by`, requiring a positive ownership minimum, or copying the policy to another relationship.

Recommendation without selection: `BMC-REL-D06-P02-B-OWNS-SCOPED-TYPED-EXTENSION`, because it preserves D06
as an independent `owns`-only axis with the smallest packet mutation surface.

## Claim ceiling

This candidate defines representational alternatives only. It does not select or apply one, mutate the main
packet/schema/validator, change canonical definitions or relationships, implement validation, resolve other
topology, authorize D07, promote, publish, release, deploy, or prove production use.
