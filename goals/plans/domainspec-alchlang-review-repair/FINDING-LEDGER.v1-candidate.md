# Accepted-finding closure ledger (bounded implementation audit)

Status: 2026-09-27 independent postimage audit: **33 bounded closed, 3 partial,
2 open** of 38 accepted numbered IDs. This is not a release, provider,
production runtime, or whole-system correctness receipt. Each row
retains its review ID even when two IDs share one patch. `A/` means
`language/capabilities/alchlang/plans/general-compiler-v1/implementation/`;
`D/` means `craft/projects/domainspec-v2/`. Current file-level details and
dirty-work cautions are in [ANALYSIS](ANALYSIS.v1-candidate.md). The pre-edit
selected baseline was partial; implemented tracks inspected exact paths and
preserved overlapping work.

2026-10-02 correction to the dated audit: W3-04's original accepted request
covered atomic no-replace publication and a supported-filesystem interleaving
control only. Retained staging cleanup was not its closure predicate. The
older partial count is preserved as historical audit output; a current focused
recheck and independent judgment are required before updating the count.

The independent closer marked every numbered row except these as bounded
closed. **Partial in that dated audit:** N10 (AlchLang package PASS, ontology BLOCK on a missing
historical integration source), F5 (v2 claim/context freshness demonstrated;
preservation, bound, case and witness evidence invalidation not implemented),
W3-04 (atomic no-replace and race controls PASS; safe failure leaves owned
staging residue). The W3-04 cleanup basis was later found outside its original
accepted predicate, so current recheck and reclassification are pending.
**Open:** N2 (selected acceptance bytes lack a checked
owner/subject/outcome decision contract), N9 (formalization validator BLOCKS on
seven absent origins and two definition-registry references). The unnumbered
TDE persisted ID-map stale/rederive behavior now has a separating control;
other evidence consumers remain unqualified. A2
closure means exact self-consistent receipt projection, not provider
authenticity.

The bounded accepted review records are the sibling provenance-only
`../domainspec-core/development/review/2026-09-25-*` `findings.md` plus their
`audit-acceptance.md` files. Group keys below are: system (`S`), obligation
model (`O`), continuation Wave 1 (`W1`), Wave 2 (`W2`), Wave 3 (`W3`), Wave 4
(`W4`), and logic/architecture (`L`). Each row needs the original counterexample,
a preserving positive control, current source/test evidence, and a separate
closure judgment. A passing grouped suite cannot close a different row.

