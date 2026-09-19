# Ontology Vault Runtime Profile

## Identity

- Profile ID: `domainspec-v2.implementation-conformance.architecture-properties.v1`
- Status: candidate
- Ontology Vault branch: `system`
- Operation mode: `map + validate`
- Runtime mode: `inline`
- Agent backend: not configured
- Owner route: implementation-conformance design owner + Ontology Vault

## Local Ontology References

- `ontology.json`: candidate architecture-property ontology
- `domain-meta-types.projection.json`: non-authoritative DS-D1 inventory and
  explicit implementation-coverage read model
- `profiles/*.profile.json`: portable and language-specific expected property
  assertions
- `examples/typescript-observed-facts.json`: example observed projection
- `examples/typescript-evaluation.expected.json`: expected finding projection

## Source Spine

- DomainSpec `definitions/meta-types/meta-types.yml`: canonical DS-D1 identity,
  category, maturity, criteria, deferred state, and superseded tombstone
- DomainSpec `definitions/meta-types/meta-types.md`: human cards used for
  meaning-first projection copy
- CAV2 `NODE-MODEL.md`: node contracts and forbidden collapse
- CAV2 `RELATION-MODEL.md`: typed relation endpoints, effect, and cycle policy
- CAV2 projection model: projection use, blocked use, drift owner, and review
  trigger
- `ONTOLOGY-MAP.md`: local experiment contract for architecture types,
  properties, relations, mappings, and authority boundaries
- `PROPERTY-EVALUATION-MODEL.md`: local experiment contract for portable and
  language-specific properties, observations, evaluation, and adapter boundary

Exact source paths and SHA-256 bindings are recorded in
`ontology.json.source_refs`.

## Allowed Runtime Outputs

- architecture ontology map;
- property and relation catalogs;
- candidate architecture profiles;
- observed fact projections;
- deterministic evaluation findings;
- validation and drift reports;
- TypeScript, Python, and Rust downstream guides.

## Blocked Runtime Outputs

- semantic or supported-profile admission;
- canonical DomainSpec or CAV2 mutation;
- architecture-profile promotion;
- source-code conformance claim without a real language projection;
- runtime behavior claim from static properties;
- authority, release, or production verdict.

## Owner Gates

| Transition | Required owner and evidence |
| --- | --- |
| property candidate -> reviewed property | profile owner + discriminating positive/negative facts |
| language projection -> usable adapter contract | language owner + native parser/compiler fixtures + explicit unsupported set |
| profile candidate -> admitted architecture profile | profile owner + schema compatibility + project adoption decision |
| observed facts -> conformance finding | current source/profile/tool digests + total property extraction |
| finding -> lifecycle action | external narrowest owner; never this ontology |

## Residue Route

Experiment gaps remain in `TRACEABILITY-AND-DRIFT.md`. Changes that affect the
parent package route to `../DESIGN-RISKS-AND-GAPS.md`.
