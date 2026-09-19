# R09-PREP result

Preparation complete; **R09 remains incomplete and depends on completed R08**.
Candidate product construction only, authority effect: none. No product approval,
admission, publication or successor execution is claimed.

The evidence-linked [MATRIX.md](MATRIX.md) covers the requested safety categories
and the remaining coherent-project exit obligations. **19 checks passed and two
checks failed** during source-only Node/tsx execution. The failures reproduce
replacement of a competing empty output directory by the reconciled publisher
and the legacy node publisher. They remain failing assertions in the reusable
probe file and are preserved in the first-run log.

## Exact changes and source identities

All new files are under
`/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/reconciliation-v1/profile-compiler-reconciliation/parallel/r09-safety/`:

- `MATRIX.md`, `RESULT.md`: coverage, evidence boundaries and parent handoff.
- `probes.test.ts`: P01 portable public module-root rejection; P02 interrupted
  staging; P03 empty-directory race in two writers; P04 nonempty-target conflict.
- `publication-hooks.test.ts`: P05 exclusive legacy project claim and P06 foreign
  artifact/sentinel preservation after receipt-time interruption, using the
  existing `publishProjectInstantiationForTest` seam.
- `run.mjs`: bounded source-test runner, source identity capture and recheck.
  It does not build packages or create a safety framework.
- `source-inputs.json`: exact SHA-256 identities for 307 selected/transitive
  input files, capture timestamp, Git HEAD, selected dirty status and Node version.
- `routing-receipt.json`: caller-bound ARE route receipt and effect assessment.
- `results/commands.json`: exact first-run commands, working directories, exit
  codes and phase durations.
- `results/reused-publication.tap`, `results/reused-surface.tap`,
  `results/reused-plan.tap`, `results/reused-layout.tap`,
  `results/focused-probes.tap`, `results/publication-hooks.tap`,
  `results/reused-currentness.tap`: retained original outputs.
- `results/source-recheck.json`: final 307-file hash comparison, zero drift.
- `results/continuation.json`: completion-boundary ARE decision.

The authoritative source checkout was used directly, with no worktree, copy or
initialization. Existing source files were already dirty/untracked, including
`impl/cli/src/generation/publish-project.ts` and `reconciled-output.ts`; their
actual working bytes, not Git HEAD alone, bind this evidence. No shared source,
existing helper/test, canonical contract, plan or progress file was edited.
No commit, push, Docker, Cargo or full native/public suite was run.

The input snapshot was taken before executable checks and rechecked after them.
It includes the reviewed files, statically discovered literal relative imports,
literal `bytes()` dependencies, the canonical publication fixture and the
generated reconciled source capsule. This is **not** a complete attestation of
every dynamic dependency or external installed tool byte. Missing dynamic
dependency coverage cannot be inferred from the successful selected recheck.

## Commands and actual outcomes

Working directory for the runner:
`/home/vrondelli/projects/domainspec-core/projects/domainspec-v2`.
Node executable: `/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node`.

```sh
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node development/reconciliation-v1/profile-compiler-reconciliation/parallel/r09-safety/run.mjs snapshot
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node development/reconciliation-v1/profile-compiler-reconciliation/parallel/r09-safety/run.mjs run
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node development/reconciliation-v1/profile-compiler-reconciliation/parallel/r09-safety/run.mjs check
```

Snapshot: exit 0, 307 inputs. Run: exit 1 because P03 failed for both writers.
Check: exit 0, `changed: []`. The runner refuses to overwrite its initial snapshot
or logs. It now checks source drift and existing log destinations before replay;
that guard adjustment was syntax-checked, not a rerun of the recorded campaigns.

| Job | Actual result | Evidence ceiling |
| --- | --- | --- |
| Existing publication tests | 5 pass, exit 0 | Materialization, exact receipts, traversal/overwrite/symlink and staging collision; even the three-language row only writes source |
| Existing module-surface tests | 2 pass, exit 0 | Bounded scanner grammar and duplicate exports |
| Selected resolved-plan tests | 5 pass, exit 0 | 13-type source join, request ordering, selected dependency directions, stale/forged rejection, shared-file conflict |
| Selected application-layout test | 1 pass, exit 0 | Path envelope and exact plan/module preservation |
| New P01–P04 cases | 3 pass, 2 fail, exit 1 | Actual local disk interleavings and public scalar-plan hostile roots |
| New P05–P06 cases | 2 pass, exit 0 | Existing legacy project claim seam and interrupted cleanup preservation |
| Existing mapped-currentness test | 1 pass, exit 0 | Stale receipt, extra path, links, unsupported view and repeat overwrite detection |

