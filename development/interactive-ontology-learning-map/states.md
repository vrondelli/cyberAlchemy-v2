# States

## Projection lifecycle

`candidate-contract -> sources-pinned -> extracted -> validated -> snapshot-built -> privately-served`

A failure at any independent gate produces `blocked-with-receipt`; it does not silently downgrade, promote, or publish the result.

## Independent state namespaces

| Namespace | Example states | Owner |
|---|---|---|
| `projection.contract` | candidate, approved, superseded | unresolved projection owner |
| `projection.build` | not-run, pass, fail, blocked | implementation/evidence owner |
| `domainspec.local` | candidate, reviewed-candidate, blocked, projected | DomainSpec local owner |
| `cav2.authority` | source-owned values only | CAV2 authority owner |
| `craft.condition` | source-owned ledger conditions | Craft ledger owner |
| `claim.verification` | not-run, source-observed, independently-verified, contradicted | evidence owner |
| `publication` | not-run, rejected, approved-exact-manifest | separate publication owner |

These namespaces cannot be coerced into one generic status axis.
