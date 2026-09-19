# Governance Sidecar Validation

Status: **PASS for separately staged package `@4` at governance-repair scope only**.

Revision `@3` was selected by Rondelli, but no owner response was created. The
acceptance edge stopped when two acceptance-bound instances were found to
declare stale package `@1`. Revision `@4` changes only those package identity
bindings and the dependent hashes, digests, pending requests, lineage, and
validation evidence. The role topology, scopes, non-scopes, verification
floors, schemas, planned validators, planned protected fixtures, and claim
ceilings are semantically unchanged.

## Current exact package

- Package: `dsv2-spec-ontology-contract-hardening@4`
- Package content digest:
  `56a4d3507d7c7bdd703a3dfe378d4722c738c72bf1d6e3bb831820d869dbf04b`
- Manifest digest:
  `103731b0004384df1b4a1a33f10bb40ba03fb95e5d822f602ff3a2b61794bc00`
- Manifest file SHA-256:
  `3ddd21b9b03fec75bbd5eccb155062e0461df1b55bd6af7a9e5f837e862d3530`
- Rondelli request SHA-256:
  `1b3ea5f35abf8ca21eea88c44f178a81bb001ed5d5fab8163340450aebe63de4`
- Victor request SHA-256:
  `7c9ee5ae59f5eec0814018131369fa8f4e3b68701eb63479095c1fe8072c9cd6`

## Executed checks

- All JSON parsed; six schemas passed metaschema checks; current role, level,
  policy, and manifest instances validated.
- Six source-decision and twelve acceptance-artifact raw hashes reproduced.
- Python and independent `jq` canonicalizations reproduced both RFC 8785
  digests.
- Both pending request files bind only package `@4`, all three digest methods,
  and the refreshed exact hashes.
- Semantic comparison with `@3` is empty after removing the package identity
  field; only the role and level instances changed that field.
- Paths are in-root regular files, symlink-free, and whitespace-clean.
- No owner response, Victor response, or verification receipt exists.

The first final closeout command used an overbroad `*RECEIPT*.json` glob after
the governance sidecar receipt itself existed, so it exited `1`. That was a
harness-only diagnostic, not a candidate failure. The assertion was narrowed
to protected owner/verifier response locations and the complete suite was
rerun; the earlier failure was not masked or reported as a package pass.

The narrow validator passes the positive `@4` candidate with exit `0`. Its
test-only negative fixture virtually places `@1` in the role-assignment
instance; the validator stops at that first mismatch and exits `1`.
An out-of-root supplied binding is rejected with exit `2`.

The negative fixture is sidecar regression evidence only. It is not one of the
planned protected `HV-*` product fixtures, and none of those planned
validators or fixtures ran.

## Boundary

Renewed Rondelli acceptance is required because `@4` is a different exact
candidate. Victor acceptance and verification, V1 checker implementation,
admission, migration, promotion, publication, and canonical effect remain
pending or unauthorized. Authority effect is `none`.
