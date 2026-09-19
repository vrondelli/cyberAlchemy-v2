---
tags: [framework-unification, artifacts, review, red-team, raw-returns]
node_type: research
is_session: false
layer: architecture
nature: reference
status: draft
created: 2026-06-16
dispatch_id: 2026-06-16-artifacts-catalog-review
dispatch_type: review
target: projects/framework-unification/components/ARTIFACTS.md
---

# Red-Team Attacks — ARTIFACTS.md (verbatim returns)

Collected attacker and verifier returns for dispatch `2026-06-16-artifacts-catalog-review`.
Groups: `attackers` (3 explorers, robot_talks) → `synthesizer` (1 writer) ↔ `verifiers`
(2 skeptics, zig-zag). The synthesis lives in [findings.md](findings.md); this file is the
evidence trail.

---

## Group: attackers — Round 1 (initial positions)

### A1 — fidelity/governance lens

- (a) Four-tier/three-plane taxonomy vs SCOPE boundary & open-questions rule — MOSTLY SURVIVES. SCOPE governs the aspirational boundary (§2) + open-questions rule (§3), not taxonomy shape; ARTIFACTS carries a real `## Open Questions` (OQ-1..6). MINOR drift (intro :16-18 promises proposals are marked but the tier/plane framing asserts structural claims unmarked).
- (b) vs CONCEPT-MAP invariants — MAJOR: I2 restated with drift (:88-90 binds "every downstream artifact should trace back to it (invariant I2)"; I2 is connection integrity / edges resolve, not a single root). MINOR: leaf/OQ-3 table cell printed as fact.
- (c) (proposal) marker honesty — granularity rule SURVIVES (honestly boxed at :106-110, OQ-1). MAJOR inconsistency: node-kind column prints composite/node/root/leaf as settled though OQ-1-pending.
- Net: 2 MAJOR (I2 over-attribution; unmarked node-kind column), 3 MINOR, 0 CRITICAL.

### A2 — mechanics/correctness lens

- CRITICAL C1: paired-views row (:78) names producers `ontology-view / system-view / engineer-view`; only `ontology-view` exists under `implementation/domainspec/.claude/skills/`; `system-view`/`engineer-view` exist only at repo-root `.claude/skills/` (Arcanum/tier-D).
- MAJOR M1: `plan … built` contradicted by SCHEMA-INVENTORY (:41 `Plan | … | no | none`; :60 "Two stages have no schema at all (plan, …)").
- MAJOR M2: `code … built` bundles code+tags+drift; implement has no template.
- MINOR m1: discovery shown as produced Tier-A object but pipeline treats it as Step-0 precondition.
- MINOR m2: Tier-B producers `domain-dictionary` (:122) / `backlog-pattern` (:126) don't exist as skills.
- SURVIVED: all other producers verified present; Route-3 "Spec→Plan" contradiction does NOT reproduce (table orders plan before spec); Tier-C producers accurate.

### A3 — ownership/reference-integrity lens

- (a) Connections table — all four pointers RESOLVE and rows hold. SURVIVED.
- (b) OQ-5 "collision" — REFUTED. CONCEPT-MAP uses OQ-A..E (no numeric OQ-5); session "closes OQ-5" = `discovery.md` OQ-5 (submodule init), different namespace from ARTIFACTS-OQ-5 (:188, plane-3 build). MINOR residual lives in the session file, not the target.
- (c) I2 root — CONFIRMED MAJOR. problem-statement (:73) is `to-create` / Producer `(none yet)` / Node kind `root`; I2 (connection integrity) is unsatisfiable for a root that doesn't exist. Honestly flagged (OQ-2) but live.
- Tally: 0 CRITICAL, 1 MAJOR (rootless I2), 1 MINOR (session-side numbering).

---

## Group: attackers — Round 2 (robot-talks confrontation, final positions)

### A1 final — governance

- (1) Mechanics C1 is ALSO a fidelity finding: the row commits the tier-A/tier-D conflation the doc's own thesis (:27-35) names as the central enemy; SCOPE §1 / submodule discipline reinforce. Keep as ONE CRITICAL with two faces (mechanics = broken pointer, governance = why it's load-bearing).
- (2) "I2 over-attribution" vs integrity's "I2 unsatisfiable" are DISTINCT: mine (mis-citation) survives even if problem-statement existed; integrity's (referential) is cured by creating it. Keep both, lead with mine; both MAJOR (softened from honest OQ-2 flagging).
- (3) HOLD I2 over-attribution (MAJOR); DOWNGRADE node-kind column to MINOR and MERGE the leaf/OQ-3 cell into it; RETRACT "taxonomy-framing-unmarked".
- Endorses: C1 (co-owned), M1 plan, m2/M2, integrity I2-root, OQ-5 refutation.

