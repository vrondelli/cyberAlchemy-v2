# Auth EVF production bridge ontology

This private, agent-facing prototype scaffold maps Auth product meaning to the exact system artifacts frozen by `AUTH-EVF-EPOCH-002`. It is a `business-system-bridge` package with separate business, system, and bridge branches.

The package is navigational and contract-bearing only. It does not admit an ontology, prove Auth EVF conformance, implement a provider or theorem, approve a product, or grant enforcement or operational authority.

Validate from the repository root with:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 projects/auth-foundation/development/auth-service-d65-r2-plan/evf-production-v2/auth-evf-01/ontology/scripts/validate.py --verify-receipt
```

The executable route is deliberately `selected-structural-nonpass`: exact Cargo bytes are bound, but Cargo does not emit the EVF JSON result contract. `AUTH-EVF-02` owns that closure. The theorem route is `not_evaluable` until `AUTH-EVF-03` creates an Auth-specific theorem and Rust projection.
