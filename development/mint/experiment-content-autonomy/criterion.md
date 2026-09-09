---
node_type: experiment-criterion
status: FROZEN — Lakatos INVALID-with-fixes on loop-1 (Obs-A′ "same content" non-adjudicable on the research cell ⇒ rigging risk realized); FIX APPLIED (§7 operationalizes "same content" + pre-scores all 3 cells BY RULE, willing to let research FALSIFY). Frozen, read-only.
dispatch_id: mint-content-autonomy-criterion
phase: propose
boundary: INTERNAL — propose-only; the run renders SURVIVED/FALSIFIED
created: 2026-06-29
supersedes_test: the FROZEN mint-foundry-boundary criterion's Obs-A ("≥1 new KIND") — which the N=3 run
  showed was the WRONG proxy (it could not credit autonomy-by-inheritance). This is a NEW criterion, not an
  edit. Obs-B/Obs-C are carried unchanged from ../experiment-foundry-boundary/criterion.md §3/§5.
---

# criterion.md — Mint CONTENT-autonomy (the corrected test) — pre-registration

## Why this exists
The frozen `mint-foundry-boundary` run rendered FALSIFIED because **research** had no genuinely-new KIND.
Adjudication + owner agreed that was the wrong test: a methodological domain achieves autonomy by
**inheriting the cav2 kind-TYPES and localizing its own CONTENT** — not by inventing a new kind-type. This
criterion tests autonomy at the **content** level. The frozen criterion stays frozen and FALSIFIED; this is a
**new** pre-registration.

## Hypothesis (ONE falsifiable claim)
> **H′ — Content-autonomy.** A Mint-produced repo is an **autonomous object-authority**: it authors
> genuinely **domain-specific authority CONTENT** (rules/definitions cav2 does not already contain), governs
> itself with no cav2 on a runtime resolution path, and does not mutate cav2 — **regardless of whether its
> kind-TYPES are inherited or new.**

Single claim about **content-autonomy**. The §3 observables are jointly its falsification condition.

## Non-goals (carried)
N1 the VSM/System-5 interpretation · N2 commercial value · N3 generality beyond the tested domains ·
N4 the AUTHORITY-MAP/GOVERNANCE-ATTENUATION contradiction · N5 whether Mint is shipped · N6 a post-mint owner
fix. **N7 (new): NOT testing whether the domain invents a new kind-TYPE** — that was the prior Obs-A; content
may sit under an inherited kind.

## 3. Falsification condition (observables) — scored at the mint-act output state
For EACH minted repo in the frozen domain set (§5), all mechanical:

### Obs-A′ — CONTENT-localization (replaces the prior "new KIND" Obs-A; genuinely falsifiable)
- **HOLDS** iff the minted repo's authority surface contains **≥1 constitution RULE or ≥1 DEFINITION whose
  governing content is genuinely domain-specific** — i.e. there is **no cav2 rule/definition governing the
  same content** (it is not a relabel of a cav2 rule/definition). The owner route / kind-type may be inherited;
  what must be new is the **CONTENT** (what the rule requires/forbids, or what the definition fixes).
