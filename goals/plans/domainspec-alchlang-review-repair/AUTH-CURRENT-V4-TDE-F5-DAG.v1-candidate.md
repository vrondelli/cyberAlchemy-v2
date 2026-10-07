# Auth command-boundary current claim to F5 — candidate dependency DAG

Status: candidate plan, not a FormalClaim admission, TDE result, EVF result, or runtime guarantee. The owner accepted the exact clarified BusinessMeaning at `auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-accepted.json`. Its acceptance decision is at `auth-foundation/formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/business-meaning-v1-clarified-acceptance.json`. These are exact inputs, not permission to reuse the historical three-Boolean SFOL claim or its eight TDE cases.

## V2 candidate review checkpoint (2026-10-03)

The draft definitions-bearing v2 meaning and occurrence InterpretationModel
retain `draft` / `not-requested` status. An independent read-only review found
no direct contradiction with the accepted v1 READY/DENY rule: qualifiers keep
same-row fields, uniqueness counts list positions, provenance reuses the unique
witnesses, and both decision directions are stated. The current candidate test
passes **5/5**, including exact refs, definition closure, both JSON schemas,
a negative status-only promotion control, and an independently pinned digest
of the complete draft expression map. In-memory QA, QR, and decision
`∨ true` suffix mutants invalidate that digest. This is a byte-level draft
change tripwire, not formula parsing or semantic review.

This is structural evidence, not logical equivalence. The existing expression
checks are regular expressions: appending `∨ true` after a qualifying formula
can preserve its matching prefix while making the qualifier universal. The
selected v2 meaning therefore cannot be treated as enforceably formal merely
because the candidate tests pass. V2 review still needs a checked formula and
exact theory/axiom identity; occurrence membership, ghost exclusion and
`InScopeNormal` totality need interpretation/correspondence proof. The accepted
DENY-without-downstream-call fact remains unformalized by these pure-decision
definitions; `no_call_contract_gap.rs` supplies a generic resolver counterexample
to treating R5's direct-site proof as an all-path proof. Do not request v2
acceptance or emit a current v4 claim from this checkpoint alone.

## V4a FOL correspondence review checkpoint (2026-10-04)

The owner-accepted clarified v1 meaning is now the fixed policy input. A
read-only implementation analysis and an independent plan review selected the
next bounded proof slice: define occurrence identities by context and list
position (with nonmember ghosts and total field projections), state an
independent Lean `folReady(c)` using the FOL qualifiers, unique occurrence
witnesses and same-witness provenance, then prove for every typed context
`folReady(c) ↔ candidateMeaning(c)` and compose that result with the existing
typed Operation theorems. QA/QR must arise from membership and row fields;
neither `ReadyCondition` nor the abstract `Decision` may be defined by the
desired theorem conclusion. A source-bound symbol/clause mapping must be
checked separately; a digest plus handwritten Lean predicate alone does not
prove the six parsed FOL clauses equivalent to Lean.

The current candidate FOL test now has **6/6** local checks. Its new check
parses altered qualifier, provenance and outcome clauses and shows that each
fails against the fixed READY finite interpretation, beyond merely changing
the AST digest. The Lean 4.32.0 binary used by the earlier exact-source proof
tests is absent from this workspace environment, so no new all-context Lean
theorem was written or claimed from this checkpoint. The next executable
unit needs that pinned runtime restored before a proof can be validated.
Finite semantic separators are useful negative evidence, not an all-context
proof or a discharge of the separate no-downstream-call obligation.

## V4a occurrence proof checkpoint (2026-10-04)

The exact official Lean 4.32.0 archive and executable were restored under an
isolated `/var/tmp` directory and matched the previously recorded SHA-256
pins. `AuthFolOccurrenceBridge.lean` now states a membership-bearing `qa` and
`qr` over context-tagged `(row, list-position)` occurrences, with total row
field projections and ghost/foreign occurrences excluded by membership. Its
explicit qualifier biconditionals cover every required field. A checked
generic uniqueness lemma preserves equal duplicate entries as distinct
positions. The all-context theorems establish `folReady(c) ↔
candidateMeaning(c)` and the corresponding selected typed Operation READY and
DENY results for every representable finite-list context, without `sorry` or
new axioms. The new exact-source proof runner passes **2/2**, including Lean
type replay, duplicate-auth and duplicate-route proof witnesses, empty-list
exclusion, and semantic mutants of trust, route action, session provenance,
and both membership guards. The prior typed proof suite passes **10/10** and
the FOL formation/finite-separator suite **6/6** under this local toolchain.

