---
node_type: refresh-report
is_session: true
status: complete
created: 2026-07-06
spell: invoke
mode: refresh
phase_status: flag
mutation_mode: proposal-only -> apply-approved (patches P1-P9 + ledger rebase applied 2026-07-06 per user approval)
target_artifact: DomainSpec v2 Batch-1 reformulation pack (WORK-PACK / DESIGN / implementation-layering)
target_owner: batch-1 reformulation cycle (CTX-DSV2-REFORMULATE-BATCH1)
source_session: 2026-07-06 batch-1 post-R3A re-triage (this session)
---

# Invoke Refresh Report — Batch-1 Reformulation Pack (post-R3A re-triage)

## Verdict

Refresh input is valid. Since the pack was planned (2026-07-01) and its DESIGN/WORK-PACK/layering
were last refreshed for R3 (2026-07-02), the batch-1 front has moved out from under the plan:
**R3A landed and is green, and three other docs were substantially reformulated out-of-band** by the
meta-type-formalization and meta-type-definitions cycles. The plan still lists R1/R2/R4/R5/R6a/R6b as
equal fresh authoring work; on disk they are not equal.

The load-bearing new signal: **R3A's relocation of the relationship authority to
`definitions/relationships/relationships.yml` silently orphaned the legacy code-tag composability
validator**, which still loads its rules from `spec/RELATIONSHIPS.md`. `npm run tags:test` now fails 2
(`CT-VAL-002`), and `tags:test` is **R2 (TAXONOMY)'s own acceptance gate** — so R2 cannot green-close
until the validator is repointed. This is a *repair* that must precede the remaining reformulation SWUs;
the plan currently files it as a "sibling work-pack, not in this pack."

Phase status is `flag`, not `pass`: the refresh is intentionally **proposal-only** and every delta routes
to the batch-1 owner. This report does not mutate `WORK-PACK.md`, `DESIGN.md`,
`implementation-layering.md`, any of the six spec docs, the validators, or the Craft ledger.

## Scope

- **Refresh scope:** the batch-1 reformulation pack, re-baselined against the actual on-disk state of the
  six REFORMULATE docs as of 2026-07-06.
- **Mutation mode:** `proposal-only` (Invoke default; no `apply-approved` selected).
- **Evidence date:** 2026-07-06.
- **Source context selected:**
  - `impl/spec/{AXIOMS,TAXONOMY,RELATIONSHIPS,TEST-PIPELINE,DRIFT-CONVERGENCE,CONSTITUTION}.md` (on-disk state)
  - `impl/package.json` (validator scripts)
  - live runs: `npm run validate` (RC 0), `engine:test` (RC 0), `validate:docs/rels/content` (PASS), `tags:test` (FAIL 2)
  - `definitions/relationships/relationships.yml`, `definitions/meta-types/meta-types.yml`, `definitions/DEFINITIONS.md`
  - `development/reformulate-batch1/{DESIGN.md,WORK-PACK.md,implementation-layering.md}`
  - prior refresh: `refreshes/2026-07-02-r3-edge-law-artifact-refresh/`
  - Craft ledger: `.craft/ledger.yml` (`GAP-DSV2-COMPOSABILITY-ENFORCE`, root/batch-1 `next_move`)

## Target Artifact Inventory

| Artifact | Owner | Current claim | Refresh relevance |
| --- | --- | --- | --- |
| `development/reformulate-batch1/WORK-PACK.md` | batch-1 cycle | R1–R7 listed as pending fresh authoring; regression gate = `validate` + `engine:test`; R3 acceptance count-reconciled; tags:test as R2 gate. | Refresh required — status drift on R1/R2/R3/R7; missing the code-tag-retarget pre-req; regression gate omits `tags:test`. |
| `development/reformulate-batch1/DESIGN.md` | batch-1 cycle | §3 per-doc target-results; §4-D4 marked resolved by R3A. | Refresh required — annotate R1/R2/R7 as substantially matched; add the two-reader consequence of the authority relocation. |
| `development/reformulate-batch1/implementation-layering.md` | batch-1 cycle | L1 promotion evidence = "`validate-code-tags` recognizes every concept type". | Refresh required — that L1 gate is currently red; add the code-tag-retarget sub-gate before it. |
| `impl/spec/RELATIONSHIPS.md` | R3 (done) | Projection of root authority; no machine rules. | Context only — the relocation is correct; the drift is in the *consumer* (code-tag validator), not this file. |
| `impl/spec/{TEST-PIPELINE,DRIFT-CONVERGENCE,CONSTITUTION}.md` | R4/R5/R6a | Still v1 (residue confirmed on disk). | Context only — confirms these three are the genuine remaining reformulation. |
| `.craft/ledger.yml` | Craft (CTX-DSV2-REFORMULATE-BATCH1) | `GAP-DSV2-COMPOSABILITY-ENFORCE` severity `low`; next_move lists 6 equal SWUs. | Cross-owner — routed to Craft `decide`/severity update, NOT an invoke delta. |

