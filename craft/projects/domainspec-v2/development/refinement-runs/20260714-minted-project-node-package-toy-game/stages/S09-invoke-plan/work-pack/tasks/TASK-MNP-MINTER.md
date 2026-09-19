# TASK-MNP-MINTER — Clean Consumer Project Emission

Layer: L1  
Status: `SWU-MNP-005` completed; retry 001 receipt pass

## Purpose and Decision Owned

Emit the machine-node package shape into a new consumer project without copying concrete DomainSpec fixture semantics, private authority prose, or paths back into the DomainSpec development repository.

## SWU-MNP-005

- Goal: implement and prove a clean project-mint operation with contained generated outputs.
- Dependencies: SWU-MNP-001, SWU-MNP-004, owner-approved template/package paths.
- Write scope: minter modules and generic project template below `projects/domainspec-v2/impl/tools/minted-project/` (template root `templates/project/`) plus `projects/domainspec-v2/impl/tools/tests/minted-project-minter.test.ts`.
- Algorithm:
  1. validate destination is empty or explicitly accepted under non-destructive policy;
  2. create a staging directory beneath the destination parent;
  3. emit generic project manifest, empty/example-free feature root, schema/tool handles, and generated-root configuration;
  4. resolve `generated_root` under the new project and reject escape/absolute paths;
  5. run contract validation and an empty/minimal compile smoke test in staging;
  6. scan emitted bytes for DomainSpec fixture IDs, local checkout paths, and private authority prose;
  7. atomically promote staging to destination or remove staging on failure;
  8. return a mint receipt with template/tool/schema digests and created paths.
- Edge cases: non-empty destination, partial failure, path traversal, interrupted write, incompatible language version, unavailable package, accidental Key-and-Door/financial-settlement content, generated root outside project.
- Done criteria: clean mint passes, second identical mint is deterministic under defined identity inputs, failure leaves no partial authority, and the consumer can replace all domain content without editing DomainSpec.
- Acceptance evidence: disposable minted-project tree, leakage scan, path-control negatives, rollback proof, compile/view receipt.
- Verification: `npm --prefix projects/domainspec-v2/impl run tools:test`, `npm --prefix projects/domainspec-v2/impl run typecheck`, and the test-owned disposable-directory integration check.
- Execution owner: local fallback with independent leakage review.
- Handoff: provide mint receipt and clean project handle to SWU-MNP-006.

## Completion Evidence

- Session: `task-sessions/20260715-swu-mnp-005-retry-001/`.
- Validation: targeted `6/6`; full tools `101/101`; TypeScript, diff, rollback,
  and test-side leakage scan pass.
- Minter digest: `712f66da90f2a60fbb4636c4bf374f4720d27dae329400a880609794624e2909`.
- Template digest: `7f4bcbe062696c328f13f194046ce9671d00f19e3f52b7bbd064f6261ca314a5`.
