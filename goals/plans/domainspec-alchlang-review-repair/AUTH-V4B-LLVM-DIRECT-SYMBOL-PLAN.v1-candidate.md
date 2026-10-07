# Auth V4b LLVM direct-symbol candidate census — candidate plan

Status: independently reviewed draft; three initial overclaims corrected below.
This is a bounded R2 evidence
improvement, not a downstream-endpoint role decision or an all-path proof.

## Frontier and context

The owner-selected no-call family covers every native authorization-policy
entrypoint reachable from the selected public Auth request. The current v12
compiled-effect frontier inventories MIR call/effect terminators across four
root-context builds, but even a unique textual target remains an unverified
name candidate. Its endpoint set, READY dominance, and runtime guarantee flags
correctly remain false. The v7 build already binds each local MIR artifact to
the Cargo package, target, features, compiler dep-info, source, and root lock.

This task adds exact *direct LLVM symbol* candidate evidence without deciding
whether a binary-decision-returning ingress wrapper is itself downstream.
The controlling selectors are `auth-v4b-root-context-census-v7.py` artifact
capture and `auth-v4b-compiled-effect-frontier-v12.py` effect frontier; the
owner scope is `AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md`.

## Plan → implementation analysis → review → implementation DAG

1. **A — Feasibility and capture.** First probe the installed rustc/Cargo
   output: multiple codegen units can emit multiple `.ll` files for one crate.
   Extend v7 with an opt-in LLVM sidecar only after selecting a checkable
   mapping. The bounded first candidate may pin `-Ccodegen-units=1`, but must
   still observe and require exactly one `.ll` for each expected local
   package/target and no extra local `.ll` outputs. Emit MIR, LLVM IR, and
   link output in the *same* isolated Cargo invocation; bind the `.ll` SHA-256
   and compiler dep-info to its Cargo artifact identity. This separately
   instrumented build must not borrow v12's MIR identity or claim equivalent
   code generation. Missing, duplicate, escaped, or mismatched outputs fail
   closed. Default v7/v12 behavior and source pins remain unchanged.
2. **B — Exact-symbol candidate relation.** In a versioned v13 candidate,
   parse LLVM function definitions/declarations and direct `call`/`invoke`
   callee symbols by their exact mangled bytes, partitioned **per root
   build**. An exact symbol with one matching local definition is a
   `same-symbol-local-definition-candidate`, not a resolved runtime target:
   linker selection, weak/linkonce merging, aliases, `available_externally`
   definitions, and preemption can invalidate that inference. A stronger
   direct-target label is permitted only for a separately checked
   non-interposable private/internal-linkage subset with caller and definition
   in the same LLVM module, or after object/final-link
   resolution; otherwise leave target identity open. Record declaration-only,
   external, duplicate, alias, indirect, and unparsed forms as unresolved.
   Never equate a same-short-name match with compiler target identity, or
   claim an LLVM edge is the same as a v12 MIR site without a checked join.
3. **C — Review gate.** Independently inspect capture identity, parser
   coverage, call/invoke syntax, symbol quoting, duplicate/linkage behavior,
   opt-in isolation, and whether any unparsed effect could be silently
   omitted. If a reliable exact-symbol subset cannot be checked, keep v13
   indeterminate and report the limitation; do not promote textual candidates.
4. **D — Hostile controls.** Compile a small Rust fixture with two distinct
   `authorize` definitions with the same displayed short name; a direct call
   must select only the exact mangled-symbol candidate actually named. A reified
   function-pointer call must stay unresolved. Unit controls cover quoted
   symbols, `invoke`, external declaration-only targets, duplicate symbols,
   alias/indirect forms, non-interposable versus weak/available-externally
   linkage, and malformed syntax. Re-run v12 and v13 focused
   suites plus the four-root v13 capture when feasible.
