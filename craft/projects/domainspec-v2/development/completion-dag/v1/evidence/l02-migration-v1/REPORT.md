# L02 migration prototype

The additive migration bridge is implemented. **21 focused regression tests pass,
and TypeScript checking passes. L02 remains BLOCK for full contract closure**
because the existing EVF S1 binding rejects its current generated graph and source
manifest before positive native obligations can be derived. See
[machine-source-drift.json](machine-source-drift.json) for exact expected/observed hashes.
No pins were reset. Positive machine parity is not evaluable; rejection parity and
four individually targeted stale-reference checks pass.

Checked Markdown derivation preserves aspect and normalized native outputs,
including needs-formal obligations. Mixed inputs select one dialect and identify
ignored sources. Missing/malformed selected inputs reject without success output.
Changed validation handles spaces, renames, deletion, containment, Git failures and
validator crashes. Selected diagnostics match the existing normal scan. Other-file
errors remain separately visible. No-work and deletion-only results do not claim
validation PASS.

All 86 selected source hashes remained unchanged, including 63 inherited L01 inputs.
Tests create and remove temporary source fixtures and a temporary Git repository;
no project callers, frozen candidates, waivers or historical approvals were edited.
The rollback check preserves the previous native components and failed result; it
is not evidence of an operational cutover or rollback.

## Reproduce

From `projects/domainspec-v2/impl`:

```sh
node --import ./node_modules/tsx/dist/loader.mjs --test ../development/completion-dag/v1/evidence/l02-migration-v1/migration.test.ts
node node_modules/typescript/bin/tsc -p ../development/completion-dag/v1/evidence/l02-migration-v1/tsconfig.json
node --import ./node_modules/tsx/dist/loader.mjs ../development/completion-dag/v1/evidence/l02-migration-v1/cli.ts derive spec/features/sample normalized-spec
```

CLI commands: `derive FEATURE_DIR DIALECT`, `machine REPO_ROOT PROFILE`, and
`changed REPO_ROOT PROJECT_RELATIVE_PATH GIT_RANGE`. Output is JSON on stdout;
rejection is nonzero. Changed validation reads current working-tree bytes selected
by the commit range. It does not include untracked/uncommitted changes or validate
historical commit contents.

Product construction: reconcile the EVF source epoch to unblock positive machine
correspondence, then finish L02 and proceed to L03 all-row closure. BTE/SFOL and
other retained consumer families are unchanged; this focused suite is not an
all-consumer migration closure claim. L04 independent review/product approval has
not run. UI remains deferred. Cutover, retirement and publication are separate
operational residue owned as recorded in progress.json.
