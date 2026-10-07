# DomainSpec / AlchLang accepted-finding repair DAG (candidate)

## 2026-10-02 continuation — selected remaining decisions

The owner selected the five options recorded in the repository-root
`DECISIONS.md`: N2 separate owner-issued acceptance decision; N9 and N10
deferred; F5 exact evaluation/receipt freshness contract; W3-04 retained
failed staging with inspected cleanup. This section updates only the remaining
repair frontier. It does not turn the dated 2026-09-27 closure audit into a
current result, or claim that deferred validators pass.

```text
C0  preserve current dirty-file baseline and selected decision record
  -> C1  N2 DomainSpec candidate decision contract + AlchLang live lowering
  -> C2  F5 exact evaluation request/receipt + executable freshness consumer
  -> C3  recheck W3-04 no-replace publication; separately harden retained staging
  -> C4  focused positive/negative tests, typechecks, package validators,
         broader suites, and local reproducible test instructions
  -> C5  independent current-byte closure audit per accepted finding

N9/N10 deferred provenance lane -> remains BLOCK for their complete validators
```

| Node | Exact construction obligation | Current gate and claim ceiling |
| --- | --- | --- |
| C1 / N2 | Version a separate DomainSpec-owned acceptance-decision schema. Its subject digest is SHA-256 of canonical key-sorted BusinessMeaning JSON excluding the **entire** `acceptance` envelope; exact full-file hash remains a separate source-currentness check. Bind decision outcome, owner and exact meaning ID/version/subject digest. Require AlchLang lowering to decode and compare selected decision bytes before emitting a current claim. Preserve predecessor artifacts as history; reject unchecked legacy decisions for new current claims. | Independent implementation review exposed an identity contradiction: v2 included acceptance, so a new decision for an interpretation-only change changed claim identity. The implementation now explicitly versions the algorithm as v3, excluding both acceptance and `interpretation_model_ref` from BusinessMeaning/v2 claim identity; old v2 algorithm bytes remain distinct and are rejected for new current lowering. Exact refs still change for freshness. A local owner field is not authenticated issuance or formal admission. |
| C2 / F5 | Exact-bind claim, interpretation/context, projection/preservation, bound, selected TDE case domain and witness set, and evidence. Derive and recompute domain/witness fingerprints from exact selected obligation/case artifact bytes, not caller assertions. Before `PASS_BOUNDED`, reject absent or changed preservation, bound, interpretation, domain, witness or request identity, with a separating mutation for each. | The owner selected post-TDE finalization on 2026-10-02 (see root `DECISIONS.md`). Keep the existing AlchLang v1 request as a base artifact and issue a separate versioned executable request after TDE case derivation. DomainSpec evaluation-context, theorem-request and provider-evidence schemas must stay coherent; theorem requests remain a distinct route. Local checks do not prove provider execution or `runtime_guarantees_observed`. |
| C3 / W3-04 plus staging hardening | Recheck the already implemented atomic no-replace publication and supported-filesystem interleaving control against current source/tests. Separately implement the owner-selected retained-staging diagnostic/policy: owner/identity, retention limit, quiescence/inspection and separately reviewed manual cleanup; no automatic recursive pathname deletion. | The authoritative W3-04 request was publication race control only, not cleanup. Its bounded closure may stand after current recheck. Retention is independent operational residue, not a retroactive finding predicate; it does not prove cleanup occurred. Pinned Lean remains separately unqualified. |
| C4–C5 | Run separating controls and the complete relevant validators/suites, preserve all unrelated dirty work, then audit each remaining row against current source and test output. | N9/N10 remain open/partial by owner deferral. Formalization and ontology validator BLOCK must be reported independently, not hidden inside a partial PASS. |

The first runnable local product slice is C1 plus its synthetic negative and
positive controls. C2 makes the remaining selected freshness behavior
testable; C3 rechecks publication and makes retention inspectable. Operational work is separate: no live provider, database migration,
deployment, publication, or credential use is selected by this continuation.
The two deferred provenance repairs are not permission to weaken validators or
to refresh historical digests in place.

Status: bounded plan independently ACCEPTED on 2026-09-27; separate
implementation phase in progress. Owner: CyberAlchemy v2 product owner. This is
not finding closure, release, or runtime-guarantee claim. The user selected **all accepted review findings**, including
documentation, fixtures, package inputs, and validators. Dropped findings and open
architecture questions are not silently promoted into fixes. Implementation
analysis and independent plan review completed with a final ACCEPT after
exact-path corrections. Implementation follows as a separate phase; the user waived repository governance routing and
further confirmation requests for this work.