An independent review caught an initial QA/QR membership omission; that
finding was repaired before this checkpoint. The proof is still an explicit
Lean occurrence-predicate bridge, **not** a checked interpretation of the six
parsed FOL clauses. The current test pins the FOL and Lean bytes separately
and spot-checks symbols, but a co-updated FOL clause/hash could leave the
Lean theorem intact. Next, implement a checked AST-symbol and clause
interpretation for all six clauses, prove its satisfaction under the selected
model, and add source-level semantic mutants. Context identity is structural
equality of the complete typed input record; if evaluation-event identity is
needed, it requires an explicit model extension. The v2 definitions/model
remain draft; V4b no-call, current v4 admission, TDE and F5 remain open.

## V4a source-derived theory proof checkpoint (2026-10-04)

The next bounded slice is now executable at candidate level. The checked
generator parses the complete six-clause FOL sketch, validates every signature
symbol, sort and arity, and emits a Lean theory with an arbitrary two-valued
`Decision` function. A fixed, explicit model interprets occurrence membership,
field projections, qualifiers and the ready condition; it does not define
`Decision` by the desired result. The unchanged Lean proof establishes that
the generated theory holds exactly when `Decision(c)` is the expected READY or
DENY value for **every** typed context. It also constructs an expected decision
that satisfies the theory, excluding a vacuous contradiction, and proves the
selected typed Operation returns exactly one of those two outcomes and satisfies
the generated theory under this interpretation. The proof uses no `sorry` or
new axioms.

The exact-source generator/theory/proof test passes **3/3**. Nine parseable FOL
semantic mutants are re-emitted and compiled in fresh isolated Lean builds
against the unchanged model and theorem; all are rejected. The accepted-meaning,
v2 draft and typed-subject suites pass **19/19** together. An independent
review found and prompted repair of an adapter that could have concealed a
third Operation result; post-repair review found no remaining P1/P2 in this
bounded bridge. These checks establish a candidate interpretation of the
source-derived theory, not an accepted v2 definition/model, current v4 source
or claim admission. Context identity remains structural input equality, not
evaluation-event identity. The next gates are independent model-to-accepted-
meaning review and explicit v2 authority acceptance, followed by the separate
all-path no-call (V4b) obligation; no TDE, F5 or runtime guarantee follows yet.

## V3 formula-formation checkpoint (2026-10-03)

The bounded AlchLang checker at
`language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim-source-check.ts`
now independently rechecks `text/x-alchlang-fol` v4 proposition bytes,
signature typing, exact selected profile semantics and typed AST identity.
Focused tests pass 5/5, including a malformed proposition with a recomputed
source digest; the surrounding formal-claim tests pass 23/23 and typecheck
passes. It explicitly reports historical Auth `text/vnd.domainspec.fol-core`
as unsupported. This does not close V3: no selected DomainSpec-wide v4
validation contract calls the checker, the historical grammar/theory binding
is unresolved, the v2 definitions remain unaccepted, and Auth has no new
current v4 source.

The next bounded V3 candidate adds
`language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim-source-boundary.ts`.
For a caller-selected profile key, it loads the claim's exact current profile
registry reference through the existing bounded evidence-file reader, requires
one matching record, and invokes the typed proposition checker. Stale bytes,
unsafe paths, malformed registries and malformed FOL return rejected; historical
Auth media and nonmatching profile semantics remain unsupported. Its focused
tests pass **7/7**, the formal-claim suite passed **35/35** before the final
two test-only cases were added, and TypeScript type-check passed. Independent
review found no P1/P2 in this formation-only slice. It is not yet wired into
DomainSpec-wide v4 validation and does not check v2 definition formulae,
grant v2 acceptance, emit an Auth v4 claim, or discharge V4b.

