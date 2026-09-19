# L04 independent migration review

**BLOCK — one reproducible P1 correctness finding. Product approval is not ready.**

Reviewed candidate: `DSV2-L04-MIGRATION-REVIEW-001`, manifest SHA256
`2bd0eaf14d65126e68ca5809cfb0aeeb3986e55658e2c1d0ee74f707d55bd1ea`.
This binds L02 successor `DSV2-L02-MIGRATION-PROTOTYPE-002`, L03 closure
`DSV2-L03-MIGRATION-CLOSURE-001`, and 192 exact source/evidence files.
All remained unchanged through review. Fresh parent replay passed 35 tests and
both TypeScript checks; those tests miss the case below.

## L04-F01: false success through an internal directory symlink

The independent reviewer `/root/l04_reviewer` found that `selectChanges` accepts
an ancestor directory alias when its target stays inside the feature root.
The legacy normal validator skips symlink directories. The wrapper compares
selected and diagnostic paths lexically, so a canonical-path error becomes
outside-scope and the selected alias is reported as passing.

Relevant inherited implementation: `l02-migration-v1/bridge.ts:104` and `:127`.
It is re-exported by the reviewed v2 API.

```text
product/spec/features/actual/bad.md contains [broken](missing.md)
product/spec/features/alias -> actual
changed path: product/spec/features/alias/bad.md
observed: selected-pass, errors=[]
canonical broken-link diagnostic: outsideScopeErrors
```

This violates L01 consumer L00-C04 and L01-T09. The parent independently
reproduced the same false success; see symlink-reproduction.json. Ordinary files,
outside-root directory symlinks, and leaf file symlinks behaved as expected in
the reviewer's additional probes. All temporary fixtures were removed.

## Repair boundary

Create a successor candidate that either rejects unsupported symlink ancestor
components or joins canonical identities while proving every selected file was
scanned. Add regressions for contained directory aliases and aliases whose
relative-link resolution differs. Rerun migration and retained-consumer tests,
refresh successor closure, and independently review the new exact candidate.
Do not edit this reviewed candidate or turn its earlier PASS receipts into a new
approval epoch. Those receipts remain evidence for their original test scope.

Construction frontier: L04 blocked by L04-F01; approval not evaluable until the
finding is resolved. Operational residue remains separate: migration owner owns
future caller cutover/removal, publication owner owns publication; neither affects
the current repair stage. UI remains deferred. No acceptance or authority granted.