## Source Signals

| ID | Type | Evidence | Target artifacts | Claim | Safety |
| --- | --- | --- | --- | --- | --- |
| B1-S1 | blocker_opened | `npm run tags:test` FAIL 2; `CT-VAL-002 | Failed to load relationship rules from spec/RELATIONSHIPS.md`. | WORK-PACK R2/R3, layering L1 | R3A's authority relocation orphaned the legacy code-tag composability validator; R2's acceptance gate is red. | needs_review |
| B1-S2 | status_changed | `validate:rels` PASS `canonicalSignatures=31`; `RELATIONSHIPS.md` is a projection; `DEC-DSV2-EDGE-ADMISSIBILITY` closed. | WORK-PACK R3, DESIGN §3-R3 / §4-D4, layering L1 | R3 is done; "reformulation-pending" is stale for RELATIONSHIPS. | safe |
| B1-S3 | status_changed | `AXIOMS.md`: namespace note folded in, no `implementation/domainspec` or `docs/features` residue, `validate:docs` RC 0; all 6 axioms present. | WORK-PACK R1, DESIGN §3-R1, layering L0 | R1 is ~80% delivered; remaining = verify-and-close plus the Saturn-axiom scope call. | safe |
| B1-S4 | status_changed | `TAXONOMY.md`: v2-native (14 backend / 11 UI, matches meta-types), no v1 residue. | WORK-PACK R2, DESIGN §3-R2 | R2 content is largely delivered; only the code-tag repair blocks its gate. | safe |
| B1-S5 | status_changed | DS-D1 backend + DS-D2/DS-D8 cards authored via `development/meta-type-definitions/`; live in `definitions/DEFINITIONS.md` + `definitions/meta-types/`. | WORK-PACK R7, DESIGN §3-R7, layering L2 | R7 is substantially delivered out-of-band; remaining = reconcile-and-close, not author. | safe |
| B1-S6 | artifact_drift | `TEST-PIPELINE.md:298` cites `docs/features/{feature}/UI-SPEC.md`; still `states.md`/`operations.md`/"DFDS". | WORK-PACK R4 | R4 remains genuine v1→v2 reformulation. | needs_review |
| B1-S7 | artifact_drift | `DRIFT-CONVERGENCE.md` anchors authority to `research/projects/domainspec/definitions/`. | WORK-PACK R5, DESIGN §4-D1 | R5 remains genuine reformulation; rebind to v2 drift governance (`domainspec-v2-D17`). | needs_review |
| B1-S8 | artifact_drift | `CONSTITUTION.md` fully v1-verbatim; C3/C4/C8/C9/C11 are Saturn observability rules (signals/observers/telemetry/metrics). | WORK-PACK R6a, DESIGN §3-R6a | R6a is the heaviest crosswalk and the true gate; couples to R1's Saturn-axiom call. | needs_review |
| B1-S9 | route_changed | `npm run validate` RC 0 + `engine:test` RC 0, but the aggregate excludes `tags:test`; the red is invisible to the plan's regression gate. WORK-PACK files the code-tag retarget as a "sibling work-pack". | WORK-PACK regression gate + Next route, layering L1 | The code-tag retarget is now a blocking pre-req for R2, not a sibling. | needs_review |

## Delta Summary

| Delta class | Count | Summary |
| --- | ---: | --- |
| status_changed | 4 | R3 done; R1 ~80%; R2 content delivered; R7 delivered out-of-band. |
| blocker_opened | 1 | R3A orphaned the code-tag composability validator → `tags:test` red (R2 gate). |
| artifact_drift | 3 | TEST-PIPELINE, DRIFT-CONVERGENCE, CONSTITUTION remain genuinely v1. |
| route_changed | 1 | Code-tag retarget promoted from "sibling work-pack" to blocking pre-req; regression gate should include `tags:test`. |
| no_op | 1 | DESIGN §4-D4 already records R3A resolution — keep. |