An opt-in `alchlang check-formal-claim` candidate now consumes one bounded
JSON request on stdin with an exact claim-file reference, absolute evidence
root and explicit profile key. It loads the claim and profile as exact current
files, distinguishes `checked`, `rejected` and `unsupported` with nonzero CLI
exits for the latter two, and reports the loaded claim bytes and a
formation-only ceiling. The source checker now validates proposition envelope,
identity digests and signature shape before classifying unsupported media.
The focused intake, boundary and source-check tests pass **18/18** and the
broader formal-claim tests pass **42/42** after the final hardening tests;
TypeScript type-check and build pass. A final independent review's CLI JSON
argument rejection and split-package allowlist findings were repaired. The
package-boundary check passes and a locally packed, isolated core CLI produced
a structured rejection with exit 2 and no stderr. Packaging is local only.

This is a runnable formation check, not DomainSpec-wide claim validation. The
DomainSpec package validator still checks package metadata and synthetic schema
fixtures, including a v4 `text/plain` fixture; it does not call this intake.
Its current standalone run is **blocked** at `DSF-V008` (seven missing source
identities) and `DSF-V053` (two stale authority-model references), unrelated
to the new opt-in command. V2 definition formula formation/acceptance, Auth v4
construction, full V4b no-call preservation, admission and TDE/F5/EVF remain
open.

## V4b caller and trace checkpoint (2026-10-03)

An independent read-only source trace found no non-test caller of
`auth-foundation/implementation/trusted-boundary-v2`. In that generic wrapper,
the two resolver traits execute before the v2 kernel decision
(`src/lib.rs:31-43,79-110`); only the wrapper's **direct** downstream dispatch is
guarded by READY (`src/lib.rs:111-112`). The pinned Lean wrapper proof replay
passes **1/1** and establishes that direct-site result under its exact model.
The native `no_call_contract_gap.rs` test passes **1/1** with a resolver that
calls the same downstream before the kernel returns DENY. Thus an all-path
no-call theorem is false for arbitrary implementations of the current generic
resolver traits; the direct theorem must not be used to discharge V4b.

At this checkpoint the `authorization-service` depended on the v1 boundary
and its concrete wrapper resolvers cloned pre-resolved vectors. That source
trace motivated the separate v2 composition and caller repair recorded below;
the old v1 service-source locations are superseded by the current diff. V4b
still requires the exact concrete call graph and an interpretation that does
not count a pre-boundary downstream invocation as compliant or silently narrow
the owner's DENY-without-downstream-call rule.

A separate callable candidate now exists at
`auth-foundation/implementation/trusted-boundary-pre-resolved-v2-candidate`.
It composes the byte-pinned v2 wrapper with private clone-only resolver
implementations; the supplied row vectors are already resolved before entry.
The candidate's **4/4** tests cover the unique qualifying authentication and
route rows beside nonqualifying siblings, READY followed by downstream DENY,
and selected kernel-DENY zero-call cases including equal duplicates. The
original generic-resolver counterexample remains passing, and the exact-source
Lean wrapper replay passes **1/1** without changing the pinned v2 source or
manifest. Independent review found no resolver-held downstream path in this
candidate composition.

