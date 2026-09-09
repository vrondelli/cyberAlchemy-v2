# Glossary: Ontology Vault Runtime API

These are feature-local terms. They are not promoted definitions.

| Term | Meaning in this package | Link status | Rationale |
| --- | --- | --- | --- |
| Configured registration | Startup-only projection of an externally selected package/profile/adapter tuple | linked | Preserves `findings.md` §3.1; not discovery or authority registry |
| Package adapter | Lossless extractor and optional native-validator invoker | linked | Preserves source/package ownership |
| Runtime envelope | Runtime-owned wrapper around opaque local bytes, aliases, facets, confidence axes, and source bindings | linked | Never becomes the ontology schema |
| Runtime snapshot | Immutable content-addressed read model compiled from one complete package identity | linked | Not source truth or conformance |
| Native validation | Exact invocation/result of the retained project validator | linked | Distinct from runtime success and conformance |
| Same-adapter diff | Byte/local-ID comparison between two snapshots from one adapter identity | linked | Semantic equivalence is excluded |
| Draft proposal artifact | Immutable PromotionRequest-compatible bytes | linked | No delivery, review, decision, or application |
| Authority effect | Effect on governed authority state | linked | Invariant value is `none` |
| Evidence confidence | Source-owned confidence in evidence support | linked | Kept independent |
| Commitment confidence | Source-owned confidence in intended commitment | linked | Kept independent |
| Owner route | Opaque exact reference to a retained lifecycle owner | partial | Runtime preserves it but never infers its permission semantics |
| Readiness | A scope-qualified evidence claim | partial | `/readyz` means service readiness only |

## Consistency Rules

- Equal local strings across package/profile/facet tuples are not equivalent.
- A branch is a view, not an identity, type, owner, or lifecycle.
- Aliases never become canonical vocabulary.
- Runtime success, native result, conformance, promotion, release, and
  production readiness are independent.

