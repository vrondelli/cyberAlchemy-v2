# F5 Auth native-witness bridge — candidate plan

## Product frontier and boundary

The current Auth SFOL correspondence checks three Boolean inputs and eight TDE
valuations, but does not show that concrete command-boundary contexts realize
those valuations or that the generated Rust operation agrees with the Boolean
oracle. This unit supplies eight source-pinned, independently executed concrete
witnesses. It establishes bounded existence and result agreement for those
witnesses only—not equivalence for all concrete contexts, DomainSpec-v4
admission, a TDE-neutral set, provider authentication, EVF pass or F5 closure.
Historical admission and generated Rust are immutable predecessors for this
unit. Select the separately versioned current-CLI command-boundary target
under `auth-foundation/implementation/current-runtime-successor-v1/`, not the
historical receipt that fails the current CLI relationship-authority check.
The historical/current build digest drift remains visible.

## Plan → analysis → review → implementation DAG

1. **Source selection.** Reuse the current Auth SFOL correspondence builder to
   re-read admitted Auth decisions, typed clause and all eight TDE cases. Check
   the versioned current-successor binding and instantiation receipt with the
   current CLI validator; check the receipt's selected artifact path, size and
   SHA against the exact on-disk Rust source. Pin the
   reviewed harness path and its bytes. Stage only those checked Rust and
   harness bytes for compilation, so a path race cannot substitute code.
   Do not treat the current receipt as the historically pinned build or as
   provider provenance. Preserve the old receipt's distinct stale-authority
   status rather than catching its validator error as a partial pass.
2. **Concrete witness construction.** Add a separate Rust harness next to the
   Auth case, using the generated library's public structs/rules/operation
   without editing generated files. Start from one matching trusted evidence,
   one matching complete route binding, and matching command provenance. To
   make the authentication or route uniqueness flag false while retaining
   provenance true, duplicate the matching evidence or binding respectively;
   to make provenance false, change the candidate request ID. This yields all
   eight flag valuations independently. For each input, the harness reports
   the three observed rule results and `Ready` or `Deny` from the operation.
3. **Run and compare.** A local TS runner must select exact harness/Rust/source
   bytes, compile only through the repository toolchain into a run-owned
   temporary directory with bounded time/output/output-file size, invoke each
   valuation with explicit argv, fixed cwd/environment and bounded process
   time/output, and compare observed flags and result against the exact TDE
   case and oracle. It must not accept caller-supplied observed results as
   evidence. Bind case IDs, source refs, harness/build identity and per-case
   process outcomes in a deterministic candidate report; replay re-executes
   and rejects forged or stale reports. Use no shell interpolation, remove
   only the run-owned temporary directory, and retain failure diagnostics.
4. **Controls.** Test all eight actual valuations, independence of duplicate
   evidence/binding and provenance mutations, altered selected case/source,
   wrong or extra harness output, timeout/nonzero/oversize, and forged
   rehashed report. The false cases must produce `Deny`; only `111` may produce
   `Ready`. No test may rewrite the admitted case set or generated runtime.
5. **Validation and handoff.** Run focused Rust/TS integration controls and
   typecheck, inspect the exact write set, and record a bounded evidence
   status. Keep the later v4 owner meaning, all-context preservation proof,
   current proof-context build successor, independent provider, and
   E03/E05/L3X/P01–P03 requalification as separate work.

Implementation analysis found the required Rust types and four functions
already public. The preferred harness is a single Rust source compiled with
`tools/toolchain/run rustc` to a temporary output; it changes no Cargo or
generated-runtime file. The runner and tests are Auth-case-local because this
is an Auth-specific witness check, not a generic DomainSpec metatype proof.

## D65 lanes

- Current product frontier: source-pinned, testable eight-witness bridge.
- Runnable product work: harness, runner, exact case comparison and replay.
- Operational support: local pinned Rust toolchain and temporary build output.
- Causal blockers for F5: owner-reviewed v4 meaning/projection/preservation,
  current build proof context, neutral obligation derivation and an independent
  provider/isolation route.
- Deferred residue: provider credentials, release/deployment and downstream
  qualification. None is implied by this local construction unit.

## Open Questions

- Which accepted DomainSpec-v4 meaning and concrete-to-abstract preservation
  contract should generalize beyond these eight witnesses? R4's distinct
  meaning decision also remains open.
- Which independent provider will run the finalized post-TDE request under
  enforceable policy and yield satisfying evidence?