| Review ID | Track | Primary local target | Separating closure predicate |
| --- | --- | --- | --- |
| N1 (S) | A1 | `A/src/formal-claim-lowering.ts` | Interpretation-only change preserves claim identity while evaluation evidence becomes stale. |
| N2 (S) | A1 | `A/src/formal-claim-lowering.ts` | Selected rejected/wrong-owner acceptance bytes cannot form an accepted-current claim. |
| N3 (S) | B | `A/src/durable-outbox-runtime.ts` | Same-worker stale acknowledgment after reclaim cannot settle a newer generation. |
| N4 (S) | B | `A/src/durable-outbox-runtime.ts` | File-backed reopen at retry limit dead-letters instead of reclaiming again. |
| N5 (S) | B | `A/src/durable-outbox-runtime.ts` | Subset or changed retry-policy replay conflicts; exact replay stays idempotent. |
| N6 (S) | B | `A/src/durable-outbox-runtime.ts` | Equal instants with different offsets schedule/expire equally. |
| N7 (S) | B | `A/src/durable-outbox-runtime.ts` | Throwing telemetry after COMMIT cannot report rollback or erase persisted state. |
| N8 (S) | F1 | `A/README.md`, bridge Mapping project | Literal recommended bridge command reaches supported semantics and a malformed Mapping rejects. |
| N9 (S) | F2 | `D/formalization/formalization-package.json` | Local-origin and definition-registry bindings reconcile without weakening DSF-V008/V053; full validator passes. |
| N10 (S) | F1/F2 | `language/capabilities/alchlang/product-capability.json`, `sources.json`; `D/ontology/sources.json` | Owner-route shape and source bindings are current; both complete validators pass, not just their first blockers. |
| N11 (S) | F1 | `language/capabilities/alchlang/README.md` | Both root-relative commands resolve from the stated repository root. |
| F1 (O) | A2 | `A/src/application-evf-evidence.ts` | Contradictory provider receipt and caller pass cannot satisfy an obligation. |
| F2 (O) | C | `D/impl/test-derivation-engine/src/emit/tests.ts` | Cap-two/operator boundaries derive correct witnesses/outcomes or explicit unsupported status. |
| F3 (O) | A2 | `A/src/application-runtime-observation.ts` | Null participants and unrelated cleanup/run mappings cannot assert a causal observed trace. |
| F4 (O) | A3 | `research/2026-09-22-alchlang-obligation-derivation/REPORT.md` | Value Object obligations distinguish application-v1 field-tuple semantics from the DomainSpec Equality-clause profile. |
| F5 (O) | A3/A1 | same report; `A/src/formal-claim-lowering.ts` | Interpretation/preservation/bound/case/witness fingerprints invalidate evidence without changing immutable claim identity. |
| F6 (O) | A3 | same report | Unknown/indeterminate retains reason and limit provenance, distinct from infeasible/unsupported. |
| W1-01 (W1) | F2 | `D/definitions/minted-project/supported-profiles.yml` | Named Key-and-Door positive and intended negatives reach their own predicates after legitimate registry binding. |
| W1-02 (W1) | F1 | `A/README.md`, bridge Mapping project | Same repair as N8; preserve both review IDs in closure evidence. |
| W1-03 (W1) | F1 | `A/docs/FORMAL-CLAIMS.md` | Exact current-profile fenced example includes a ceiling and parses. |
| W1-04 (W1) | F1 | `A/docs/LANGUAGE.md` | Literal check/build examples use a valid explicit backend or full prerequisite. |
| W1-05 (W1) | F2 | `D/AUTHORING-TO-RUNTIME.md` | Current table reflects candidate Rule consumers/profiles without claiming absent runtime observation. |
| W1-06 (W1) | F1 | `language/capabilities/alchlang/product-capability.json`, `sources.json` | Same Alch package half as N10; full validator passes with guards intact. |
| W1-07 (W1) | F1 | `A/README.md` | Focused test path resolves from wrapper cwd; host test runs. Docker invocation is separate operational scope. |
| W1-08 (W1) | F1 | `language/capabilities/alchlang/README.md` | Same repair as N11; both literal root commands resolve. |
| W2-01 (W2) | F2 | `D/definitions/DEFINITIONS.md` | Current D31/D32 navigation resolves via @10 pointer; @6 is historical. |
| W2-02 (W2) | F2 | `D/definitions/meta-types/meta-types.md` | Static generated-target observation is accurately current; production/runtime ceiling remains explicit. |
| W2-03 (W2) | A1/F2 | `D/formalization/method/formalization-method.json` | Context-only transition preserves FormalClaim identity and invalidates dependent evidence. |
| W2-04 (W2) | F2 | `D/IMPORT-MANIFEST.md` | MINOR/KEEP navigation annotation points to relocated vocabulary without rewriting history. |
| W3-01 (W3) | C | `D/impl/test-derivation-engine/src/bte/validation/validate-semantics.ts` | Independently valid sets with same identity but changed member content fail at comparator and bundle caller. |
| W3-02 (W3) | C | `D/impl/test-derivation-engine/src/rules/index.ts` | Prose/opaque call does not become calculation; recognized closed-form remains supported. |
| W3-04 (W3) | G | `D/impl/cli/src/assurance/certify.ts` | Supported-filesystem competing-create interleaving cannot replace a target; Lean remains separately unqualified if absent. |
| W4-EVF-01 (W4) | A2 | `A/src/application-evf-evidence.ts` | Same receipt-contradiction repair as F1; provider authenticity is not inferred. |
| W4-HTTP-03 (W4) | E | `A/src/http-invocation-adapter.ts`, outbound port/caller | Direct wrong-model `sendOnce` rejects with zero fetch; valid model still sends. |
| W4-UI-04 (W4) | E | `A/docs-app/src/workspace.ts`, `App.tsx` | Changed editable rule changes execution or is refused as an explicitly fixed simulation. |
| W4-OUTBOX-05 (W4) | B | `A/src/durable-outbox-runtime.ts` | Interleaved `markFailed`/reclaim cannot settle a new owner/generation. |
| L01 (L) | D | `D/impl/cli/src/meta-types/catalog.ts` | Mismatched canonical ID/label and retired row both reject, while valid catalog accepts. |
| L02 (L) | D | `D/impl/cli/src/meta-types/catalog.ts` | Shallow-frozen valid parent still recursively freezes descendants. |

