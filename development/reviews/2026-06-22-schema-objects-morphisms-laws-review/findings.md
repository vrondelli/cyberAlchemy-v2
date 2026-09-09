# Review — Should CAV2 define `schema` = objects + morphisms + laws, and at what depth?

Dispatch: `2026-06-22-schema-objects-morphisms-laws-review`
Type: review (red-team) · schema_version 0.6.0
Status: resolved
Date: 2026-06-22
Final approver: parent

## Target

The strategist's recommendation, made during a definitions-governance pass, to:
(a) define `schema` as a canonical CyberAlchemy-v2 term = **objects + morphisms + laws**
(rejecting the earlier object-only framing), grounded in CAV2-D16 / CAV2-D19; and
(b) implement at the **"Fuller"** depth (inline attribute-vs-morphism marking + a
registry-level typed-edge table with an edge signature).

## Topology (13 working agents, 5 groups)

- **attackers** (3, robot-talks): Ashby *governance-fidelity* · Wisnesky *ownership/redundancy* · Beer *operability/abuse*
- **synthesizer** (1): Spivak
- **verifiers_L1** *grounding* (3): Sattler *literal-text* · Gödel *formal-soundness* · Kahneman *anti-inflation*
- **verifiers_L2** *integration→promote/block* (3): Russell *logical-coherence* · Capucci *dependency-graph* · Meadows *systems-feedback*
- **verifiers_L3** *depth* (3): Gigerenzer *fast-frugal* · Lakatos *hard-core* · Tetlock *expected-value*

Edges: attackers→synth (seq); synth↔L1/L2/L3 (zig-zag, loop_cap 3); L1→L2→L3 (seq). anti_bias_global: "structural-completeness ambition vs authority-parsimony restraint". Tension gate (check-tension) passed on the final design (2 independent agents).

## Verdict on the target: **FIX** (recommendation substantially overturned)

The original recommendation is **rejected as stated**. The review converged — across an independent triple-attack and three verifier layers — on a materially different, better-supported recommendation.

### Surviving change requests (post-verification severities)

