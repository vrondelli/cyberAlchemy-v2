# SWU-OEW-005 Attempt 002 Context Pack

Status: strict coverage pass
Mode: Context Builder standard
Artifact class: private session evidence

## Objective

Fetch the exact pinned Understand-Anything commit, verify its repository,
license and selected source bytes, build the unmodified viewer from its
lockfile, and retain deterministic source/viewer archives plus a receipt
written last.

## Obligations

| ID | Obligation | Status |
| --- | --- | --- |
| U1 | use only `Egonex-AI/Understand-Anything@2cda14e…630f` | covered |
| U2 | verify MIT license and all inspected file digests | covered |
| U3 | reject floating/wrong repository, commit, license, and file pins | covered |
| U4 | install/build from the upstream lockfile and record toolchain/tests | covered |
| U5 | emit deterministic source and viewer archives before build receipt | covered |
| U6 | provide `npm run verify:upstream` within the nine-target inventory | covered |
| U7 | remove temporary clone/install/build residue | covered |
| U8 | preserve protected scopes and authority effect `none` | covered |
| U9 | preserve the original SWU-005 block and emit attempt-002 receipt | covered |

## Controlling Sources

- current SWU-005 manifest/task contract;
- `design/UPSTREAM-BASELINE.md`;
- `define/interfaces.md`;
- option-A Refresh receipt;
- passing SWU-OEW-004 predecessor receipt;
- upstream `package.json`, lockfile, license, viewer/dashboard/core sources at
  the exact commit, inspected only in the temporary build root.

## Write Scope

Exactly nine current SWU-OEW-005 targets. Clone, dependencies, intermediate
build output, logs, and extracted verification directories are temporary and
must not survive the Task Session.

## Validation

`npm run verify:upstream` from the OEW implementation root, plus staged/live
parity, archive-content verification, protected-set equality, and residue
absence.

Strict coverage: **PASS**. Blockers: **0**.
