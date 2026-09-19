# Invoke Refresh — SWU-APE-ONT-005

Status: `materialized / ready for Task Session admission`

## Selection and scope

- Selected unit: `SWU-APE-ONT-005` (`Causal scenario contract`).
- Dependency: immutable passing `SWU-APE-ONT-004` receipt.
- Exact mutation scope: one evaluation-scenario schema, three scenario fixture files, and the existing ontology validator.
- Forbidden scope: every BTE-owned path. Later BTE adoption remains a separate owner refresh.
- Authority/publication: private, internal, `authority_effect: none`.

## Staged delta

- JSON Schema 2020-12 binds stable operation, base, mutant, expectation, mutation, scenario, case, result, partition, and join identities.
- Base/mutant and pre/post expectation handles are content-addressed. Expectations are explicitly immutable; a changed post handle produces `BTE_EXPECTATION_REWRITTEN`.
- Recomposition partitions carry half-open resource scopes. The checker rejects any same-resource scope overlap with `BTE_RECOMPOSITION_OVERLAP`.
- Frozen cases and results are joined explicitly and bijectively. A missing case/result edge produces `BTE_RECOMPOSITION_MISSING`; duplicate or unresolved edges produce typed failures.
- Expected diagnostic and semantic delta stay in each frozen case, while observed diagnostic and delta stay in the independently joined result.
- The main ontology validator invokes the focused checker as a regression gate.

## Validation

- Pinned runtime: Node `22.13.0`; built-ins only; no network or package change.
- One complete causal scenario passes.
- Three exact negatives fail: overlapping recomposition scopes, rewritten expectation digest, and partial frozen-case/result join.
- Repeated focused output is byte-identical with SHA-256 `562cf625a547cba67239bf8475a8e7c54b3759d7924c05919d427113a26fd131`.
- An isolated overlay of the staged files onto the current ontology experiment passes the full validator twice with byte-identical SHA-256 `58e316c7ea893da598655a192a07d2b0617b07c66eb7cdd6807371c853a25a08`.

## Residue and claim boundary

This proves a candidate-local schema and deterministic fixture contract. It does not modify or validate BTE, publish `red-scenario.v1`, prove a real proof-provider integration, freeze a production corpus, authorize profile semantics, promote ontology, release, deploy, or establish production readiness. BTE may consume this contract only through a later BTE-owner refresh.

