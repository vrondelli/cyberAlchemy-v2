# Owner Request Revision 2 Validation

Status: **PASS at request-projection governance scope only**.

The frozen package remains `dsv2-spec-ontology-contract-hardening@4`. Request
revision r2 differs from the prior request object only at two fields:

- OAR-07 `decision_scope` now exactly names
  `formalizes and derived_from signatures`.
- OAR-08 `decision_scope` now exactly begins
  `admit the verifier-only topology`.

All eleven request IDs, order, manifest pointers, role assignments,
verification levels and routes, explicit non-scopes, package methods, package
digests, and pending statuses match the frozen manifest.

## Regression evidence

The positive request validator exits `0`. The test-only negative fixture
restores the stale OAR-07 wording; validation stops at that first exact-scope
mismatch and exits `1`. An out-of-root request path exits `2`. The fixture is
governance regression evidence, not a protected `HV-*` product fixture.

Eleven future owner-response shapes were constructed only in memory from r2,
the manifest, role bytes, response schema, and the structure of the existing
aggregate decision. All eleven were schema-valid. No response was written.
The existing aggregate decision is invalidated and was not treated as renewed
owner acceptance.

## Boundary

Every existing @4 byte named by the repair brief remains unchanged. A renewed
Rondelli decision over request r2 is required before any OAR response can be
materialized. Victor acceptance, verification, role admission, implementation,
migration, promotion, publication, and canonical effect remain pending or
unauthorized. Authority effect is `none`.
