---
node_type: experiment-run-result
status: RUN COMPLETE — per-observable self-read recorded; SURVIVED/FALSIFIED DEFERRED to the adjudicator
consumes: criterion.md (FROZEN, read-only) + run-instantiation.md (FROZEN, read-only)
runner: Spivak, David
adjudicator: Vlachopulos (scores independently; renders the SURVIVED/FALSIFIED verdict — NOT this file)
created: 2026-06-29
boundary: INTERNAL — run output; intended-not-shipped
note: |
  This is the runner's HONEST per-observable self-read at each domain's mint-act output state
  (criterion §5 = the commit including authority/decisions/<date>-mint.md). It records HOLDS/
  FAILS per observable per domain. It does NOT render the mechanical SURVIVED/FALSIFIED verdict
  (criterion §4) — that is the adjudicator's independent job. Integrity rule honored: each
  domain's NATURAL kinds were proposed (not kinds chosen to pass Obs-A); re-skins are reported
  as re-skins, not laundered or swapped.
---

# RUNNER-RESULT — mint-foundry-boundary RUN (self-read)

Two domains were minted faithfully via the EMIT-PROCEDURE (`research` = resonantos re-mint
leak-stripped; `product` = API-contract governance). The third domain (`process` =
release-approval) is the **existing golden fixture** — NOT re-minted — self-read here at its
own mint-act output state.

Scoring boundary (criterion §5): each domain's `authority/decisions/2026-06-29-mint.md` commit;
nothing authored after it.

## Per-domain proposed kinds (the NATURAL set per domain — integrity rule)

| Domain | Proposed kinds (natural / as-built) | Domain-originated kind under F3(c)? |
| --- | --- | --- |
| **research** (resonantos re-mint) | Primary source, Method authority, Formalization discipline, Related evidence, Local synthesis, Candidate invariant, Workflow witness, External policy authority | **NONE clean** — Method authority→Constitution re-skin; Formalization discipline→Discipline re-skin; Related evidence/Workflow witness/Primary source/Local synthesis→Evidence specializations; Candidate invariant→Definition (`invariant`-as-Definition); External policy authority→foreign owner pointer |
| **process** (release-approval fixture) | Change-class ruling, Gate-set binding (+ meta-machinery rows) | **YES** — Change-class ruling + Gate-set binding, both owner route `change-class-governance` (a class→gate-set mapping function; not Constitution/Decision/Discipline) |
| **product** (API-contract governance) | Compatibility ruling, Deprecation schedule, Contract surface (+ meta-machinery rows) | **YES** — **Deprecation schedule** (owner route `lifecycle-scheduling`, a binding temporal-commitment/T0-T1-T2 sunset kind; cav2 has no schedule/timeline kind). Compatibility ruling (~Decision) and Contract surface (~Spec) reported CONTESTABLE. |

## Per-observable HOLDS / FAILS self-read (honest)

| Domain | Obs-A (≥1 F3(c) domain-originated kind+rule) | Obs-B (no cav2 on a resolution path @ output state) | Obs-C (operable w/o cav2 adding/altering a D49 row) |
| --- | --- | --- | --- |
| **research** | **FAILS** | **HOLDS** | **HOLDS** |
| **process** | **HOLDS** | **HOLDS** | **HOLDS** |
| **product** | **HOLDS** | **HOLDS** | **HOLDS** |

### research (resonantos re-mint, leak-stripped) — Obs-A FAILS, Obs-B HOLDS, Obs-C HOLDS

- **Obs-A — FAILS.** The domain's natural kind set has **no kind that is BOTH lexically AND
  owner-route new** under F3(c). The two clearest kinds are exactly the precedent's re-skins:
  *Method authority* → owner-route identical to cav2 **Constitution** (`constitution-governance`,
  governs source-posture/promotion/non-collapse); *Formalization discipline* → owner-route
  identical to cav2 **Discipline**. The remaining kinds (Primary source, Related evidence, Local
  synthesis, Workflow witness) are specializations of cav2 **Evidence**, and *Candidate
  invariant* falls under cav2's treatment of `invariant` AS the **Definition** kind. No invented
  kind was added to rescue this — **this is a genuine, informative FAIL**, the Conant–Ashby
  re-fusion the criterion §6 names as the most-likely failure. (Rule-level: REC-C5/C7 are domain
  *topical* rules but exercise the inherited constitution function, not a new owner route — so
  even the rule-level half of Obs-A is not cleanly met.)
