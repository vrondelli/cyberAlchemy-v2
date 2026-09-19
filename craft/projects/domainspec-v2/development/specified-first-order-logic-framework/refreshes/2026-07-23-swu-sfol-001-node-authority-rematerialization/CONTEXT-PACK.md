# Context Pack: SWU-SFOL-001 Node-Authority Rematerialization

Status: session evidence, strict coverage pass.

## Scope

Refresh only the missing Task Session implementation material for
`SWU-SFOL-001`. The package must derive from the current v0.2 canonical-node
authority, preserve the independent-denominator boundary, and stage exact
post-images without writing implementation targets.

## Obligation Matrix

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| O1 | Consume canonical graph/manifest/build/source-set handles only. | `SPEC.md` Node Authoring Contract and invariants 7/11; `DESIGN.md` Views 2/6 | covered |
| O2 | Build an adopter-neutral exact clause and role denominator. | denominator task objective/done criteria; shared context invariants | covered |
| O3 | Replace directory-level scope with exact Task Session writes. | work-pack SWU row; Task Session admission verifier exact-set check | covered |
| O4 | Reject empty, missing, extra, duplicate, stale, malformed, and noncanonical inputs. | denominator task acceptance boundary; existing exact-set/diagnostic contracts | covered |
| O5 | Import no generator, language, binding, runner, evaluator, proof, generated-output, or receipt module. | `SPEC.md` invariant 2; `DESIGN.md` forbidden dependencies | covered |
| O6 | Resolve `B-SFOL-001-MATERIAL` without claiming implementation completion. | live work pack/evidence; blocked mutation-admission receipt | covered |
| O7 | Bind package, receipt, producer schema, ownership, authority, publication, and source frontier exactly. | Task Session mutation-readiness verifier | covered |
| O8 | Preserve targeted tests, engine typecheck, dependency check, and plan validation. | denominator task validation surface; shared validation baseline | covered |
| O9 | Keep Invoke as material producer and Task Session as implementation executor. | Invoke Refresh contract and work-pack handoff | covered |

## Exact Output Scope

- `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator/index.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator.test.ts`

The staged implementation defines immutable clause, node, module, and
proof-context handles; deterministic exact membership and coverage keys; stable
typed diagnostics; and an independent negative corpus. No canonical
implementation target is changed by this Refresh.

## Validation Surface

- targeted Vitest denominator corpus;
- exact scoped TypeScript compilation after Task Session applies the
  post-images. This is the accepted equivalent for SWU-SFOL-001 because the
  broader engine workspace typecheck currently fails on pre-existing
  minted-project `rootDir`, extension, and strictness errors outside the two
  allowed writes;
- focused import/dependency assertion inside the targeted corpus;
- DS-SFOL plan-package validator.

## Exclusions

- DS-SFOL language, evaluator, bindings, runners, node adapter, adopters, and
  proof join;
- implementation execution or completion;
- public Arcanum mutation;
- G-SFOL-06 resolution, release, promotion, or production claims.

## Distill Decision

Distill is not rerun. This is an exact two-file rematerialization of the
already-distilled first SWU; no task boundary, plan structure, or architecture
is being recomposed.