### A2 final — mechanics

- (1) C1 SURVIVES and strengthens. Exact paths: `system-view`/`engineer-view`/`paired-views` exist only at repo-root `.claude/skills/`; submodule has only `ontology-view`; `domainspec-pipeline/SKILL.md` references none of the four (0 matches). Verifier-checkable; not softened.
- (2) Governance boundary gloss: agree in part — it's a fidelity miscredit (public Arcanum spells credited as private-engine producers), NOT a private→public leak. Log as fidelity defect with boundary-attribution note.
- (3) Route-3 does NOT reproduce — held.
- (4) Defend C1 (CRITICAL), m2 (MINOR), m1 (MINOR); DOWNGRADE M1 (plan) and M2 (code) to MINOR (both self-qualified/honest). Endorses I2 cluster + node-kind MINOR. One-line synthesis: "the catalog renders unbuilt/proposed things in built/settled typography."

### A3 final — reference-integrity

- (1) I2-root vs governance over-attribution = TWO distinct findings under one cluster ("problem-statement as provenance root"): (a) governance-owned citation edit, (b) ownership-owned existence/producer gap. Two findings, one root cause, no double-count.
- (2) OQ-5 collision — DROP entirely; log as REFUTED in a closed register, not a change request.
- (3) Corroborate C1 as a reference-integrity finding (producer cited under the domainspec engine that Arcanum owns); co-sign m2 likewise. One finding, two attackers → confidence, not count.
- (4) Defend root-unsatisfiable (MAJOR), Connections (SURVIVED), OQ-5 (REFUTED). Cede the I2 mis-citation half to governance to avoid overlap.

---

## Group: verifiers — zig-zag turn 1 (no objection → exchange terminates)

### V1 — literal-text corpus

- F1 (:78) SURVIVES — producer cell `ontology-view / system-view / engineer-view`, Status `built` present verbatim.
- **F2a SURVIVES (load-bearing check)** — CONCEPT-MAP:140 I2 = "Connection integrity — every `connections.to` resolves to a real artifact; no dangling provenance"; contains NO single-root/convergence claim. F2a does NOT collapse.
- F2b (:73) SURVIVES — `— (none yet)`, `root`, `to-create` present.
- F3 SURVIVES — Node kind header (:71), `leaf (tagged)` (:83), `(proposal)` convention (:18), "proposed, not ratified (see OQ-1)" (:110); no node-kind cell bears `(proposal)`.
- F4 SURVIVES — `domain-dictionary` (:122), `backlog-pattern` (:125) in Producer cells.
- F5 SURVIVES — `discovery` Tier-A row, Status `built`.
- Refuted register confirmed literal: plan (:79) precedes spec (:80); ARTIFACTS-OQ-5 (:188) = plane-3 build; Connections rows (:209-212) present.
- **No findings dropped.**

### V2 — built-engine corpus

- F1 SURVIVES (stays CRITICAL) — submodule `.claude/skills/` has `ontology-view` only; repo-root has all four; `domainspec-pipeline/SKILL.md` grep for the four views → No matches. Downgrade rule not triggered.
- F4 SURVIVES — `domain-dictionary` / `backlog-pattern` absent in both submodule and repo-root; `domainspec-feature-glossary` exists in submodule.
- F5 SURVIVES — pipeline L78 Step 0 = discovery existence check (precondition), L86 Step 1 = Plan, L94 Step 2 = Spec.
- F6 SURVIVES — SCHEMA-INVENTORY L40 `Plan | … | no | none`; reinforced L59, L138.
- Refuted-register cross-check CONFIRMED — engine orders Plan (Step 1) before Spec (Step 2); no Route-3 inversion.
- **Nothing dropped.**

---

## Outcome

Both verifier corpora confirmed every surviving finding; the zig-zag terminated after one turn
(no objection raised). `final_approver: parent` accepted the change-request list. Zero-findings
red flag not applicable (attackers returned substantive findings). Exit: `resolved`.