The concrete `authorization-service` now calls that pre-resolved v2
composition while retaining its v1 request type at the public service/API
boundary. The trusted-input provider no longer truncates matching-ID rows at
two, and the service selects the unique *qualifying* occurrence rather than
requiring a singleton raw list; every matching occurrence is then passed to
the v2 wrapper in order. Red-before-green service separators demonstrate
one qualifying row with nonqualifying siblings and a qualifying third row;
equal qualifying duplicates still DENY. The provider suite passes **11/11**,
service unit/integration suites **7/7** and **17/17**, and API tests **9/9**.
A concrete test counts the actual downstream-port invocations: selected
duplicate/no-qualifier/invalid-input DENYs make zero calls, and READY followed
by downstream DENY makes one. This counter observes the service path only,
not every possible external caller or test-only hook. The provider's matching
slice is sufficient for the ID-equality qualifier but is not literally every
database row; the exact SQLite-to-formal occurrence interpretation remains
to be bound and reviewed. The service additionally treats revoked/expired
authentication as untrusted and disabled routes as incomplete and rejects
overlong/control-character IDs: these security gates are not in the accepted
pure command-boundary rule. Preserve them, but do not claim whole-service
READY iff over all strings without a separate scoped interpretation. Removing
silent SQL truncation also exposes an unbounded-allocation availability risk;
any future bound must fail explicitly, not silently discard occurrences.
V4b remains open pending complete source-bound interpretation and all-path
review; this is concrete construction and test evidence, not full preservation.
The [source-bound V4b call-boundary analysis](AUTH-V4B-CALL-BOUNDARY.v1-candidate.md)
separates the selected concrete service path, generic-resolver counterexample,
injectable-clock hazard, and HTTP/public DENY from a normally evaluated kernel
DENY. It is a candidate analysis, not an all-path proof.

The historical Auth technical-evidence validators still **do not** pass for
these current sources: `validate-trusted-input.py` and
`validate-current-evidence-successor.py` pin the old ten-test provider and v1
service boundary. They remain snapshots. A separate
`auth-foundation/implementation/current-evidence-successor-v2` candidate now
binds the actual pre-resolved v2 service path, current source/migration/lock
bytes, seven crate inventories, current CLI replay, and two byte-identical
clean v2 generations. Its local technical result does not
admit the full meaning or close V4b; exact source-bound all-path interpretation
and independent review remain required.

## Claim construction decision

Use one many-sorted FOL canonical proposition under `fol-core/1-candidate` for this bounded, normally evaluated command decision. Occurrences, not row values, are the quantification subjects for uniqueness: two equal rows at different list positions are distinct occurrences. The external InterpretationModel must map each concrete list position injectively to one occurrence and preserve its row fields and multiplicity. Occurrence sorts remain nonempty even for empty resolver lists, with nonmember ghosts and total field projections whose ghost values cannot qualify. `Decision` is an abstract two-value business outcome function; its mapping to typed `evalOperation` is external correspondence evidence. `InScopeNormal` must be fixed from the representable, fully supplied finite-list input domain plus a separately proved totality/normal-completion assumption; it cannot be defined post hoc from the observed result or used to narrow the owner's scope. Without these mappings, a correct-looking formula can falsely accept duplicate rows or pass vacuously. The typed Lean proof is separate source/model correspondence evidence, not a second canonical FormalClaim. If the exact FOL language/definition-binding contracts cannot express this model without hidden assumptions, stop at a documented expressibility gap and repair that contract before claiming admission.

Define the qualifying-authentication and qualifying-route predicates by **all** owner-accepted field checks, not by opaque uninterpreted names. Schematic shape for every in-scope context `c`:

`forall c:Context. InScopeNormal(c) -> ((Decision(c)=READY iff P(c)) and (Decision(c)=DENY iff not P(c)))`, where `P(c)` is exactly `(NonemptyRequestID(c) and exists a:AuthOccurrence, r:RouteOccurrence. QA(c,a) and QR(c,r) and (forall a2:AuthOccurrence. QA(c,a2) -> a2=a) and (forall r2:RouteOccurrence. QR(c,r2) -> r2=r) and CandidateRequestID(c)=RequestID(c) and CandidateSessionID(c)=SessionID(a) and CandidatePermission(c)=Permission(r) and CandidateScopeEvidenceRef(c)=ScopeEvidenceRef(r))`. `Decision` has the declared two-value READY/DENY range with distinct values; the final proposition must expand `P`, not leave it uninterpreted.

