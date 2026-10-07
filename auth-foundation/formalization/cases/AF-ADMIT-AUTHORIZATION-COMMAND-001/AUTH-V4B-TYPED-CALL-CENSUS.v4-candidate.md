# V4b normal-build typed-call census v4 (candidate)

This versioned successor adds compiler-emitted MIR evidence without rewriting
the v3 concrete-pool successor. It compiles the normal (non-test) library or
binary for the public API, service, READY authority, READY decision, and three
selected bridge roots. It counts sensitive calls across every function emitted
for those seven crates, checks the API worker's concrete service type, and
checks the admission-result-to-READY-comparison-to-continuation def-use chain
in the authority's MIR control-flow graph. The generated policy is directly
called only in the READY decision crate in this bounded census. Synthetic
compiled MIR pattern controls test early policy, callback policy, alternate
READY issuance, and legacy decision calls. A scratch copy of the selected API
is also compiled with a real direct policy dependency and a pre-gate call.
Additional scratch copies of selected roots exercise a pre-gate policy callback,
a pre-gate resolved-engine call through a new direct legacy dependency, and a
second READY-issuer invocation for a changed request ID. The checker must reject each
mutant. MIR edits test DENY-arm, comparison-constant, and def-use sensitivity.
These real-root mutants establish rejection sensitivity for the specific
injected changes, not a second successful READY outcome or completeness of the
call graph or endpoint family. Scratch-copy mutants use offline dependency
resolution but do not use the selected roots' lockfiles.

This is not an exhaustive typed call graph. Rust text MIR is a human-oriented,
toolchain-dependent format, and imported call names may be shortened; the
checker uses policy input/output types to catch known shortened calls. It does
not resolve all cross-crate calls or prove transitive callback, iterator,
Drop, SQL, async, FFI, macro, or panic effects. It does not prove the actual
request/transaction identity across every indirect edge, and it does not
observe per-endpoint runtime entries. The finite endpoint set and all-path
READY dominance remain open. `runtime_guarantees_observed` stays `false`.

From the repository root:

```sh
python3 -m unittest auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/test_auth_v4b_typed_call_census_v4.py
python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-typed-call-census-v4.py --verify
```

The saved JSON is a candidate observation for these exact sources and the
locked local toolchain, not an admitted FormalClaim, EVF/TDE result,
publication, deployment, or runtime guarantee. The frozen node-13 record and
historical V4b versions remain unchanged.

## Open Questions

- How will full cross-crate typed def-use and implicit effects be closed for
  every selected public entry path, including future direct dependencies?
- How will the selected-root mutant set cover future direct dependencies and
  dynamic call forms without treating these finite examples as full proof?
- How will request/epoch-correlated traces count entry to every reachable
  native decision endpoint for gate DENY and READY policy outcomes?
