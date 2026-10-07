# Auth v2 generated-Rust refinement — candidate construction plan

Status: implementation analysis and independent plan review completed; the
selected generated-Rust fragment has a candidate all-context semantic proof,
and the selected trusted wrapper has a conditional composed authorize-path
proof.
This plan is candidate evidence, not an
admitted execution or F5 result.

## Frontier and decision

The existing no-`sorry` Lean bridge proves the selected typed AST's pure
Operation result against an unaccepted candidate meaning for every typed
context and finite resolver list. The generated v2 Rust and trusted wrapper
were separately tested and are now covered by separate, conditional R3/R4 and
R5 source-bound models. Keep AlchLang lowering independent of TDE. TDE must derive its
exact cases and witnesses before the F5 executable request is finalized.

## Dependency DAG

1. **R0 — Select and pin the subject.** Bind the v2 typed source/closure,
   exact generation receipt, compiler Rust-lowering branch, generated Rust
   bytes and five selected functions. Require a clean second generation to
   reproduce the exact artifact. Do not edit generated Rust by hand.
2. **R1 — Establish totality of the selected typed evaluator.** State and
   check that each selected Rule and the Operation guard returns `some Bool`
   for every well-typed context and arbitrary finite resolver lists. This
   licenses outcome comparison with Rust's lazy `&&`/`any` despite the fixed
   Lean interpreter eagerly evaluating all list positions. It does not assert
   that malformed ASTs are total.
3. **R2 — Extract the actual Rust fragment.** Independently parse the exact
   generated Rust function bodies, not comments or a parallel DomainSpec
   translation. A closed grammar/AST must account for field paths, String and
   Bool equality, negation, lazy conjunction,
   `Vec::iter().filter(...).count() == 1`, `Vec::iter().any(...)`, the three Rule calls and the Operation
   branch. Reject unknown syntax, extra calls, effects and unexpected types.
4. **R3 — Prove the model.** Give that parsed fragment a fixed Lean semantics.
   Prove the selected Rules and Operation agree with the typed AST interpreter
   for every representable in-memory context. Make the Rust `Vec` to Lean
   `List` embedding explicit. State the normal-termination/resource assumption;
   arbitrary mathematical lists need not be materializable as Rust vectors.
5. **R4 — Test the binding adversarially.** Recheck exact regeneration and
   Cargo tests. Rust-only semantic mutants must keep the typed AST fixed,
   produce a type-correct separating context, and fail the theorem or checker:
   delete a qualifier, redirect an equality operand, replace `filter/count`
   with `any`, and swap READY/DENY branches. Unknown syntax and extra
   executable statements must fail closed. Finite differential cases are
   runtime evidence, not the all-context theorem.
6. **R5 — Separate wrapper trace.** Pin the wrapper's `authorize` control
   flow and sole direct downstream call site. Prove `kernel Deny` yields
   wrapper Deny with zero direct downstream calls, and `kernel Ready` makes
   exactly one direct call and preserves its result. Prove unique-row candidate
   construction and field copying before extending the claim to business
   meaning. A final wrapper Deny is *not* the no-call condition: downstream
   may be called and return Deny.

R0–R4 precede R5. R1 is a standalone executable proof prerequisite; completing
it alone does not complete generated-Rust refinement.

## R3 proof construction detail (candidate, executed)

The reviewed R2 extractor now fixes the precise R3 input shape. The proof
subject must come only from production-mode `extractCurrentGeneratedRust()`;
fixture extraction is reserved for hostile tests. A narrow case-local emitter
must validate every IR operation, type, path and selected function again, then
render the four Rule expressions and Operation branch as Lean **data** in a
generated `AuthGeneratedRustIR.lean`. Re-emission from current production IR
must be byte-identical. This is independent of the existing source-derived
Lean AST generator.