## Evidence and current baseline

The accepted bounded review records are the final audit files in the sibling
`domainspec-core/development/review/2026-09-25-*` folders for the system review,
obligation model, continuation Waves 1–4, and logic/architecture review. Their
`findings.md` files own the exact predicates, counterexamples, and claim ceilings.
The [candidate closure ledger](FINDING-LEDGER.v1-candidate.md) gives one row
per accepted numbered ID for the independent reviewer.
The [selected target-byte baseline](TARGET-BASELINE.v1-candidate.md) records
current hashes and dirty-file state for primary targets and immediate inputs;
each implementation track must extend and refresh it before editing.
The [implementation sheet](IMPLEMENTATION-SHEET.v1-candidate.md) specifies
file ownership, migration/rollback, and planned validation per track.
The sibling is review provenance, **not** a build, runtime, or validation dependency.
The source of truth for a repair is the current standalone `cyberAlchemy-v2` file.

On 2026-09-27, ten representative source files (`catalog.ts`, TDE rules and BTE
comparator, `certify.ts`, FormalClaim lowering, durable outbox, EVF, ORODI,
HTTP adapter, and browser workspace) matched the review's recorded SHA-256
values. This does not establish that every reviewed file is unchanged. The
current check-only AlchLang package validator still BLOCKs on the
`public-realization` responsibility and two selected-source drifts; the
formalization validator still BLOCKs at DSF-V008 (seven absent/outside-root
sources) and DSF-V053 (two definition-registry refs); the DomainSpec ontology
validator still rejects its stale Architecture source. The worktree is very
dirty, including unrelated projects and in-scope documentation/package files.
Every work package must re-baseline its exact files and preserve unrelated edits.

The accepted review is **bounded**. It did not finish the original whole-system
coverage requirement or qualify providers, Lean, production transport, 39
realizations, packages, browser behavior, or runtime guarantees. A fix ledger
can close the accepted findings only with predicate-specific controls; it cannot
turn those coverage gaps into proof of whole-system correctness.

## Dependency graph

```text
P0 freeze exact current targets, dirty-file ownership, and finding ledger
  ├─> P1a–g resolve decisions that change specific fix semantics
  └─> P2 analyze exact files, tests, migrations, and dirty overlaps by track
        -> R independent plan review of every accepted ID and dependency
R + relevant P1 decision + I (separate implementation phase, exact file scope)
  -> [A claim/EVF/ORODI] [B outbox] [C TDE/BTE] [D catalog]
     [E HTTP/UI] [F package/docs/fixtures] [G certify]
  -> P3 pairwise negative controls and cross-package joins
     -> P4 current-source validators, focused suites, broader suites
        -> P5 independent finding-by-finding closure audit
```

P2 analysis can proceed while P1 decisions are open. The reviewed plan and
only a track's relevant P1 decision, plus I, gate its target edits; unrelated
tracks must not wait on unrelated choices. I is a distinct post-review
implementation phase with an exact-file work sheet and dirty-work controls;
it does not use repository governance machinery or require another confirmation.
Tracks A–G may run in parallel
only after their shared contracts and exact file ownership are settled. P3 is
a join, not permission to collapse evidence types. A local test pass is not a
provider or runtime observation.

## P0–P2: construction frontier and decision gates