`QA` includes membership/position in `c`, evidence-ref equality to the request, nonempty evidence ref and session ID, and trusted true. `QR` includes membership/position in `c`, route-ID equality to the request, nonempty route ID and scope-evidence ref, complete true, and nonempty permission resource, action and scope. The final proposition must expand these predicates or include exact typed biconditional axioms in its theory/assumption identity; accepted prose definitions and a binding graph alone do not constrain FOL models. Likewise eliminate `InScopeNormal` by quantifying over the fixed complete `Context` carrier, or include an exact axiom `∀c:Context. InScopeNormal(c)` in the claim identity; an uninterpreted scope predicate could be false everywhere. The same *scoped* `a` and `r` witness both uniqueness and provenance. `AuthOccurrence` and `RouteOccurrence` are typed position identities, not row-value identities; their context membership and field projections require an exact interpretation. Both decision biconditionals forbid a valid-context DENY and an invalid-context READY. Exceptions, missing outputs, and nontermination remain out of scope.

The accepted no-downstream-call fact is a **separate end-to-end trace obligation**: in-scope kernel DENY must entail no downstream authorization call through any relevant path. R5 proves only zero calls at one selected *direct* wrapper call site under its exact assumptions; resolver or other indirect calls remain opaque. Its READY-one-direct-call result is implementation evidence, not an additional owner-accepted policy. Do not silently weaken the accepted fact to that direct-site theorem or fold external effects into the pure kernel signature. Full correspondence requires a separate all-relevant-path proof or a new explicit owner decision changing the meaning.

## Dependency DAG and exit checks

| Node | Depends on | Deliverable and exit check |
| --- | --- | --- |
| V0 — Freeze inputs | owner acceptance | Verify accepted meaning/decision bytes and subject digest; pin the typed Rule/Operation closure and R3/R5 proof subjects. Historical SFOL/TDE is marked superseded for this meaning. |
| V1 — Vocabulary and interpretation | V0 | Enumerate every typed field, qualifier, list occurrence and outcome. Specify occurrence identity, injective position mapping, explicit finite-list/normal-evaluation bounds, and every symbol's interpretation. Bind `InScopeNormal` to exactly the accepted in-scope contexts with no hidden narrowing; demonstrate a READY and a DENY context within it. Review duplicate equal-row and wrong-row countermodels. |
| V2 — Definitions-bearing meaning and graph | V1 | Draft a `BusinessMeaning/v2-candidate` successor to the accepted v1 with pure-decision formal definitions inline, exact `base_accepted_meaning_ref`, `definition_source_ref`, and separate `interpretation_model_ref`; preserve every accepted business fact, including the unqualified no-downstream-call wording. Independently review and obtain **separate exact owner acceptance** for the new definitions and version. Do not insert a direct-only trace formula into normative definitions. Only then mark the v2 meaning and every bound definition accepted. Build the explicit transitive `uses_definition` graph/closure against that same accepted v2 meaning. Without acceptance, stop at candidate analysis. |
| V3 — Current v4 source candidate | V2 | First close the [FOL expressibility gap](AUTH-V4-FOL-EXPRESSIBILITY-GAP.v1-candidate.md): an exact grammar/theory encoding and source-bound parser/type checker must reject malformed formulae, undeclared or wrong-sort symbols, wrong arity, unbound variables and omitted defining axioms. After V2 acceptance, author one `FormalClaimSource/v4-candidate` with exact current v2 meaning/its new acceptance/definition/profile/identity refs and a full **pure-decision** FOL proposition; require `definition_binding.definition_authority_ref == business_meaning_ref` and accepted inline definitions. Its claim ceiling must say the accepted no-call fact remains a separate obligation. Keep InterpretationModel external. Validate JSON schema **and cross-artifact contract**, digest identities, binding graph, no hidden qualifier, no uninterpreted `InScopeNormal` escape, both biconditional directions, and explicit satisfiable READY/DENY/nontrivial duplicate witnesses. If V2 is not accepted, stop before emitting v4; keep only an out-of-schema design sketch, never misuse `superseded` as a draft state or fabricate accepted refs. |
| V4a — Pure-decision correspondence and review | V3 | Show the formal interpretation of each qualifying occurrence and field matches the accepted meaning and selected typed AST for every representable finite-list context, including empty lists and ghost nonmembership; keep abstract `Decision` distinct from its external typed-source interpretation. Replay existing R3 exact-source proofs conditionally. Test semantic separators: duplicate equal entries, blank ID, missing each qualifier, nonqualifying-row provenance, valid context returning DENY. Review proposition, definition closure, interpretation, proof assumptions and exact pins independently. |
| V4b — Full no-downstream-call boundary | V3 | Pin the actual v2 caller and concrete resolver implementations, then enumerate every relevant path from an in-scope DENY evaluation to the downstream authorization service, including indirect resolver/callback effects. Define precisely which `authorize` endpoints count; distinguish pre-boundary authorization-state reads from decision invocations. Bind exact source/call graph and normal-return assumptions; show no call on all paths or record a gap. Replay R5 as a **direct-site sublemma only** and retain the passing indirect-call counterexample for the unconstrained generic v2 port. The service now calls the pre-resolved v2 composition; its retained v1 dependency supplies a public request type, not the active decision path. The new technical binding and selected zero-call tests are construction evidence, not the complete all-path proof. A downstream DENY after READY does not prove no call. If full proof is unavailable, do not claim full meaning preservation or F5; a narrower policy requires a distinct owner decision, not silent reinterpretation. |
| V5 — Admission boundary | V4a, V4b | Record a distinct, explicit admission decision only for the exact proposition and evidence actually established. A pure-decision admission cannot be described as full accepted-meaning preservation while V4b is open. Meaning acceptance alone does not admit the claim. |
| V6a — TDE capability and adapter | V5 | Classify whether the admitted FOL claim has an executable-bounded projection. Since `fol-core` is not a TDE execution profile, build and review the v4→TDE-v2 adapter and an exact preservation binding for occurrence identity, multiplicity, qualifier fields, same-row provenance, scope and two-outcome semantics. If lossless projection is unsupported, missing, or indeterminate, stop with that status; do not derive purported current cases. |
| V6b — Projection admission and neutral cases | V6a | Separately admit the preservation-backed executable projection under the current TDE contract. Only then derive exact neutral obligations and witnesses from it and the accepted meaning; record source fingerprints, positive/negative cases, pairwise qualifier separation, duplicate multiplicity and direct-call trace separately. Historical eight-case TDE evidence cannot be transferred. |
| V7 — Post-TDE F5/EVF | V6b | Finalize the executable verification request *after* TDE emits exact cases/witnesses; do not rerun AlchLang lowering just to bind them. Obtain authenticated native/provider observations, compare them to the request, and record EVF join/freshness/indeterminate behavior. Only an evidenced pass may support the bounded `runtime_guarantees_observed` field; never infer it from compilation, theorem, fixtures or stale receipts. |

