# New CLI source validation

The newer CLI changes pass the executed local checks after correcting one Python test-environment dependency. This is successor validation evidence, not product acceptance or release authorization.

## Product construction

Added the omitted `test/generation/guarded-bindings.test.ts` to `scripts.test:parallel` in the CLI package. This is the only source edit made during this validation, measured against `package-before.json`. Existing feature changes were preserved. The post-edit source snapshot contains 199 files; final verification found no changed, added or missing source files. Generated `dist` output was rebuilt for testing.

| Check | Observed result |
| --- | --- |
| Typecheck and build | PASS |
| System integration consistency | PASS |
| Serial proof suite | PASS: 21 tests |
| Expanded parallel suite | 201 PASS, 1 environment failure; resolved by focused retest |
| Affected L1 project file, isolated pinned Python environment | PASS: all 3 tests |
| Package contract suite | PASS: 25 tests |
| Generated Rust validation | PASS |
| Clean package validation and isolated replay | PASS |
| Recipe qualification harness checks | PASS: 7 tests |

The regression asserting that exact realization is opt-in and preserves default arithmetic passed. Guarded bindings, declarative functions, portable functions and composition tests were included. These checks support the tested compatibility paths; they are not proof of compatibility for every external consumer.

The original parallel run failed because system Python could not import `referencing`. Installing the repository's hash-pinned CI requirements into an isolated temporary environment resolved it; the entire affected test file passed without source changes. The original failure remains in `phases.json` and its log. An earlier Windows npm/UNC launch failure is retained under `windows-npm-attempt/`; the substantive run used Linux Node 26.8.1. No single all-green full-suite rerun is claimed.

## Operational support and next frontier

Local environment repair is complete. The next product-construction frontier is an exact frozen successor candidate, its current qualification evidence, independent review and product acceptance. This run executed `recipe-qualification:check`, not the full `recipe-qualification:l1` campaign. It did not create a frozen release bundle or conduct a comprehensive security audit.

Release-owner operational residue: hosted checks for the exact eventual source candidate, private distribution/provenance configuration and package metadata/terms. These remain separate from runnable candidate construction. The earlier release-readiness assessment records their previous state; this validation did not refresh external GitHub/npm state.

Existing accepted candidates remain unchanged. No approval, commit, push, publication or deployment was performed. UI stays outside v1.0.0; BTE comparison remains deferred.

See `checks.json`, `source-manifest.json`, individual phase logs and `retest.json` for the bounded evidence.
