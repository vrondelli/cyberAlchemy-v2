---
tags: [framework-unification, review, red-team, findings]
node_type: review-findings
is_session: false
layer: architecture
nature: reference
status: active
version: 1.0.0
last_updated: 2026-06-15
created_by: victorboscaro@gmail.com
---

# Review Red-Team — Verified Change Requests

> **Final.** Synthesizer draft (3 attackers) reconciled through both verifiers — V1 (deductive
> against governing law) and V2 (empirical against the literal files). Surviving findings only;
> refuted/over-reaching ones are listed under "Dropped / demoted" with the verifier reason.
>
> Source attacker returns (verbatim): [`attacks.md`](./attacks.md).
> Targets: `research/domainspec-findings.md`, `discovery/discovery.md`.
>
> **Controlling reconciliation (V1).** The ../domainspec findings-template / ontology-conventions
> are *vault* law; the targets live in **domainspec-core** (a different repo) and were authored as
> a **disclosed pragmatic adaptation**, not via the strict agents. So that law binds only where the
> artifact *claims conformance* or *adopts the convention itself*. Findings that depended on the
> external vault law hard-binding outside the vault were dropped/demoted; findings convicted by the
> docs' **own adopted conventions** survive.

---

## Surviving change requests

### Artifact 1 — research/domainspec-findings.md

| # | line | evidence | severity | fix | verifiers |
|---|------|----------|----------|-----|-----------|
| CR-F6 | l150 | Edge `feeds` is not in the ontology-conventions edge catalog; Authoring Rule 2 forbids coining edges inline; the file itself adopts the catalog (uses `derives-from`, `cites`), so it is bound by it. Inverse of `derives-from` is `derives`. | **MAJOR** | Change `feeds` → `derives`. | V1 UPHOLD, V2 UPHOLD |
| CR-F2 | l66 | R18 actual-spend rendered as a prose `unrecorded` line, not the table shape. | MINOR | Optionally restore the table skeleton with cells `unrecorded` (R18 is field-completeness, not table-shape — honest-absence is template-blessed, so not load-bearing). | V1 DOWNGRADE, V2 present |
| CR-F5 | l147-150 | Node typed `subagents-findings` has no `derives-from` to a strategy/research node. | MINOR | Labeling nit only — the triad rule presumes those nodes exist; here they never did and the file links its surviving provenance. Consider a node_type that fits, or leave as disclosed. | V1 DOWNGRADE, V2 present |
| CR-F7 | l55-57 | Per-agent model/budget all `unrecorded` (schema intact, disclosed). | MINOR | Optional backfill. | both minor |
| CR-F9 | l150 | Link text `./discovery.md` ≠ href `../discovery/discovery.md` (href works). | MINOR | Correct the link text. | both UPHOLD |

**Verdict: FIX** (1 MAJOR: CR-F6).

### Artifact 2 — discovery/discovery.md

| # | line | evidence | severity | fix | verifiers |
|---|------|----------|----------|-----|-----------|
| CR-D1 | l5 | `layer: ontology` mis-applied — Appendix B defines `ontology` = vault-self docs; this is a product-engine architecture doc. `architecture` (already present) is the correct primary. | **MAJOR** | Drop `ontology`; keep `architecture` (add `application` if in scope). | V1 UPHOLD (down from CRITICAL), V2 present |
| CR-D3 | l43 | Cites `[findings F1]` for the "DomainSpec/Arcanum/**Saturn** intent→evidence" triad, but F1 is only the layers claim and **"Saturn" appears nowhere in findings.md**; the triad lives in RESEARCH.md §The three pillars (l19-27). Unsupported-claim defect (discovery-writer step 7). | **MAJOR** | Repoint to `../research/RESEARCH.md#the-three-pillars-from-cyberalchemy`. | V1 UPHOLD, V2 UPHOLD |
| CR-D2 | l43,50,67,101,106,111,121 | 7 citations use coarse `#findings`/`#analysis` anchors though granular `#f1--…`/`#t1--…` exist. | MINOR | Precision-only (anchors resolve; R17 granularity governs findings→research, not discovery→findings). Optionally repoint to granular anchors. | V1+V2 DOWNGRADE |
| CR-D5 | l151 | "Pragmatic chain" note lacks the upstream "provenance lost" caveat. | MINOR | Add the caveat. | both UPHOLD |
| CR-D6 | l90 | "the rest of `projects/` **are** the actual applications" stated as fact from a description-only read. | MINOR | Soften to "appear to be". | both UPHOLD |
| CR-D7 | l77-82 | D-3 (sequence research→discovery→paired-views) is a process decision filed under "Decisions taken" but cites no finding. | MINOR | Move to a process/plan note. | both UPHOLD |

