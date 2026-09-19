---
module: language-type-enforcement-parser-experiment
task: TASK-LTE-02
layer: L0
status: blocked-by-swu-lte-001
updatedAt: 2026-07-17
docType: work-pack-task
---

# TASK-LTE-02: Content-Validator Adapter

## Objective And Mapping

Make the content validator consume the shared result, reject malformed
registries rather than silently skip them, and preserve its positive carrier,
exit convention, schema behavior, and counts. This implements S-002 in W1/L0.

## Source Contracts

- [Architecture workflow and behavior-delta matrix](../../ARCHITECTURE.md)
- [Cross-task decisions](../shared/cross-task-decisions.md)
- `projects/domainspec-v2/impl/tools/validate-content.ts`: main target loop,
  `Violation`, output loop, and `parseTableForSection`.
- `projects/domainspec-v2/impl/tools/tests/validate-content.test.ts`: spawned CLI
  fixture harness.
- SWU-LTE-001 receipt and exported `RegistryParseResult` surface.

## Dependencies And Blockers

- Dependency: SWU-LTE-001 pass.
- Blocker: package/result drift from the approved architecture or concurrent
  modification in this task's write scope.

## Implementation Detail

### Data Flow

```text
read target lines
  -> parseConceptRegistry(lines, relative source label)
  -> rejected: map primary diagnostic to one content Violation whose reason
               begins [LTE-*], skip all later work for this file
  -> parsed: run the existing relationship validator unchanged as a downstream
             projection, then run the content schema loop over shared declarations
```

The adapter mapping must be total over every frozen code. The reason preserves
the existing useful subject/detail after the additive code prefix. Strict/warn
exit behavior remains the current content-validator behavior. The adapter may
not turn unknown meta-types into L0 failures; current schema lookup/skip behavior
continues after a structurally parsed result.

The relationship validator currently rereads the file and owns an independent
relationship-authority registry projection. L0 does not refactor it: the shared
gate runs first so malformed registries never reach that projection, while the
content schema loop must stop using its local registry-table parse and iterate
the shared declarations instead.

### Exact Content Carrier Projection

For a rejected result, append exactly one `Violation` with:

```ts
{
  file: toRelative(file),
  concept: diagnostic.subject,
  type: "Structure",
  reason: `[${diagnostic.code}] ${diagnostic.detail}`,
  line: diagnostic.line ?? 1,
}
```

`diagnostic.subject` is exactly `Concept Registry`. Then `continue` the per-file
loop before relationship or schema work. This fixes the null-line fallback and
maps code, subject, and detail without changing the existing output loop.

### Edge Cases And Failure Modes

- a malformed registry must stop relationship/schema work for that file so an
  unrelated violation cannot satisfy the negative;
- `Fixture` remains a positive opaque meta-type;
- multiple target files may include a mix of accepted/rejected results without
  process exit inside the kernel;
- content counts for the three current packs must remain equal;
- leaving the old silent-skip branch or independently mapping header columns
  would preserve parser drift and fails the task.

## Smallest Working Units

### SWU-LTE-002 — Content adapter and black-box cases

- Goal: wire one total adapter and cover all structural branches through the
  real CLI.
- Dependencies: SWU-LTE-001.
- Write scope:
  - `projects/domainspec-v2/impl/tools/validate-content.ts`;
  - `projects/domainspec-v2/impl/tools/tests/validate-content.test.ts`.
- Done criteria:
  - old registry parsing no longer decides the Concept Registry path;
  - every rejected result yields exactly one code-bearing content violation and
    stops later work for that file;
  - canonical/three-pack positive behavior and counts remain unchanged;
  - current schema-admission behavior remains unchanged;
  - eight content-surface mutation assertions pass.
- Acceptance evidence: black-box status/stdout assertions, before/after positive
  count snapshot, and total mapping review.
- Validation, from `projects/domainspec-v2/impl`:
  - `node --import tsx --test tools/tests/validate-content.test.ts`;
  - `npm run validate:content`;
  - `npm run typecheck`.
- Execution owner: `subagent` preferred; `local-fallback` allowed.
- Handoff note: include the architecture behavior matrix, kernel types/export,
  current target loop/output carrier, focused tests, and SWU-LTE-001 receipt.
  Exclude engine integration changes; they belong to SWU-LTE-003.
- Expected return: the complete
  [shared SWU receipt schema](../shared/execution-receipt-schema.md), with exact
  positive counts and all emitted code/subject/detail triples in `validation`.

## Synchronization And Completion

Run only after the kernel/export is stable. Do not edit the engine grammar in
this task. A pass opens SWU-LTE-003; any code mapping or positive-count drift
keeps W1 blocked.
