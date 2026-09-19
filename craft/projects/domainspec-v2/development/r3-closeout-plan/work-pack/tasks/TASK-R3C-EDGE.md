# TASK-R3C-EDGE: Dynamic DS-D8 Code-Tag Enforcement

Layer: L0.
Slice: S-R3C-001.
Wave: [W0](../waves/W0.md).
Status: completed 2026-07-12.

## Objective

Refactor code-tag composability so it consumes root DS-D8 relationship authority instead of the hard-coded
pre-R3 rule list.

## Source Contracts

- `projects/domainspec-v2/impl/governance/tags/tools/check-code-tag-composability.ts`
- `projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/impl/governance/tags/tools/tests/code-tag-composability.test.ts`

## Dependencies

R3A complete. No other execution dependency for the first SWU.

## Implementation Detail

Inputs:

- code-tag extraction JSON,
- root relationship authority,
- tagged concepts and their declared types.

Outputs:

- composability report with `checks`, `passedChecks`, `issues`, `blockingIssues`,
- issue classes that distinguish noncanonical/deprecated/deferred/generation mistakes from call-graph misses.

Algorithm sketch:

1. Load the relationship authority with the same root-path rule used by relationship validators.
2. Build active signature rules from DS-D8 active signatures.
3. Normalize `source_type`/`target_type` to code-tag type names.
4. For each tagged edge, classify the label:
   - generated view: issue, not canonical authored edge;
   - deprecated alias: issue with replacement guidance;
   - deferred candidate: issue or skip-with-report depending mode, never active pass;
   - active signature: validate source/target types and composability direction.
5. Preserve existing call-direction checks for edges with known code-call semantics.
6. Report unsupported active signatures as explicit coverage gaps, not silent pass.

Edge cases:

- overloaded signatures such as `applies` and `queries`;
- generated `owned-by`;
- deprecated `enforces-cross`;
- deferred `depends-on`;
- active DS-D8 signatures with no code-call analogue.

## Smallest Working Units

### SWU-R3C-001

- Goal: load and classify DS-D8 signatures dynamically.
- Dependencies: none.
- Write scope: `check-code-tag-composability.ts`; optional imports from `impl/tools/lib/relationship-signatures.ts`.
- Done criteria: static pre-R3 rule table is removed or generated from DS-D8; output names authority path and signature count.
- Acceptance evidence: focused JSON report over existing examples.
- Validation: `npm --prefix projects/domainspec-v2/impl run tags:test`.
- Execution owner: local-fallback.
- Handoff note: do not change root relationship authority; consume it.

### SWU-R3C-002

- Goal: add discriminating tests/fixtures.
- Dependencies: SWU-R3C-001.
- Write scope: `governance/tags/tools/tests/`, `governance/tags/examples/composability/`.
- Done criteria: tests cover active pass, generated noncanonical, deprecated alias, deferred candidate, and wrong endpoint.
- Acceptance evidence: tests fail before implementation and pass after.
- Validation: `npm --prefix projects/domainspec-v2/impl run tags:test`.
- Execution owner: local-fallback.
- Handoff note: reuse DS-D8 examples/non-examples where possible.

### SWU-R3C-003

- Goal: document and optionally aggregate dynamic composability validation.
- Dependencies: SWU-R3C-001, SWU-R3C-002.
- Write scope: docs/package scripts only if needed.
- Done criteria: docs identify root DS-D8 as authority; aggregate wiring does not break validation.
- Acceptance evidence: full validation suite stays green.
- Validation: `npm --prefix projects/domainspec-v2/impl run validate`; `engine:test`; `typecheck`.
- Execution owner: local-fallback.
- Handoff note: if aggregate wiring is too broad, flag it rather than forcing it.

## Synchronization

After any SWU passes, update [WORK-PACK.md](../../WORK-PACK.md) status and preserve any coverage gaps.

All three SWUs passed. The checker consumes root authority dynamically, the
required authority states and endpoint cases are covered, and documentation is
synchronized. Aggregate `validate` wiring remains deferred until a stable
code-tag extraction input exists; second-corpus breadth moves to
`SWU-R3C-004`.
