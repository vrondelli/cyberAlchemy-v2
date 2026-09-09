# TASK-OEWFR-01: Failure-Evidence Primitives

## Objective

Produce pure diagnostic sanitization and one contained exclusive writer before
the builder failure path depends on them.

## Source contracts

- [Architecture low-level view](../../../design/ARCHITECTURE.md#3-low-level-components-view)
- [Validation V02-V07](../../../design/VALIDATION-CONTRACTS.md)
- current builder and builder tests from [shared context](../shared/context.md)

## SWU-OEWFR-001 — deterministic diagnostic sanitizer

- Primary behavior: convert transient stdout/stderr into bounded, redacted,
  digest-bound fields without writing a file.
- Acceptance boundary: a pure input/output fixture bank passes independently
  of command execution and persistence.
- Split analysis: hashing, redaction, and truncation were considered; splitting
  them would create an unsafe intermediate that cannot satisfy the record.
- Dependencies: TASK-OEWFR-READINESS pass.
- Write scope: builder source and builder test only.
- Algorithm:
  1. accept UTF-8 stream bytes and fixed ceilings;
  2. compute original SHA-256 and byte length;
  3. apply versioned deterministic redaction for synthetic secret/path/env
     patterns;
  4. if over limit, retain fixed head/tail segments plus truncation metadata;
  5. secret-scan sanitized retained bytes; reject leakage;
  6. return no environment and no absolute temporary path.
- Edge cases: empty streams, invalid UTF-8 replacement, exact-limit,
  limit+1, marker spanning head/tail, repeated markers.
- Done: pure function and positive/negative fixtures pass; existing behavior is
  unchanged because no caller is integrated.
- Validation: targeted `node --test .../thin-prototype-build.test.mjs` name
  pattern for sanitizer plus `git diff --check` on two targets.
- Owner: task-session or local-fallback.
- Return: standard SWU result with exact files, command, fixture counts, and no
  authority claim.

## SWU-OEWFR-002 — contained exclusive evidence writer

- Primary behavior: persist exactly one validated record at an admitted path.
- Acceptance boundary: path/collision/write/re-read failures are independently
  reviewable without the real typed command.
- Split analysis: containment, exclusive create, and re-read were considered;
  a reference is not valid unless the whole transaction closes.
- Dependencies: 001 pass.
- Write scope: builder source and builder test only.
- Algorithm:
  1. normalize relative destination and resolve inside allowed run root;
  2. reject absolute, traversal, normalized escape, symlink escape, collision;
  3. schema-check record and artifact ceiling;
  4. create exclusively, flush/close, re-read, parse, digest, and secret-scan;
  5. return normalized path/digest/schema/producer/gate/issue;
  6. remove a partial file if safely identified, then block on any failure.
- Edge cases: parent missing, collision, symlink parent, writer throw, partial
  bytes, digest mismatch, secret scanner failure.
- Done: writer fixtures pass and never invoke a command.
- Validation: targeted builder tests for writer plus scoped diff check.
- Owner: task-session or local-fallback.

## Synchronization

Close each SWU separately through its predeclared receipt and Invoke Refresh.
No task-wide closeout may combine 001 and 002.