A separate, fixed `AuthRustFragment.lean` must interpret Rust-named paths over
the typed Auth context; String/Bool equality, `not`, lazy binary `and`,
list-position `exactlyOne`, lazy `exists`, selected Rule calls, and the
Operation `if`/variants must have explicit `Option` error behavior. It must not
alias `AuthExprInterpreter` or `AuthGeneratedSubject.eval*`. A case-local proof
then establishes selected per-row, list and Rule bridge lemmas and the exact
all-context proposition that interpreting the generated Rust IR Operation
equals `some (AuthExprInterpreter.operation c)` for every typed `Context`.
It must also check exact `Option Bool` equality and `some` totality for each
of the four selected Rules; an Operation-level Deny-on-error fallback alone
could hide a Rule mismatch.
Composition may derive READY iff the separate candidate meaning, but does not
accept that meaning as normative.

The checker must typecheck pinned Lean modules, verify exact theorem types and
axioms, replay generated IR bytes, and reject weaker/unused-import proofs.
Rust-only fixture mutants must leave the typed AST fixed and exhibit a
type-correct separating context whose two Lean evaluations reduce to distinct
values before a failed equivalence is counted. Native
Cargo/differential tests corroborate the parser/model boundary; neither they
nor the Lean theorem verify Rust compiler or standard-library implementation.

The production IR emitter and fixed Rust-fragment interpreter typecheck. The
full provenance, aggregate and Operation bridges now typecheck with no `sorry`;
all four Rule bridges state exact `Option Bool` equality for every typed
context. Four compiled Rust-only mutants yield Lean-reduced separating
contexts. The case-local checker replays production IR, pins selected proof
bytes, checks exact theorem propositions and axiom output, and rejects a weaker
Operation theorem and changed imported Rust IR. See `IMPLEMENTATION-STATUS.md`
for test and review evidence. R5 is a separate proof unit, recorded below.

## R5 wrapper-trace construction detail (candidate, executed)

The selected wrapper is
`auth-foundation/implementation/trusted-boundary-v2/src/lib.rs`; its
`authorize` path resolves two lists, constructs a candidate, maps both lists
and the candidate into the v2 kernel context, then matches the kernel result.
The current source has one direct downstream call site in the `Ready` arm and
none in `Deny`. Its current whole-file SHA-256 is
`55f05b0c164e41129605ef944e68136681bad317403ae5958e6050978673d653`.
That pin is a selected input, not proof of wrapper behavior.

1. Bind the exact wrapper bytes, Cargo dependency on the selected v2 kernel,
   and R3/R4 kernel proof subject. A closed source/CFG extractor must target
   the generic `TrustedAuthorizationBoundary::authorize`, not the separate
   `SqliteAuthorizationService` trait delegation. Extract that function,
   `construct_candidate`, and the `to_kernel_*` maps into generated Lean IR
   data from executable syntax. Reject extra direct downstream calls, arm
   changes, field redirection, altered candidate qualifiers and list-map
   reordering or loss; comments and strings are not executable syntax.
2. Give the generated wrapper IR a fixed Lean interpreter, independent of the
   intended direct-call trace. Prove the parsed-IR trace equals that intended
   trace for arbitrary normal resolver outputs, downstream result and kernel
   outcome. In particular, `Deny` returns Deny with no direct downstream
   call; `Ready` records exactly one call with the candidate and preserves the
   downstream result, even when that result is Deny. This is conditional on
   normal return from resolvers, kernel and downstream; direct-call counting
   excludes indirect effects inside those implementations.
3. Define qualifying rows by proof of equivalence to the selected v2 kernel's
   full authentication and route predicates, not a new unrelated wrapper
   predicate. Prove unique qualifying rows yield the copied candidate;
   non-unique rows yield a blank candidate. Prove ordered, multiplicity- and
   field-preserving embedding of resolver vectors into the kernel context.
   Compose only after these properties are checked.
4. Replay source pins and exact theorem types/axioms in an isolated checker.
   Run existing native wrapper tests and type-correct source-only hostile
   changes for an eager/duplicated call, swapped branch, redirected copied
   field and lost row multiplicity. Each hostile change must yield a concrete
   separating trace or candidate and fail the exact proof/checker; mere parse
   failure is an additional fail-closed control, not semantic separation. The
   native and model checks corroborate rather than verify compiler or
   machine-code behavior.

