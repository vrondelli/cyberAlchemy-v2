# Auth v2 typed-rule preservation — candidate construction plan

Status: the selected pure AST-to-candidate-meaning proof unit has been checked
and independently reviewed; no meaning acceptance, generated-Rust refinement,
wrapper proof, or F5 result.

## Product frontier and bounded context

The clarified Auth BusinessMeaning/v1 successor is a complete **draft**, not
an accepted meaning. Its READY condition enumerates the selected v2 typed
qualifiers, nonempty request ID, list-entry multiplicity, and same-unique-row
provenance. The v2 source trace pins the typed Rule/Operation AST and generated
target but does not prove the prose or runtime semantics. The prior
`source-bound-quotient.ts` addresses a different, earlier runtime; it cannot
serve as v2 preservation evidence.

Selected context is limited to the clarified candidate and its source refs,
the v2 typed context/decision and five Rule/Operation contracts, the exact
meaning trace, the Rust lowerer branch for `all`, `not`, `eq`, `exactly_one`,
`exists`, `rule_ref`, and the v2 generated Rust/wrapper for identifying later
obligations. Existing exact validators supply source-currentness, not proof.

## Dependency DAG

1. **Pin the proof subject.** Verify the current clarified meaning,
   clarification, typed source nodes, trace, and product-admission bytes.
   Define the proof domain as all finite lists of representable records with
   pure, total Boolean predicates. Do not treat the draft as accepted.
2. **Generate the formal subject from the AST.** A narrow, reviewed translator
   must consume the exact selected typed expression trees and emit a typed
   Lean AST/IR imported by the proof, retaining path roots/property chains,
   binder scope, term nesting/order, `rule_ref` selector/arguments, and
   Operation guard/results. The interpreter must count qualifying *list
   positions*, not distinct row values. The translator must cover every selected
   `path`, typed literal, `eq`, `not`, `all`, `exactly_one`, `exists`, and
   `rule_ref` occurrence and the Operation guard/result branch, rejecting
   unsupported forms. Independent structural checks compare a canonical
   expression-tree IR from the source with the generated formal subject; a
   manually repeated qualifier list or source hash alone is insufficient.
   Keep a separate fixed, owner-reviewable machine interpretation of the
   clarified draft's READY predicate. It must not be defined as the source
   AST evaluator; otherwise the preservation theorem is tautological. This
   interpretation remains candidate until an actual owner decision.
3. **Prove the typed algebra.** In a case-local Lean file importing those
   generated definitions, prove the singleton-filter lemma for arbitrary finite lists:
   exactly one qualifying list position plus an existence witness satisfying the same
   qualifier and candidate equality iff the unique qualifying row has that
   equality. Compose the two lemmas with the v2 aggregate and Operation branch
   to obtain the pure decision value READY iff the separate candidate meaning
   interpretation holds. This is a theorem about that machine interpretation,
   not automatic acceptance of its correspondence to the draft prose.
   Include duplicate-equal-row and blank-request-ID corollaries. No `sorry`,
   extra axiom, or finite-case substitution.
4. **Bind and execute.** Add a separate checker that verifies exact current
   source refs, generates the Lean subject from the selected AST, checks the
   exact expected theorem proposition and its dependency on both the
   generated AST evaluator and independently fixed meaning interpretation
   (not merely theorem names or an unused import), checks for extra axioms,
   and runs it with the pinned
   Lean version in an isolated runtime. Acquire that runtime without changing
   global toolchain defaults. A proof file that has not typechecked is not a
   passed artifact.
5. **Hostile controls and review.** Keep the candidate meaning interpretation
   fixed while mutating selected AST copies to omit the request-ID guard or a
   permission qualifier, change `exactly_one` to `exists`, redirect candidate
   provenance to a nonqualifying row, and swap the Operation branches.
   Retranslate those mutants while bypassing only production byte pins. For
   each, require a type-correct separating context and failed equivalence;
   a changed source hash or subject identity alone does not satisfy this
   control. Also replace the theorem with a same-named weaker proposition or
   unused-import proof, and mutate the independent meaning interpretation;
   require the proposition/dependency check or theorem to fail.
   Test proof replay against exact current bytes. Independently review the
   translation, proof, checker, tests, and claim ceiling before recording a
   result.
6. **Synchronize evidence.** Record only typed-algebra preservation for the
   exact selected draft/AST if the proof typechecks and controls pass. Keep
  generated-Rust-to-typed semantics and trusted-wrapper-to-business meaning
   as separate subsequent proof tasks.