5. **E — Evidence.** Record exact validation and an independent postimage
   review. Preserve `status: indeterminate`, `endpoint_set_closed: false`,
   `all_path_ready_dominance: false`, and
   `runtime_guarantees_observed: false`. Update the repair status only for
   the observed exact-symbol candidate subset; do not rewrite historical v1–v12
   artifacts or production Auth code.

Edges: A → B → C → D → E, with a review of the preimplementation plan before
A. The current product frontier is compiler-backed target evidence; runnable
work is the opt-in capture, parser, and controls. Operational support is the
pinned local Rust toolchain and scratch build space. The causal blocker for
full R2 is unresolved whole-program effects, endpoint-role classification,
same-invocation READY dominance, and correlated runtime evidence. F5/EVF and
release remain deferred separate work.

## Write ceiling and done criteria

Only v7's opt-in capture interface, new v13 analyzer/tests, this plan, and a
bounded repair-status checkpoint may change. No public Auth implementation,
accepted meaning, owner decision, old compiled evidence, deployment, or
external service is in scope. Done requires a current four-root run with exact
artifact bindings; positive exact-symbol-candidate and hostile same-name controls;
indirect/external/unknown forms remaining open; unchanged v12 behavior; and
an independent review of the final bounded claim.

## Implementation checkpoint — 2026-10-06

The opt-in v7 path now emits MIR, LLVM IR, and link output from one isolated
root-context Cargo invocation with `-Ccodegen-units=1`. It checks one paired
`.mir`/`.ll` artifact per selected local package, binds each LLVM SHA-256 to
the Cargo identity and already-checked MIR SHA-256, and rejects extra
same-crate `.ll` files anywhere in that root's target directory. Default v7
and v12 build flags and the two-value `bind_artifacts` interface are unchanged.
Installed compiler observed: rustc 1.98.1 (LLVM 22.1.8). A one-root feasibility
build produced one paired sidecar per local crate. The first full v13 attempt
using default `/tmp` failed during the prototype build with OS error 28, `No
space left on device`; its JSON result was `status: fail`, not validation
success. This was a tmpfs capacity limit, not evidence of a source/parser pass.

From the checkout root, `python3 -m unittest` over the three exact case paths
`test_auth_v4b_llvm_direct_target_v13.py`,
`test_auth_v4b_root_context_census_v7.py`, and
`test_auth_v4b_compiled_effect_frontier_v12.py` passed 24/24 after hostile
same-short-name compilation, quoted symbol, invoke,
external/weak/available-externally, alias, indirect, asm/bitcast, malformed,
and extra `.0.ll`/root-level `.ll` controls. `python3 -m py_compile` passed
for v7, v13, and its test. No trailing whitespace was found.

With `set -o pipefail` and `TMPDIR=/var/tmp`, the exact v13 CLI piped through a
summary-only `jq` projection exited 0 and returned `status: indeterminate`.
Each of API, tenant, prototype, and HTTPS had 11 local paired LLVM artifacts
with 11 bound LLVM SHA-256 values. The call-like site counts were 12,952,
11,607, 9,901, and 9,901 respectively. The corresponding classification
counts were:

| Root | Same-module private/internal | Same-symbol local candidate | External/declaration unresolved | Indirect | Unparsed/callbr |
| --- | ---: | ---: | ---: | ---: | ---: |
| API | 1,842 | 4,740 | 6,351 | 19 | 0 |
| Tenant | 2,978 | 2,726 | 5,895 | 6 | 2 |
| Prototype | 2,184 | 2,714 | 4,996 | 6 | 1 |
| HTTPS | 2,184 | 2,714 | 4,996 | 6 | 1 |

The unchanged v12 CLI was also replayed with `TMPDIR=/var/tmp` and
`set -o pipefail`: exit 0, `status: indeterminate`, original
`RUSTFLAGS=--emit=mir,link`, 11 local modules per root, and 1,914 / 2,464 /
1,967 / 1,967 MIR effect sites for API / tenant / prototype / HTTPS.
Both runs kept `endpoint_set_closed: false`, `all_path_ready_dominance: false`,
and `runtime_guarantees_observed: false`. The exact-symbol relation is a
compiler-emitted candidate subset, not a linker-resolved target or MIR-site
join. Independent postimage review remains pending at this checkpoint.

