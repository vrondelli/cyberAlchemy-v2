---
tags: [framework-unification, review, red-team, attacks]
node_type: review-attacks
is_session: false
layer: architecture
nature: reference
status: active
version: 0.1.0
last_updated: 2026-06-15
created_by: victorboscaro@gmail.com
---

# Review Red-Team — Attacker Returns (verbatim)

> Targets reviewed:
> - `projects/framework-unification/research/domainspec-findings.md`
> - `projects/framework-unification/discovery/discovery.md`
>
> This file records the three attacker returns **verbatim**, grouped by attacker.
> The deduped, severity-ranked change-request list derived from these returns lives in
> [`findings.md`](./findings.md) (DRAFT, pending verifier refutation).
>
> **Cross-confrontation note.** `robot_talks` cross-confrontation was folded into this
> synthesis: this was a **single parallel pass** — each attacker swept independently and the
> initial positions are the final positions (no second confrontation round). No attacker
> retracted or revised, so initial = final throughout.

---

## A1 — fidelity / governance

- **A1-F01** [findings] **CRITICAL** R17: cites RESEARCH.md *synthesis* not the mandated verbatim `domainspec-research.md` with `#agent-N` anchors (template line 16). Self-disclosed (l17-22,84) + Fidelity self-penalized 0.5, but no ratified waiver exists → live violation. Fix: persist a verbatim research.md and re-anchor, OR record a ratified R17 waiver.
- **A1-F02** [findings] **CRITICAL** R18: Actual-spend table (template l53-59: Tokens in|out|Total + Sum) collapsed to one prose line "unrecorded" (l66). Schema *shape* dropped. Fix: restore the table skeleton, cells `unrecorded`.
- **A1-D01** [discovery] **CRITICAL**: frontmatter `layer: ontology` (l5) mis-applied — Appendix B defines `ontology` layer = vault-self docs; this doc is about the engine. Fix: `layer: architecture` (+`application`), drop `ontology`.
- **A1-F03** [findings] **MAJOR** R21/R22: Cost-discipline (the only *mechanical* component) scored `n/a` (l75) → four-component grade is really three. Fix: mark grade incomplete-by-necessity citing missing telemetry, don't `n/a` the mechanical anchor.
- **A1-F08** [findings] **MAJOR**: node typed `subagents-findings` lacks `derives-from` to a `domainspec-subagents-strategy` AND a `subagents-research` node (ontology-conventions triad rule → "malformed"). Fix: retype, or add the required edges.
- **A1-D05** [discovery] **MAJOR**: discovery-writer contract says Alternatives derive from findings tensions T1/T2; here T1/T2 became OQ-1/OQ-2 and Alternatives are author-supplied. Fix: confirm/realign the tension→alternative routing.
- **A1-D06** [discovery] **MAJOR** bidirectionality: findings side (domainspec-findings.md l150) declares un-catalogued edge `feeds`; catalogued inverse of `derives-from` is `derives`. Fix: change `feeds`→`derives`.
- **A1-F04** [findings] **MINOR** R18: per-agent model/budget all `unrecorded` (schema intact, disclosed). Optional backfill.
- **A1-F09** [findings] **MINOR**: verify eval/edit dispatch-id consistency vs telemetry (A2 confirmed they exist).
- **SURVIVED:** R16 order, R22 markers, R23 preamble, discovery veracidade/convicção correctly omitted, node_type/nature/status enums legal, created_by legal.

---

## A2 — ownership / reference-integrity

- **A2-M1** [discovery] **MAJOR**: 7 citations use section-coarse anchors `#findings`/`#analysis` (l43,50,67,101,106,111,121) though granular anchors EXIST in findings.md (e.g. `#f1--the-three-folders-are-three-layers-of-one-engine-not-separate-products`, `#t1--dispatch-composition-has-two-homes`). R17 granularity thrown away. Fix: repoint each to its granular anchor.
- **A2-M2** [discovery] **MAJOR** content-mismatch: l43 cites "findings F1" for the DomainSpec/Arcanum/**Saturn** intent→evidence triad, but F1 is ONLY the layers claim; the triad lives in RESEARCH.md §Mental model/§pillars and Saturn is never in findings.md. Fix: cite `../research/RESEARCH.md#the-three-pillars-from-cyberalchemy`.
- **A2-m1** [findings] **MINOR**: l150 link TEXT `./discovery.md` contradicts its href `../discovery/discovery.md` (href works; text misleading). Fix: correct link text.
- **A2-m2** **MINOR**: the disclosed R17 pragmatic substitution — no mechanical fix (overlaps A1-F01).
- **RESOLVED FINE:** all relative file paths exist; all `./RESEARCH.md#...` anchors resolve; all 3 dispatch IDs exist in telemetry ledger; T1/T2 double-ownership is intentional (recorded for resolution), not an accidental link-graph defect.

---

## A3 — abuse / gaming

- **A3-G1** [findings] **MAJOR**: Fidelity 0.5 dresses a *destroyed* audit trail as "pragmatic adaptation" — agent-level provenance is ~0% recoverable, not half. "Nothing is fabricated" is unfalsifiable once the evidence is gone. Fix: lower Fidelity ≤0.3 and state provenance is unrecoverable.
- **A3-G2** [findings] **MAJOR**: Coverage 0.8 is self-serving — the engine (arcanum) AND the Lean repo, the two objects the question turns on, were both UNREAD (mapped by description). Fix: Coverage ~0.5-0.6 with corrected note.
- **A3-G3** [findings] **MAJOR**: Independence 0.7 grades a property the note itself says "can no longer be inspected." Fix: `unverifiable` (like cost) or ≤0.4.
- **A3-G4** [discovery] **MINOR**: "pragmatic chain" euphemism (l151) loses the "provenance lost" caveat one hop downstream. Fix: add the caveat.
- **A3-G5** [discovery] **MINOR**: A-1 "the rest of projects/ are the actual applications" (l90) stated as settled fact from a description-only read. Fix: soften to "appear to be".
- **A3-G6** [discovery] **MINOR**: D-3 (sequence research→discovery→paired-views) is a *process* decision filed under "Decisions taken (from findings)" though it doesn't trace to a finding. Fix: move to a process/plan note.
- **HELD UP HONESTLY:** NO Lean/PermGuard overclaim — F5/OQ-4/NOT-claims block faithfully keep "proofs do not certify Arcanum runs" + the bash-curl negative (matches DESIGN §4 / PERMGUARD §4). D-1→F4, D-2→F2, A-1/A-2, OQ-1..5 all trace cleanly.

---

## Synthesis note

Twenty findings were raised across the three attackers (A1: 9 + survived set; A2: 4 + resolved
set; A3: 6 + held-up set). The deduped roster, with overlap collapses noted, is in
[`findings.md`](./findings.md). Overlaps folded during synthesis:

- **R17 / Fidelity root:** A1-F01 ↔ A2-m2 ↔ A3-G1 all touch the same destroyed-research-provenance
  root and are merged into one CRITICAL change request (mechanical R17 fix) plus one MAJOR grading
  correction (Fidelity score).
- **Coarse anchors:** A1's coarse-anchor concern is the same defect A2-M1 documents granularly;
  A2-M1 is the surviving representative.
