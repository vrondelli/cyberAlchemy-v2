# O01 completion — portable declared tool identities

Date: 2026-09-20. Status: scoped complete. Authority effect: none.

## Completion statement

O01 is complete for the host/container tool-resolution boundary. The AlchLang
command wrapper resolves `tsc` and `tsx` only through exact bin targets in the
package's `package-lock.json`; it no longer borrows another checkout or searches
ambient `PATH`. Cargo and rustc resolve through the repository toolchain launcher
or an explicit read-only sysroot executable whose observed version must equal
the repository Rust lock.

The same five-test resolver suite passes on the host and in the current local
Node toolchain image. The container run uses `--pull never`, `--network none`, a
read-only root filesystem, read-only repository and Rust mounts, and no symlink
or path-repair step.

## Validation

- Host resolver suite: 5/5 pass, zero skips.
- Container resolver suite: 5/5 pass, zero skips.
- O01 qualification validator: 2/2 pass, zero skips.
- Combined O01/P01 operational selection: 9/9 pass, zero skips.
- AlchLang strict typecheck: pass.
- AlchLang build: pass.
- Existing P01 exact package-boundary check: pass.
- Container image: `domainspec-node-toolchain:26.8.1-ts7.0.2`, observed local
  ID `sha256:8468442d3752a48db2f94e2d4a3b693d3f40d19a6b7a97b693a8cc1b45d91b03`.
- Qualification: `evidence/o01-portable-toolchain/qualification.json`, SHA-256
  `ce2accf197d0e56a90d9d585ff07eeaba97595fdef3ee12336ab58bdf4819bf3`.

## Claim ceiling

This closes O01 tool identity and host/container parity only. It does not prove
clean installed-consumer flows, freeze release bytes, publish, release, deploy,
operate production, approve a product or grant authority. P02 owns the three
clean installed-consumer paths.

Progress is 32 of 37 scoped nodes. P01 and O01 are both complete, so P02 is now
dependency-ready. Product-owner validation remains deferred until L4X.

## Open Questions

P02 must preserve these exact tool identities while installing and exercising
all three consumer paths, and must dispose of every task-owned temporary output.