### Complete LLVM-output attribution repair — 2026-10-06

Independent postimage review found that the first gate scanned only selected
`crate-*.ll` names and could miss an extra unprefixed or unknown LLVM file.
The opt-in capture now sets `CARGO_INCREMENTAL=0` and scans *all* `.ll` files
under each fresh isolated target directory. Each observed file must have
exactly one owner in that build's Cargo `compiler-artifact` rows; selected
local files must also agree with the already-bound MIR hash, package ID, and
manifest. An unhashed selected binary artifact is joined to its hashed LLVM
sidecar only through the exact paired MIR identity and unique Cargo row.
Unknown, ambiguous, symlinked, missing, and extra outputs fail closed.

The first strict-gate four-root attempt correctly failed at the tenant root:
`debug/deps/auth_tenant_bridge-4a142ee862ea38fb.ll` had zero derived row
owners because Cargo named the binary executable without the sidecar hash.
The paired-MIR/Cargo-row repair was followed by a tenant-only opt-in probe
(11 local modules, 11 LLVM modules, 11 LLVM hashes) and a fresh four-root
run. The final command was:

```bash
set -o pipefail; TMPDIR=/var/tmp python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-llvm-direct-target-v13.py | jq -c '{status, instrumentation:.root_context.instrumentation, incremental_mode:.root_context.incremental_mode, roots:(.root_context.root_context_builds | with_entries(.value = {modules:.value.local_package_count, ll_sha_count:([.value.artifacts[] | select(.llvm_sha256 != null)] | length), llvm:.value.llvm_direct_symbol_inspection.classification_counts, sites:.value.llvm_direct_symbol_inspection.call_like_site_count})), endpoint_set_closed, all_path_ready_dominance, runtime_guarantees_observed}'
```

Exit 0; `status: indeterminate`; `CARGO_INCREMENTAL=0`; 11 selected local
modules and 11 bound LLVM hashes in each root. Call-like site counts remained
12,952 / 11,607 / 9,901 / 9,901 for API / tenant / prototype / HTTPS. The
new compiler configuration changed the cross-module symbol classifications:

| Root | Same-module private/internal | Same-symbol local candidate | External/declaration unresolved | Indirect | Unparsed/callbr |
| --- | ---: | ---: | ---: | ---: | ---: |
| API | 1,842 | 4,601 | 6,490 | 19 | 0 |
| Tenant | 2,978 | 2,721 | 5,900 | 6 | 2 |
| Prototype | 2,184 | 2,707 | 5,003 | 6 | 1 |
| HTTPS | 2,184 | 2,707 | 5,003 | 6 | 1 |

The expanded focused v7/v12/v13 suite passed 25/25, including an external
sidecar, extra `.0.ll`, extra root-level hashed and unprefixed `.ll`, unknown
`.ll`, ambiguous Cargo-row ownership, and unhashed-binary controls. This
supersedes the earlier candidate counts for current v13 evidence; it does not
turn exact symbol candidates into linker-resolved targets. All three guarantee
flags remain false. Independent read-only rereview found the original
unattributed-output P2 closed and no new P1/P2 in the repaired attribution
path; a separate local rerun passed the same 25/25 focused controls and Python
syntax checks.

## Open Questions

- Will a changed compiler/Cargo output shape require a new attribution rule?
  The current pinned isolated build passed the complete observed-output gate;
  it is not a toolchain-independent guarantee.
- Which LLVM instruction/linkage forms need explicit unsupported status under
  the installed rustc version?
- How should direct LLVM symbol edges later join MIR CFG sites and an
  owner-accepted endpoint-role relation without treating either as implied?
