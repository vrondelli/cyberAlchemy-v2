# Pending Exact Owner and Verifier Requests

Status: prepared, not sent, no responses.

Current package: `dsv2-spec-ontology-contract-hardening@3`.

Artifact digest method:
`sha256-raw-file-bytes-v1`

Package content digest method:
`sha256-rfc8785-acceptance-artifact-path-digest-set-v1`

Manifest digest method:
`sha256-rfc8785-manifest-without-manifest-digest-v1`

Package content digest:
`71d58281363e591e7fb2e56b4eca8e0c420ec71d6727046b0983aef582f365d4`

Package manifest digest:
`49ed58484f0a802c9e2e1ceedd540d985a1c00bbadbd38b4e7282581fc03e20c`

Package manifest file SHA-256:
`ab40b4d47b07c19eb8108c60f585f4214ebbe38ea2c3888bcfb3c36e658d6481`

Revisions `@1` and `@2` were never accepted. They are superseded evidence only;
none of these requests may bind or revive them.

Every future owner response and verification receipt must repeat all three
method identifiers exactly. An absent, unknown, or mismatched method is
structurally inadmissible.

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
policy, checker, identity, source decision, or claim ceiling creates a
superseding package and restarts every affected request and verification.

Authority effect: `none`.
