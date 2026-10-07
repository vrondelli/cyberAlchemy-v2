# Current selected Auth validation (candidate)

Run one read-only local verification command from the repository root:

```sh
python3 auth-foundation/implementation/scripts/test-validate-current-auth.py
python3 auth-foundation/implementation/scripts/validate-current-auth.py
```

The aggregate runs the current three-target AlchLang replay, trusted-input/D65
validation, versioned v6 selected-path technical binding (preserving stale v5), and the feature-aware legacy
adapter successor. It independently tests the public API, admission service,
READY authority and decision, and three bridges with locked offline Cargo.
It runs explicit doctests for library crates, including compile-fail API
fences, plus the ten syntax-inventory controls and normal-build MIR census.
The inventory checks all nine functions in the selected generated policy
source and rejects opaque re-export, macro, or external-module syntax there;
Boolean helper endpoint roles remain unresolved.
It also runs the 14-local-package standalone-default MIR effect inventory,
checking that its generated-policy ingress remains unique and its unresolved
effect count and `indeterminate` claim ceiling remain explicit. The package
samples are not a root-context whole-program call graph.
An additional v7 check builds each public root in an isolated temporary Cargo
target with MIR emission enabled, joining local MIR to Cargo's package, target,
feature, source, compiler, and lock identities. It verifies the per-root
generated-policy ingress and retains every unresolved effect class. These
instrumented builds are still not a resolved whole-program call graph or an
observed runtime guarantee.
For each root, the v7 check also joins the source-derived known Auth decision
entrypoints to the resolved local Cargo package set. A newly selected raw
SQLite, runtime-adapter, or legacy decision package fails the check; the only
known downstream decision *packages* retained in these roots are the READY
decision and generated policy. This is a Cargo package-boundary exclusion, not
proof that every native entrypoint has been discovered, that cross-package
source inclusion cannot occur, or that every callback and destructor is
harmless. A subsequent compiler dep-info binding rejects out-of-package
dependencies other than three exact SQL migration data files, including a
Rust `include!` source with a non-`.rs` extension. This still does not classify
every possible macro use or prove the SQL files cannot be used as code without
an additional source-use check. The three approved files are required to be
regular, non-symlinked files and their byte hashes must remain stable across
the before/after capture checks; this does not exclude a transient change that
is reverted between those checks.
Historical runtime evidence and the nine frozen v3 preimages are checked for
mutation during the run.

The older `implementation/scripts/validate.py` is a historical v1-chain
validator. It currently stops at `runtime-adapter-binding-current` and also
expects retired raw-provider and boundary wiring; this command does not call
it or reissue its historical bindings. The aggregate's `status: pass` means
only that its stated candidate checks ran successfully. MIR remains
`indeterminate`, and `runtime_guarantees_observed` remains false. The full
aggregate now includes two separate MIR compiles and may take several minutes.
The v7 root-context build is a third compiler pass.

## Open Questions

- Close the remaining native endpoint, transitive effect, and all-path READY
  proof obligations before upgrading any guarantee.
- Derive and execute the required TDE/F5/EVF cases for the accepted Auth
  meaning, with a separately fresh observed-runtime receipt.
