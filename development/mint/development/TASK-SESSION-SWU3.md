---
node_type: task-session-record
is_session: true
status: candidate
boundary: INTERNAL — Mint is intended-not-shipped; records the bounded build of SWU-3 + the first golden fixture
created: 2026-06-29
authored_by: task-session
capability: task-session
work_pack: cyberAlchemy-v2/development/mint/WORK-PACK.md
swus_done: [SWU-3]
swus_prior: [SWU-1, SWU-2]
swus_blocked: [SWU-4]
mvp_boundary: private-only (owner decision 2026-06-29)
note: Paths repo-root-relative from domainspec-core/. This is a DEVELOPMENT artifact (a self-check on ONE hand-built example), NOT the frozen N=3 experiment run.
---

# Mint — TASK-SESSION RECORD (SWU-3 + first golden fixture)

Bounded execution of **SWU-3 (the L1 stage-2 emit-logic)** + production of the **first
positive golden fixture** the harness lacked. claim ≤ proof: the procedure is
**intended-not-shipped emit-logic**; the fixture is **one hand-built worked example** scored
by hand — this is explicitly NOT the frozen N=3 experiment run (criterion §4), which renders
SURVIVED/FALSIFIED.

## SWU-3 — emit procedure (DONE)
Wrote `templates/EMIT-PROCEDURE.md`: the deterministic L1 stage-2 procedure that takes the 6
SWU-2 templates + a `<DOMAIN>` spec and instantiates the domain's authority spine.
- **Per-template steps** (Step 0 fill-set derivation → Steps 1–6, one per template): how each
  placeholder is filled, where it's written in the minted tree, how a proposed kind is routed
  through the **authority-triage front-door (review-mode, INTERNAL)** — precedent sweep →
  F3(c) membership test → D49 default-deny → verdict `new-authority (domain-local)` routed to
  the **domain owner** for ratification (Mint proposes; owner ratifies).
- **Inherit/localize boundary enforced** via the SPEC boundary test baked into every fill
  (*how* authority is made → inherit verbatim; *what* authority the domain holds → localize).
- **No-leak rule (Obs-B)** baked in: the only cav2 mentions a conforming emit produces are the
  source-spine citation-only row, the crosswalk borrow-carefully row, and optional definition
  Evidence citations — every governance decision resolves to the minted repo's own `authority/`.
- **Signed record = L0-attributional PLACEHOLDER** (§6): L2 cryptographic signing is BLOCKED on
  the attestation capability; the procedure emits an honest "who-proposed-what" record, not a
  forged seal. Obs-A/B/C are scorable at that record's commit (the mint-act output state).
- **§7 emit self-checks** (parses / default-deny / no-leak grep / domain-originated present /
  resolution scan) — the per-emit analog of the criterion sub-rules.

## The golden fixture (DONE) — `examples/release-approval/`
**Domain chosen:** a **release-approval / change-advisory workflow** — a genuinely distinct
*process* shape (governs an operating procedure: classifying a software change and gating its
release), NOT research (resonantos) and NOT economy/product.

**Domain-originated authority kind:** **Change-class ruling** (+ its enforced consequence
**Gate-set binding**), routed to a **new owner route `change-class-governance`** — a standing
classification function that maps a change to its required approval gate-set. This is the Obs-A
core: a governance function cav2 has no D49 row for.

Files written (the worked minted authority spine):
- `examples/release-approval/authority/AUTHORITY-MODEL.md` (2 domain-originated kinds, each with a default-deny cell)
- `examples/release-approval/authority/source-spine.md`
- `examples/release-approval/authority/promotion-policy.md` (2 domain-originated gates)
- `examples/release-approval/authority/constitutions/release-approval-CONSTITUTION.md` (1 domain-originated object rule: C4 Role Separation)
- `examples/release-approval/definitions/DEFINITIONS.md` (2 cards; D2 = the domain-originated term)
- `examples/release-approval/RELATED-FRAMEWORK-CROSSWALK.md` (cav2 = borrow-carefully precedent)
- `examples/release-approval/authority/decisions/2026-06-29-mint.md` (L0-attributional placeholder record)

## §7 emit self-check results (deterministic, run over the fixture)
| check | result |
|---|---|
| 1. parses (4-col tables, no dangling `<...>`) | PASS |
| 2. default-deny (every PROPOSED kind has a Blocked-use cell) | PASS — both kind rows carry explicit Default-deny cells |
| 3. no-leak grep `as (external )?method authority` | PASS — zero matches; all 11 cav2 mentions in citation/precedent/forbid/differentiation frames |
| 4. domain-originated present | PASS — 2 kinds + 2 promotion gates + 1 constitution rule flagged domain-originated |
| 5. resolution scan (no positive "resolve to cav2"; no dangling on attach removal) | PASS — no governance decision routes into the attach |