The supplemental P05–P06 and currentness commands used working directory
`/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/cli`:

```sh
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node --import ./node_modules/tsx/dist/loader.mjs --test --test-concurrency=1 ../../development/reconciliation-v1/profile-compiler-reconciliation/parallel/r09-safety/publication-hooks.test.ts
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node --import ./node_modules/tsx/dist/loader.mjs --test --test-name-pattern='^mapped currentness rejects' test/generation/reconciled-application-layout.test.ts
```

Their stdout/stderr are in `results/publication-hooks.tap` and
`results/reused-currentness.tap`. Node emitted the retained loader deprecation
warning. No assertion was weakened after a failure and no campaign was retried.
Early discovery also encountered a nonexistent `impl/profile-compiler` path and
no Node on the non-login shell PATH; the actual CLI path and installed exact Node
binary resolved those diagnostics without installing tools. An initial unscoped
Git status produced umbrella noise; subsequent status checks used exact paths.

## Defects and parent integration

1. **Reconciled publisher replaces a competing empty directory.**
   `impl/cli/src/generation/reconciled-output.ts:68–69` performs an absence check
   followed by `renameSync`. P03 creates a competing empty target immediately
   before the actual rename and verifies directory identity. The observed inode
   changes from `678716` to `678705`, violating the no-overwrite assertion.
   Reconciled build and node/project instantiation call through this writer;
   the probe directly exercises the writer, not every caller independently.
2. **Legacy node publisher has the same reproduced defect.**
   `impl/cli/src/generation/publish-instantiation.ts:87–88` uses the same pattern.
   P03 observes competing inode `678735` replaced by `678726`. The legacy project
   build pattern at `project-build.ts:146–147` is an additional inspected
   touchpoint, not a third executed reproduction.
3. Existing legacy project instantiation uses `mkdir` as an exclusive claim.
   P05 confirms it preserves an empty competing target. P06 confirms its failure
   cleanup does not erase a foreign replacement artifact or sentinel; it leaves
   a visible incomplete public target. Use this evidence when choosing a repair,
   but do not transplant a mechanism without checking its receipt and visibility
   contract. The parent owns all implementation and canonical-definition changes.

All newly created fixtures were owned temporary directories. Sentinel assertions
passed in each case, including the failing P03 cases, before cleanup. `fs` test
interception was restored in `finally`. No public target outside those owned
temporary trees was touched. Failure preservation means retained logs and red
assertions, not abandoned scratch trees.

Recommended parent join: review exact source hashes and scope; carry P03 into
the R09 repair surface after the current R08 work; fix the bounded no-replace
publication contract across applicable callers; rerun these probes and the
existing source assertions; then schedule the remaining native/public matrix.
Do not mark R09 complete from this preparation or update golden digests alone.

## Remaining obligations, blockers and Open Questions

- R08 completion is the exact final-qualification prerequisite. Runnable R08 work
  need not wait for this preparation. Parent owns shared source and integration.
- Final native 13-type imports/behavior, all supported public positive/hostile
  entry points, independent AST mutation controls and all-type naming remain
  unqualified here. Existing assertions and commands are mapped in MATRIX.md.
- Module-root semantic equivalence is broader than the executed layout-prefix
  and request-order preservation tests. Architecture direction is broader than
  the three selected dependency assertions; no general rule was invented.
- Unicode module roots reject under ASCII grammar. There was no Unicode alias
  normalization/case-insensitive filesystem campaign, hostile stage-identity
  replacement, ancestor-swap stress, real multiprocess race, SIGKILL, power-loss
  or fsync/durability qualification.
- No owner decision was needed to finish preparation. Parent must select the
  exact publication/visibility/durability repair if that requires changing a
  supported contract; record that decision before expanding implementation.
- Operational support is limited to parent scheduling of native work and input
  drift coordination. No unavailable operational task blocked this source lane.
  DomainSpec remains first; AlchLang/SFOL/EVF redesign is outside this work.