## AST-interpreter bridge amendment (2026-10-03)

The first proof increment established all-context equivalence for a
source-derived Lean executable projection, not for the retained `AuthExpr`
data. The next bounded unit keeps that theorem and adds a fixed, non-generated
interpreter. Its dependency DAG is: (A) statically validate the selected
four-Rule reference graph, path/type closure and sufficient expression depth;
(B) define a total interpreter of the generated term/expression constants and
Operation guard/branches; (C) prove the interpreted auth, route, provenance,
aggregate and Operation results equal their generated executable projections
for every typed context; (D) compose with the independent candidate-meaning
theorems; (E) run exact theorem-type, axiom and hostile mutation checks; (F)
independently review the claim and synchronize status.

Implementation-analysis and review constraints: fuel measures only AST and
rule-reference depth, never the number of resolver rows; the selected bound
must be shown sufficient. Invalid paths, types and references propagate an
error to the top-level Deny boundary, so `not` cannot turn an invalid equality
into success. Binder scope and the `context` rule argument are checked exactly.
The theorem statement must mention the actual generated AST constants and
Operation constants. At least one valid AST-only mutation must leave the
parallel executable projection unchanged yet break the bridge on a concrete
context. Byte pins and JS closure checks establish source identity/coverage;
the Lean theorem, not those checks, establishes the semantic bridge. The
claim remains pure candidate typed semantics only.

## D65 lanes and write scope

- Product frontier: an executable all-finite-list typed-algebra theorem.
- Runnable work: proof file, exact source-binding checker, hostile tests, and
  candidate proof receipt under the Auth case; this plan and status only.
- Operational support: isolated pinned Lean execution and local tests. No
  deployed service or provider request.
- Tool boundary: Lean `v4.32.0` is now available only under an isolated
  `/var/tmp` directory. The official Linux archive SHA-256 is
  `fca846f3588724a38ad19ee40292c67cb7438d7555903372e3308eef795ba516`;
  the checked `lean` binary SHA-256 is
  `e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550`.
  These observations must be rechecked at execution; no global installation
  or lasting tool availability is inferred.
- Causal blockers for later F5: owner-accepted meaning, generator/Rust and
  wrapper preservation, v4/current proof context, TDE-neutral cases,
  post-TDE finalized request, authenticated provider evidence.
- Deferred operational residue: release, deployment, and production claims.

Do not edit admitted Auth product artifacts, historical draft/trace, v2 typed
source, generated Rust, wrapper, compiler, or F5 consumer in this unit. The
existing owner-selected order remains TDE cases/witnesses before executable
request finalization; AlchLang is not rerun on those outputs.

## Completion and claim ceiling

Completion requires a typechecked Lean theorem on formal definitions generated
from the pinned AST, reviewed translation coverage, negative controls that
exercise the semantic binding rather than merely a whole-file hash, exact
replay, and independent review. That would prove a
conditional typed-rule algebra result for arbitrary finite lists and the
pure decision value only. It would not prove the draft's no-downstream-call
clause, compiler lowering, actual Rust execution for all inputs, wrapper
behavior, owner acceptance, a v4 claim, F5, or
`runtime_guarantees_observed`.

## Open Questions

- Which isolated pinned Lean acquisition path is reproducible in this host?
- What separate refinement will connect the generated Rust operators and
  trusted wrapper to this typed-algebra theorem?

## Execution result (2026-10-03)

The fixed Lean interpreter consumes the generated `AuthExpr` constants and
Operation selector/branches. All-context Lean theorems bridge auth, route,
provenance, aggregate and Operation interpretation to the generated typed
executable projection, then to the separately encoded draft candidate
meaning. Blank-ID and duplicate-qualifying-row DENY corollaries typecheck.
Static graph checking admits only the selected acyclic leaf/aggregate shape,
shows expanded maximum depth 7 under fuel 8, and does not consume fuel per
resolver row. Error-valued paths/types/references propagate through Boolean
operators and become DENY only at the Operation boundary.

The exact generated AST, translator, interpreter and proof bytes are pinned in
the checker. The final focused suite passed 32/32 with the isolated pinned
Lean 4.32.0 binary. A valid AST-only blank-ID mutation leaves the executable
projection unchanged yet produces a concrete READY/DENY split and breaks the
bridge proof. Independent review found no remaining P1/P2 within this pure
candidate scope. This is not owner acceptance, Rust/compiler refinement,
trusted-wrapper/no-call preservation, a v4 claim, F5 qualification or a
runtime observation.
