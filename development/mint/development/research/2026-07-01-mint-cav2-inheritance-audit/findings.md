---
node_type: research
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-07-01
authored_by: domainspec-subagents-strategy (research dispatch 2026-07-01-mint-cav2-inheritance-audit)
final_approver: parent
note: Paths are repo-root-relative from domainspec-core/.
---

# Mint ⟵ cav2 — Inheritance Audit (findings)

**Question.** Is Mint (`cyberAlchemy-v2/development/mint/`) drawing all the authority + ontology
machinery it could from cav2 into a minted domain — and if not, what is genuinely missing vs.
correctly withheld?

**Dispatch.** research, 4 agents / 2 tensioned groups, gated (check-tension PASS).
Collected returns: [research.md](./research.md) (verbatim) · maps: [supply-map.md](./supply-map.md)
(Alexander, supply-side) · [demand-map.md](./demand-map.md) (Ashby, demand-side) ·
[circularity-attack.md](./circularity-attack.md) (Gödel, meta-vs-object gate) ·
[precedent-attack.md](./precedent-attack.md) (Meadows, already-provided gate).

---

## One-line answer

**Yes, Mint under-inherits — but not where it first looks.** Mint casts ~8 authority *outputs*
(6 templates + 1 decision + AUTHORITY-MODEL) and inherits the authority-table *format* well, but it
omits most of the *authoring machinery* a domain needs to grow its own authority. The clarifying
correction: the **ontology/"artifact-handling" package — the example that motivated this audit — is
the one big cluster that is *correctly* withheld** (it is cav2's own self-model; seeding it re-fuses
the two System-5 levels). The real gaps are in the **definitions lifecycle, the ratify-close flow,
and the owner-routing/derivation patterns** — ~10 surfaces, one of which fixes an *existing
self-inconsistency* in what Mint already emits.

## How each candidate was judged

A surface is a **real gap (`should-inherit`)** only if it survives *both* skeptic gates: Gödel
(is it meta-machinery, not cav2's object rows?) **and** Meadows (is it genuinely absent, not already
provided?), and Ashby rates it load-bearing. The two gates assign *opposing* terminal labels to the
same surface — `correctly-localized` (Gödel) vs `already-provided` (Meadows) — so a surface only
reaches `should-inherit` when neither can dismiss it.

## Verdict matrix (21 consolidated candidates)

