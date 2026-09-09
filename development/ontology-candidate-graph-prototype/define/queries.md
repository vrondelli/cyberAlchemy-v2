# Queries

## InspectResearchLineage

Returns the validated `derives-from` closure for the named lineage rooted at
`D1`, preserving edge direction and source digests.

For the normative fixture the exact node set is `D1`, `R1`, and `F1`, with:

```text
F1 --derives-from--> R1 --derives-from--> D1
```

`D2 contradicts D1` is visible in a conflict appendix but excluded from
grounding closure.

## InspectPolicyDisposition

Returns candidate ID, endpoint IDs, policy ID/version/digest, disposition,
stable reason code, evidence selectors, and `authority_effect: none`.

## InspectRunBinding

Returns fixture, policy, evaluator, result, projection, and isolation-attestation
digests from one immutable receipt.

## Read-Model Rule

Queries consume only a completed run bundle. No query can write a fixture,
policy, ontology source, authority source, promotion record, or another run.
