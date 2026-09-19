# SWU-SGRM-003 Context Pack

## Envelope

- mode: standard-strict
- task: `SWU-SGRM-003`
- runtime: local
- delegation: none
- dependency: `SWU-SGRM-001` PASS; SGRM-002 also PASS and synchronized
- write scope: three tool modules, their focused tests, and this run evidence

## Selected Sources

| Source | Obligation |
|---|---|
| `work-pack/tasks/TASK-SGRM-IMPLEMENTATION.md#swu-sgrm-003-attribute-one-of-rule` | Owns algorithm, tests, failures, scope, and validation. |
| `WORK-PACK.md#swu-manifest` | Marks SGRM-003 ready and names acceptance evidence. |
| `runs/SWU-SGRM-002/RETRY-001/TASK-SESSION-RESULT.md` | Confirms authority migration and staged implementation residue. |
| `impl/tools/validate-content.ts` | Markdown criterion parsing/application and unsupported-rule behavior. |
| `impl/tools/instances.ts` | Deterministic instance generation and structured instance validation. |
| `impl/tools/lib/meta-type-noncollapse.ts` | Total rule classification and attestation invariance. |
| Three corresponding focused test files | Existing black-box and pure-core test patterns. |
| `impl/spec/meta-types/behavioral/workflow.schema.yml` | Target consumer shape; remains unchanged until SGRM-004. |

## Implementation Contract

1. Add `values?: string[]` to criterion representations.
2. Validate `key` is non-empty and `values` is a non-empty array of non-empty strings before reading data.
3. Match attribute keys case-insensitively.
4. Normalize actual and allowed values with trim plus lowercase; require exact membership.
5. Report missing key, malformed values, absent attribute, and unexpected value distinctly.
6. Generate the first allowed value deterministically and reject malformed schemas.
7. Apply identical key/value membership semantics to structured instances.
8. Reject unsupported instance/content rules rather than silently skip them.
9. Add `attribute-one-of` to the attestation set and total-classification map.
10. Test both allowed scopes, unknown/missing failures, malformed rule shape,
    deterministic generation, structured validation, unknown-rule rejection,
    and attestation permutation invariance.

## Boundaries

- Do not mutate live Workflow/Saga schemas, cards, fixtures, or generated instances.
- Do not delete legacy implementation artifacts.
- Do not change relationship fixtures or Saga-specific acceptance locks; SGRM-005 owns them.
- Follow the repository's existing duplicated local YAML-subset parser pattern; no cross-tool refactor in this SWU.

## Validation

- `npm --prefix projects/domainspec-v2/impl run tools:test`
- temporary-schema generate/validate round trip in focused tests
- `npm --prefix projects/domainspec-v2/impl run typecheck`
- scoped diff and unsupported-rule scans

## Coverage Result

PASS. Every algorithm rule, failure condition, write boundary, and done criterion
has a named implementation and test surface.
