---
node_type: research
is_session: false
status: candidate
created: 2026-07-02
authored_by: research subagent (SKEPTIC, gate: DECIDABILITY + PROPORTIONALITY / lightest-that-runs)
agent: "Gödel, Kurt"
target_artifact: meta-type formalization + content validator (../../)
role: skeptic gate over the 3-explorer converged proposal set (formalism-solver, formalism-lean, formalism-minimal)
gate_question: per item — does it DECIDE + TERMINATE automatically at spec-time, and is it the LIGHTEST that suffices? Demote proof-effort / undecidable / over-formalized structural checks.
claim_discipline: claim <= proof. A "KEEP" is asserted only where a decision procedure demonstrably terminates on schema-level input; a "DEMOTE" names the exact failure (undecidable OR heavier-than-necessary). Owned re-verification noted where done; cited-not-reverified marked in residue.
---

# Decidability + Proportionality gate — the SKEPTIC verdict

**Headline.** The converged set is decidability-sound and, with **two demotions**, proportionality-clean.
I re-verified the one owned artifact checked out here (`validate-relationships.ts`) — it is *exactly* the
deterministic table-walk + finite-`Set` membership the KEEP verdicts lean on (`parseTableForSection` +
`parseTableRow` + `toHeaderMap` + `canonicalEdges.has(value)` at lines 72, 98; Levenshtein suggest at
337–371; no solver, no proof, terminates by construction). Every explorer independently reduced 5 of 6
primitives to a **bounded quantifier-free question over a finite parsed structure** — the textbook
decidable-and-cheap shape. My gate agrees with the merged verdict on items 1, 3, 4, 5, 6 and **demotes the
Lean-soundness half of item 2** as heavier-than-necessary for the stated criterion.

