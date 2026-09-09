# AUDIT — Authority-Harness / Ledger / Ontology Unification

Auditor: Fosco Loregian (n=1, P12 final_approver). Read-only outside this folder.
Inputs read in full: `findings.md` (LEAD matrix + superseded loop-0 trace), `research.md`
(verbatim explorer returns), `explorer-simon-unifier.md`, `explorer-bateson-separatist.md`,
`review-lakatos-precedent.md`, `review-quine-definitional.md`, `review-popper-witness.md`.

**VERDICT: ACCEPT.**

---

## 1. Verdict-matrix verification (C1–C7)

Each LEAD-matrix row (`findings.md:257-265`) was checked for consistency against the three
review files (Lakatos = ownership label; Quine = definitional soundness; Popper = non-vacuity).

| # | Owner label (Lakatos) | Witnessed? (Popper) | Sound/distinct? (Quine) | Verdict in findings | Reviews support? |
|---|---|---|---|---|---|
| C1 | build-from-owned — `RESULT.md:54-99` envelope | yes (envelope shipped) | COLLAPSES → envelope, field-for-field | EXTEND-OWNED | YES. Quine COLLAPSE + Lakatos ownership = EXTEND-OWNED is the correct label-not-KILL fusion. |
| C2 | already-deployed — `definitions:108-115` vs `constitution:122-139` | n/a (proof, not a fixture) | DISTINCT — the one net-new identity | GROUND (net-new) | YES. Quine: DISTINCT, "typed-hole contract is the whole new identity." A net-new GROUND survivor — matches dispatch spec. |
| C3 | build-from-owned — vault↔`ontology_events` split | yes (vault runs it) | COLLAPSES → vault split + InfoKeeper join | EXTEND-OWNED | YES. Quine COLLAPSE → EXTEND-OWNED, not KILL. Consistent. |
| C4 | build-from-owned — craft + register; signals unread | PARTIAL (W1: row writable, no validating schema) | DISTINCT (axis only); "validated" overstated | EXTEND-OWNED + BUILD | YES. Quine DISTINCT on the axis + Popper W1 (must BUILD a validator) → EXTEND-OWNED+BUILD. The `ledger_spec_axis` is the net-new GROUND survivor per dispatch spec; findings correctly downgrades the "validated" claim. |
| C5 | build-from-owned-by-analogy — session carve-out `:314-320` (Lakatos caveats: owner-licensed by analogy, NOT owner-stated) | NO WITNESS — KILL | COLLAPSES (Quine: sound but not new) | KILL-until-amendment | YES. This is the ONLY genuine KILL, and it is the bridge edge, and it is KILL-*until-amendment* (an open link, fixable via the schema-evolution gate). Exactly as the dispatch spec requires. Note the productive tension: Quine sees the *premise* as collapsing to the carve-out; Popper proves the carve-out *does not actually fire* for this edge. Findings resolves this honestly: the renamed carve-out (Quine) is the wrong reading because the carve-out is keyed on `is_session`, not on logical type (Popper). Both reviewers land on KILL-as-specified; findings adopts KILL-until-amendment. Consistent. |
| C6 | build-from-owned — envelope already carries `drift_owner`/`ontology_refs` `RESULT.md:73,84-86` | yes (homeless fixture fields land on projection metadata exactly as predicted) | COLLAPSES → envelope (strongest collapse) | EXTEND-OWNED | YES. Quine "strongest collapse" + Popper W2 (branchTarget/useScope confirm C6) → EXTEND-OWNED. Consistent. |
| C7 | build-from-owned — `ledger.schema.yml:111-121` vs `ontology-conventions.md:60`; orthogonality `:332-345` | yes (Popper: cleanest part of the tie) | DISTINCT — distinct axes, distinct objects | GROUND (ruling) | YES. Quine DISTINCT + Popper witnessed → GROUND as orthogonality-placement ruling. The third net-new GROUND survivor per dispatch spec. |

**Cross-check against the dispatch's stated expected shape:**
- "Ownership is a label, never a KILL" — HELD. Every owned candidate (C1/C3/C6 collapse, C4 partial)
  is labeled EXTEND-OWNED, never killed. Lakatos's gate "never emits a terminal KILL" is respected.
- "The only genuine KILL is the bridge edge (C5), KILL-until-amendment (an open link)" — HELD exactly.
- "The only net-new GROUND survivors should be the typed-hole contract (C2) + ledger_spec_axis (C4 axis)
  + C7 orthogonality placement" — HELD exactly (`findings.md:267-269` names precisely these three).

No matrix row is unsupported by the reviews. **Matrix VERIFIED.**

---