- **Obs-B — HOLDS.** At the mint-act output state, no cav2 edge is on any resolution path. cav2
  appears only as a `source-spine` harvested-precedent row (Blocked-use: "on ANY resolution
  path") and a `crosswalk` borrow-carefully row. The §7.3 no-leak grep returns **zero** matches
  over the minted spine. The precedent's `2026-06-26` leak ("cav2 as the external resolving
  authority") is stripped at emit-time, not by a later owner decision. Removing the `--source`
  attach leaves zero dangling references.
- **Obs-C — HOLDS.** The surface is operable on its own kinds/rules without cav2 adding/altering
  a D49 row; the mint act does not open cav2's closed set. *Note the asymmetry that makes this
  cheap: because the kinds ARE re-skins of existing cav2 rows (Obs-A FAIL), they trivially never
  demand a NEW cav2 row.*

### process (release-approval — existing golden fixture, NOT re-minted) — all HOLD

- **Obs-A — HOLDS.** *Change-class ruling* and *Gate-set binding* are both routed to
  **`change-class-governance`** — a genuinely new owner route governing a class→gate-set mapping
  function that is neither a Constitution (rule), a Decision (one-off choice), nor a Discipline.
  Lexically AND owner-route new under F3(c). Rule-level: the **Blast-radius classification gate**
  and **Self-approval separation gate** (promotion-policy) + **release-approval-C4 Role
  Separation** (constitution) are domain-originated.
- **Obs-B — HOLDS.** Change-class rulings, gate-set bindings, promotion, source-posture, and
  non-collapse all resolve to the repo's own `authority/`; cav2 is citation-only (source-spine +
  crosswalk). Removing the `--source` attach leaves zero dangling references.
- **Obs-C — HOLDS.** Operable on its own kinds; the mint act does not add/alter a cav2 D49 row.

### product (API-contract governance) — all HOLD

- **Obs-A — HOLDS.** **Deprecation schedule** (owner route `lifecycle-scheduling`) is a binding
  temporal-commitment kind — a future-dated, time-indexed sunset obligation (T0 deprecate / T1
  warn / T2 remove) the repo is bound to honor. **cav2 has no schedule/timeline/temporal-
  commitment kind** and no owner governing time-indexed obligations (a `decision-gate` rules a
  point choice, not a binding future timeline). Both lexically AND owner-route new under F3(c).
  Compatibility ruling (~Decision) and Contract surface (~Spec) are reported CONTESTABLE and are
  redundant to the existential verdict. Rule-level: the **Deprecation-schedule gate**
  (promotion-policy) + **APIC-C5 Schedule Honored** (constitution) are the domain-originated
  rule support — both with no cav2 analog.
- **Obs-B — HOLDS.** Compatibility rulings, deprecation schedules, surface decisions, promotion,
  source-posture, and non-collapse all resolve to the repo's own `authority/`; cav2 is
  citation-only. §7.3 no-leak grep: zero matches. Removing the `--source` attach leaves zero
  dangling references.
- **Obs-C — HOLDS.** Operable on its own kinds without cav2 adding/altering a D49 row. The
  Deprecation-schedule kind is proposed into THIS repo's own table; it is ALSO a downstream
  `promotion-candidate` to cav2's D49 (crosswalk bridge row) — but that later owner-ratified
  promotion is a SEPARATE act, explicitly NOT the mint act (criterion Obs-C note). The mint act
  does not open cav2's closed set.

## Which domain(s) FAIL which observable

- **research — FAILS Obs-A** (all natural kinds are re-skins / Evidence-or-Definition
  specializations; no lexically-AND-owner-route-new kind). Obs-B HOLDS, Obs-C HOLDS.
- **process — no failures** (Obs-A/B/C all HOLD).
- **product — no failures** (Obs-A/B/C all HOLD).

## Runner posture (verdict deferred)

The mechanical verdict rule (criterion §4) is **NOT rendered here**: FALSIFIED ⟸ any observable
FAILS on any pre-registered domain; SURVIVED ⟸ all three HOLD on all three domains. The
adjudicator (Vlachopulos) applies that boolean rule to the HOLDS/FAILS table above
independently. This file records only the runner's honest self-read.

**Integrity statement.** research's Obs-A FAIL was NOT engineered away. Its natural (as-built)
kinds were proposed faithfully and each was honestly tested against F3(c); the re-skins were
reported as re-skins. Per the integrity rule, gaming the kinds to pass would have defeated the
experiment — the FAIL is a real result about the resonantos domain's kind shape, not a defect
of the mint apparatus (the leak-stripping worked: research passes Obs-B and Obs-C cleanly).