No wrapper edit, generated-Rust edit, deployment, provider request or F5
qualification is in this R5 candidate scope. The frontier is a conditional
source-bound direct-call trace and field-copying theorem, not owner acceptance
of business meaning.

The selected wrapper extractor now parses the generic `authorize` prelude,
branch actions, candidate construction, qualifiers, context wiring, and
`to_kernel_*` mappers into data-only `AuthGeneratedWrapperIR.lean`. Fixed Lean
interpreters compose resolver `Err` defaulting, candidate, ordered mapping,
the R3 selected kernel model, and direct-call branches. The exact theorem
checker pins and replays source/Lean bytes, checks propositions and accepted
axioms, and typechecks the no-`sorry` authorize-path theorem. Seven
typechecked source-only wrapper mutants each have a Lean-reduced concrete
separation, including Ready-to-Deny, eager/duplicate calls, qualifier and
field redirection, and row loss. The extractor suite passed 15/15, the pinned
proof 1/1, the separator suite 1/1 (seven mutants), and the native wrapper
Cargo suite 11/11. Independent review's R5 P2 gaps were repaired. This remains
a conditional model of selected source under normal-return assumptions, not
a Rust compiler or machine-code proof, provider observation, or F5 result.

## Execution progress (2026-10-03)

R0 was rechecked by a clean isolated generation: the selected Rust file,
Cargo manifest and instantiation receipt were byte-identical, and the CLI
target observation passed. The v2 evidence checker passed 15 pinned references
after local Cargo byproducts were moved out of the generated target tree.
R1's five selected totality theorems typecheck; the focused suite passed 32/32.

R2 now has a case-local, typed, closed executable-fragment extractor for the
exact selected generated Rust module. Production extraction requires its
whole-file SHA-256 before lexing. It validates six record declarations, the
decision enum, four Rule bodies and the Operation body, including typed paths,
SSA single use, lazy Boolean conjunction, list-position `filter/count`, `any`,
Rule calls, and branches. It rejects unknown executable syntax in selected
bodies and direct or indirect Rule-call cycles. Fixture mode bypasses only the
whole-file pin so Rust-only semantic mutants can be inspected; fixture IR is
not proof input. The R2 suite passed 10/10, and independent review found no
remaining P1/P2 issue in this bounded extraction claim. At that R2 snapshot,
R3–R5 remained open; their later candidate evidence is recorded above.

## D65 lanes, scope and claim ceiling

- Product frontier: trusted-wrapper trace proof (R5), following the candidate
  generated-Rust semantic-model refinement (R0–R4).
- Runnable construction: pin wrapper control flow, prove zero downstream calls
  on kernel Deny and exactly one on Ready, then check candidate field copying.
- Operational support: isolated pinned Lean and local Cargo tests only.
- Write scope: candidate files in the Auth formalization case and this
  plan/status. Compiler tests may be touched only if an exact lowerer defect
  is demonstrated and separately scoped. Typed source, generated Rust, wrapper,
  admitted Auth artifacts and F5 consumers are read-only in R0–R4.
- Causal blockers to F5: owner-accepted meaning, Rust and wrapper boundary
  evidence, current v4 claim, TDE-derived neutral cases/witnesses, post-TDE
  finalized request, authenticated provider observation.
- Deferred operational residue: release, deployment and production claims.

An all-context theorem for a parsed Rust *model* is conditional on faithful
fragment parsing/semantics and normal Rust execution. It is not a verified
Rust compiler, standard-library, machine-code, allocation or all-platform
theorem. No owner acceptance, EVF pass, F5 satisfaction or
`runtime_guarantees_observed` follows from this plan or R1 alone.

## Open Questions

- Which closed Rust parser implementation provides the smallest auditable
  executable-syntax surface while preserving source locations for mutations?
- What independent check is sufficient to trust the selected Rust-subset
  semantics beyond exact regeneration and finite compiled differential tests?
