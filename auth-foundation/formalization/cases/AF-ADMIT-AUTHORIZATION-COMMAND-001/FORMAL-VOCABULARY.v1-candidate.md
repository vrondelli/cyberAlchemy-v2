# Auth command-boundary formal vocabulary — V1 candidate

Status: interpretation design, not an accepted definition, current FormalClaim, TDE projection, or runtime result. Exact meaning: `BUSINESS-MEANING.v1-clarified-accepted.json`; exact typed source projection: `AuthGeneratedSubject.lean`; existing all-finite-list candidate bridge: `AuthTypedPreservation.lean`. The historical `FORMAL-CLAIM-SFOL.v1.json` three-Boolean abstraction and `TDE-CASES.v2.json` eight cases do not represent this current meaning.

## Domains and identity

| Formal sort or symbol | Exact proposed interpretation |
| --- | --- |
| `Context` | A representable, fully supplied `AuthGeneratedSubject.Context` with finite `authRows` and `routeRows`, not an arbitrary partial resolver state. |
| `AuthOccurrence` | A nonempty global carrier containing a distinct `(c,i)` for every valid zero-based position `i` in `c.authRows`, plus a nonmember ghost if needed when all lists are empty. Valid occurrence identity includes context and position; its projected row value is `c.authRows[i]`. |
| `RouteOccurrence` | A nonempty global carrier containing a distinct `(c,j)` for every valid zero-based position `j` in `c.routeRows`, plus a nonmember ghost if needed when all lists are empty. Valid occurrence identity includes context and position; its projected row value is `c.routeRows[j]`. |
| `AuthMember(c,a)`, `RouteMember(c,r)` | True exactly for valid positions in the respective complete list. The interpretation maps every concrete position to exactly one occurrence and distinct positions to distinct occurrences, even when row values are equal. Ghost and foreign-context occurrences never qualify. |
| `Decision(c)` | Abstract command-boundary outcome function into a two-value `DecisionValue` sort with distinct `READY` and `DENY`; it is not the downstream authorization outcome. A separate external implementation interpretation may map this function to the selected typed `evalOperation c`, subject to exact source/preservation evidence. |
| `InScopeNormal(c)` | True for every element of the fixed `Context` carrier, which contains all complete representable typed finite-list inputs. It is not selected after observing the decision. The existing totality/correspondence proof must justify selected evaluator normal completion; an erroneous or nonterminating implementation cannot make its input disappear from scope by definition. Eliminate this predicate from the final proposition or bind its exact universal defining axiom. |

The FOL universe need not itself be finite, but each interpreted context's resolver lists are finite and exhaustively represented by its membership relation. All field projection functions are total on the nonempty occurrence carriers; arbitrary values on ghosts or nonmembers are semantically irrelevant because `QA`/`QR` require membership first. This is an explicit interpretation obligation, not a schema-default assumption. It is forbidden to quantify over distinct *row values* for uniqueness. Two equal qualifying entries at positions 0 and 1 make two qualifying occurrences and force DENY. Empty auth and route lists are valid finite-list contexts that force DENY, not an excuse for empty FOL sorts or undefined field functions.

## Complete qualifying predicates

`QA(c,a)` expands to `AuthMember(c,a)` and all of: `EvidenceRef(a)=RequestedEvidenceRef(c)`, `EvidenceRef(a)≠""`, `SessionID(a)≠""`, `Trusted(a)=true`. The projected fields come from the single `authRows` entry at `a`'s position.

`QR(c,r)` expands to `RouteMember(c,r)` and all of: `RouteID(r)=RequestedRouteID(c)`, `RouteID(r)≠""`, `ScopeEvidenceRef(r)≠""`, `Complete(r)=true`, `PermissionResource(r)≠""`, `PermissionAction(r)≠""`, `PermissionScope(r)≠""`. The projected fields come from the single `routeRows` entry at `r`'s position.

Neither predicate may be left as an uninterpreted atom in the final canonical proposition. Expand every qualifier literally in that proposition, or include logically typed biconditional defining axioms in the claim's exact theory/assumption identity and validate their correspondence to the accepted BusinessMeaning/v2 definitions. An accepted prose definition plus a `uses_definition` graph alone does **not** constrain an FOL model. The owner has accepted the business rule, not these formal symbol definitions.

## Scoped decision relation

For each in-scope `c`, let `P(c)` mean nonempty inbound request ID and the existence of one `a:AuthOccurrence` and one `r:RouteOccurrence` such that `QA(c,a)`, `QR(c,r)`, no second qualifying auth or route occurrence differs from them, candidate request ID equals inbound request ID, candidate session ID equals `SessionID(a)`, and candidate permission resource/action/scope plus scope-evidence ref equal the corresponding fields of `r`. The equalities are **inside the same** `a,r` quantifier scope. Require both `Decision(c)=READY iff P(c)` and `Decision(c)=DENY iff not P(c)`, with distinct READY/DENY values and a two-value decision range. An explicit in-scope READY witness, in-scope DENY witness, and duplicate-position countermodel are required against vacuity.

The existing `AuthTypedPreservation.candidateMeaning` uses `filter = [e]` and `filter = [r]` over the original lists. Filter length counts positions, not distinct row values, and the `authAgree`/`routeAgree` predicates compare to the element in that singleton filter. Its `generated_operation_ready_iff` and `generated_operation_deny_iff` are the current candidate all-finite-list correspondence bridge for the pure typed subject. They do not establish a FormalClaim interpretation model or approve the definitions above.

The accepted business rule says a normally evaluated in-scope kernel DENY has **no downstream authorization call**, without limiting the assertion to one direct call site. The existing R5 source-bound model establishes only that a kernel DENY makes zero calls at the selected direct wrapper call site; it leaves indirect calls through resolver or other paths opaque. That narrower result is useful conditional evidence, not full preservation of the accepted no-call fact. A separate all-relevant-path trace/call-graph obligation must close this gap before full meaning or F5 satisfaction is claimed. A kernel READY may make a direct call whose downstream result is DENY; this selected-wrapper observation is not an additional owner-accepted READY-call policy and is not a predicate of pure `Decision(c)`.

## Countermodel checks required in V2–V4

1. Equal duplicate qualifying auth entries at distinct positions force DENY, as do equal duplicate route entries.
2. Empty auth and route lists force DENY while all formal sorts and functions remain well formed.
3. A second matching but nonqualifying row cannot supply candidate provenance.
4. Empty inbound request ID, each missing qualifier, and each candidate field mismatch force DENY.
5. A valid unique context returning DENY and an invalid context returning READY both violate the biconditionals.
6. A downstream DENY after kernel READY does not establish zero calls.
7. Shrinking `InScopeNormal` after observing a wrong result is invalid.

## Open Questions

- The clarified v1 BusinessMeaning is owner-accepted. A definitions-bearing v2 meaning and an independent occurrence InterpretationModel now exist as draft candidates, but neither has been accepted as authority; this vocabulary remains candidate. The source-derived Lean FOL theory supplies technical correspondence evidence for the pure decision, not an acceptance decision or an all-path no-call proof.
- The fol-core parser and v4 cross-artifact validator must prove they can carry occurrence/context identity and exhaustive list membership without hidden interpretation assumptions.
- TDE must separately classify executable-bounded capability and admit a preservation-backed projection before deriving current neutral cases.
