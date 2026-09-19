# Portable EVF audit kit

User intent: give the CRABS maintainer a runnable EVF kit for independently
authored audits. Do not inspect, change, or run more CRABS experiments here.

## Scope and work lanes

Product-construction frontier: the frozen EVF v3 reference product remains
unchanged. This operational packaging candidate exports its generic Rust runner
and independent verifier, adds a host-local profile-binding CLI, and provides
an unrelated finite C example. It does not extend the original proof or inherit
the original product approval.

Runnable operational support, owned by this packaging task: create the exact
allowlisted source export, portable wrapper, vendor directory, archive and
checksums; test an extracted copy outside the repository, including failed and
tampered evidence. A Linux host with working user/network namespaces is the
exact prerequisite for live package smoke tests. Missing namespace support must
remain a reported blocker, never trigger an isolation bypass.

Deferred support, owned by the repository/distribution owner: approve the new
package and decide redistribution/license terms and actual recipient delivery.
No publication, message, credential use, release, or installation is performed.

## Package contract and navigation scaffold

- Audit specification: owner-authored properties, exact source/binding files,
  positive output and cause-specific negative output. Input to `evf freeze`.
- Frozen profile: machine-local exact references, full S0-S12 denominator, two
  positive executions per check, no operational authority. Input to the existing runner.
- Evidence: append-only result of that profile, retaining non-pass outcomes.
- Verification: separate read-only recomputation, not proof that the provider's
  scientific or program-level oracle is adequate.
- CLI prototype: `doctor`, `init`, `build-example`, `freeze`, `run`, `verify`.
  Numeric exit status must not mistake valid failed evidence for a passing audit.
- Distribution: Linux x86-64 binaries, Rust source, locked vendored dependencies,
  source provenance, plain-language instructions and checksums.

## Exact mutation scope

Only this directory. Authored inputs: `assemble.py`, `validate_archive.py`, `.gitignore`, this plan, and the files
under `template/` listed by that builder. Generated output: a new `kit/` tree,
`artifacts/` archives/checksums, and a package test report. Exported source files
are explicitly enumerated in `assemble.py`; each is checked against the frozen
v3 candidate before copying. No source scan is used as an export allowlist.

The portable export removes only the unused repository auto-discovery helper
and the private reference-profile generator/bin declaration. Run and verifier
semantics are otherwise unchanged. The exact transformations are recorded.

## Completion evidence

1. Frozen source hashes match before export; approved inputs remain unchanged.
2. Rust tests pass using locked dependencies; offline build succeeds.
3. Extracted kit runs with no DomainSpec checkout, original working directory,
   original Cargo cache, Codex, or Task Session contract.
4. Positive finite C example passes; a surviving mutant and incorrect positive
   expectation fail; tampering and source drift are rejected; repeat results
   agree; old evidence is not overwritten.
5. Archive has no credentials, private fixture/decision/proof corpus, original
   absolute paths, host-bound profiles, symlinks, or build-directory leftovers.
6. User receives local artifact links, invocation commands, and explicit limits.

## Packaging result — 2026-09-05

Operational packaging is complete as a tested local candidate. The 9,251,967-byte
archive and checksum file are under `artifacts/`. Its SHA-256 is
`e13b7436bdca93ff9028bce90453f6f61f5994aef1f72bcef80db3600cfeeb5e`.
`VALIDATION.json` binds the extracted-package test results to that exact archive.

All 8 Rust contract tests passed. All 14 CLI integration tests passed in the
assembly directory, with the shipped binaries extracted outside this repository,
and again after rebuilding the extracted sources. That rebuild used an initially
empty Cargo cache inside a network-disabled Linux namespace. The test host was
Linux x86-64 under WSL2 with glibc 2.39; a different host OS was not tested.

The archive has 2,438 regular files, exactly matching its manifest plus the
manifest itself. Build directories and private source locators were excluded.
All 79 references in the original frozen v3 candidate were rehashed after
assembly and still matched. Its approved source bytes remain unchanged.

No CRABS audit was run, no owner repository was changed, and nothing was committed,
sent, or published. Solver-specific adapters, other platforms, license decisions,
distribution approval, and recipient delivery remain separate work. They do not
prevent the supplied executable-check example from running on the tested platform.
