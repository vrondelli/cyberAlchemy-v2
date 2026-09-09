# AlchLang Construction Profile v1 — research candidate

## Why a composed profile

A single flat “TypeScript profile” would mix at least nine independently owned
compatibility decisions. The root profile should instead bind them by exact
reference and digest.

```json
{
  "schema_version": "cav2.alchlang-construction-profile/v1-research-candidate",
  "profile_id": "alchlang-construction/typescript-static-arrow-v1",
  "language_epoch": {
    "id": "cav2.alchlang/initial-language-v1",
    "sha256": "<required>"
  },
  "frontend": {
    "id": "alchlang.frontend/typescript-static-arrow-v1",
    "decoder_provider_id": "alchlang-ts-static-decoder-v1",
    "grammar_sha256": "<required>"
  },
  "carrier": {
    "schema_version": "cav2.alchlang.carrier/v3-candidate",
    "schema_sha256": "<required>"
  },
  "domainspec": {
    "baseline_id": "domainspec-meta-types-current-implemented@10",
    "baseline_sha256": "4e8c72e3c59308bf7f476a2365d0ba66e149534b8dfddb4ad8b555e454edbf59",
    "meta_type_registry_sha256": "bc800afdca36fa701a13ec611e7ee0ef928a4c8d259d48dfac2880a3cc8cbbc4",
    "allowed_meta_type_ids": ["DS-D1.1", "DS-D1.2", "DS-D1.3", "DS-D1.4", "DS-D1.5", "DS-D1.6", "DS-D1.7", "DS-D1.8", "DS-D1.9", "DS-D1.11", "DS-D1.12", "DS-D1.13", "DS-D1.14"],
    "relationship_profile_ref": "<required-exact-ref>"
  },
  "realization": {
    "target_language": "typescript",
    "target_profile_ref": "<required-exact-ref>",
    "provider_registry_sha256": "<required>"
  },
  "integration": {
    "formation_profile_id": "domainspec.system-integration-profile/provider-neutral-v1",
    "formation_profile_sha256": "b3d29e53172b8ba81600c6e1944cb96f9778e4fedadaacf1ccd5ca4022483e9b",
    "binding_registry_sha256": "<required>",
    "provider_selection": "none"
  },
  "patterns": {
    "catalog_id": "cav2.alchlang.pattern-catalog/v1-candidate",
    "catalog_sha256": "<required>",
    "visibility_policy": "dependency-closure-only"
  },
  "runtime": {
    "effect_policy": "explicit-and-separately-authorized",
    "provider_runtime_required_for": ["runtime-capable"],
    "observed_guarantees_required": true
  },
  "evidence": {
    "factory_projection_schema": "cav2.alchlang.factory-projection/v1-candidate",
    "require_replay": true,
    "require_hostile_tests": true,
    "require_create_only_publication": true
  },
  "authority_effect": "none",
  "claim_ceiling": "Compilation and proof selection only; no adoption, admission, release, provider-runtime guarantee, deployment, or effect authority."
}
```

All placeholders are intentional blockers. A profile with any unresolved
placeholder, missing digest, unknown ID, or incompatible provider is invalid.

## Profile validation rules

- Exact keys and schema version; unknown dimensions fail closed.
- Every referenced digest is recomputed before decoding source.
- Every allowed meta-type exists in the pinned baseline.
- Every selected target realization row exists for every used meta-type.
- Each source factory resolves to exactly one admitted meta-type projection.
- Each relationship resolves to a canonical signature and obligations.
- Pattern visibility requires all declared dependencies, not merely a known
  pattern name.
- Runtime-capable pattern visibility additionally requires a provider binding
  and matching runtime observation; generatable visibility does not.
- Profile resolution produces a receipt before compilation.

## Why profile is not status

The profile is a compatibility envelope. Lifecycle status belongs to the
referenced artifacts and owner decisions. Changing one selected digest creates
a new profile candidate; it does not mutate the old profile.