| Node | Required output | Gate / owner |
| --- | --- | --- |
| P0 | One row per accepted ID with current target bytes, existing tests, exact counterexample, proposed repair owner, and dirty-file overlap. Deduplicate aliases without losing acceptance obligations. The selected baseline is partial: add exact transitive consumers/tests for each track immediately before edits. Mark already-fixed only after a current separating control passes. | Planning lead; no edits to targets. |
| P1a | Claim-owned meaning identity versus external evaluation-context identity, selected business-acceptance decision contract, and interpretation/bound freshness. | AlchLang/DomainSpec meaning owners; needed by A and the method/report edits. |
| P1b | Outbox claim generation, max-attempt recovery, complete replay equivalence, time representation, and transaction/telemetry outcome. Migrate the existing SQLite schema transactionally to a new version: preserve rows/attempt counts, revoke legacy leased rows without a fence, requeue only below the retry bound and dead-letter exhausted rows. Legacy commits without a complete stored replay identity must conflict rather than claim idempotent replay. On migration failure, roll back the whole schema/data transaction and do not dispatch with mixed versions; a live old-worker cutover is outside this local repair. Late acknowledgment after expiry but before reclaim stays an explicit policy question. | Runtime owner; needed by B. |
| P1c | Typed provider receipt/request/binding trust boundary for EVF and causal participant/run/stage/cleanup mapping for ORODI. Independent stages need not share one operation ID. | Evidence/runtime owners; needed by A. |
| P1d | TDE obligation occurrence versus semantic identity, rule-set/semantic-source freshness, and supported count-cap/closed-expression shapes. Use a versioned current key containing the selected rule-set and semantic-source fingerprints; treat prior keys/evidence as stale and rederive, not as current through a dual-read. Preserve old records as history on failure and never promote them merely because the new derivation fails. | TDE owner; needed by C. |
| P1e | Browser workspace choice: real editable semantics or explicitly fixed simulation; exact HTTP binding identity at exported send boundary. | Demo and adapter owners; needed by E. |
| P1f | Meaning-preserving reconciliation of the selected local package sources and definition/fixture/ontology bindings; distinguish current imports from historical citations. | Package and authority owners; needed by affected parts of F, while independent documentation corrections may proceed. |
| P1g | Supported-filesystem scope and atomic no-replace publication primitive for a certificate target. If the primitive or filesystem guarantee is unavailable, fail closed before touching the target; preserve the competing target. Failed staging is retained for separate inspected cleanup under the owner's later policy, not deleted by a pathname check. | Assurance/runtime owner; needed by G, whose Lean qualification remains a separate evidence limit. |
| P2 | Implementation analysis: exact files, interfaces, migrations, rollback, controls, validation commands, cross-track conflicts, and claim ceiling for each track. The companion implementation sheet must carry these per track before target edits; summaries in `ANALYSIS` alone do not complete P2. | Independent review must reject incomplete contracts before target mutation. |

If a P1 choice cannot be made from existing authority, prepare the smallest
owner decision and continue unrelated tracks. D's catalog repair uses the
accepted pair/retired-row/freeze predicates without assuming full-row equality;
the owner must decide only if the patch would expand that contract. Do not select arbitrary full-row
catalog equality, mandatory same-operation stage progression, set-ID equality,
strict/compound emitter expansion, or lease-expiry revocation by inference.

## Repair tracks and acceptance predicates

| Track | Accepted IDs (duplicates retained) | Minimum separating result |
| --- | --- | --- |
| A1 FormalClaim identity and acceptance | N1, N2, W2-03, F5 | Interpretation-only change preserves claim identity but invalidates evaluation evidence; changed selected acceptance bytes/owner/subject/outcome cannot yield an accepted-current claim. Reconcile method transition and provenance without treating source currentness as approval. |
| A2 EVF and ORODI | F1/W4-EVF-01, F3 | Contradictory provider receipt/pass envelope cannot satisfy an obligation; null participants and unrelated cleanup/run mapping cannot assert a causal observed trace. Retain construction-only versus actual provider/runtime observation ceiling. |
| A3 Obligation report | F4, F5, F6 | Correct Value Object grammar/profile distinction; identify interpretation, preservation, bound, case-domain and witness-set fingerprints; represent unknown/indeterminate separately from infeasible with limit provenance. These are report/model repairs, not fabricated engine behavior. |
| B Durable outbox | N3, N4, N5, N6, N7, W4-OUTBOX-05 | Replacement claims carry a unique fence; stale `markPublished`/`markFailed` cannot settle a newer lease; crash/restart exhaustion dead-letters at the bound; replay compares the complete commit identity; equal instants compare equally; telemetry failure after COMMIT cannot misreport rollback. Include file-backed restart, interleaving, migrated-legacy-row, and failed-migration controls. |
| C TDE/BTE | F2, tracked rule-set/key prerequisite, W3-01, W3-02 | Count-cap tests derive expected outcomes from parsed operator/cap or report unsupported; prose is not classified as calculation; changed member content hash fails exact-set comparison; rule-set and relevant semantic-source changes invalidate obligation/evidence identity. Old persisted keys are stale-and-rederive, not silently accepted as current. Keep set-ID policy separate. |
| D Meta-type catalog | L01, L02 | Candidate-supplied valid-member but mismatched ID/label and retired DS-D1.10 rows reject; shallow-frozen valid parent still freezes all descendants. Keep distinct invalid-at-entry and mutation-after-return tests. |
| E Adapters and demonstration | W4-HTTP-03, W4-UI-04 | Direct wrong-model `sendOnce` rejects before fetch; changing an editable rule changes execution or is explicitly refused as a fixed simulation. Include native and browser controls at their actual scope. |
| F1 AlchLang guidance and package | N8/W1-02, N10/W1-06, N11/W1-08, W1-03, W1-04, W1-07 | Recommended bridge example lints; root commands and test recipe resolve from documented cwd; current FormalClaim snippet parses with a ceiling; backend guidance matches actual default; package validator passes only after semantic owner-route/source reconciliation, never by weakening guards. |
| F2 DomainSpec fixtures, bindings and prose | N9, N10 (ontology half), W1-01, W1-05, W2-01, W2-02, W2-04 | Minted Key-and-Door positive and intended negative controls reach their own predicates; formalization and ontology checks reach PASS on legitimate local bindings; current-state table, @10 navigation, static target observation and historical import relocation are accurate with candidate/runtime ceilings preserved. W2-04 is MINOR/KEEP and can be a nonblocking navigation annotation. |
| G Certificate publication | W3-04 (conditional) | Atomic no-replace at new target and supported-filesystem interleaving control prevent replacement; unsupported primitive/filesystem fails closed; failed publication preserves an existing target. Retained staging is a separately selected operational-hardening policy, not part of W3-04's original predicate. Pinned Lean execution remains separately unqualified if unavailable. |

