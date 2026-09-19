# Hardening Validation

Status: **PASS for superseding revision `@3` at Design-candidate scope only**.

Revision `@1` passed the original local checks, but the parent Balancer found an
acceptance-critical gap: its package-content digest had no declared portable
method. Revision `@1` was never accepted and is superseded evidence only.

Revision `@2` also passed its local checks, but it did not declare the manifest
self-digest method and its future evidence schemas did not repeat all method
bindings. It too was never accepted and is superseded evidence only.

Current package `dsv2-spec-ontology-contract-hardening@3` has:

- artifact method `sha256-raw-file-bytes-v1`;
- package-content method `sha256-rfc8785-acceptance-artifact-path-digest-set-v1`;
- manifest method `sha256-rfc8785-manifest-without-manifest-digest-v1`;
- package-content digest `71d58281363e591e7fb2e56b4eca8e0c420ec71d6727046b0983aef582f365d4`;
- manifest self-digest `49ed58484f0a802c9e2e1ceedd540d985a1c00bbadbd38b4e7282581fc03e20c`;
- manifest file SHA-256 `ab40b4d47b07c19eb8108c60f585f4214ebbe38ea2c3888bcfb3c36e658d6481`.

The package-content method sorts the acceptance-bound entries by Unicode code-point path,
projects only `path` and `sha256`, serializes the array using RFC 8785 as UTF-8
with no trailing line feed, then applies SHA-256. All current paths and keys are
printable ASCII, all digests are lowercase hexadecimal, and the projection
contains strings only. Python and an independent `jq` projection produced the
same bytes and digest for this restricted domain.

The manifest method removes only top-level `manifest_digest`, retains the
method field itself, RFC 8785 JCS serializes the entire remaining manifest as
UTF-8 without a trailing line feed, and applies SHA-256. The full manifest has
only ASCII keys/strings and one integer revision, with no floats, booleans,
nulls, controls, or non-ASCII values. Python and independent `jq` projections
again agree exactly.

## Executed checks

- Three revised schema metaschema checks and `@3` manifest instance validation: pass.
- Exact raw regular-file SHA-256 for six source decisions and 12 acceptance-bound artifacts, with symlinks forbidden: pass.
- Declared RFC 8785 package-content method reproduction: pass using two independent restricted-domain projections.
- Manifest self-digest and manifest file SHA-256 reproduction: pass.
- Rondelli and Victor pending-request bindings to exact `@3` identity, all three methods, and digests: pass; no responses exist.
- Nine method-negative classes cover missing, unsupported, and mismatched values across all three methods: present but unmaterialized and unexecuted.
- Repair write-scope, path boundary, symlink safety, JSON parsing, and Markdown trailing whitespace: pass.
- Original context coverage, closed scope, denominator, selection fixed point,
  planned-witness completeness, role topology, and floors remain unchanged and
  retain the prior pass evidence; this repair did not rewrite or reinterpret them.

The final repair validation preserves failure status with `set -euo pipefail`.
Six acceptance-bound artifacts changed, so their hashes correctly created
revision `@3`; every pending request was rebound and must start fresh.

## Explicitly unexecuted

The eight `HV-*` validator contracts are plans, not implementations. No planned positive or negative fixture was materialized or run. There is no owner admission, verifier acceptance, V1 or V2 receipt, migration, promotion, publication, or semantic closure.

## Remaining gates

The candidate remains blocked pending exact protected Rondelli responses; Victor Boscaro's direct verifier-role and V1-policy acceptance; Victor's required direct V2 receipts; and future V1 checker implementation and execution. V3 remains unavailable until a separate external L2 gate exists.