| # | cav2 surface | Gödel (meta/object) | Meadows (provided?) | Ashby (need) | **Verdict** |
|---|---|---|---|---|---|
| 8 | **Definitions lifecycle equipment** — INDEX + DRIFT-AUDIT + SCHEMAS registry | meta ✔ | absent | — | **SHOULD-INHERIT · HIGH** — the seeded constitution's load-bearing-term rule *requires* a drift audit Mint never emits → the rule **fires into a void** (`supply-map.md`; `authority/definitions/DEFINITION-DRIFT-AUDIT.md`). Fixes an existing self-inconsistency. |
| 11 | **Ratify-CLOSE in the mint flow** (D49 owner-gate *close*, not just propose) | meta ✔ | absent | G1 load-bearing | **SHOULD-INHERIT · HIGH** — Mint templates the *propose* half only; kinds stay "PROPOSED — pending" forever. domainspec-v2 needed a hand-authored `ratify-governance-kinds.md`; the experiment product is stuck PROPOSED (`demand-map.md` G1; `precedent-attack.md` #11). |
| 13 | **Governance-function → methods catalogue** prompt | meta ✔ | absent | G2 | **SHOULD-INHERIT · HIGH** — "a kind without its methods is a name with no actuator." Witnessed: domainspec-v2 grew a Methods catalogue the template doesn't emit (= handoff L2, unimplemented) (`demand-map.md` G2). |
| 1 | Narrowest-Owner routing table (movement→owner) | meta ✔ (pattern) | absent | load-bearing | **SHOULD-INHERIT** — `authority/AUTHORITY-MODEL.md:90-104`. |
| 2 | invariant→axiom→constitution→validator derivation pattern | meta ✔ (pattern) | absent | load-bearing | **SHOULD-INHERIT** — `authority/AUTHORITY-MODEL.md:105-120`. |
| 5 | **Table-level default-deny CLOSED declaration** (not just per-row) | meta ✔ (dissolves C1 contradiction) | per-row provided; table-closure absent | load-bearing | **SHOULD-INHERIT** — inherit the closure *rule* applied to the domain's OWN kinds table (never cav2's D49 enumeration) (`circularity-attack.md` #5; `precedent-attack.md` #5). |
| 9 | DEFINITION-LOCALIZATION-ROUTE + `definitions/reviews/` staging | meta ✔ (route) | absent | — | **SHOULD-INHERIT** — how a domain imports→canonicalizes its *own* definitions (`authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md`). |
| 12 | Stop/demotion rule (D48 `stop_rule` — demote/supersede path) | meta ✔ (rule) | absent | G3 | **SHOULD-INHERIT** — both products emit only forward promotion; no demote path for an active kind (`demand-map.md` G3). |
| 10 | decisions/README + CAV2-D36 decision-card schema | meta ✔ (schema) | absent | — | **SHOULD-INHERIT · LOW** — the domain will author more decisions than the one mint record. |
| 18 | authority/README navigation surface (CAV2-C7) | meta ✔ | knowledge-tree half provided by scaffolder; authority half absent | — | **SHOULD-INHERIT · LOW** — cheap; scaffolder already stubs the knowledge-tree half (`precedent-attack.md` #18). |
| 3 | 8-posture **table** | **object ✖** (seed columns + posture≠confidence rule only) | absent | source-posture load-bearing | **SPLIT** — seed the empty posture-*contract* (should-inherit); the 8 rows are cav2's taxonomy → correctly-localized. |
| 4 | 7 Non-Collapse **Rules** in full | **object ✖** (seed rule-slot + `forbidden_collapse` field) | structure provided; 7 rules not | non-collapse load-bearing | **SPLIT** — seed the slot (should-inherit); the 7 named rules are cav2 instances → correctly-localized. |
| 6 | boundaries.md (public/private, source/read-model, …) | meta ✔ *but* localize the engine/free-paid clause | absent | public-scrub needed-later | **SPLIT** — a minimal private-only boundary marker is load-bearing (MVP mints private); full doc needed-later; the engine-withholding clause is cav2-object (localize). |
| 7 | Import/inventory rung + `authority/imports/` ledger | meta ✔ (the rung) | absent | needed-later | **SPLIT** — the promotion-flow rung is a cheap should-inherit; the full imports ledger is `correctly-deferred` (single framework import handled by the source-spine row). |
| 17 | STABLE-REPO C-rules as minted-repo rules (11 of 16) + IMPORT-PACK | **object ✖** (cav2 selectors; inherit authoring route + import-pack template) | credibility-constitution provided; structural rules not | needed-later | **SPLIT** — inherit the constitution-authoring route + IMPORT-PACK template (should-inherit); copying cav2's rule instances = correctly-localized. |
| 14 | Ontology candidate-staging package (Candidate-Record-Shape + challenge_contract D40 + 2-axis confidence) | **object ✖** — package IS cav2's self-model; seed empty shape only | absent | internal-bookkeeping | **CORRECTLY-LOCALIZED** — optional: seed the *empty* record-shape if the domain wants candidate-staging (low priority). |
| 15 | Ontology structural models (RELATION / LIFECYCLE-FSM / BRANCH-AS-VIEW / views / projections / promotion-requests) | **object ✖** (models cav2's own objects; empty even in cav2) | absent | internal-bookkeeping / domain uses own ladder | **CORRECTLY-LOCALIZED + DEFERRED** — strong agreement: do not seed. |
| 16 | ARTIFACT-TREE + cav2 crosswalks (TAXONOMY / RELATIONSHIP / SOURCE-SURFACE) | **object ✖** (orients cav2's own tree + private-parent witnesses) | absent | — | **CORRECTLY-LOCALIZED** — cav2 self-orientation; the *framework* crosswalk Mint already emits is the right analogue. |
| 19 | DISCIPLINES catalog + Growth Rule + cards | **object ✖** (3 catalog rows are cav2's practices; inherit Growth Rule + card schema only) | absent | needed-later (no practice day-1) | **CORRECTLY-DEFERRED** — Growth-Rule + card-schema is a low-priority later should-inherit. |
| 20 | Verifiable/tamper-evident **attestation seal** | net-new (outside dichotomy) | build-from-owned: `attestation-capability/` (L2 blocked); seal is L0-attributional placeholder | N1 net-new-need | **BUILD-FROM-OWNED** — already a disclosed deferral; owner exists (`development/attestation-capability/`). Not a new gap. |
| 21 | Adopt-back surface for domain-surfaced kinds cav2 lacks | — | absent | N2 | **CORRECTLY-DEFERRED** — Mint stage-5 adopt-back is explicitly deferred (ARCHITECTURE-BUNDLE stage 5). |

## What this means (claim ≤ proof)

1. **The motivating example inverts.** "Artifacts handling" = the ontology/artifact package (#14–#16).
   Both skeptics + the demand audit agree it is **correctly withheld**: it is cav2's *own* read-layer
   / self-model (`ontology/PACKAGE-MODEL.md:9-11` self-labels it "the CyberAlchemy base repository's
   candidate authority model package"), and seeding it re-fuses the two System-5 levels
   (`circularity-attack.md`; `development/machine-map/findings.md:36-39`). At most, seed the *empty*
   record-shape as an optional tool — never the models. **This is the audit's main correction to the
   opening hypothesis.**

2. **The real under-inheritance is the authoring lifecycle, not the artifact models.** The load-bearing
   gaps (#8, #11, #13, and the routing/derivation patterns #1/#2/#5/#9/#12) are all *meta-machinery a
   domain applies to its own content* — exactly the things Mint's stated "inherit-meta" principle says
   it *should* carry, and doesn't yet.

3. **One gap is a live defect, not a nice-to-have (#8).** Mint already seeds a constitution rule
   (load-bearing-term) whose enforcement target (a definitions drift-audit/index) it never emits — so
   the seeded rule "fires into a void" (`supply-map.md`). This is internal inconsistency in Mint's
   *current* output, independent of any expansion.

4. **One gap is already witnessed failing in production (#11).** The first real mint (domainspec-v2)
   had to hand-author the ratify-close after the fact; the experiment product never did and its kinds
   are permanently "PROPOSED" (`demand-map.md` G1; `precedent-attack.md`). The propose-without-close
   flow leaves every minted domain's authority *asserted, not live*.

## Recommended follow-on (a task-session on the Mint skill, not this dispatch)

- **Tier 1 (fix now — cheap + high value):** #8 (emit the definitions INDEX + DRIFT-AUDIT stubs the
  seeded rule already assumes), #11 (add the ratify-CLOSE step to the mint flow), #13 (emit the
  governance-function→methods prompt). These are meta, cheap, and #8/#11 close existing holes.
- **Tier 2 (seed the empty format, localize the rows):** #3, #4, #5-table-closure, #6-minimal,
  #7-rung, #17-import-pack — inherit the *contract/slot*, never cav2's populated rows.
- **Tier 3 (leave as-is — correctly withheld):** #14, #15, #16 (ontology package), #19 (disciplines),
  #20 (attestation — owner exists), #21 (adopt-back — deferred). Record them as *disclosed* non-seeds
  so they read as decisions, not oversights.

## Residue (honest limits)

- G1's frequency rests on **N=1 real mint** (domainspec-v2); the experiment product may have stopped
  at PROPOSED intentionally (`demand-map.md` residue).
- #12 (stop/demotion) is inferred from the D48 `stop_rule` spec, not a witnessed failure.
- The Ashby requisite-variety framing is a productive analogy, not a repo-cited law — the load-bearing
  evidence is the two products' actual contents, not the lens.
- The 21 candidates are consolidated from ~46 raw omissions (`supply-map.md`); the consolidation is the
  strategist's, and a finer split could re-separate a few SPLIT rows.