## Proposed Changes

Detailed, apply-ready patch instructions are in [REFRESH-PATCH-PROPOSAL.md](./REFRESH-PATCH-PROPOSAL.md). Summary:

1. **WORK-PACK — add pre-req row `R0` (repair, not reformulation):** repoint the legacy code-tag validator
   (`validate-code-tags` / `check-code-tag-composability`) at `definitions/relationships/relationships.yml`
   (DS-D8 root authority); acceptance `tags:test` RC 0 (was 2 fail, `CT-VAL-002`). `R0` blocks `R2`.
2. **WORK-PACK — R3 row → `executed`;** note the orphan side-effect and link to `R0`.
3. **WORK-PACK — R1 → verify-and-close;** add open sub-decision `DEC-B1-SATURN-AXIOM-SCOPE` (do axioms
   A3–A6 stay in DomainSpec-v2 or route to Saturn/drift?), coupled to R6a.
4. **WORK-PACK — R2 → content-ready;** add `Depends: R0`; keep the `tags:test` gate.
5. **WORK-PACK — R7 → substantially delivered** via meta-type-definitions; reduce to reconcile-and-close.
6. **WORK-PACK — regression gate + Next route:** add `tags:test` to the global regression gate; re-order
   Next route to `R0 → verify-close R1/R2 → reconcile-close R7 → R4/R5 → R6a → R6b`.
7. **DESIGN §3-R3 / §4-D4:** note R3A green and the *two-reader consequence* — `validate-relationships`
   reads the root authority (green); the code-tag composability path must also consume it (currently red).
8. **DESIGN §3-R1 / §3-R2 / §3-R7:** annotate each with "current doc substantially matches target
   (evidence 2026-07-06)".
9. **implementation-layering L1:** insert a sub-gate before "`validate-code-tags` recognizes every concept
   type" — "code-tag validator repointed at root authority; `tags:test` RC 0".

## Applied Changes

Applied 2026-07-06 per user approval (after the proposal-only pass):

- **WORK-PACK.md** — P1 (R0 pre-req row + note), P2 (R3 → executed + side-effect), P3 (R1 verify-and-close + `DEC-B1-SATURN-AXIOM-SCOPE`), P4 (R2 `Depends: R1, R0` + state), P5 (R7 substantially-delivered), P6 (regression gate now includes `tags:test`; Next route re-ordered R0-first).
- **DESIGN.md** — P7 (§4-D4 two-reader consequence), P8 (§3 state-update note for R1/R2/R7).
- **implementation-layering.md** — P9 (L1 R0 sub-gate; dependency order R0-first; L1 repair-residue note).
- **`.craft/ledger.yml` (ledger rebase)** — `GAP-DSV2-COMPOSABILITY-ENFORCE` `low → medium` + evidence; root & batch-1 `next_move` re-baselined (index + context rows); `ART-DSV2-REFORMULATE-BATCH1` note refreshed; new `DESC-DSV2-BATCH1-RETRIAGE-001`.

Not applied (still owner-gated): the six spec docs, the code-tag validator itself (that is R0 execution), `DEC-B1-SATURN-AXIOM-SCOPE`, and any DS-D* card promotion.

## Skipped Changes

| Candidate change | Reason skipped |
| --- | --- |
| Edit the six spec docs (AXIOMS/TAXONOMY/RELATIONSHIPS/TEST-PIPELINE/DRIFT/CONSTITUTION) | Owned by their SWUs; refresh proposes plan deltas, not content mutation. |
| Repoint the code-tag validator now | It is a task-session/execution action; refresh only names the R0 pre-req + acceptance. |
| Decide `DEC-B1-SATURN-AXIOM-SCOPE` | Owner decision (R1/R6a); refresh surfaces it, does not resolve it. |
| Update `.craft/ledger.yml` (gap severity, next_move, R7 status) | Cross-owner — routes to Craft `decide` / severity update, not an invoke mutation. |
| Promote any DS-D* card candidate→active | Owner-gated (`definitions-governance`); `authority_split_gate`. |

