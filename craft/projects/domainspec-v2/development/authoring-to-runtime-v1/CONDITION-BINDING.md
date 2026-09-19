# Rule–FormalClaim binding contract

Version: `domainspec.formal-condition-bindings/v1-candidate`.
Implementation: `../../impl/cli/src/formalization/condition-binding.ts`.
Tests: `../../impl/cli/test/formalization/condition-binding.test.ts`.

`condition-bound-to` connects one qualified Rule in the compiled domain graph
to one exact FormalClaim v4 source in the formalization partition. This
cross-partition relationship is not added to the domain-only relationship
catalog; it does not change the thirteen backend meta-types.

The caller selects the Rules in scope explicitly. Every selected Rule has
exactly one condition binding. Multiple Rules can bind the same claim. Claim
identity is `(claim_id, claim_version, identity_inputs_digest)`; a single
claim ID/version cannot resolve to competing bytes within the join.

```json
{
  "schema_version": "domainspec.formal-condition-bindings/v1-candidate",
  "rules": ["commerce:eligible-order"],
  "bindings": [{
    "binding_id": "order-eligibility",
    "relationship": "condition-bound-to",
    "rule_ref": "commerce:eligible-order",
    "claim_ref": {
      "path": "claims/eligible.json",
      "sha256": "<exact 64-character lowercase SHA-256>",
      "size_bytes": 1234,
      "claim_id": "FormalClaim:EligibleOrder",
      "claim_version": "1",
      "identity_inputs_digest": "<exact semantic identity input digest>"
    },
    "source_pointer": "commerce.alch:12"
  }],
  "authority_effect": "none"
}
```

The JSON above is an explanatory shape, not executable evidence. The caller
supplies a map of relative source paths to exact bytes. The join itself performs
no file, network, provider, or runtime effects. It dereferences the map and
checks byte length, digest, source version, authority effect, claim identity,
and currentness. Missing, stale, duplicate, escaped, non-Rule, wrong-kind, and
competing bindings reject. Qualified identifiers must match exactly.

Results retain the compiled graph's source-manifest digest, relationship
signature digest, source pointers and exact claim references. Binding order is
canonical and outputs are frozen. Providers and interpretation models are not
accepted fields and cannot alter the relationship identity.

This component proves endpoint and byte correspondence only. It does not
validate the complete v4 schema, accepted-definition closure, proposition,
identity algorithm, or executable preservation. Those are separate S03/S04/S06
obligations, and their success is required before a whole application can claim
a valid executable formal condition. It never treats an existing Rule body as
equivalent to the claim merely because this join passes.

Current validation: four focused test groups pass, including nine structural
and identity mutations and four missing/stale/wrong-kind/superseded cases.
The DomainSpec full typecheck and materialized-source checks also pass. No
formal provider was executed and no admission was inferred.
