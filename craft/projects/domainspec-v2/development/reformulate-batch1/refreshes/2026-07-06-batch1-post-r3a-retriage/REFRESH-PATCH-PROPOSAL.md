---
node_type: refresh-patch-proposal
status: proposal-only
created: 2026-07-06
report: ./REFRESH-REPORT.md
target_owner: CTX-DSV2-REFORMULATE-BATCH1
---

# Batch-1 Refresh — Patch Proposal (proposal-only)

Apply-ready edits for the batch-1 owner. **Nothing here is applied.** Each patch cites its signal
(`B1-S*`) from [REFRESH-REPORT.md](./REFRESH-REPORT.md). Order matters: **P1 (R0) is the pre-req** that
unblocks the rest.

---

## P1 — WORK-PACK: add pre-req row `R0` (repair) · signals B1-S1, B1-S9

Add to the SWU manifest table, **above R1** (it gates R2):

```
| **R0** | pre | Repoint legacy code-tag validator (`validate-code-tags` / `check-code-tag-composability`) from `spec/RELATIONSHIPS.md` → root `definitions/relationships/relationships.yml` (DS-D8 authority) | — | `npm run tags:test` RC 0 (was 2 fail, `CT-VAL-002`); no relationship-rule load error; composability check reads the 31 canonical signatures |
```

Add a note under the manifest:

> **R0 is a repair, not a reformulation.** R3A (2026-07-02) relocated the relationship authority to the
> root machine file and thinned `impl/spec/RELATIONSHIPS.md` to a projection. `validate-relationships`
> follows the root authority (green), but the Batch-2 code-tag composability validator still loads rules
> from `spec/RELATIONSHIPS.md` and now errors (`CT-VAL-002`). Until R0 lands, `tags:test` — **R2's
> acceptance gate** — stays red. This is the item the plan previously deferred to a "sibling work-pack".

## P2 — WORK-PACK: R3 row → executed · signal B1-S2

In the SWU manifest, mark R3 `executed (R3A, 2026-07-02)` and append to its row:

> Side-effect: relocating the authority orphaned the code-tag composability consumer — see **R0**.

(The R3 acceptance text itself is accurate; only the status + side-effect note change.)

## P3 — WORK-PACK: R1 → verify-and-close + Saturn-axiom decision · signal B1-S3

Replace R1's framing "re-author each axiom v2-native" with a verify-and-close note:

> **State (2026-07-06):** `AXIOMS.md` already carries the namespace-disambiguation clause, has no
> `implementation/domainspec` / `docs/features` residue, and passes `validate:docs`. Remaining R1 work is
> **verify-and-close** (confirm A2↔C6/C7 binding + every cited axiom ID resolves), **not** fresh authoring.
> **Open — `DEC-B1-SATURN-AXIOM-SCOPE`:** axioms A3–A6 (computable governance, observer/executor split,
> shift-left, feedback budget) are v1 Saturn/observability axioms carried verbatim. Decide whether they
> stay in DomainSpec-v2 governance or relocate to Saturn/drift **before** closing R1 — the same decision
> governs R6a's C3/C4/C8/C9/C11 crosswalk.

## P4 — WORK-PACK: R2 → content-ready, depends R0 · signal B1-S4

Change R2 `Depends` from `R1` to `R1, R0`, and append to its acceptance:

> **State (2026-07-06):** `TAXONOMY.md` is v2-native (14 backend / 11 UI, matching the meta-type schemas),
> no v1 residue. The acceptance gate `tags:test` is currently **red because of R0**, not the taxonomy
> content — it green-closes once R0 lands.

## P5 — WORK-PACK: R7 → substantially delivered · signal B1-S5

Prepend to R7:

> **State (2026-07-06):** R7 is substantially delivered out-of-band by the `meta-type-definitions` cycle —
> DS-D1 (backend) meta-type cards + DS-D2/DS-D8 relationship cards live in `definitions/DEFINITIONS.md`,
> `definitions/DEFINITIONS-INDEX.md`, and `definitions/meta-types/`. Remaining R7 work is
> **reconcile-and-close** (confirm every TAXONOMY type / RELATIONSHIPS verb resolves to a DS-D* card; mark
> the IMPORT-MANIFEST R7 row done), **not** authoring. UI DS-D1.15..25 remain deferred to MT5.

## P6 — WORK-PACK: regression gate + Next route · signal B1-S9

Change the global regression gate line from:

> Global regression gate for **every** SWU: `npm run validate` **and** `npm run engine:test` stay RC 0.

to:

> Global regression gate for **every** SWU: `npm run validate`, `npm run engine:test`, **and**
> `npm run tags:test` stay RC 0. (`tags:test` is added because R3A showed the aggregate `validate` does not
> cover the code-tag composability path — a real gate can be red while `validate` is green.)

Replace the "Next route" ordering with:

> `task-session` per SWU in the order **R0 → {verify-close R1, R0→R2} → reconcile-close R7 → {R4, R5} →
> R6a → R6b**. R0 is first (unblocks R2 + completes R3A recomposition).

## P7 — DESIGN §3-R3 / §4-D4: two-reader consequence · signal B1-S2, B1-S1

Append to §4-D4 (already marked resolved):

> **Consequence (2026-07-06):** the authority now has **two readers**. `validate-relationships` reads the
> root machine file (green). The Batch-2 code-tag composability validator still reads
> `impl/spec/RELATIONSHIPS.md` and must be repointed at the root authority (**R0** / `GAP-DSV2-COMPOSABILITY-ENFORCE`)
> before `tags:test` is green again.

## P8 — DESIGN §3-R1 / §3-R2 / §3-R7: annotate matched target-results · signals B1-S3/S4/S5

Add one line to each of the §3 R1, R2, R7 blocks:

> _State 2026-07-06: the current on-disk doc substantially matches this target-result (see the
> post-R3A re-triage refresh); remaining work is verify/reconcile-and-close, not authoring._

## P9 — implementation-layering: L1 sub-gate · signals B1-S1, B1-S9

In the L1 row's "Promotion evidence" cell, insert **before** "`validate-code-tags` recognizes every
concept type":

> code-tag composability validator repointed at root `definitions/relationships/relationships.yml`
> (`tags:test` RC 0);

and add to the "Layer risks / residue" line:

> L1 carries a repair pre-req (R0): R3A's authority relocation left the code-tag validator reading a
> now-ruleless `spec/RELATIONSHIPS.md`.

---

## Cross-owner items (NOT invoke patches — route separately)

| Item | Owner | Action |
| --- | --- | --- |
| `GAP-DSV2-COMPOSABILITY-ENFORCE` severity `low → medium` | Craft (`.craft/ledger.yml`) | It is causing a red `tags:test`; re-severity via Craft `decide`/gap update. |
| Root + batch-1 `next_move` re-baseline | Craft | Reflect R0-first ordering + R1/R2 verify-close + R7 delivered. |
| `DEC-B1-SATURN-AXIOM-SCOPE` | R1/R6a owner (`decision-gate`) | Resolve the Saturn-axiom keep/relocate call. |
| R7 formal closure | `definitions-governance` + IMPORT-MANIFEST | Mark R7 delivered; close the DS-D* reconciliation. |

## Apply instructions

This is `proposal-only`. To apply, the batch-1 owner re-runs `invoke refresh` with `apply-approved`, or a
`task-session` executes P1–P9 with the acceptance evidence in each patch. After any apply, re-run
`npm run validate && npm run engine:test && npm run tags:test` and confirm all three RC 0.
