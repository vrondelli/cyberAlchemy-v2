# Distill Proposer Result

- Target context: one private owner-admission hardening package for the already
  selected Specification-Ontology Design.
- Objective/output: bind exact roles, scopes, package bytes, verification
  floors, policy, responses, receipts, and supersession without implementing
  or admitting them.
- Mode/budget: Standard assumed; one proposal track, two recursive rounds;
  parent Balancer pending.
- Current smallest coherent unit: frozen role-scoped owner-admission package.
- Proposer result: complete candidate; final Distill verdict is parent-owned.

## Superseding candidate repair — turn 2

The parent Balancer found that revision `@1` carried a package-content digest
without declaring the exact byte projection and canonicalization needed to
reproduce it. Revision `@1` was never accepted and is now superseded evidence
only.

Revision `dsv2-spec-ontology-contract-hardening@2` required method
`sha256-rfc8785-acceptance-artifact-path-digest-set-v1`. It sorts the 12
acceptance-bound entries by Unicode code-point path, projects only `path` and
`sha256`, serializes the array with RFC 8785 as UTF-8 without a trailing line
feed, and hashes those bytes with SHA-256. Every current path/key is ASCII and
every digest is lowercase hexadecimal, so this restricted-domain
implementation was exact and independently reproducible. The revision was
never accepted and is now superseded evidence only.

This repair changes no architecture semantics or authority. It creates a new
candidate package and restarts every pending owner/verifier binding.

## Comprehensive digest-contract repair — turn 3

Independent review found the remaining hidden glue in `@2`: the manifest
self-digest algorithm was undeclared, and future owner responses and
verification receipts did not repeat the digest-method bindings. Current
revision `dsv2-spec-ontology-contract-hardening@3` closes all three layers:

- `sha256-raw-file-bytes-v1` for exact regular-file bytes, with symlinks
  forbidden;
- `sha256-rfc8785-acceptance-artifact-path-digest-set-v1` for the sorted
  acceptance artifact path/digest projection;
- `sha256-rfc8785-manifest-without-manifest-digest-v1` for the complete
  manifest after removing only top-level `manifest_digest`.

All three identifiers are required constants in the manifest, owner-response,
and verification-receipt schemas. Recomposition now begins by reproducing all
three layers and joins only evidence that repeats them exactly. Planned
validators fail closed for missing, unsupported, or mismatched methods; those
validators and fixtures remain unimplemented and unexecuted.

The full manifest JCS domain is exact here: ASCII keys and strings, one integer
revision, and no floating-point, boolean, null, control, or non-ASCII values.
Two independent restricted-domain serializers agree. Revisions `@1` and `@2`
were never accepted and cannot be revived.

The unit cannot be split into a manifest alone, roles alone, or verification
alone: each split loses either authority scope, byte identity, non-bypassable
floors, or currentness. Checker code, external L2, transport, physical
canonical locations, and migration can be deferred without breaking Design
closure.

Recomposition starts by reproducing raw-file, package-content, and manifest
digests under the declared methods. It then joins each exact Rondelli
role-scoped response to its required V1 or V2 structural receipt only when both
repeat those methods. The result is only eligibility for a separate lifecycle
decision; it never yields semantic truth, discharge, promotion, or publication.

Start with `owner-admission/PACKAGE-MANIFEST.json`, then the role and level
assignments, followed by the separate Rondelli and Victor request artifacts.
The parent must run the Balancer and independent validation before reporting a
Distill verdict or advancing any protected route.
