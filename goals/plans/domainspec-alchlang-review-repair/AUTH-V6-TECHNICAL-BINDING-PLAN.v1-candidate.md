# Auth current technical binding v6 — candidate plan

Status: bounded plan for current-source freshness; not formal, runtime, or
deployment proof. Preserve the v5 binding and all historical preimages.

## Current evidence and context pack

The current Auth aggregate stops at `selected_technical_v5`. Replaying the v5
validator with `--print-expected` differs from its stored binding in exactly
one leaf: `authorization-api/src/http_api_tests.rs` changed from SHA-256
`519b28ba66eb66a48f9afaedae6f99324cdd34518227a93c34f014f79f9b3627`
to `4c16730e7b1e205c7d16a3666969ed20fe3584f489b91b207720542590b67666`.
The file and v5 binding are untracked, so Git cannot authenticate the prior
test source. A read-only in-memory deletion of lines 2, 49–67, and 353–398
from the current source reproduces the bound old hash exactly. This
reconstructs the byte delta: a test-only `GatedEngine` and timeout-lifetime
witness, not a recovered historical Git blob. The API all-target suite passes
11/11; five repeats of the new witness pass. `cargo fmt --check` fails only
on that added test's import order and assertion formatting.

Selectors: v5 `binding.json` and `validate-current-evidence-successor-v5.py`
`expected_binding`; `authorization-api/src/http_api_tests.rs` `GatedEngine`
and `timed_out_response_precedes_blocking_worker_completion`; current
aggregate `STAGES`, `checked_json`, and focused controls. These sources cover
the exact delta, validation surface, and write scope. No runtime handoff pack
is needed; execution stays local.

## Plan → implementation analysis → review → implementation DAG

1. **A — Plan review gate.** Independently review this plan and its exact
   source/evidence scope before any mutation. Resolve P1/P2 findings first.
2. **B — Format-only repair.** Apply the exact two rustfmt changes in the
   added test. Rerun API `fmt --check` and all-target tests. Do not alter
   production Auth behavior or any other test.
3. **C — Implement versioned successor.** Keep the v5 binding and validator
   byte-for-byte. Create a small v6 receipt that pins v5's byte hash, the
   single changed source path and prior/current hashes, and a digest of the
   fully recomputed v5 expected binding after B. Digest the full expected
   object as sorted-key compact UTF-8 JSON. Bind the v6 verifier, focused
   hostile tests, and README as separate noncircular source hashes in the
   receipt. The v6 verifier must require
   the recomputed binding to equal v5 after replacing only that one leaf.
   Require identical key sets and whole-object equality. This rejects a
   second changed file, changed closure/result, or modified predecessor,
   instead of treating a fresh hash as sufficient evidence. Add v6 validator,
   concise binding, README, and hostile tests for predecessor drift, a second
   changed leaf, changed source hash, and runtime-guarantee escalation.
4. **D — Postimage review gate.** Independently review the exact formatted
   delta, v6 verifier comparison, frozen-v5 preservation, and claim limit
   before aggregate selection. Reject silent v5 rebinding or a waiver of the
   current aggregate.
5. **E — Select current aggregate.** Switch only the current
   aggregate's technical stage from v5 to v6 and update its focused tests
   and explanatory README.
6. **F — Validate and synchronize.** Run v5 stale behavior, v6 focused and
   current validator, API checks, aggregate focused checks, and full current
   Auth aggregate. Compare v5 binding and frozen historical preimage hashes
   before/after. Record exact pass/fail and independent postimage review.

Edges: A → B → C → D → E → F. The
current product frontier is a source-current technical binding. Local toolchain
and scratch space are operational support. Semantic admission, complete
native-endpoint/effect closure, all-path READY dominance, TDE/F5/EVF,
publication, and deployment remain separate open work.

## Write ceiling and done criteria

Only the added HTTP test's rustfmt lines, this plan, new v6 package and
validator/tests, current aggregate validator/tests/README, and one additive
repair-status checkpoint may change. v5, v3/v4, production Auth, accepted
meaning, runtime evidence, live services, and release state stay untouched.
Done requires an exact singleton source delta from v5, a passing current v6
verifier and full aggregate, preserved predecessor bytes, and an independent
review. All guarantee flags stay false; the timeout test shows a response can
precede worker completion but does not prove production SQLite no-call.

## Open Questions

- What subsequent instrumented run and all-path proof can close the actual
  runtime guarantee rather than only technical source freshness?

## Implementation and validation checkpoint — 2026-10-06

Independent plan review closed the sequencing P2 before mutation. The exact
rustfmt-only repair to the added `http_api_tests.rs` witness passed API
`cargo fmt --check` and `cargo test --locked --offline --all-targets` (11/11).
The formatted source SHA-256 is
`5454e2386de2797dab4bd8d0fc767c8db054ddb4f2e117b32e63e4c2c777adb3`.
Recomputed v5 expected evidence still differs from its stored binding in
only that leaf. The v5 binding remains SHA-256
`4cc0afcbd3754a6ded7384191b73085c9b576595e4a2174050abcd671cbcaf0e`;
its validator continues to fail source-stale as intended.

The new v6 verifier compares the *entire* recomputed v5 object to the frozen
v5 object after replacing exactly the selected test-source hash. Its concise
receipt pins the v5 bytes, prior/current test hashes, sorted-key compact-JSON
digest of the complete recomputed object, and SHA-256 of the v6 verifier,
hostile tests, and README. The v6 focused suite passed 3/3; the v6 validator
returned `status: pass` and `runtime_guarantees_observed: false`.
Postimage review found and closed a P2 missing v6 self-input binding before
aggregate selection. A sequential rereview found no remaining P1/P2 in the
bounded v6 code. One concurrent compiler-probe attempt transiently failed;
the sequential v6 suite passed and no concurrent heavy compiler checks were
used for the final aggregate.

The current Auth aggregate was then switched from v5 to v6. Its focused
controls passed 6/6. The full command
`python3 auth-foundation/implementation/scripts/validate-current-auth.py`
exited 0 with `status: pass`: all four current source/evidence stages passed,
seven selected Rust crates passed format/strict check/Clippy/all-target tests,
the syntax inventory passed 10/10, and the named/standalone/root-context MIR
inventories ran. Their claim status remains `indeterminate`: 1,244 standalone
effect terminators and 695/731/731/860 root-context effect terminators remain
unresolved; `endpoint_set_closed`, `all_path_ready_dominance`, and
`runtime_guarantees_observed` remain false. The aggregate also checked
historical protected bytes for mutation during the run. Final independent
review of the aggregate switch found a P2: the aggregate accepted an absent
or null v6 runtime-guarantee field. Its checker now requires literal `false`,
and hostile tests reject missing/null values. Focused controls passed 6/6;
the independent rereview found the P2 closed and no remaining P1/P2 in this
bounded switch. The full aggregate was rerun *after* this final guard edit;
it again exited 0 with the same candidate `status: pass`, MIR-indeterminate
counts, and all three guarantee flags false. No production Auth, v5 binding,
or historical preimage was changed.
