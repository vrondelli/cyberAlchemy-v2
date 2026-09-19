# Pending Exact Owner and Verifier Requests

Status: prepared, not sent, no responses.

Current package: `dsv2-spec-ontology-contract-hardening@4`.

Artifact digest method:
`sha256-raw-file-bytes-v1`

Package content digest method:
`sha256-rfc8785-acceptance-artifact-path-digest-set-v1`

Manifest digest method:
`sha256-rfc8785-manifest-without-manifest-digest-v1`

Package content digest:
`56a4d3507d7c7bdd703a3dfe378d4722c738c72bf1d6e3bb831820d869dbf04b`

Package manifest digest:
`103731b0004384df1b4a1a33f10bb40ba03fb95e5d822f602ff3a2b61794bc00`

Package manifest file SHA-256:
`3ddd21b9b03fec75bbd5eccb155062e0461df1b55bd6af7a9e5f837e862d3530`

Revisions `@1`, `@2`, and `@3` are never-current superseded candidates.
The user selected `@3` exact bytes, but its protected acceptance edge was
invalidated before any owner response was materialized because two bound
instances still declared `@1`. No request or response may bind or revive a
superseded revision.

Every future owner response and verification receipt must repeat all three
method identifiers and package `@4` exactly. An absent, unknown, stale, or
mismatched package identifier or method is structurally inadmissible.

## Rondelli

Eleven exact requests are prepared in `RONDELLI-OWNER-REQUESTS.json`. Each asks
Rondelli to act through the exact proposed role for that slice and to accept,
reject, or defer only the named scope. The request cannot serve as a response.
Even a future `accept-contract` response remains structurally pending until its
required V1 or V2 receipt is current over the same frozen package.

- V1 floor: OAR-02, OAR-03, OAR-04, OAR-05, OAR-06, OAR-10.
- V2 floor: OAR-01, OAR-07, OAR-08, OAR-09, OAR-11.

## Victor Boscaro

Four direct requests are prepared in `VICTOR-VERIFIER-REQUEST.json`: direct
identity authentication, verifier-role acceptance, V1-policy acceptance, and
V1/V2 receipt-contract acceptance. None has been sent or answered.

Victor's role is structural only. A block means the package evidence is
inadmissible; it does not reject Rondelli's semantics. V1 checker execution is
not available because no checker has been implemented or admitted. V2 receipt
issuance is not available until Victor directly authenticates and accepts the
exact role/contract bytes.

## Invalidation

Any changed acceptance-bound byte, digest, role, scope, non-scope, level,
policy, checker, identity, source decision, package identifier, or claim ceiling
creates a superseding package and restarts every affected request and
verification.

Authority effect: `none`.
