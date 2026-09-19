---
artifact_kind: interrogation-refine-review
mode: refine-review
status: pass-with-design-repairs-required
authority_effect: none
---

# Definition Critique And Dispositions

## Interrogation result

No new operator question is required at this stage. The confirmed target and
local evidence make the safe defaults non-optional proof constraints rather
than product preferences. All nine reviewer blockers are accepted; none is
waived or downgraded.

| Finding | Disposition | Definition/Design effect |
| --- | --- | --- |
| RTB-01 | accept | `CanonicalEnumDefinition/v1` and separate `TypeScriptTargetBinding/v1` become mandatory source contracts. Caller-supplied expected values are forbidden. |
| RTB-02 | accept | `ArchitectureObligationCatalogue/v1` must be separately owned and full-payload frozen. Same-key drift is a required negative. |
| RTB-03 | accept | Emitter, compiler, adapter, evaluator, and replay are separate import/process surfaces; forbidden-import checks enter the witness plan. |
| RTB-04 | accept | `CompileResult/v1`, compile-time type witness, and runtime import/freeze witness are mandatory before observation can pass. |
| RTB-05 | accept | The first `OrderStatus` proof is explicitly direct-only. Composition remains a later breadth unit, not silently claimed. |
| RTB-06 | accept | Exact-one facts, member-ID/value bijection, uniqueness-before-set semantics, and explicit order-loss policy are mandatory. Profile-local predicates need owners. |
| RTB-07 | accept | `GenerationReceipt/v1` binds definition, catalogue, IR, target binding, profile, provider, emitter/config, output path, bytes, and digest. |
| RTB-08 | accept | The first primary mutant removes one generated member from an immutable green child; compile remains green and evaluation fails only for missing-member preservation. |
| RTB-09 | accept | `ArchitectureReplayResult/v1` is produced by a separate isolated replay entry point over raw allowlisted handles. |

## Highest-discrimination question resolved by evidence

Question: should the system generate TypeScript directly from the ontology
shape, or introduce a portable realization boundary?

Evidence-backed default: retain a minimal language-neutral
`EnumRealizationIR/v1` plus a separate `TypeScriptTargetBinding/v1`. The IR is
justified by already-planned Python/Rust backends and by the need to prevent
TypeScript names, imports, and formatting from becoming portable meaning. It
must remain derived and non-authoritative.

Distill still owns the final size check: if the proposed IR carries fields with
no current semantic or proof consumer, they must be removed.

## Readiness verdict

- Definition critique: pass; every finding has a disposition.
- Design readiness: flag until s05 selects the smallest coherent boundary and
  s06 expresses all nine repairs as explicit contracts and witnesses.
- External research: not required by any finding.
- Next stage: local research decision, then Distill tournament.