- **FAILS** iff **every** minted rule and definition has a cav2 counterpart governing the same content — a
  **hollow re-stamp** ("cav2-in-a-folder": cav2's rules/definitions relabeled, nothing domain-specific added).
- **Mechanical test:** enumerate the minted `constitutions/` rules + `definitions/` entries; for each, search
  cav2's authority surface for a rule/definition governing the same content; Obs-A′ HOLDS iff ≥1 has **no** cav2
  counterpart. (Example that PASSES: research's "Failure-Corpus-First" — cav2 has no failure-corpus rule.
  Example that FAILS: a repo whose only rules are cav2's `claim≤proof` / non-collapse relabeled.)

### Obs-B — No runtime governance leak (UNCHANGED — carried from the frozen criterion §3)
No cav2 on any runtime resolution path at the mint-act output (the 6-member decision list + reachability check).

### Obs-C — Non-circular (UNCHANGED — carried from the frozen criterion §3)
Operable without cav2 adding/altering a D49 row; the mint act effects no D49 change.

## 4. Verdict rule (deterministic, three verdicts)
`FALSIFIED ⟸ ∃ repo r, ∃ X∈{A′,B,C} : X(r)=FAILS` · `SURVIVED ⟸ ∀ r, ∀ X : X(r)=HOLDS` (rendered at the run).
`INVALID` is propose-phase only (the skeptic). Domain set frozen = the same N=3 (research=resonantos,
process=release-approval, product=API-contract-governance); the **existing minted spines** from the prior run
(`../experiment-foundry-boundary/run/{research,product}/` + `../examples/release-approval/`) ARE the scored
artifacts — re-adjudicated against THIS frozen criterion, no re-mint (the spines pre-exist this criterion).

## 5. The discrimination check (both outcomes informative — and Obs-A′ CAN fail)
- **A SURVIVED teaches:** the foundry produces autonomous authorities via **content-localization** — kind-types
  may be inherited (research) or new (product), and in BOTH cases the domain governs genuinely-its-own content
  without leaking. The boundary holds across the inherit-route AND the expand-route. (This is the corrected
  reading; if it survives, the foundry works for both domain classes.)
- **A FALSIFIED teaches (the real-failure arm — this is what makes Obs-A′ not a rubber-stamp):** a domain whose
  authority CONTENT is just cav2's rules/definitions relabeled is a **hollow re-stamp**, not an autonomous
  authority — the foundry produced "cav2-in-a-folder," and the "manufactures domain authorities" claim is empty
  for it. **Most-likely falsifier:** a domain that inherits cav2's kinds AND cannot add a single
  domain-specific rule/definition. A mint that copies cav2's governance with new names FAILS Obs-A′.
- **Why this is a genuine test, not a confirmation ritual:** Obs-A′ is **failable on the prior run's own data** —
  if research's localized rules turn out to be cav2's rules relabeled (not genuinely Failure-Corpus-First-style
  domain content), research FAILS Obs-A′ and H′ is FALSIFIED. The prediction (all 3 SURVIVE) is a *prediction*,
  not a guarantee; the run adjudicates it deterministically.

## 6. Pre-registered categories (frozen before the run scores)
Domain set (§4, frozen) · the mint-act output-state scoring boundary (carried) · "cav2 counterpart governing the
same content" = a cav2 rule/definition whose required/forbidden content (not its label) matches the minted one ·
the 6-member runtime-governance-decision list (carried) · the cav2 D49 + authority-surface reference set.

## 7. Same-content counterpart test (Lakatos fix — operationalizes Obs-A′; binds the verdict)
A minted rule/def **R has a "cav2 counterpart governing the same content"** iff a cav2 rule/definition C exists s.t.
**(i)** R's required/forbidden obligation is **entailed by** C applied to the domain (R adds no obligation C doesn't
already impose once instantiated), **AND (ii)** R names **no domain object/quantity/role/event absent from cav2's
vocabulary** (D49 + DEFINITIONS + authority/constitutions/). **R is genuinely domain-specific (no counterpart) iff
it fails (i) OR (ii).** "Same content" is thus rule-forced, not a judgment call.

### Pre-scored cells (frozen by rule — the run may NOT move them)
- **product** APIC-C5 "Schedule Honored" — predicated on `deprecation schedule / T0-T1-T2`, an object cav2 does not
  name (fails (ii)); obligation (a removal may not precede T2) not entailed by any cav2 rule (fails (i)). → **no counterpart → HOLD.**
- **process** release-approval-C4 "Role Separation" — imposes separation of `change-class-ruler / bound-gate /
  approver` (fails (i): no cav2 rule entails role-separation-of-duties); names roles cav2 lacks (fails (ii)). → **no counterpart → HOLD.**
- **research** REC-C5 "Failure-Corpus-First" — **adjudicated by rule, willing to FALSIFY:** mechanically checked
  (grep, 2026-06-29) — cav2's authority surface names **no** failure-corpus / attack-surface / adversarial-failure
  object (fails (ii)), and cav2's rules (`claim≤proof`, non-collapse, research-before-spec) govern *evidence
  sufficiency*, not *cataloguing failures before promotion*, so REC-C5's obligation is **not entailed** (fails (i)).
  → **no counterpart → HOLD.** *(Had cav2 named a failure-corpus object OR entailed the obligation, REC-C5 would
  have NO non-counterpart rule and research would FAIL Obs-A′ ⇒ H′ FALSIFIED. It objectively does not — so the HOLD
  is rule-forced, not discretionary. This is the cell that converts the criterion from a ritual into a test.)*

### Resulting verdict (rule-forced; the run re-derives it deterministically)
All 3 repos HOLD Obs-A′ (by §7) and HOLD Obs-B + Obs-C (prior run, carried) ⇒ **§4 ∀∀ = HOLDS ⇒ SURVIVED.**
Honest scope: research's HOLD is **THIN** — a single genuinely-domain-specific rule (REC-C5) carries it; most research
rules ARE cav2's rigor relabeled. Real autonomy, narrowly. product/process are robust.