## Honest Obs-A/B/C self-check on the golden fixture (at its mint-act output state)
> Scored by hand on ONE example. NOT the frozen N=3 run. This is a self-check; a real
> adjudicator running the criterion read-only would re-derive these from the HOLDS/FAILS rules.

| Obs | Rule (criterion §3) | Verdict | Honest reasoning (incl. the weak edge) |
|---|---|---|---|
| **Obs-A** | ≥1 domain-originated kind AND ≥1 domain-originated rule, by the F3(c) lexical-AND-owner-route test | **HOLDS** | `Change-class ruling` is **lexically new** (no cav2 D49 label matches) AND **owner-route new** (`change-class-governance` is a standing artifact→gate-set classifier — not `constitution-governance` authoring rules, not `decision-gate` making one-off choices, not `Discipline`). It is NOT the precedent's `Method authority` re-skin (that was owner-route-IDENTICAL to `Constitution`). Plus domain-originated rules (C4, two gates). **Weak edge (honest):** one could argue a change-class ruling is "a Decision kind specialized." I reject that — a `Decision` (cav2) is a one-off contested choice; a change-class ruling is a *standing, repeated, artifact-indexed* classification that *binds* a gate-set. Different cardinality and effect. But this is the leg most open to a skeptic re-reading it as a Decision-subtype; I flag it rather than hide it. |
| **Obs-B** | No cav2 rule binding at the mint-act output state; operable after attach removal; cav2 only cited | **HOLDS** | Every runtime-governance decision (promote / block / admit-kind / source-posture / non-collapse; public/private is N/A here) resolves inside the minted `authority/`. cav2 appears only as a source-spine citation-only row + crosswalk borrow-carefully row. The mint record **explicitly does NOT name cav2 as method authority** (the precedent's exact `2026-06-26` leak) — the localized posture is baked at emit-time, no later owner fix needed. Removing `--source` leaves zero dangling refs (check 5). **This is the leg the precedent FAILED and the fixture passes — the valuable result.** |
| **Obs-C** | Operable on its own artifacts without cav2 ADDING/ALTERING a D49 row; mint act doesn't open cav2's closed set | **HOLDS** | The spine governs its own artifacts using only its own kinds/rules. The two domain-originated kinds live in the repo's OWN table; they are **proposed**, not promoted into cav2's D49 enumeration. The `promotion-candidate` crosswalk row is explicitly a SEPARATE downstream owner act, NOT the mint act. cav2's `AUTHORITY-MODEL.md` is untouched and un-demanded. |

**Self-check verdict: all three HOLD** on this fixture at its mint-act output state. The
honest caveat is the Obs-A Decision-subtype edge (flagged above) — a skeptic adjudicator
*could* re-read `Change-class ruling` as a specialized `Decision` and call Obs-A FAILS; I
judge it domain-originated on the standing/indexed/binding distinction, but it is the one leg
where my hand-verdict is contestable. Obs-B and Obs-C are clean.

## What this proves (and does NOT)
- **Proves:** a *positive* golden fixture now exists (the harness gap closed) — a hand-built
  mint-act output that passes all three observables, including the Obs-B leg the negative
  control (resonantos `2026-06-26`) failed. The emit procedure can produce a non-leaky,
  genuinely-localized spine **by construction**.
- **Does NOT prove:** SURVIVED. This is N=1, hand-built, self-scored, on the *process*
  category only. The frozen criterion needs N=3 (research + product + process), minted by the
  actual apparatus, scored by an independent adjudicator. claim ≤ proof.

## Remaining blockers
- **SWU-4 / L2 signed gate — BLOCKED** on the attestation/signer capability
  (`../attestation-capability/`, owner decision 2026-06-29). The fixture's mint record is
  L0-attributional placeholder until that capability's L1 integrity-seal MVP lands. Owner:
  sigil-development.
- **The formal N=3 experiment run — NOT DONE (out of scope).** This SWU produced ONE
  process-domain self-check; the frozen criterion's run (research/product/process, independent
  adjudication, SURVIVED/FALSIFIED) is a separate downstream dispatch.
- **`BLK-CAV2-PUBLIC-PRIVATE-001`** — public-attached mints stay blocked. This fixture is
  private-only (MVP boundary). Owner: decision-gate.
- **Obs-A contestable edge** (above) — the `Change-class ruling`-vs-`Decision-subtype` reading
  is the one leg a real adjudicator could flip; worth pre-empting in the N=3 run's domain spec
  by sharpening the standing/indexed/binding distinction.

## lifecycle_owner_next_step
**sigil-development** — (1) the SWU-4 signer/ratifier capability that unblocks L2; (2) author
the product-domain and re-mint the research-domain (resonantos) fixtures so the harness has the
full N=3 set the frozen criterion requires, then dispatch the independent adjudication run.
The emit procedure + this golden fixture are the input surface; no further SWU-3 work is needed.
