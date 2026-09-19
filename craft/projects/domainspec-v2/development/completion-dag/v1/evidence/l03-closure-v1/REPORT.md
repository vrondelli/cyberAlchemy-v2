# Selected migration closure

**L02 repair and L03 selected migration closure pass.** The new explicit EVF
migration profile produces the unchanged native obligation payload from a
reproducible current source epoch. The historical stale binding and BLOCK receipt
remain unchanged.

L02 has 31 passing tests; L03 adds four passing retained-consumer checks. Both
TypeScript checks pass. All 178 L03-selected source/evidence hashes remain unchanged.
The financial-settlement bridge preserves all 79 native obligations and the full
BTE projector/emitter outputs. This includes one expected structural mapping
failure and 67 behavioral coverage gaps; those are preserved, not fixed or waived.

The closure accounts for all 33 ledger rows, two notes and six consumer families:
- 2 adapt rows.
- 8 retain rows.
- 6 retain-exclusion rows.
- 4 defer rows.
- 13 retain-evidence rows.

Only the two adapted rows introduce implementation changes. Retained rows prove
selected byte preservation and consumer availability, with focused BTE comparisons;
they do not revalidate every historical behavior. Architecture staging remains
evidence only; exclusions and unresolved destinations remain explicitly outside
implementation scope. Navigation corrections are in NAVIGATION.md. SFOL runtime
execution and operational rollback are not claimed. No retraction/removal occurred.

The next product step is **L04 independent review**, followed by a human decision
on the exact tested migration candidate. Product approval has not been granted.
UI, caller cutover, retirement and publication remain deferred.

Reproduce from `projects/domainspec-v2/impl`:

```sh
node --import ./node_modules/tsx/dist/loader.mjs --test ../development/completion-dag/v1/evidence/l03-closure-v1/closure.test.ts
node node_modules/typescript/bin/tsc -p ../development/completion-dag/v1/evidence/l03-closure-v1/tsconfig.json
```

See closure.json for every row and consumer, checks.json for observed results,
source-manifest.json for the exact dependencies, and receipt.json for the candidate
binding. This is selected migration closure, not Stable release or full DomainSpec
v2 completion. The original full-program denominator, including deferred UI,
remains unchanged.
