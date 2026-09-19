---
task_reference: SWU-MNP-001
parent_task: TASK-MNP-CONTRACT
mode: standard
status: complete
created: 2026-07-14
timestamp: 2026-07-15T01:06:49Z
handoff_kind: local-task-context
authority: session evidence only
---

# Context Pack: SWU-MNP-001

## Objective

Author the first production machine-contract family for a minted DomainSpec
project: one experimental profile registry, source and generated-view schemas,
a normalized Key-and-Door conformance derivative, distinct negative contract
fixtures, mechanically checked human documentation, and one contract test.

This unit establishes factory form only. It does not implement the resolver,
compiler, view generator, minter, release admission, fixture migration, or a
consumer project's concrete domain authority.

## Obligation Matrix

| ID | Obligation | Controlling evidence | Coverage |
| --- | --- | --- | --- |
| O1 | Execute exactly selected `SWU-MNP-001` and preserve its directory-level write scope. | work-pack row, task contract, selection decision | covered |
| O2 | Keep profile admission, machine contracts, executable tooling, conformance evidence, and consumer meaning under separate owners. | factory authority decision, design authority table | covered |
| O3 | Define versioned project, feature, node, and embedded source-owned connection contracts for layout A. | task implementation detail, selected design, toy layout-A sources | covered |
| O4 | Define versioned graph, source-manifest, Markdown-view, and build-receipt contracts as generated read models. | task outputs, selected design, toy generated outputs | covered |
| O5 | Bind an experimental profile to explicit kinds and active relationship signatures without turning kind existence into admission. | authority decision, meta-type registry, relationship registry | covered |
| O6 | Provide one normalized positive fixture and distinct failures for missing field, duplicate ID, path escape, profile/language mismatch, and generated-authority injection. | task outputs and toy failure model | covered |
| O7 | Mechanically prevent human documentation from drifting from machine contracts. | task done criteria and existing contract-test convention | covered |
| O8 | Run the declared tool tests and typecheck without editing pre-existing dirty files outside the SWU. | task validation surface, package scripts, scoped status | covered |

## Selected Sources

| Source | Selector | Obligation |
| --- | --- | --- |
| `stages/S09-invoke-plan/WORK-PACK.md` | active SWU, manifest row, validation and handoff | O1, O8 |
| `stages/S09-invoke-plan/work-pack/tasks/TASK-MNP-CONTRACT.md` | outputs, ordered rules, SWU write scope, done criteria | O1-O8 |
| `authority/decisions/2026-07-14-minted-project-first-swu-selection.md` | selected/not-started binding and next owner | O1 |
| `authority/decisions/2026-07-14-minted-project-node-package.md` | authority homes, profile posture, toy disposition | O2, O5, O6 |
| `stages/S08-distill-repair/selected-design.json` | layout A, generated projections, receipt, frame expiry | O2-O4 |
| `stages/S06-invoke-design-toy-game/DESIGN.md` | common contracts, build binding, workflow and failure flow | O2-O6 |
| `definitions/meta-types/meta-types.yml` | `Entity`, `Operation`, `Rule`, `Event` entries and maturity | O5 |
| `definitions/relationships/relationships.yml` | active exact signatures for `performs`, `enforces`, `produces` | O5 |
| `impl/spec/meta-types/structural/entity.schema.yml` | local schema/document companion convention | O3, O7 |
| `impl/tools/tests/validate-relationships.test.ts` | Node test runner and negative-fixture convention | O6, O8 |
| `impl/package.json` | `tools:test` and `typecheck` commands | O8 |
| toy `candidates/layout-a/project.json` and node sources | minimal consumer source record shapes | O3, O6 |
| toy `generated/layout-a/{graph,source-manifest,build-receipt}.json` | generated record shapes and digest binding | O4 |
| toy `toy_compiler.py` | evidence-only validation/normalization rules | O3-O6 |

## Authority Precedence

1. The two operator decisions bind owner homes, experimental posture, and the
   selected unit.