Dropped W3-03, W3-05 and W4-OBS-02 are not implementation tasks. Their
associated optional coverage questions may be recorded but cannot be counted
as accepted-finding closure. N8/W1-02, N10/W1-06, N11/W1-08, and F1/W4-EVF-01
are one repair each with multiple review IDs. F5/W2-03 share an identity
contract but have distinct report and method deliverables.

## P3–P5: validation and closure

1. Each track adds its original counterexample as a checked-in negative control,
   plus a positive control preserving intended behavior. Re-run the reviewed
   test, not only a newly written test. For races, use a deterministic
   interleaving; for crash claims, use a real file-backed reopen boundary.
2. Run exact package/input validators and focused suites from the documented
   working directories. Preserve pre-existing failures and identify new ones
   causally. Regenerate only derived artifacts whose authoritative inputs
   actually changed; inspect source-currentness and package contents.
3. Cross-check identity and evidence joins across FormalClaim, TDE, EVF,
   ORODI and outbox, including changed interpretation, rule-set, provider
   outcome, lease generation and source digest. A passing source build never
   sets `runtime_guarantees_observed` by itself.
4. Run broader AlchLang and DomainSpec suites, type/build checks, and the
   current validators. Record environment/toolchain exclusions (for example
   Lean) as unverified, not PASS. Do not claim all 39 realizations without a
   39-member matrix and corresponding execution evidence.
5. An independent closer checks every accepted ID against current source,
   separating control, test result, package/document result, and remaining
   residue. Only then can the bounded accepted-finding list be called fixed.
   The original whole-system review coverage remains a separate obligation.

## D65 two-lane planning and limits

| Field | Current position |
| --- | --- |
| Product-construction frontier | P0/P1/P2, then independently reviewed tracks A–G. The first runnable repair after review is the exact nonblocked track with a selected contract and owned files. |
| Runnable product work | Current-byte analysis, decision drafting, exact regression design, and candidate plan review. No target implementation in this stage. |
| Operational tasks and owners | Product owner must separately choose any live provider, credentials, database/broker, browser host, or release qualification; runtime owners select crash/interleaving environments. |
| Exact affected stages | Source meaning/claim, derivation, static generation, evidence joins, runtime adapters, packages, docs and validation. Live operation is not selected. |
| Causal blockers | Independent review and a separate exact-file implementation phase precede target edits; P1 contract choices block only their dependent tracks; dirty-file overlap blocks editing a specific file until its owner work is separated. Goals validation remains a current package result, not a work gate. |
| Deferred operational residue | Publication, deployment, production runtime guarantees, provider authenticity, every-active-subsystem audit and full 39-realization qualification. |

## Open Questions

- Which owners select P1a–P1g contracts, and where should their exact decisions
  be recorded before implementation?
- Which current dirty edits overlap each track after P0, and which are unrelated
  user work that must remain untouched?
- Is the browser workspace intended as an executable editor or a fixed
  simulation? That choice changes E's implementation, not the false-green
  acceptance predicate.
- What separate review will satisfy the original whole-system coverage promise?
