# Shared toolchain repair and successor validation

Date: 2026-09-08. Authorization: user `yes` to repairing the shared toolchain.
Scope: restore prerequisites and rerun the blocked PCR L0 validation.
Authority effect: none; no compiler change, admission, release or publication.
Execution route: `CA2-ROUTE-IMPLEMENT`, native bounded task-session.
Result: **PASS — prerequisites restored; complete source typecheck and all 68
selected generation/project-model tests pass.** L0 candidate validation clears;
the remaining PCR plan is not completed.

## Repair performed

System installation was unavailable: `sudo -n true` required interactive
authentication. No sudo configuration, system package database or shell profile
was changed. Ubuntu packages were downloaded using apt, checked against their
package-metadata SHA-256 values and extracted into the user-local runtime:

`/home/vrondelli/.local/share/domainspec-toolchain/jq-1.8.1-4ubuntu2`.

| Package | Version | Archive SHA-256 |
| --- | --- | --- |
| jq | 1.8.1-4ubuntu2 | `bb7f69de12414f6e52eea1da952ed7226b8e3fd9db74f93bb8ea3f2f39f4836f` |
| libjq1 | 1.8.1-4ubuntu2 | `3ced45ef4154cce59ce9fc74cc606b7361fa1b2f088b31a903d54fbcee75cb43` |
| libonig5 | 6.9.10-1build1 | `050ad79c8c02956d896407ff66fddcb24e114b307cde196a0226697cf643ef88` |

The executable wrapper `/home/vrondelli/.local/bin/jq` selects these libraries
only for its process. Its SHA-256 is
`b098ba51f176464ab063b668ae7aa7554f7538ef2c46c66510d28289d9291f51`.
Both `jq --version` and the actual manifest selector succeed (`jq-1.8.1`,
`.typescript` = `7.0.2`). The first extraction failed because the parent runtime
directory did not exist; creating the exact directory and repeating extraction
resolved it. This did not alter package contents.

From the umbrella root, the unchanged shared launcher restored dependencies:

```sh
toolchains/node-typescript/bin/node-env install --project projects/domainspec-v2/impl/cli
toolchains/node-typescript/bin/node-env validate
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl/cli -- npm run typecheck
```

Frozen installation completed: pnpm 10.34.5 reported 10 discovered workspace
projects and 374 packages. No dependency resolution update was performed.
The dependency authority remains the parent lockfile; the restored volume is
`domainspec-node-modules---4007580862b0335b`. Shared npm/pnpm cache volumes are
retained. The only reported dependency build hook was the allowed esbuild hook.
The launcher remains unchanged; no temporary compiler was installed.

## Validation and operational limits

- Shared toolchain validator: PASS, Node 26.8.1, npm 11.19.0, pnpm 10.34.5,
  TypeScript 7.0.2; bundled Python/YAML/JSON Schema checks pass.
- Direct complete CLI source typecheck: PASS (`tsc -p tsconfig.json --noEmit
  --pretty false`), without suppressing Node types or changing configuration.
- Normal `npm run typecheck`: PASS, including catalog (39 rows), relationship
  authority (31 signatures), integration profile (five definitions, three
  languages), and the complete source typecheck.
- Final disk-backed generation suite: **68/68 PASS**, zero failures, skips,
  cancellations or TODOs, in 89.069 seconds. Includes all six PCR tests and
  the previously blocked all-target-generation test. Native Rust lanes ran.

Native generation tests need host Docker and Rust in addition to the locked
Node dependencies. For this run, the dependency volume's `root` and DomainSpec
`impl` member were exported without re-resolution into a temporary mirror with
their original relative pnpm layout. Two previously absent checkout paths
(`node_modules` and `projects/domainspec-v2/impl/node_modules`) were temporarily
symlinked to that mirror. No existing dependencies were overwritten.

The first test launch used the DomainSpec root, where the package-scoped `tsx`
import does not resolve; all 13 test files failed to load. The corrected launch
used `impl/cli`. Its unconstrained run passed 64/68 tests, with no skips, but
encountered RAM-backed `/tmp` exhaustion (99% full), `ENOSPC`, a linker bus error
and a failed native compiler process; kernel output also showed memory pressure.
These failures are retained as environmental evidence, not semantic test passes.

Only this run's 273 MB dependency mirror and logs were moved from `/tmp` to
`/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq`. No unrelated temporary
files were removed. The same test set was rerun with a disk-backed temporary
directory, one test-file worker and two Cargo build jobs. No test filters,
skips, timeout increases, assertion changes or source fixes were introduced:

```sh
# Working directory: projects/domainspec-v2/impl/cli
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
CARGO_BUILD_JOBS=2 \
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run \
  node --import tsx --test --test-concurrency=1 --test-reporter=tap \
  test/generation/*.test.ts test/input/project-model.test.ts
```

Host native versions: Node 26.8.1, Python 3.14.4, Rust/Cargo 1.98.1. The Rust
launcher preserves nested pins. Generated PCR TypeScript and AST observation
use the existing image
`sha256:ad84ad003986966fc38cf50953363ce81eb44d108734b882bee8b912c9b652ef`.
Source tests still use the repository's transitional locked tsx loader; emitted
target code is natively compiled/executed. This is not a test-runner migration.

## Preservation and handoff

Rehashed against entry preimages: parent lockfile, workspace/package manifests,
toolchain launcher/manifest, dirty CLI package file, all four PCR implementation
and test files, parent PLAN/WORK-ITEMS, historical DSR-007 report, existing
generator and dirty project-build file are unchanged. PCR source identities
remain those recorded in [STATUS.md](STATUS.md#source-identities-and-preservation).
Repository writes in this repair are confined to this report and its status
companion. Both temporary symlinks were removed after checking their exact
targets; neither checkout dependency path remains. The shared volume, exported
mirror and logs are retained, so no dependency data was deleted.

Local raw evidence is retained under
`/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq`:

| Log | SHA-256 | Result |
| --- | --- | --- |
| `generation-tests.tap` | `852409285aadd7dc96f3b6143d84968654eb86b1572b61a79dcd0c2b1790c2bc` | Wrong launch directory; 13 file-load failures. |
| `generation-tests-package-cwd.tap` | `3f68b594b52965f0a4481b6642ad39346e9a2b9263d22249cc34bb5b8a2452fd` | 64/68; temporary-storage/resource failures. |
| `generation-tests-disk-serial.tap` | `21bad3c8df9a55f46b307b88bf84d5eedcd710f565579baa9204a038dba85060` | 68/68 PASS, no skips. |
| `typecheck.log` | `78118180a3c4e3bb20ca5109b5aab50ce753c7518a9beac961fd7cecccf299dd` | Normal launcher typecheck PASS again after temporary checkout links were removed. |

The repaired dependency volume is the normal launcher environment; the exported
host mirror is only local validation evidence, not another dependency authority.
The launcher does not automatically supply host Docker/Rust to container tests.
For native host reruns, the exact dependency mirror/temporary links and the
disk-backed low-concurrency invocation above remain necessary in this setup.
Default parallel execution on the full RAM-backed `/tmp` is not qualified.

## Open questions and claim boundary

Later profile/compiler decisions remain owned by
[PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions). This repair does not
close PCR-05..14, reconcile historical observer references, switch CLI defaults,
or claim full-product testing. The selected suite is every current generation
test file plus project-model, not all `test:parallel` or proof/package suites.
