# DSR-007 DomainSpec-only context

Task Session evidence, Context Builder lean; no runtime delegation.
Interpretation: continue the next planned vertical in DomainSpec; Alch reconciliation is explicitly deferred.
No Workflow implementation is inferred from the preceding conceptual question. Existing Workflow semantics
remain unchanged; multi-Operation execution is later work (DSR-017/024).

| Selected source | Selector | Obligation |
| --- | --- | --- |
| WORK-ITEMS.json | DSR-007, V08, V09 | O1 test the selected Entity/Query path; preserve pending Alch requirements |
| definition-pack/catalog.json | DS-D1.1, DS-D1.5, DS-D8:reads | O2 identity, read-only meaning and exact endpoints |
| impl/cli/src/input/project-model.ts | BODY_SCHEMAS.Query, validateThinBackendNode | O3 closed typed input and reference validation |
| impl/cli/src/typed-backend/contracts.ts | TypedQueryContract, decodeTypedQueryContract | O3 use the existing supported contract |
| impl/cli/src/generation/project-build.ts | planCompiledProjectBuild, verifyProjectBuild | O4 generated code and digest-bound evidence |
| impl/cli/test/thin-backend-verticals.test.ts | Query contract and cross-language corpus | O4 existing execution mechanism |
| definition-pack/preservation.mjs | previous epoch check | O5 preserve prior files and dirty code |
| /home/vrondelli/projects/domainspec-core/toolchains/node-typescript/toolchain.json | typescript, container_image | O4 use the pinned compiler without installing another toolchain |

All five obligations covered by these eight sources. Source paths are relative to DomainSpec root except
the plan artifacts, which are relative to reconciliation-v1. No unrelated exploration or provider binding.
Write ceiling: verticals/entity-query/, evidence/l0/, PLAN.md and DSR-007/V08/V09/current frontier fields
in WORK-ITEMS.json. Generated output is confined to a fresh temporary directory or an explicit new evidence
target. No compiler or Alch edits, package builds, database calls, Git index changes, publication or admission.
D65 boundary: reuse owned meanings and existing implementation; prove a bounded product path, not general
product approval. The user's DomainSpec-first scope defers Alch—not a claim that the original dual-frontend
acceptance criteria passed. Candidate definition proposals are not compiled or promoted.

Validation: compile through the CLI; inspect the normalized typed graph; build and independently verify
TypeScript target; execute exact results and read-only tests; reject malformed source, wrong endpoint and
missing field/type before target creation; repeat deterministically; preserve source hashes.
Trade-off: use existing typed-record storage shape inside an Entity node, not invent new syntax in a test.
The Entity semantic kind and declared identity remain explicit. Richer field constructors are DSR-009.

## Open Questions

Alch comparison is deferred by the user. Broader field semantics, compiler reconciliation and workflow
execution remain in the work pack. This vertical introduces no provider or durability guarantee.

