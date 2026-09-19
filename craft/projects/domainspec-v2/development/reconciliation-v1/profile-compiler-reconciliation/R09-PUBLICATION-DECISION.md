# R09 publication runtime decision

2026-09-13. Product-construction decision resolved by the user. Selected option: normal CLI publication with explicit handling of optional Node permission mode. This is internal planning/evidence, not user-facing product documentation. Authority effect none.

## Owner resolution

User response: "yes maintain current behavior of the cli and optional handling for the edge case". In the context of the preceding explanation and recommendation, implementation preserves normal CLI commands, artifacts, receipts and exit behavior; uses the bundled atomic no-replace component for output writing; and handles optional Node permission mode explicitly before creating output. Restricted-mode imports, planning and file-currentness inspection remain non-writing. No automatic permission grants, privileged process, ordinary-rename fallback, compiler installation or mandatory new user flag is introduced.

This is an implementation decision, not release/product acceptance. The historical conflict and restoration below are preserved. Adoption resumes with distinct normal-mode and restricted-mode tests; the existing relocation, no-checkout-access and receipt assertions must remain covered. No owner decision remains open for this boundary.

## Question

May writing generated output require a native-capable process, with Node permission-restricted processes retaining non-writing planning/inspection but rejecting publication, or must the existing scoped-filesystem-only Node execution mode continue to publish?

## Why this changes the product

The three existing atomic writers use ordinary rename, which can replace a competing empty directory. R09 requires atomic directory visibility and no replacement, not per-file publication or a last existence check. The candidate implements kernel no-replace through a bundled Node-API adapter; it does not require users to install a compiler.

Existing tests provide direct evidence of a different runtime contract: `impl/cli/test/generation/reconciled-build.test.ts:258` and `reconciled-instantiation.test.ts:251` start relocated public APIs using only `--permission --allow-fs-read=<fixture> --allow-fs-write=<fixture>`. They grant neither native addons nor child processes. The integrated candidate fails both before output mutation;19 other selected tests pass. Planning, receipt equality and generated source behavior are not the failing obligations.

[Node documents](https://nodejs.org/api/permissions.html#permission-model) that native addons are restricted by default under this mode; allowing them requires a separate grant. It also distinguishes these trusted-code safety controls from a malicious-code security sandbox. The current candidate intentionally rejects permission-model processes, including ones with addons allowed, because its native filesystem syscalls and descriptor paths cannot be represented as the unchanged scoped `fs` contract. Adding `--allow-addons` alone is not a qualified fix.

## Options

1. **Native-capable publication process — recommended for the CLI.** Ordinary CLI invocation keeps atomic, no-overwrite output and uses the bundled adapter; permission-restricted in-process users get an explicit publication-unavailable error. Preserve non-writing operations and qualify filesystem-bound execution with OS-level isolation where needed. Benefit: builds on the tested candidate without changing generated domain behavior. Cost: the existing restricted publication use case changes, requiring explicit compatibility documentation and replacement evidence for its intended boundaries. No blanket filesystem grant, silent fallback or deleted tests.
2. **Keep scoped-filesystem-only publication as a hard requirement.** Do not adopt this adapter in public writers. Continue designing a compatible publication boundary; a separate trusted writer/broker would itself need an explicit runtime/interface decision. Benefit: retains the existing embedding constraint. Cost: no qualified implementation currently satisfies it together with atomic no-replace publication using the current Node `fs` surface. No completion estimate or compatibility solution is asserted.

Neither option permits reverting to partial directory visibility, silently overwriting another writer, bypassing Node permissions or relabeling failed tests as passing.

## Historical restoration before the owner decision

The integration was disconnected after discovery, preserving the candidate and original failed evidence. Current production writer SHA256 values match the unchanged R09 preparation snapshot:

- `reconciled-output.ts`: `6e4b5993fa3b45bb33b63db2a6b750f2f7a44194406f8608fa7432724023568d`.
- `publish-instantiation.ts`: `bf4985856f3caa5ce85a3842ee7a34c6b3061db5b33be8ef04897230f2df25e8`.
- `project-build.ts`: `b18fdde210cb3b197cf843123f7b71b7ee0492ef2a0c2a4f7865475140b5ce62`.

This restores existing behavior, including the known race; it does not fix R09. No package scripts, public exports, test grants, release settings or defaults were changed. The new source files are internal unadopted candidate material; their presence under `src` is not package/release approval.

Both exact permission-restricted public cases pass again after restoration (session37825 exit0,2/2; `evidence/r09-atomic-primitive/writer-restored-exact.tap`, SHA256 `38bdf5cd566eb23073b69f73f51d15b8593b226d97db878263e9795b388956c2`). Full CLI strict typecheck also passes. No claim of fixing the original publication race follows from this restoration.

## Historical task-session / decision-gate result

Task R09; integration awaiting one owner decision. Context: public atomic-output contract, preparation race probes, three writer implementations, candidate native/packaging/helper tests and the two exact permission-restricted public tests. Local execution, no delegation or handoff. ARE requests179–181 preserve owner-directed construction bounds. No new authority or publication effect selected.

Runnable construction up to this decision has completed the candidate primitive, reproducible payload, lazy loading and shared-helper tests. Adoption and its dependent safety matrix wait for the choice. Operational support: parent owns evidence synchronization only; no installation/publication/release action is pending as a prerequisite. R13/R14 preparation remains retained, not full milestone completion. Full goal remains active; this is the first observed occurrence of this blocker, not a goal-blocked status transition.

## Resumed implementation

The owner resolution above supersedes that pause. ARE request182 selects bounded IMPLEMENT. Three public atomic writers now call the tested shared helper. Restricted-mode publication returns the existing error/exit22 structure with an explicit unavailable code; no flag is automatically added. Relocated normal publication is tested in a container with no source-checkout mount. Separate Node permission-mode processes retain scoped reads, validate planning/currentness, reject publication, and preserve output absence. Both original domain/receipt checks remain covered. Native source/payload currentness is part of build/typecheck; focused tests are registered in the normal test script. No package publication, installation, commit or release was performed.
