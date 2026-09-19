# TASK-UIR-ABSENCE

## Objective

Implement DEC-UIR-007 as a versioned finite-search construction and append a
successor corpus generation without reinterpreting or overwriting corpus v1.

## Smallest Working Units

### SWU-UIR-011 - Bounded Search Contract

**Goal:** define the only construction path that may emit
`observed-absent`.

**Dependencies:** SWU-UIR-001 through 003 and 006 accepted receipts;
DEC-UIR-007.

**Inputs and state:**

- `contracts/canonical-json-v1.mjs` envelope and digest rules;
- corpus v1 schema/module/tests as compatibility boundary;
- a declared finite source universe, pinned source/extractor digests,
  enumerated selectors, per-selector outcomes, and aggregate match count.

**Algorithm:**

1. Validate that the source universe is finite, non-empty, and fully
   enumerated.
2. Validate source revision/file digests and extractor ID/version/digest.
3. Validate one unique result for every declared selector.
4. Reject any parse error, extraction error, stale/moved selector, duplicate
   selector, unvisited source, or unexpected result.
5. Sum matches only after steps 1-4 pass.
6. Emit `observed-absent` only when completeness is true and match count is
   zero; emit `observed` when complete with matches; otherwise construct
   `not-observed` or fail validation according to the typed failure.
7. Build a versioned envelope whose semantic digest includes the full universe,
   extractor, selectors, outcomes, and result state.

**Edge cases and failure modes:** empty universe, duplicate selector, source
digest drift, extractor digest drift, partial traversal, parse/extract error,
one match, zero matches, and reordered declaration input.

**Write scope:**

- `contracts/bounded-search-receipt.schema.yml`
- `contracts/corpus-receipt-v2.schema.yml`
- `evidence/bounded-search-receipt.mjs`
- `fixtures/contracts/bounded-search-*`
- `tests/bounded-search-receipt.test.mjs`

**Done criteria:** construction is total over declared typed inputs; no
incomplete/error path yields absence; v1 behavior and tests remain unchanged.

**Acceptance evidence:** focused test output, schema fixtures, golden digest
vectors, and `runs/SWU-UIR-011/receipt.json`.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/bounded-search-receipt.test.mjs
node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/corpus-receipt.test.mjs
```

**Execution owner:** local-fallback through Task Session.

**Context Builder anchors:** this task, `IMPLEMENTATION-PLAN.md`,
`IMPLEMENTATION-LAYERING.md`, refresh report sections "Proposed Architecture
Delta" and "SWU-UIR-011", DEC-UIR-007, GAP-UIR-004, corpus v1 contract/module,
and canonical kernel.

**Expected result:** shared SWU result shape from `EXECUTION-PACK.md`; next route
SWU-UIR-012 only on pass.

### SWU-UIR-012 - Corpus Generation 002

**Goal:** publish an immutable corpus-v2 successor that consumes bounded-search
receipts and preserves honest observation states.

**Dependencies:** SWU-UIR-011 accepted receipt.

**Inputs and state:** corpus generation 001 handle/content digest, bounded-search
contract, pinned corpus manifest, and current source revisions.

**Algorithm:**

1. Load generation 001 and verify its record/content/generation handles.
2. Build corpus-v2 facts from pinned selectors and bounded-search receipts.
3. Require one bounded-search handle for every `observed-absent` fact.
4. Preserve `not-observed` for any source lacking complete finite-search proof.
5. Derive content and successor generation IDs from semantic inputs plus the
   generation-001 predecessor.
6. Publish only to `generation-002`; identical replay is a no-op and
   non-identical existing output is an error.

**Edge cases and failure modes:** missing predecessor, invalid bounded-search
handle, changed source revision, partial manifest, false absence, repeat run,
and attempted generation-001 write.

**Write scope:**

- `evidence/corpus-receipt-v2.mjs`
- `evidence/build-corpus-v2-generation.mjs`
- `fixtures/contracts/corpus-v2-*`
- `evidence/results/corpus/generation-002/`
- `tests/corpus-receipt-v2.test.mjs`

**Done criteria:** generation 002 is append-only and replayable; every absence
claim has complete proof; generation 001 bytes are unchanged.

**Acceptance evidence:** generation-002 handles and summary, replay/overwrite
test output, generation-001 before/after digests, and SWU receipt.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/corpus-receipt-v2.test.mjs
sha256sum projects/domainspec-v2/development/ui-meta-type-repair/evidence/results/corpus/generation-001/receipts.json
```

**Execution owner:** subagent eligible or local-fallback.

**Context Builder anchors:** this task, accepted SWU-011 receipt, corpus
generation 001, DEC-UIR-007, and refresh report section "SWU-UIR-012".

**Expected result:** shared SWU result shape; route to SWU-UIR-015 only after
013 and 014 also pass.
