# BMC-REL-D07-P02 Typed Packet Representation Candidate

Status: `candidate-only-pending-owner-decision`

Authority effect: `none`

Decision effect: `none`

Decision ID: `BMC-REL-D07-P02-TYPED-PACKET-REPRESENTATION`

Dependency: the repaired D30 package is canonically applied. Registry path
`projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json` has exact SHA-256
`854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c`.

## Consequential question and strict boundary

Which typed packet representation should carry the selected D07 policy for canonical `belongs-to`: a generic
first-class row facet, a `belongs-to`-scoped typed extension, or a top-level typed projection—or should projection
be deferred or stopped?

Every action option represents exactly the same fixed policy and vocabulary:

```text
policy = one-parent-per-admitted-membership-kind
registry = projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json
registry_sha256 = 854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c
active_ids = { classification, home-assignment }
```

For every Entity `e`, admitted kind `k`, and parent Entities `p1`, `p2`, two direct canonical facts
`belongs_to_k(e,p1)` and `belongs_to_k(e,p2)` imply `p1 = p2`. There is no existence condition. The gate does not
infer numeric bounds, self/cycle/transitive/closure/duplicate/inverse/serialization/runtime behavior, make
membership mandatory, or conflate `belongs-to` with `owns`. It does not mutate the packet, schema, or validator.

<a id="bmc-rel-d07-p02-a-generic-first-class-facet"></a>
## `BMC-REL-D07-P02-A-GENERIC-FIRST-CLASS-FACET`

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `decision-gate:owner-decision`
- Rejection reasons: none at structural prefilter.
- Shape: add a required `membership_topology` facet to every packet row. The `belongs-to` row carries the exact
  policy token, registry path and digest; every other row carries `not-applicable` and may not carry the token.
- Benefit: makes membership topology first-class within the packet's uniform-row pattern.
- Risk: rewrites every row for a `belongs-to`-specific concern and creates more non-applicable surface where a
  token could be copied incorrectly.
- Downstream effect: after separate selection, the packet schema and validator would need uniform presence,
  exact `not-applicable` enforcement outside `belongs-to`, and closed registry-binding checks.

<a id="bmc-rel-d07-p02-b-belongs-to-scoped-typed-extension"></a>
## `BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION`

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `decision-gate:owner-decision`
- Rejection reasons: none at structural prefilter.
- Shape: add a schema-discriminated, `belongs-to`-only `membership_topology` object requiring exact keys for
  status, policy, registry path, registry digest, rationale, and evidence; forbid it on every other signature.
- Benefit: places the independent axis at its semantic locus, minimizes unrelated row churn, and stays closed
  and fail-closed.
- Risk: introduces a conditional row shape that the schema and validator must enforce explicitly.
- Downstream effect: after separate selection, packet/schema/validator changes would be scoped to the
  `belongs-to` discriminator plus cross-checks against D30 and the exact registry digest.

<a id="bmc-rel-d07-p02-c-top-level-typed-projection"></a>
## `BMC-REL-D07-P02-C-TOP-LEVEL-TYPED-PROJECTION`

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `decision-gate:owner-decision`
- Rejection reasons: none at structural prefilter.
- Shape: add a closed packet-level `relationship_specific_projections` collection with one membership-topology
  entry keyed to `signature_id: belongs-to`, the exact policy token, registry path, and digest.
- Benefit: preserves the uniform row schema and creates an explicit typed projection boundary.
- Risk: separates the decision from its row and adds lookup, uniqueness, and cross-reference invariants.
- Downstream effect: after separate selection, schema and validator changes would require a unique `belongs-to`
  projection and exact cross-reference to the row and registry.

<a id="bmc-rel-d07-p02-d-defer"></a>
## `BMC-REL-D07-P02-D-DEFER`

- Option kind: `defer`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Rejection reasons: none at structural prefilter.
- Trade-off: retain canonical D30 vocabulary while leaving packet representation and executable enforcement
  unresolved. Later packet or registry drift requires renewed evidence.

<a id="bmc-rel-d07-p02-e-stop"></a>
## `BMC-REL-D07-P02-E-STOP`

- Option kind: `stop`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Rejection reasons: none at structural prefilter.
- Trade-off: terminate D07 projection without adding a typed packet representation; canonical D30 remains local
  vocabulary authority only.

## Rejected constructions

- Overloading numeric bounds, closure, multi-endpoint, occurrence, inverse, representation, or compatibility-token facets.
- Storing only untyped evidence without a schema-owned policy and exact registry binding.
- Omitting the registry digest, accepting free-text IDs, or accepting a policy token not closed by the schema.
- Requiring any Entity to belong somewhere, inferring numeric minima/maxima, or treating `many_to_one` as numeric authority.
- Reusing ownership vocabulary or collapsing `belongs-to` into `owns` or `owns^-1`.
- Selecting and applying packet/schema/validator changes in this gate.
- Allowing `one-parent-per-admitted-membership-kind` or a `membership_topology` object on a non-`belongs-to` row.

## Recommendation without selection

Recommend `BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION` because the policy is an independent
`belongs-to`-only axis and B has the smallest unrelated-row mutation surface while retaining a closed,
schema-discriminated representation. This recommendation has `decision_effect: none`.

## Explain-path complexity ladder

Shared invariant: every action represents the same policy, exact registry path/digest, `belongs-to`-only scope,
and zero-existence condition. These scenarios are hypothetical, option-aligned, and have `decision_effect: none`.

### Low — one classified Entity

A source Entity has one direct `classification` parent. A represents the policy in the `belongs-to` row's generic
facet and marks all other rows not applicable; B represents it in the row's scoped object; C represents it in one
top-level entry keyed to `belongs-to`. D leaves representation unresolved; E stops projection. This demonstrates
ordinary placement only and does not require membership or select a representation.

### Medium — two admitted kinds, two distinct parents

The same Entity has a `classification` parent and a different `home-assignment` parent. A, B, and C must each
preserve uniqueness within each kind while permitting distinct parents across kinds and binding the same registry
digest. D defers and E stops. This demonstrates kind-scoped uniqueness, not a global one-parent rule.

### Complex — registry drift and non-`belongs-to` token pressure

The packet contains many relationship rows; a stale registry digest is supplied and a non-`belongs-to` row tries
to carry the policy token. A must reject the stale digest and require `not-applicable` outside `belongs-to`; B must
reject the scoped object outside the discriminated row; C must reject a projection keyed elsewhere or duplicated.
D preserves no typed representation and E terminates. This demonstrates fail-closed registry and scope behavior;
it does not authorize packet mutation or define runtime enforcement.

## Claim ceiling

This candidate presents representational alternatives only. It does not select or apply one, mutate the packet,
schema, main validator, relationships or definitions, infer any unselected topology semantics, implement
enforcement, decide D08, publish, release, deploy, or prove production use.