The one thing I push harder than the explorers: **"decidable" is necessary but not sufficient for KEEP.**
Item 3's cross-graph solver is decidable, but so is a table walk — the gate is *lightest-that-runs*, and I
hold item 3 to the proof that a table walk *structurally cannot* express its query (it can't — see below),
which is what earns the solver its keep. That is the only place a solver survives the gate.

---

## Per-item gate (decides+terminates? lightest-that-suffices? → verdict)

### Item 1 — Per-concept structural table-walk validator over per-type `.schema.yml`
- **Decides + terminates at spec-time?** YES. Identity = bounded `∃` over a finite field list; field-existence
  = `|fields| ≥ 1`; typedness = bounded `∀` over finite fields × finite type alphabet (membership); per-edge
  signature = ground lookup in the finite 29-row signature table. Every quantifier is bounded over a finite
  parsed structure → terminates by construction, reproducible (satisfies the Z3-thesis "gate iff reproducible"
  bar cited by solver §1).
- **Lightest that suffices?** YES — and *demonstrated owned*, not asserted. `validate-relationships.ts`
  already runs the hardest already-shipped case (edge-label canonicity) at this exact weight; P1–P3 and
  per-edge P6 are strictly easier than what that file does today. Nothing lighter exists; nothing heavier is
  warranted.
- **VERDICT: KEEP.** All 3 explorers converge; I re-verified the precedent. This is the floor of the design.

### Item 2 — P5 boolean-predicate = mini typed-expression parser + return-sort check
- **Decides + terminates at spec-time?** YES for the *intended* check. Parse (context-free → terminates) +
  return-sort inference (simple typed-expression / HM-style over a fixed operator signature → decidable).
  This is the Rule≠Policy discriminator (Bool-rooted vs strategy-select). The solver explorer is correct that
  reframing this as predicate *validity/satisfiability* flips it to undecidable in full FOL — but the criterion
  does **not** ask for that, so the intended check stays inside the decidable zone.
- **Lightest that suffices?** The **bare parser + sort-tag IS the lightest that decides the criterion.** The
  Lean-proven-sound parser (Curry's ~1–2 day `matchesGlob_iff`-shaped bridge) adds a machine-checked
  *biconditional* between the Bool matcher and a named relation — real rigor, but it **does not change the
  accept/reject verdict** and does not add discriminating power the DEFINE bar (accept-positive / reject-negative)
  requires. By the gate's own standard (lightest-that-runs), the soundness proof is **heavier than the criterion
  needs.**
- **VERDICT: KEEP the bare parser + return-sort check. DEMOTE-overkill the mandatory Lean soundness bridge**
  to OPTIONAL / deferred (see P5 verdict below for the precise proportionality line).

### Item 3 — Cross-graph / cross-rule checks = Datalog/Cedar solver (build from owned FOL/Cedar)
- **Decides + terminates at spec-time?** YES, and this is the discriminating case. Per-edge admissibility is a
  finite lookup, but **cycle-freedom / reachability / cross-rule closure are recursive relational properties**.
  Datalog's least-fixpoint over a finite Herbrand base terminates (stratified, finite domain → decidable);
  Cedar policy-set evaluation over a finite request/entity set terminates (the owned Lean kernel's
  `decidePolicy` is `decide`-shaped, executable-by-construction). Both DECIDE + TERMINATE on schema-level input.
- **Lightest that suffices?** YES — and it is the **only item where the lighter tool (table walk) provably
  cannot do the job.** The Lean explorer's owned `acyclicity_not_unary` result is the load-bearing separation:
  no predicate over node-local data alone can decide a cross-edge property (a cyclic and an acyclic graph share
  identical node data). So the per-concept table walk is not merely inconvenient here — it is *expressively
  incapable*. That is exactly what earns a solver its keep under a proportionality gate: not "a solver is
  nice," but "the lightest sufficient tool fails, and this is the next rung."
- **VERDICT: KEEP — the one solver that survives the gate.** Guardrail I add: keep it a **separate cross-cutting
  validator layer** (the owned FOL/Cedar Row-2 complement), NEVER folded into the per-concept check, and scope
  it to cross-rule / graph-closure queries only. Use a small embedded Datalog or the owned Cedar composition —
  do NOT reach for SMT here (that is item 4's failure mode).

### Item 4 — P6 purity + "is a VALID/non-vacuous predicate" (MEANING) = NOT public-validatable
- **Decides + terminates at spec-time?** NO for the semantic property. Semantic purity (referential
  transparency, no observable effect) and "non-vacuous / total / satisfiable predicate" are **undecidable in
  general** (halting-flavoured / full-FOL validity). No spec-time decision procedure terminates on them.
- **Lightest that suffices?** The only *decidable* thing available is a **syntactic proxy** — an AST/token scan
  for mutating forms — which is sound-for-obvious-impurity, **not complete**. That proxy is fine AS a proxy; it
  is not a decision of purity and must never be labelled one.
- **VERDICT: DEMOTE-undecidable for the semantic property (correctly, as the explorers already do).** KEEP the
  syntactic proxy but bind it to claim ≤ proof: the `.schema.yml` criterion must say *"syntactically pure (no
  mutating forms)"*, never *"pure function."* Anything requiring real derivation → FALSIFIED boundary record,
  never a public solver. This is also the moat line: an SMT/validity check that reasons about *what a predicate
  computes* starts reconstructing engine δ-semantics — undecidable AND a moat leak. Two reasons to demote, both
  decisive.

### Item 5 — Primitives-first = structural predicates (schema); Lean Decidable twins only where a bridge pays
- **Decides + terminates at spec-time?** YES — this is just items 1+2 restated at the primitive layer; every
  primitive is a `decide`-able Bool over a finite record (`deriving DecidableEq` discharges P1–P3, P5-syntactic,
  per-edge P6; no proof).
- **Lightest that suffices?** YES. A heavyweight formal-primitives program (dependent-typed "well-formed concept
  as a type", `Σ`/`Π` witnesses) is **over-formalization**: the validator emits an accept/reject Bool and does
  not compute *with* validated concepts, so a proof-carrying value buys nothing it consumes. The gate demotes
  the dependent-type richness the Lean explorer itself flags as unneeded.
- **VERDICT: KEEP as scoped (structural predicates, Decidable twins only where a soundness bridge pays — i.e.
  the *optional* P5 bridge). DEMOTE-overkill any dependent-typed / proof-carrying primitives program.**

### Item 6 — No bespoke DSL; the `.schema.yml` + small P5 expression-parser IS the minimal DSL
- **Decides + terminates at spec-time?** N/A directly (this is a scope decision), but it is the decidability-
  preserving choice: `.schema.yml` shape rules are declarative finite predicates the validator interprets as
  bounded ∀/∃; the mini-parser is the single narrow escalation. Both terminate.
- **Lightest that suffices?** YES. A full criterion-DSL is a language-design + parser + semantics program to
  express what two already-owned mechanisms (`.schema.yml` shape + ~100-line typed-expression mini-parser)
  already express. Classic over-engineering.
- **VERDICT: KEEP (no bespoke DSL). DEMOTE-overkill a full criterion-DSL.** Minor open flag inherited from the
  minimal explorer: whether the P5 mini-parser ships as hand-rolled parser code vs a declarative
  `formal_return_type: boolean` key is a DES-D3 design choice — the declarative-key variant keeps parser code
  out of the public contract (marginally better moat posture). Both are light; not a gate blocker.

---

## The P5 contested sub-question — proof verdict

**Bare parser (Simon/Tarski) vs Lean-proven-sound parser (Curry, ~1–2 day via owned `matchesGlob_iff`).**

**Verdict: the Lean soundness proof is NOT PROPORTIONATE to the stated criterion. A bare parser + return-sort
check is enough. Demote the proof to OPTIONAL / deferred rigor, not a WORK-PACK gate.**

Reasoning, held to the gate:
1. **Decidability is not the discriminator here.** BOTH options decide + terminate — the parser terminates and
   the sort-check is decidable either way. So the tie-break is *proportionality alone*, and proportionality asks:
   does the extra weight buy discriminating power the criterion needs? It does not.
2. **The proof changes no verdict.** `matchesGlob_iff`/`decidePolicy_allow_iff` prove `matcher = true ↔ NamedRelation`.
   That upgrades the *meaning* of "parses to Bool" from incidental to declarative — genuine rigor — but the
   accept/reject output on every fixture is **identical** with or without it. The DEFINE bar is
   accept-positive / reject-negative; the bare parser clears it. Paying 1–2 engineer-days (even if bounded and
   sorry-free, as the owned kernel calibrates) for zero change in discriminating power is heavier-than-necessary
   by definition.
3. **Where the proof WOULD be proportionate — and isn't yet triggered.** The soundness bridge earns its keep
   when the parser becomes a **published public-contract artifact** whose guarantee must be checkable and
   declarative (a small sorry-free Lean twin stating the public criterion), OR when a downstream consumer relies
   on the "is-boolean" guarantee compositionally. Neither is in scope for the 3 pre-registered criteria. So:
   **defer, don't kill.** Keep the `matchesGlob_iff` template on the shelf as the copyable pattern (owned, cheap,
   ~55 lines by functional induction per the Lean explorer's calibration) and cash it in only if/when P5 is
   promoted to a public-contract publication or a compositional consumer appears.
4. **Residual asymmetry favouring the bare parser on the moat.** The bare parser reads syntax and stops at the
   root tag. The heavier the formal apparatus around the predicate, the closer it drifts to reasoning about what
   the predicate *computes* — item 4's undecidable/moat wall. Lighter is also safer here, not just cheaper.

**One honest caveat (residue, below):** this verdict rests on the Lean explorer's *read-confirmed* proof-cost
figures for `matchesGlob_iff` / `decidePolicy_allow_iff`; that repo is not checked out here and I did not
re-run `lake build`. If those proofs were materially heavier than ~1–2 days, the case for demotion is only
*stronger* (more cost, still zero verdict-change), so the direction of my verdict is robust to that uncertainty.

---

## Decidable-minimal recommendation (the lightest set that runs)

1. **Per-concept + per-edge layer (items 1, 5): structural table-walk over `.schema.yml`.** Bounded ∀/∃ +
   finite-set membership. Extend the owned `validate-relationships.ts` pattern; NO solver, NO proof. Decidable,
   reproducible, moat-safe, and already-owned at this weight.
2. **P5 (item 2): bare typed-expression parser + return-sort = Bool check.** Stop there. NO SMT (unnecessary +
   moat-risk), Lean soundness bridge DEFERRED as optional rigor (P5 verdict).
3. **P6 purity + predicate-meaning (item 4): syntactic no-mutation proxy only, labelled sound-not-complete;
   FALSIFIED boundary record where a real decision would require derivation.** Never a public solver.
4. **ONE solver, cross-cutting only (item 3): a separate Datalog/Cedar-shaped global edge-graph validator**
   (cycles, reachability, cross-rule closure), built from the owned Cedar composition + FOL/Cedar Row-2
   complement. The only place the lightest tool provably fails (`acyclicity_not_unary`) → the only place a
   solver survives the gate.
5. **No bespoke criterion-DSL (item 6): the `.schema.yml` + the P5 mini-parser IS the minimal DSL.**

Net: exactly **one** solver in the whole design, quarantined to the cross-graph layer; everything else is
table-walk / parse / sort-infer; proof is optional-and-deferred, never a spec-time gate. That is the
lightest-that-runs.

---

## Residue / boundaries (claim ≤ proof)
- **Re-verified here:** `validate-relationships.ts` (the table-walk + `Set.has` precedent) — read in full,
  pattern confirmed at cited lines (72, 98, 141–157, 235). This is the load-bearing precedent for the KEEP
  floor and it holds.
- **Cited-not-reverified:** all `domainspec-lean-formalization/` artifacts (`matchesGlob_iff`,
  `decidePolicy_allow_iff`, `acyclicity_not_unary`, `AgentPermissionKernel*`). That repo is a SEPARATE checkout
  (MEMORY: `lean-kernel-location-and-status`) and is NOT present under this repo root — I could not `lake build`
  or re-grep it. I relied on the Lean explorer's read-confirmed (grep `sorry`=0) status and its proof-cost
  calibration. My P5 demotion is robust to this uncertainty (see P5 caveat).
- **Not settled by me:** the DES-D3 sub-choice of P5 parser-code vs declarative `formal_return_type` key
  (both light; moat-marginal); and guard-overlap / State-Machine exhaustiveness (the minimal explorer's
  second break) — deferred out of the 3 criteria, correctly, and would be the *next* candidate for the item-3
  solver layer, not the per-concept one.

## Citations
- Explorer files (this gate is over their converged set): `./formalism-solver.md` (SOLVER-FIT, Tarski),
  `./formalism-lean.md` (proof/dependent-types, Curry), `./formalism-minimal.md` (lightest-sufficient, Simon).
- Re-verified precedent: `projects/domainspec-v2/impl/tools/validate-relationships.ts:72,98,141-157,225,235`.
- Package: `../../DEFINE.md` (accept-positive/reject-negative bar; FALSIFIED clause; moat line),
  `../../DESIGN.md` (§3 worked criteria, §4 validator loads `.schema.yml`), `../../WORK-PACK.md` (MT0–MT4).
- Owned (cited via explorers, not reverified here): `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel*.lean`,
  `.../cav2-governance/GovernsAcyclicity.lean` (`acyclicity_not_unary`); Z3-governance determinism thesis.
- MEMORY: `fol-constitution-validation-complement`, `precedent-sweep-owned-in-repo`, `engine-algorithm-proprietary`,
  `lean-kernel-location-and-status`.
