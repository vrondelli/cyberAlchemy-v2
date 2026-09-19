# Glossary Consistency

Result: `pass-with-unadmitted-candidate-terms`

The hardening reuses the prior ontology meanings and adds no canonical
DomainSpec definition. All new labels below are package-local contract terms.

| Term | Meaning here | Non-collapse boundary |
| --- | --- | --- |
| `formal-claims-owner` | per-claim primary-source role proposed for Rondelli | not a new authority kind or composition owner |
| `owner-authentication-and-receipt-structural-verifier` | verifier-only role proposed for Victor Boscaro | not a semantic approver, veto, lifecycle, promotion, or publication role |
| `V0-draft-precheck` | optional draft check | no admission effect |
| `V1-policy-verified` | future deterministic checker result under exact Victor-owned policy | checker does not own policy or meaning; currently unimplemented/unexecuted |
| `V2-direct-verified` | direct Victor structural receipt over one exact package | not semantic acceptance |
| `V3-externally-attested` | V2 plus separate external L2 evidence | unavailable until its own gate |
| package freeze | exact manifest plus bound artifact digests, roles, scopes, levels, and ceilings | not canonical admission |
| structural block | evidence package is missing, stale, mismatched, or scope-expanding | not a judgment that Rondelli's meaning is wrong |
| superseding package | new immutable package after any bound change | old receipts do not follow it |

Existing `DS-D1`, `DS-D2`, `DS-D8`, and `domainspec-v2-D27` remain owned by
their current definitions routes. `formalizes` and `derived_from` remain
candidate relationship terms pending their separate exact admission. The
CAV2 structural envelope is precedent and a compatibility target only;
DomainSpec has not adopted it through this run.

Authority effect: `none`.