V1 may inspect V2 authority availability in parallel, but no V3 currentness before V2. V4a/V4b review can inspect drafts as they emerge, but full-meaning V5 waits for both. V6a design may begin earlier; its **current** capability classification waits for V5 and V6b waits for V6a. F5 request design may begin earlier; finalization waits for V6b and the full no-call boundary.

## Construction and routing boundaries

Candidate planning under `CA2-ROUTE-PLAN` ends with review of this DAG. Route implementation separately through `CA2-ROUTE-IMPLEMENT` and its `CAV2-D65` construction chain. Keep review and owner/authority decisions separate from authoring. Do not mutate generated Rust, historical SFOL/TDE receipts, or accepted meaning to make a candidate claim pass. Keep exact ref/digest tests and failing semantic mutants in the implementation unit. No production deployment is in scope.

## Open Questions

- What exact formal definitions and interpretation-model lineage will the owner accept in a new BusinessMeaning/v2 successor? The v1 acceptance does not cover them.
- Can the unqualified no-downstream-authorization-call fact be proved over all relevant paths for in-scope DENY, beyond R5's selected direct site? If not, full meaning preservation remains open.
- Does the v4 FOL representation and its validators encode occurrence identity, typed domains, and interpretation axioms strongly enough, or must those contracts be extended before V3?
- Which existing independent admission actor and evidence format applies to V5? Resolve from current governance, not from this plan's author.