## Blockers And Gaps

| ID | Owner | Status | Next action |
| --- | --- | --- | --- |
| BLK-B1-CODETAG-RETARGET | drift/validation governance + Batch-2 sibling | open | Repoint `validate-code-tags`/`check-code-tag-composability` at `definitions/relationships/relationships.yml`; make `tags:test` green. Blocks R2. |
| DEC-B1-SATURN-AXIOM-SCOPE | batch-1 R1 / R6a | open | Decide whether AXIOMS A3–A6 and CONSTITUTION C3/C4/C8/C9/C11 (Saturn observability) stay in DomainSpec-v2 governance or relocate to Saturn/drift. Gates R1 close + R6a crosswalk. |
| GAP-B1-R7-CLOSURE | definitions-governance + batch-1 R7 | open | Formally reconcile/close R7 against the delivered `definitions/` cards; mark IMPORT-MANIFEST R7 done. |
| GAP-B1-LEDGER-DRIFT | Craft (CTX-DSV2-REFORMULATE-BATCH1) | open | Raise `GAP-DSV2-COMPOSABILITY-ENFORCE` `low → medium` (it is causing a red test); re-baseline root/batch-1 `next_move`; note R7 delivered. |

## Dispatch Technique Trace

Selected from `arcanum/formulae/dispatch-spec/TECHNIQUE-CATALOG.md`:

- `sequence`: on-disk state read → signals → target inventory → deltas → patch proposal → next route.
- `handle_handoff`: references target artifacts and evidence by path/handle, no copied source blobs.
- `owner_boundary_check`: Invoke authors refresh deltas only; batch-1/validation/drift/definitions owners apply them; Craft owns ledger state.
- `artifact_contract_bridge`: each delta maps to a WORK-PACK row, DESIGN section, layering gate, or validator command.
- `concrete_path_evidence`: every signal cites a repo path and, where relevant, a live command result.
- `residue_ledger`: the four blockers/gaps above stay named; skipped changes recorded.
- `authority_split_gate`: no canonical definition/edge promotion; the Saturn-axiom scope call stays owner-gated.
- `validation_loop`: the refresh carries the exact commands (`validate`, `engine:test`, `tags:test`) that prove the drift and will prove the R0 repair.

Full dispatch JSON not required: single Invoke refresh package, no delegated subagent execution, no protected-context movement.

## Distill Validation

**Verdict:** `flag`.

The refresh unit — "batch-1 post-R3A re-baseline" — is broad but coherent: it cannot be repaired one file
at a time without desynchronizing R2's gate, the layering L1 evidence, and the regression gate. Execution
splits into ordered SWUs:

- **R0** — repoint the code-tag composability validator at the root relationship authority (`tags:test` green).
- **Verify-close R1/R2** — acceptance passes only after R0; resolve `DEC-B1-SATURN-AXIOM-SCOPE`.
- **Reconcile-close R7** — against delivered `definitions/` cards.
- **Then** the genuine reformulation: R4, R5, R6a, R6b.

Gaps are named with owners and repair paths, so the `flag` output is routable.

## Validation

Refresh evidence run (2026-07-06):

- `npm run validate`: **PASS (RC 0)** — docs + rels + content + tools:test + engine:lint.
- `npm run engine:test`: **PASS (RC 0)**.
- `npm run validate:docs`: PASS. `npm run validate:rels`: PASS `canonicalSignatures=31`. `npm run validate:content`: PASS (7 concepts, 14 schemas).
- `npm run tags:test`: **FAIL 2** — `CT-VAL-002` (relationship-rule load from `spec/RELATIONSHIPS.md`) + a cascade JSON-parse failure in the strict-output test. This is the refresh trigger, not R2 content failure.

These are evidence of drift (the plan's regression gate is green while a real gate is red), not completion.

## Next Route

`task-session` on **R0 first** (repoint the code-tag composability validator; get `tags:test` green) — it
unblocks R2's gate and completes R3A's recomposition — then verify-and-close R1/R2. In parallel, a Craft
`decide` pass re-baselines the ledger drift (`GAP-DSV2-COMPOSABILITY-ENFORCE` severity, next_move, R7
status). Do **not** start R4/R5/R6a authoring until R0 is green and R1/R2 are closed.