| # | Target | Defect | Severity | Fix |
|---|---|---|---|---|
| CR1 | DEFINITIONS-INDEX.md + any new entry | A canonical generic `schema` violates the index note "reference Arcanum IDs for `schema`… instead of redefining" **and** D21's "narrow local subtype" boundary; objects+morphisms+laws is a *broadening*, the inverse of the authorized *narrowing*. (D25 does **not** carry the subtype condition — that was a synthesizer overcite, corrected by Sattler; D25's role is the amendment witness, CR4.) | **CRITICAL** | Do not mint a generic `schema`. If anything, a narrow Arcanum-*subtyped* handle citing the parent ID. |
| CR2 | DEFINITION-SCHEMAS.md / D23 | The "Fuller" mechanism (attribute-vs-morphism marking, typed-edge table, edge signature) **does not exist** in the artifact — describing it as the plan is a future-state overclaim, not a present capability. | **MAJOR** *(was CRITICAL; demoted by Kahneman: future-state ≠ false-presence)* | Block Fuller depth until the surface exists and is testable; the term is minimal-depth at most now. |
| CR3 | proposed entry vs DS-D8 | A CAV2 schema carrying its own edge signature restates Arcanum DS-D8's σ: R→P(M)×P(M). | **MAJOR** *(was CRITICAL; "double-owns" shown for objects/morphisms, not proven as two authoritative owners)* | Reference DS-D8 σ by ID; never restate it locally. |
| CR4 | D25 | Introducing a schema term is itself a schema-affecting change owing a D25 amendment witness. | **MINOR** *(was MAJOR; bookkeeping, per Kahneman)* | File the D25 witness as a precondition of any promotion. |
| CR5 | RELATION-MODEL.md | Asserting "laws = path-equations" as authority pre-empts RELATION-MODEL's gated edge-law route and overreaches the D17/D20/D29 anti-category-claim discipline. | **MAJOR** | Laws are non-governing support evidence; route any enforceable law through the existing schema-governance gate. |
| CR6 | DEFINITION-SCHEMAS.md | The word "schema" is already owned by the documentary registry (naming collision / D22); the registry is self-certifying and gameable ("mark every reference a documentary attribute → zero edges"). | **MINOR** *(naming)* + **MAJOR** *(gaming, with Beer's concrete exploit path)* | Don't compete on the word; **harden the registry's witness/drain rule** (see CR-NEW). |
| CR7 | proposed entry vs D19/D16 | "objects + morphisms" recreate D19's (N,E) and a schema-morphism = a D16 typed coupling. | **MAJOR** | Reference D19/D16; add no parallel structure. |
| CR8 | DEFINITION-SCHEMAS.md backlog | Backlog is a parking lot with an inflow rule and **no outflow rule** (15 rows — *not 16*, per Sattler — untracked, no per-row owner/SLA); D25 itself is untracked. | **MINOR** → escalated by Meadows to the **primary leverage point** | Add a drain rule: named owner + per-pass resolve-or-reaffirm; resolve OQ-1. |
| CR9 | DEFINITIONS.md D23 | `L(a)` signature duplicated in 3 places (sync-drift); D23 normative list has **6** dims but the tuple has **7** (`residue`). | **MINOR** | Single-source the signature; reconcile the 6-vs-7 cardinality. |

### Two findings that reshaped the recommendation

- **Gödel (formal surplus):** objects + morphisms are genuinely already owned (D19 `(N,E)`, D16 coupling, DS-D8 signature) — but **path-equation laws are a real surplus none of them carry** (no commuting-diagram/quotient anywhere in D16/D19/D23/DS-D8). The laws have no *force* yet (no instances-as-functors layer). This both corrects the "fully redundant" overstatement and identifies the *only* genuinely novel content. He also flagged that CRITICAL severities were overstated (a premature, uninterpreted definition is soundness-neutral per D23: commitment ≠ authority) and that "don't define schema" is *sufficient, not forced* — a **documented candidate schema** is a coherent suppressed third option.
- **Russell + Meadows (how, not whether):** the "candidate/documentary" status is legal on a schema **row** (the D23-SCHEMA precedent), not on a **term** (D33 has no in-file candidate-definition posture); and the **real leverage is the registry's drain rule**, not minting `schema` at all (a low-leverage parameter add).

## Final recommendation (converged): **MINIMAL depth, registry-drain-first**

1. **Do NOT** define a generic `schema`, and **do NOT** implement Fuller/Fullest now. The original recommendation is rejected on governance (CR1), ownership (CR3/CR7), and operability (CR2) grounds.
2. **Primary action (highest leverage, do regardless of the schema decision):** harden the documentary registry's **drain rule** — every `tracked (documentary)` row carries a named owner + a per-pass *resolve-or-reaffirm-with-reason* trigger; resolve DEFINITION-SCHEMAS OQ-1 from demand-pull to per-pass discipline. This is the only move that changes system behavior and it neutralizes the "all-documentary" gaming path.
3. **Optional, cheap, reversible (MINIMAL):** promote a **narrow Arcanum-subtyped `schema` term** (definitions-governance-*promoted*, not an in-file "candidate term") whose `### Schema` **row** is `status: candidate / documentary`; it **references** D16/D19/DS-D8 for objects/morphisms/signature (no restatement) and **records the path-equation laws as a documented-but-unenforced slot**. Amend the DEFINITIONS-INDEX line-194 note so the subtyped handle does not collide with the "don't redefine `schema`" rule.
   - *Lakatos's rule:* **defer the force, never defer the slot** — naming the law obligation now is near-zero-cost and reversible; omitting it risks irreversibly losing which equalities the authors intended to commute.
4. **Defer Fuller/Fullest** until a concrete, near-term **edge-type consumer** (validator/generator/caller) is committed — Tetlock's explicit flip condition. This is a clean one-directional staging gate, not a chicken-and-egg trap (Meadows).

Depth consensus: Gigerenzer = MINIMAL-MINUS; Lakatos = MINIMAL; Tetlock = MINIMAL (≳ MINIMAL-MINUS ≫ FULLER ≫ FULLEST). The split is only over whether to mint the handle; all three reject Fuller now.

## Process deviations (disclosed)

- **robot-talks confrontation folded into synthesis.** SendMessage was unavailable to continue the attacker agents with context; because the three attacks converged *independently* (the strongest anti-collapse signal), the cross-lens reconciliation was performed by the synthesizer rather than a separate confrontation round. No separate "final positions" were produced.
- **L1/L2 zig-zag revisions folded inline.** The verifier adjustments were the verifiers' own verified findings (severity demotions, the laws-surplus, the term-vs-row correction, the drain-rule leverage), so the synthesizer position was revised to incorporate them rather than re-spawning a synthesizer + reconfirmation turn (which would trivially pass). Each zig-zag terminated in one verifier turn.
- **Tension gate cost.** The check-tension gate ran 5 times (10 infra agents, not registered); 3 of those agents were discarded for hallucinating because they were initially spawned as filesystem-search (`Explore`) agents that wandered the repo's many persona-based dispatch files. Corrected by sandboxing the gate agents (no tool use, judge inline only); the final design passed cleanly.

## Agents spawned

explorer 3 · writer 1 · skeptic 9 · auditor 0 · helpers 0 = **13** (plus 10 unregistered check-tension infra agents). loops_used: 1.