**Verdict: FIX** (2 MAJOR: CR-D1, CR-D3).

---

## Dropped / demoted (verifier-refuted — recorded, not actionable)

| # | was | verdict | reason |
|---|-----|---------|--------|
| CR-F1 | CRITICAL | **DROP** | R17 cannot mandate citing a `domainspec-research.md` that was never produced; the disclosed adaptation + self-imposed Fidelity 0.5 penalty discharges its intent (V1). No ratified waiver needed — law doesn't hard-bind outside the vault. |
| CR-F3 | MAJOR | **DROP** | Cost is the mechanical ratio of two `unrecorded` inputs → `n/a` is the *correct* value; scoring `0` would fabricate a measurement R22 forbids (V1). |
| CR-F4 | MAJOR | **DROP** | R22 (template l70) declares Fidelity/Coverage/Independence are *judgments, not measurements* — they cannot be "inflated vs the trail"; the file already self-penalizes and footnotes the uninspectable trail (V1). *(Owner may still choose to lower them — a judgment call, not a violation.)* |
| CR-D4 | MAJOR | **DROP** | The discovery-writer lists tensions/gaps as *sources*, not an exclusivity rule; undecided T1/T2 are correctly OQ-1/OQ-2 (an Alternative is a path rejected *after a decision*; T1/T2 have no decision). Tensions are cleanly routed to OQ with citations (V1+V2). |
| CR-F8 | MINOR | **DROP** | All 3 dispatch IDs verified present in the ledger (V2). Nothing to fix. |

---

## Cleared by attackers (held up honestly — no change)

- **No Lean/PermGuard overclaim** — F5 / OQ-4 / the "does NOT claim" block faithfully keep "the
  proofs do not certify Arcanum runs" + the bash-curl egress negative (matches DESIGN §4 / PERMGUARD §4).
- R16 section order, R22 judgment markers, R23 preamble all conformant; discovery correctly omits
  `veracidade`/`convicção`; all enums legal except the `ontology` layer value (CR-D1).
- All relative file paths resolve; all `./RESEARCH.md#…` anchors resolve; D-1→F4, D-2→F2,
  A-1/A-2, OQ-1..5 all trace cleanly; T1/T2 double-ownership is intentional, not a link-graph defect.

---

## Closing change-request list (ordered by severity)

### MAJOR (3 — durable; convicted by the docs' own conventions)
1. **CR-D3** [discovery l43] — repoint the Saturn-triad cite from `findings F1` to `RESEARCH.md` §pillars.
2. **CR-D1** [discovery l5] — drop the `ontology` layer value (keep `architecture`).
3. **CR-F6** [findings l150] — change the invented edge `feeds` → catalogued `derives`.

### MINOR (8 — optional / hygiene)
4. CR-F9 — fix link text `./discovery.md` → match href.
5. CR-D5 — add the "provenance lost" caveat to the pragmatic-chain note.
6. CR-D6 — soften "are the actual applications" → "appear to be".
7. CR-D7 — move process decision D-3 out of findings-traced Decisions.
8. CR-D2 — (optional) repoint 7 coarse anchors to granular.
9. CR-F2 — (optional) restore the R18 spend-table skeleton.
10. CR-F5 — (optional) reconcile the `subagents-findings` triad/labeling.
11. CR-F7 — (optional) backfill per-agent model/budget.

---

> **Both artifacts: FIX** (each carries ≥1 surviving MAJOR). The original 3 CRITICAL draft
> findings did **not** survive verification: two (R17, R18-shape) were discharged by the disclosed
> pragmatic adaptation, and the layer CRITICAL demoted to MAJOR. The durable defects are three
> MAJORs convictable without invoking external vault law — a mis-citation, a misapplied enum value,
> and an invented edge.