2. The task contract binds the exact SWU write scope and done criteria.
3. The selected design binds layout A and source/graph/provenance/view separation.
4. Current kind and relationship registries supply names, maturity, exact active
   endpoint signatures, and content digests; they do not themselves admit a
   minted profile.
5. The toy package is read-only development evidence and must be normalized,
   never copied as production authority.

## Constraints

- Profile ID is `feature-with-independent-node-files`, status `experimental`.
- Profile membership is evidence-bounded to `Entity`, `Operation`, `Rule`,
  `Event`, and active signatures `performs`, `enforces`, `produces`.
- A node owns outgoing authored connections; `from` is derived from the
  containing node and is prohibited in source connection records.
- Every source path and generated root is project-relative and containment
  checked by contract metadata plus negative fixtures.
- Generated graph, source manifest, Markdown view, and build receipt declare
  generated/read-model posture and cannot be authored semantic authority.
- Source schemas and generated schemas use stable `/v1` identifiers.
- The registry remains under definitions; schemas under `impl/spec`; fixtures
  under the minted-project conformance root; only the contract test enters
  `impl/tools/tests`.
- Do not edit `impl/package.json`, the retired-orchestration allowlist, or its
  test; all three were dirty before this Task Session.

## Non-Goals

- Production resolver/compiler/view/minter implementation.
- Cross-feature resolution or independent edge lifecycle.
- Release admission or registry promotion beyond `experimental`.
- Movement or deletion of existing concrete feature packs.
- Website or interactive mental-map implementation.

## Decisions And Assumptions

- No blocker decision remains.
- Evidence-bounded assumption: the first experimental profile admits only the
  four kinds and three relationship signatures exercised by the positive
  witness. Expanding membership requires later conformance evidence.
- Reversible file-format assumption: contracts use JSON Schema Draft 2020-12 in
  `.schema.json` files; the profile registry is JSON-compatible YAML so it is
  valid YAML and can be tested without adding a dependency.
- Reversible implementation assumption: SWU-MNP-001 uses a test-local schema
  validator. Production validation belongs to later compiler SWUs.

## Write Scope

- `projects/domainspec-v2/definitions/minted-project/`
- `projects/domainspec-v2/impl/spec/minted-project/`
- `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/`
- `projects/domainspec-v2/impl/tools/tests/minted-project-contract.test.ts`
- this Task Session evidence folder and required S09 synchronization after
  evidence passes

## Done Criteria

- Every declared record has a machine schema and stable version identifier.
- Layout A and source-owned first-class edge IDs are expressible.
- Generated/read-model authority cannot be confused with source authority.
- Each required negative fixture fails with its named class.
- Human contract documentation is mechanically checked against schema metadata.
- Tool tests and TypeScript typecheck pass.

## Validation Surface

- `npm --prefix projects/domainspec-v2/impl run tools:test`
- `npm --prefix projects/domainspec-v2/impl run typecheck`
- fixture/schema/profile inventory assertions
- scoped write-boundary and no-consumer-semantics scans
- `git diff --check`

## Provenance

- Kind registry SHA-256: `a3c37a65ed1bffa5cf2dc4e6b11ccffd4463a24e341a234abf60c916f6ab0f04`
- Relationship registry SHA-256: `567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41`
- Selected design SHA-256: `9a389f9fc62dc6beb3cfcba8c9b15eb56abe5059e995665c647244c4f036717a`
- Task contract SHA-256: `5d290b9e17f4b7dcf21db5365274aa55291a15c07ee622b9c0a787d35e6153e9`

## Context Builder Result

- Mode: standard, strict.
- Files selected: 14.
- Obligation coverage: 8/8 (`100%`).
- Noise ratio: low; every selected source closes at least one obligation.
- Output Markdown: `CONTEXT-PACK.md`.
- Output index: `CONTEXT-PACK.index.json`.
- Runtime handoff: none; execution is local.
- Fallback search: named convention gaps only, now resolved.
- Blockers: none.

