# Context Pack — SWU-SFOL-002

## Selected unit

- SWU: `SWU-SFOL-002`
- Parent: `TASK-SFOL-LANGUAGE`
- Objective: define the closed, versioned DS-SFOL v1 AST and result/failure
  contracts without decoding source data or evaluating target behavior.

## Source anchors

- `SPEC.md#language-boundary`
- `SPEC.md#node-authoring-contract`
- `DESIGN.md#typed-intermediate-representations`
- `work-pack/tasks/TASK-SFOL-LANGUAGE.md#swu-sfol-002`
- `work-pack/shared/cross-task-decisions.md`
- passing `SWU-SFOL-001` closeout receipt

## Bound write scope

- `src/sfol/language/ast.ts`
- `src/sfol/language/contracts.ts`
- `src/sfol/language/profiles.ts`
- `src/sfol/language/contracts.test.ts`
- this Task Session evidence directory

## Exclusions

- no decoder, typechecker, evaluator, runner, binding, adopter, BTE, canonical
  node-profile, public Arcanum, Craft, or production-authority mutation;
- no Markdown/prose parsing and no target implementation import;
- no change to the digest-bound SWU-SFOL-001 denominator postimage.

## Acceptance obligations

1. The v1 AST covers every bounded term, declaration, clause, sort, value,
   source-span, and source-identity shape selected by the approved design.
2. The profile registry admits exactly `domainspec-sfol/v1`.
3. Runtime unknown term tags and language versions fail with typed diagnostics.
4. Canonical JSON serialization is byte-stable across object-key order and
   rejects non-JSON or cyclic values.
5. The focused surface compiles under strict TypeScript with
   `noUncheckedIndexedAccess`, contains no `any`, and passes focused plus full
   engine tests.