The tracked TDE rule-set/key freshness prerequisite is attached to track C's
implementation analysis, not counted as a new numbered accepted finding.
Current bounded tests also cover incident relation/neighbor changes and legacy
ID-map tombstoning; this does not prove all persisted evidence consumers.
Dropped W3-03, W3-05 and W4-OBS-02 stay excluded. Open architecture choices,
full 39-realization coverage, provider/Lean/browser execution, and production
`runtime_guarantees_observed` remain separate from this bounded closure ledger.

## 2026-10-03 current-byte recheck of N2 and W3-04

An independent read-only reviewer rechecked these two original predicates against
the current dirty source and tests. This supplements, rather than rewrites, the
2026-09-27 snapshot. On this bounded recheck, **N2 and W3-04 are closed**:
the ledger tally becomes **35 bounded closed, 2 partial (N10, F5), and 1 open
(N9)**. N9/N10 remain owner-deferred; F5 remains incomplete. This is not a
whole-system, release, or runtime-guarantee verdict.

- **N2:** Current `formal-claim-lowering.ts` resolves and checks the exact
  selected decision bytes, accepted outcome, owner, subject identity/version,
  canonicalization, and recomputed subject digest before emitting a current
  claim. Rejected, wrong-owner, wrong-subject, wrong-version, legacy, and
  malformed selected decisions fail; a synthetic accepted decision is the
  preserving positive control. The independent reviewer ran the focused
  `formal-claim-lowering.test.ts` suite: **12/12 PASS**. The separate DomainSpec
  acceptance-decision schema is candidate-only; its owner string does not
  authenticate issuance or admit a real current claim.
- **W3-04:** On Linux/x64 with `/dev/shm` as the supported test filesystem,
  `certify.ts` uses native `renameNoReplace` after the competing-create seam,
  rejects `EEXIST`, and checks the published inode. The competing empty target
  survives unchanged and staging remains intact; absent-target publication is
  the positive control. The native `rename-noreplace.c` primitive uses
  `renameat2(RENAME_NOREPLACE)` relative to a held parent descriptor. The
  independent reviewer ran `atomic-publication-native.test.ts`: **13/13 PASS**.
  The primary run of the complete `certify.test.ts` file passed **12/12** with
  `TMPDIR=/dev/shm` and the local pinned Lean 4.33.1 binary on `PATH`.
  The initial `/tmp` attempt failed because that tmpfs was full (`ENOSPC`),
  and the first `/dev/shm` attempt lacked Lean on `PATH`; neither was a
  counterexample to the tested publication predicate. Retained-staging cleanup
  is separate operational residue, not part of W3-04 closure.

These results cover current local candidate bytes and the stated test
environment only. They do not establish authenticated owner issuance, formal
admission, provider observation, production filesystem behavior, or
`runtime_guarantees_observed`.

## 2026-10-03 F5 focused freshness recheck

An independent read-only audit found the generic post-TDE finalizer recomputes
exact selected bytes and case-domain, witness-input, and bound digests; the EVF
execution-pass path re-finalizes before its observation gate. A focused test
now explicitly asserts that changed case domain, witness input, bound,
interpretation, or preservation bytes change the finalized request **while the
selected FormalClaim reference remains identical**. The finalizer and EVF
suite passed **15/15**, the four-file request/EVF/case-claim/local-link group
passed **27/27**, and AlchLang `tsc --noEmit` passed. All positive finalizer
fixtures are synthetic. The EVF execution-pass route still fails closed
without runner-verified case observations.

F5 remains **partial**, not closed: the accepted Auth v1 meaning has no
separately accepted definitions-bearing v2 successor, admitted current v4
FormalClaim, lossless TDE projection/admission, or eligible non-synthetic
neutral case/witness set. A satisfying request and authenticated provider
observation therefore cannot be inferred from these local controls. The
pending v4 grammar and full no-call-boundary decisions remain separate gates;
historical SFOL cases cannot be relabelled as the missing current set.

## Open Questions

- Which exact owner-issued acceptance mechanism will authenticate real N2
  decisions beyond the bounded selected-byte rejection check?
- What current FormalClaim, TDE case/witness evidence, and provider-authenticated
  observations will complete F5 without promoting local fixtures to runtime
  guarantees?
- When the owner resumes deferred N9/N10 provenance reconciliation, which
  exact historical records and source bindings can be repaired without
  weakening the validators?
- Which current dirty paths belong to other work and must remain untouched?
