# E02 completion — exact FormalClaim v4-to-v2 projection

Date: 2026-09-20. Status: scoped complete. Authority effect: none.

## Completion statement

E02 is complete for the current AlchLang FormalClaim subset. Exact v4 claim
bytes now project deterministically into the current
`FormalClaimSourcePayload/v2` TDE intake shape without creating a second claim,
repairing meaning or hiding target-shape loss.

## Done-criterion accounting

| Obligation | Evidence | Result |
| --- | --- | --- |
| Exact source | Projection starts from current v4 bytes produced by the existing exact FormalClaim lowering path. | pass |
| Exact target | The payload validates against the current closed v2 schema. | pass |
| Meaning preservation | Claim identity, business binding, profile, proposition, signature, definition binding, interpretation boundary and ceiling remain bound. | pass |
| Explicit loss | Five representation-only target-shape losses are recorded; semantic loss is zero. | pass |
| Preservation record | A schema-valid DomainSpec preservation binding names preserved semantics, losses, direction and ceiling. | pass |
| Attached currentness | A schema-valid v4 view points to the exact current v2 payload without changing FormalClaim identity. | pass |
| Semantic mutation behavior | Proposition and ceiling changes create new claim identity and projection bytes; eight projected-surface mutations reject currentness. | pass |
| No invented result or authority | Projection trace records no meaning repair, provider execution, admission, result or authority effect. | pass |

## Validation

- AlchLang strict and build-surface typechecks: pass.
- Focused projection plus FormalClaim source-identity suite: 12/12 pass, zero
  skips.
- E02 qualification validator: 2/2 pass.
- Complete serial `application-*.test.ts` regression: 120/120 pass, zero
  skips; duration 183371.652143 ms.
- Qualification: `evidence/e02-formal-claim-projection/qualification.json`,
  SHA-256
  `05e87131e292b26e10dbb7a263cb819a065fb79c8c0f69619281c4e92b1511de`.

## Claim ceiling

This closes E02 only. It does not admit a FormalClaim, derive or discharge an
obligation, admit or execute a provider, produce or join evidence, approve a
product, publish, release, deploy, establish production readiness or grant
authority.

Progress is 26 of 37 scoped nodes. E03 is next on the formal-evidence chain;
E04 remains dependency-ready on the parallel runtime-evidence branch.
Product-owner validation remains deferred until L4X.

## Open Questions

E03 owns typed provider request/result evidence and EVF joining. FormalClaim
admission remains an independent owner decision.
