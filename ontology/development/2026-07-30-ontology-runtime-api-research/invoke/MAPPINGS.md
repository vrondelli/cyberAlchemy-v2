# Mappings: Ontology Vault Runtime API

## Configured Input To Verified Registration

Preserve package/profile IDs, adapter identity, manifest/profile digests,
role-bearing opaque owner refs, privacy class, declared capabilities, and
fixture caps. Resolve the physical root at startup but never emit or accept it
over HTTP.

## Local Extraction Item To Runtime Record Envelope

| Source | Target | Transform |
| --- | --- | --- |
| `local_kind`, `local_id` | qualified record identity | prefix with package/profile/snapshot; do not globalize local ID |
| payload bytes | opaque payload | preserve bytes and SHA-256 |
| aliases | human alias bindings | preserve role, language, owner, selector |
| local facets | owner-bound facets | preserve axis, raw value, owner route, schema, selector |
| source refs | immutable source bindings | logical ref + digest; remove physical path |
| confidence | confidence pair | require evidence and commitment axes independently |
| authority | runtime authority effect | constant `"none"` |

## Native Execution To Runtime Run

Child completion maps to runtime `succeeded` even when the native result is
negative. Child/process failure maps to runtime `failed`. No mapping creates
conformance, maturity, approval, or readiness.

## Run Evidence To Draft Proposal Bytes

Copy exact snapshot/run/receipt handles, observation selectors, both confidence
axes, requested transition text, semantic delta, conflicts, questions,
suggested opaque owner route, and residue. Add only draft identity, compatibility
target, and authority effect `none`.