## 2. Claim ≤ proof spot-check

Load-bearing claims in `findings.md` are cited to an explorer return, a skeptic return, or a
source file. Spot-checks:

- C1/C6 collapse → cited Quine + `RESULT.md:54-99`/`:73,84-86`. (`findings.md:16-23`) — OK.
- C3 collapse → cited Quine + `ontology-architecture-draft.md:99-107,138-141`. (`:24-27`) — OK.
- C2 typed-hole = sole survivor → cited Quine + `definitions:108-115`/`constitution:122-139`.
  (`:32-38`, `:229-231`) — OK.
- C4 downgrade ("no in-repo validating schema; signals UNREAD; validator must be BUILT") → cited
  Popper W1. (`:68-74`, Popper `:65-82, :217`) — OK.
- C7 placement → cited Popper + `ontology-conventions.md:60` vs `ledger.schema.yml:111-121`;
  orthogonality `:332-345`. (`:239-241`) — OK.

**Bridge-edge KILL — exact blocking fact (the dispatch's special-attention item):**
`findings.md:43-55` cites:
- the two forward-only carve-outs and the **closed** skip list at `ontology-conventions.md:295-320`
  (findings `:45`, `:48`), and at the carve-out cite `:314-318`;
- target under `arcanum/development/**` is the OPEN question **OQ-C at `:312`** (findings `:50`);
- **no lawful `node_type`** (event/movement/promotion) at `:56` so the record cannot be a vault node
  carrying a lawful inverse (findings `:50-52`).

All three load-bearing facts are present and cited. They trace verbatim to the Popper review's
"Closed negative" (`review-popper-witness.md:182-193`) and scorecard (`:218`): carve-outs keyed on
`.claude/skills|agents/**` (`:301-312`) and `is_session:true` (`:314-320`); skip list closed at `:320`;
OQ-C scope clause at `:312`; no `node_type` at `:56, :570-583`. **Citation matches the source exactly.**

No uncited load-bearing claim found. (Minor note, non-blocking: the KILL facts are sourced from the
Popper witness return, NOT from the explorer returns — which is correct, since the witness construction
is Popper's work, not the explorers'. The explorers argued the *bridge* design; Popper proved it
unconstructible-as-specified. The findings attributes correctly.)

---

## 3. Honesty of the open link

`findings.md` states plainly, in multiple load-bearing places, that the ontology-tie cycle has
exactly ONE open link today:
- `:54-55`: "**The ontology-tie cycle has exactly one open link today.**"
- `:236`: "**The bridge movement-edge is KILL-until-amendment** — the ontology-tie cycle has one open link."
- `:270-272`: "KILL-until-amendment (C5 — one open link in the ontology-tie cycle, fixable only through
  the schema-evolution gate)."

And it names the EXACT amendment that would close it (`:57-65`, `:236-238`, `:250-251`), one of:
- (A) a third forward-only carve-out keyed on the movement-event's logical type, OR
- (B) a `promotion-event`/`movement` `node_type` with a lawful catalog forward/inverse pair,
authored as a discovery node via the **schema-evolution gate at `ontology-conventions.md:476`**.

This matches Popper's prescription verbatim (`review-popper-witness.md:198-200, :227-229`). The
honesty requirement is satisfied. **No REJECT trigger here.**

---

## 4. One-line answer to the dispatch goal

The proposed unification is **sound and buildable as an EXTENSION of what the repo already owns —
not as a new harness/envelope object**: the `authority_artifact_lifecycle_envelope` IS the rail
(C1/C6), the vault↔`ontology_events` split IS the typed projection (C3); the only net-new things to
build are the **typed-hole `validate_and_promote` contract** (C2), the **`ledger_spec_axis` tag +
a BUILT append-only authority-ledger validator** (C4), and the **workflow/maturity orthogonality
placement** (C7); and the **ontology-tie cycle has exactly one open link — the forward-only movement
bridge edge (C5), KILL-until-amendment — which closes only after a schema-evolution-gate amendment
(`ontology-conventions.md:476`) adds either a third carve-out or a `promotion-event` node_type with
a lawful inverse**.

---

## 5. Citation gaps found

None blocking. Every load-bearing claim is cited; the bridge-edge KILL cites the exact blocking facts
(closed carve-outs at `:301-320`/`:314-320`, OQ-C at `:312`, no `node_type` at `:56`). The only
observation worth recording (non-gap): the loop-0 section below `findings.md:78` is correctly marked
SUPERSEDED and was excluded from the audit per the dispatch instruction; the LEAD matrix is internally
consistent with all three reviews.

## Gate disposition

**ACCEPT — final approval granted.**
