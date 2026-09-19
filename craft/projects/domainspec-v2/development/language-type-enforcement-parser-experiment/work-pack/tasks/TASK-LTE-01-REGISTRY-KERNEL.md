---
module: language-type-enforcement-parser-experiment
task: TASK-LTE-01
layer: L0
status: selected
updatedAt: 2026-07-17
docType: work-pack-task
---

# TASK-LTE-01: Registry Parse Kernel

## Objective And Mapping

Implement the pure, supported Concept Registry discriminator required by
[S-001](../../WORK-PACK.md#delivery-slices). This task belongs to W0/L0 and
answers whether the frozen grammar can be classified deterministically before
either consumer is changed.

## Source Contracts

- [Architecture grammar, result, precedence, and dependency contract](../../ARCHITECTURE.md)
- [Shared context and current symbols](../shared/context.md)
- `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/index.ts`:
  existing Markdown primitives and `parseNormalizedSpec` behavior.
- `projects/domainspec-v2/impl/test-derivation-engine/package.json`: current
  package entrypoint and scripts.
- `projects/domainspec-v2/impl/test-derivation-engine/tsconfig.json`: current
  `rootDir: src` build boundary.

## Dependencies And Blockers

- Dependencies: approved design only; no implementation SWU.
- Blocker: any concurrent change in this task's write scope.
- Explicit non-dependency: FPR-02 profile/schema decisions.

## Implementation Detail

### Inputs And Outputs

- Input: immutable Markdown `lines` and a `sourceLabel` used only in diagnostics.
- Output: `RegistryParseResult` exactly as constrained by the architecture:
  parsed declarations and accounting, or one frozen primary diagnostic and zero
  declarations.
- Package surface: `@domainspec/test-derivation-engine/concept-registry`. Keep
  `"main": "src/index.ts"` and add exactly this source export map:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./concept-registry": "./src/grammar/concept-registry-parser.ts"
  }
}
```

### Ordered Algorithm

```text
scan level-two headings
  -> select exact case-sensitive "Concept Registry" sections
  -> 0: MISSING_SECTION; >1: AMBIGUOUS_STRUCTURE
scan selected section for header-like pipe-block candidates
  -> 0: MISSING_TABLE; >1: AMBIGUOUS_STRUCTURE
split exact header cells
  -> not exactly [Concept, Type]: NONCANONICAL_HEADER
inspect optional next line as separator
  -> absent/malformed/not exactly two cells: NONCANONICAL_SEPARATOR
collect contiguous authored pipe rows after separator
  -> none: EMPTY
for every row
  -> arity != 2 or blank trimmed cell: INCOMPLETE_ROW
  -> otherwise declaration with 1-based line number
return parsed result with authored = parsed + rejected
```

Section/table cardinality precedes header, separator, row-set, and row checks.
The function stops at the first failed discriminator. Trailing prose is ignored;
a later candidate block in the same section is ambiguous. Markdown parsing must
not import filesystem/process/schema/profile/graph state.

### Edge Cases

- duplicate registry headings and two table blocks share one code but have
  separate tests;
- missing separator and malformed separator both use the separator code;
- differently cased, reordered, or extra headers fail header classification;
- missing, blank, or extra data cells fail row classification;
- multi-fault input demonstrates precedence without adding diagnostics;
- `Fixture` is accepted as opaque `metaType` text.

### Failure Modes

- a direct relative import from the root tool bypasses the supported subpath;
- package export works under `tsx` but engine build fails;
- the parser silently normalizes non-canonical headings/headers;
- rejected rows disappear from accounting;
- implementation reuses graph or schema utilities and violates purity.

## Smallest Working Units

<a id="swu-lte-001"></a>

### SWU-LTE-001 — Pure kernel and package subpath

- Goal: add the classifier, focused tests, and supported export as one atomic,
  buildable unit.
- Dependencies: none.
- Write scope:
  - `projects/domainspec-v2/impl/test-derivation-engine/package.json`;
  - new `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/concept-registry-parser.ts`;
  - new `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/concept-registry-parser.test.ts`.
- Done criteria:
  - canonical input yields exact declarations/lines and accounting;
  - all eight consumer-bound branches bind to the frozen code, subject, and
    required detail in the Work Pack diagnostic matrix;
  - multi-fault precedence and accounting invariants pass;
  - source leaf has no banned dependencies;
  - package subpath resolves in both implementation type contexts, imports from
    the root consumer runtime context, and builds.
- Acceptance evidence: focused test output, typecheck/build output, files touched,
  and explicit note that consumer source was not changed.
- Validation, from `projects/domainspec-v2/impl`:
  - `npm -w @domainspec/test-derivation-engine run test -- src/grammar/concept-registry-parser.test.ts`;
  - `npm run typecheck`;
  - `npm -w @domainspec/test-derivation-engine run typecheck`;
  - `npm -w @domainspec/test-derivation-engine run build`;
  - `node --import tsx --input-type=module -e "await import('@domainspec/test-derivation-engine')"`;
  - `node --import tsx --input-type=module -e "await import('@domainspec/test-derivation-engine/concept-registry')"`.
- Execution owner: `subagent` preferred; `local-fallback` allowed through Task
  Session if no subagent is available.
- Handoff note: Context Builder must include this task, the architecture grammar
  and candidate result contract, current package/tsconfig, and the existing
  parser primitives. Do not include FPR/private authority prose beyond the
  already selected boundary evidence.
- Expected return: the complete
  [shared SWU receipt schema](../shared/execution-receipt-schema.md), with
  `swu_id: SWU-LTE-001`, the concrete Task Session receipt path, export smoke
  evidence, residue, reroute, and what SWU-LTE-002 may rely on.

## Synchronization And Completion

No other worker may edit the three write-scope files during this SWU. On pass,
the coordinator records the receipt and opens SWU-LTE-002; on flag/block, later
SWUs remain closed. Completion evidence belongs in the Task Session result, not
in this task contract.
