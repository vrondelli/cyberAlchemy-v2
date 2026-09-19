---
module: language-type-enforcement-parser-experiment
status: planned
updatedAt: 2026-07-17
docType: work-pack-shared-context
---

# Shared Execution Context

## Source Spine

1. [Accepted findings](../../../research/2026-07-16-language-type-enforcement-proof/findings.md)
2. [Bounded context](../../CONTEXT.md)
3. [Approved architecture](../../ARCHITECTURE.md)
4. [Glossary check](../../GLOSSARY-CONSISTENCY.md)
5. [Implementation layering](../../IMPLEMENTATION-LAYERING.md)

## Current Implementation Anchors

- `projects/domainspec-v2/impl/tools/validate-content.ts`: registry lookup and
  current silent-skip branches near the main target loop; `parseTableForSection`
  owns the existing local table parser.
- `projects/domainspec-v2/impl/tools/tests/validate-content.test.ts`: black-box
  CLI fixture harness.
- `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/index.ts`:
  `parseNormalizedSpec` and current registry branch.
- `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/normalized-spec.test.ts`:
  current normalized positive and fail-closed tests.
- `projects/domainspec-v2/impl/test-derivation-engine/package.json` and both
  implementation `tsconfig` files: package/export and build boundary.

Task Session must resolve fresh line numbers when it builds the execution
context pack. Symbol/section selectors are stable; copied line offsets are not.

## Non-Negotiable Boundaries

- No `projects/domainspec-v2/development/first-production-release/` mutation.
- No definitions, profile/schema admission, relationship authority, Lean,
  translation, or public Arcanum mutation.
- Preserve unrelated dirty work.
- Invoke artifacts are planning authority only; Task Session owns execution.
