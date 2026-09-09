---
dispatch_id: 2026-06-28-constitution-fol-validation-path
role: writer
agent_name: "Curry, Haskell"
synthesizes:
  - agents/01-explorer-wisnesky.md
  - agents/02-explorer-tarski.md
  - agents/03-explorer-lawvere.md
  - agents/04-skeptic-quine.md
  - agents/05-skeptic-godel.md
  - agents/06-skeptic-rathjen.md
status: complete
exit_reason: resolved
final_approver: "Bourbaki, Nicolas (G4) — accepted 2026-06-28"
agents_spawned: 8
date: 2026-06-28
---

# Findings — FOL/model-theoretic validation of our constitutions

> Synthesis only. Every load-bearing claim cites the collected return it rests on. I
> synthesize, I do not invent. claim ≤ proof; owned is a GO, never a KILL.

## 1. Thesis

FOL/formal-methods validation of our governance constitutions is a **build-from-owned
COMPLEMENT** — not a fork, not a subsumer — to the categorical `agent⊨spec` prize: it earns
its keep on exactly one of three fibres (cross-rule consistency / whole-constitution
satisfiability, **Row 2**), is a relabel of an already-owned Lean check on **Row 1**, and is
provably blind on the categorical residue layer **Row 3** — and the residue is real, not
hypothetical, because Gödel built a witness (a `governs`-cycle our own CAV2-C13 mandates but
our per-rule validator cannot even state).

## 2. Register verdict — COMPLEMENT, on a three-fibre division of labor

The candidate registers ("does FOL subsume / fork / complement the categorical `⊨`?")
resolve **per fibre**, not globally (E3). The hyperdoctrine correspondence is what licenses
this: FOL `⊨` and the categorical `⊨` are **two fibres of one hyperdoctrine**, each forced on
a different layer (E3 §1–3). The division of labor:

- **Row 1 — per-rule / per-request `r ⊨ rule`.** This is the Boolean fibre, and it is
  *already written in Lean*: `Satisfies` is a first-order formula verbatim, with
  `decidePolicy` its sound+complete decider (`decidePolicy_sound`, non-`rfl` theorem)
  (E3 §2; S3 §Row 1; S1 confirms sorry-free / `#print axioms`). An external FOL/solver port
  here **adds nothing** — it re-skins an owned, single-trust-base, machine-checked check under
  a second trust base. **Verdict on Row 1: relabel, no residue** (S3 §Row 1; E3 §4 names this
  fork-with-negative-residue).

- **Row 2 — cross-rule consistency / contradiction / `∃ state . state ⊨ constitution`.**
  This is **the FOL complement, and the only one.** Proof-theoretic reason it does not
  collapse to Row 1: the defining predicate is `∃ state . ⋀ᵢ (state ⊨ cᵢ)`, which **does not
  distribute** into `⋀ᵢ ∃ state . (state ⊨ cᵢ)` — different states could satisfy different
  conjuncts, and the contradiction is precisely the *absence of a common* state (S3 §Row 2).
  A per-rule sweep is `∀ rule . lint(rule)`; it has no slot for the conjunction-then-
  existential, so it **cannot state the predicate**, never mind decide it (E3 §4; S3 §Row 2).
  **Verdict on Row 2: real residue, build-from-owned.**

- **Row 3 — residue / behavior gluing.** Categorical-only, and FOL is blind **by theorem**:
  `count_blind_agrees` proves any readout factoring through the Boolean/cardinality fibre
  agrees on the merge/separate distinction the colimit gluing separates
  (`FunctorialResidueStructure.lean:258–261`; E3 §3; S3 §Row 3). The question "is FOL a
  relabel here" does not even arise — FOL cannot *render* this layer. **Verdict on Row 3:
  categorical-only, FOL-blind by theorem.**

**The seam, named.** It is **not** "FOL owns governance, categorical owns residue." The seam
runs *through* the governance fibre, between two quantifier strata: Row 1 (`∀rule.lint`,
owned in Lean) and Row 2 (`∃state.⋀ᵢ`, open) (E3 §"THE SEAM"). **Row 2 is the FOL complement;
Row 3 is categorical-only.** The categorical residue spine and the FOL complement touch
different fibres and never compete (E3 §"Honest read"; S3 §Row 3).

## 3. Build-from-owned matrix

Owner column always filled. The only thing approaching net-new is the A1–A6 *encoding*
(novel-attempt), and it carries its collapse-test (§5c). **No KILL** — no return banked one;
Gödel WITNESSED (S2).

| Part | Owner (cite) | Witnessed? | Relabel-or-residue (S3) | Verdict | Use-mode |
|---|---|---|---|---|---|
| **Row 1 — `r ⊨ rule`** (one state satisfies one rule) | `Satisfies` + `decidePolicy_sound`/`decidePolicy_allow_iff`, sorry-free Lean (`AgentPermissionKernel.lean:102,137,162`; S1) — permission constitution; C-1..C-3 presence lints (`closure-validator-SPEC`) for governance kind-layer | n/a (owned) | **relabel, no residue** (S3 §Row 1) | **GO — already-deployed** | Use the owned Lean decider directly; do NOT port to an external solver (E3 §4: fork w/ negative residue) |
| **Row 2a — cross-rule consistency / contradiction / shadowing / redundancy / equivalence** | **Cedar + Cedar Analysis** (Lean-verified engine; decidable/sound/complete SMT fragment, arXiv 2403.04651) + **FORGE/PCAS Datalog⁻** (contradiction/redundancy/subsumption/reachability, arXiv 2602.16708); permission instance already in our Lean (`deny_precedence`, `decidePolicy_append_allow`, `decidePolicy_flatten_meet`, `layered_not_flattenable`) (E2; S1) | **YES** (S2: governs-cycle defect + C13-vs-R_A contradiction) | **real residue** — `∃state.⋀ᵢ` non-distributive (S3 §Row 2) | **GO — build-from-owned** | Encode our governance rules into a Cedar/Datalog decider and run it |
| **Row 2b — `∃ state . state ⊨ whole-constitution`** (satisfiability of the whole ruleset) | **Classical finite-model / bounded model-checking**; tool owners **Alloy/Kodkod** (bounded SAT), **Cedar→SMT** UNSAT-check, **Z3** on EPR/finite. FORGE does *not* own this (S1). `decidePolicy_flatten_meet` is the *template*, permission-object only (E1 §4) | YES (S2: the lint-clean-but-cyclic state is a `∃state` witness) | **real residue** (S3 §Row 2) | **GO — build-from-owned** | Bound the domain → hand to Alloy/SMT |
| **axiom⊨rule seam** (does an underlying axiom force its rule) | *Checking:* owned-by-classical — FOL entailment `Γ⊢φ`, any sound prover (Lean/Coq/Z3/Vampire) (S1). *Encoding A1–A6:* precedent-thin — no field tool has an axiom-deriving slot; A1–A6 are NL harm-evidence prose, not formulae (S1; E1 §"Check-class 3"; E2 §caveat). Repo-flagged DEFERRED (S1: promotion-request gap G5/OQ-2) | partial (S2: `A3⊨C8` premise-gap exhibited by hand) | checking = relabel-to-owned; **encoding = potential residue iff non-`rfl`** (S3 §axiom-seam) | checking: **GO — build-from-owned** · A1–A6 encoding: **GO — novel-attempt (carries collapse-test §5c)** | Author A1–A6 as formulae, then a one-line `Γ⊢φ` prover call; gate on non-`rfl` derivation |

Reading the matrix honestly (S1): "Row 2 is net-new residue" is **inflation** — the math and
tools are owned; only the *governance-constitution instance is unbuilt*. Build-state ≠
precedent-state. The single genuinely precedent-thin item is the A1–A6 *encoding*, and even
there the entailment *machinery* is owned — only the act of writing our six axioms as
predicates is thin (S1 §axiom-seam).

## 4. The witness (S2 — Gödel, verdict WITNESSED)

This is the proof the Row-2 residue is real, not labelled.

**The two rules.** R_A = the imported `edge-acyclicity-constitution` §1: the `governs` edge
type **must be acyclic**, stated *exceptionless* ("a governance loop … collapses L3
separation"). R_B = **CAV2-C13** (Value-Cycle Edge Guard): authority transitions that can
constrain a value/label/authority-state/schema-field/validation-outcome must be acyclic
**unless** a contextuality-obstruction review records an explicit exception (S2 §"The two real
rules").

**The cross-rule defect the per-rule validator provably cannot state.** Construct three
real-shaped CAV2-C nodes joined by a `governs` cycle `C2 → C13 → C4 → C2`, each *individually
perfect* for C-1..C-3 (kind in home, location enumerated, catch-all present). Ran the Datalog
fixpoint by hand: **per-rule validator returns ALL-PASS (clean)** while `reach(X,X)` finds the
self-reaching cycle on `{C2, C13, C4}` (S2 §"Cross-rule check"). C-1..C-3 are **unary
`(kind, location)` lints with no edge variable and no recursion** — acyclicity is a
transitive-closure predicate, so they **cannot express it** (S2 Defect 1; this is the airtight
half). The sting: **CAV2-C13 already mandates this acyclicity**, so the gap is inside our own
promoted rules — the validator we own to enforce closure cannot enforce the acyclicity our own
constitution requires.

**Why it does not collapse to `decidePolicy`.** There is **no single-artifact reformulation**
of "no cycle in the `governs` relation" or "no model where C13 and R_A disagree" (S2 §Verdict).
`decidePolicy` answers `r ⊨ P` for a *given* `r` (Row 1); the defect lives on **edges and
joins** over the rule graph — the exact expressive gap between a presence-lint and a relational
solver (S2 §"Exact residue"; matches S3's non-distributivity argument and E3's
`∀rule.P` vs `∃kind.governs∧¬enumerated`).

**Stated boundary (claim ≤ proof, S2's own caveat).** Defect 1 (unstateable acyclicity) stands
on CAV2 rules alone. Defect 2 (the C13-vs-R_A *contradiction* on a `{governs, value-constraining,
cyclic, reviewed}` edge — R_A FORBID, C13 ALLOW) is real but R_A is still an *import*, so today
it is a latent cross-boundary contradiction, not yet between two promoted CAV2 rules (S2
§"Honest caveat"). The headline rests on Defect 1, which needs no such interpretation.

## 5. Path-clearing — the buildable first step

**(a) First target — smallest-first.** Formalize **Gödel's witness**: the `governs`-acyclicity
+ CAV2-C13 cross-rule check, in the tightest tool — **Cedar (Lean-verified) or Datalog/FORGE**.
Encode `governs` edges + the `reach`/transitive-closure rule + the C13 reviewed-exception, run
it on the three-node cyclic fixture, and confirm it BLOCKS the cycle the per-rule validator
passes (S2; E2 §"Buildable first step"). This **immediately enforces a rule our constitution
already mandates** (CAV2-C13's acyclicity) — value before any new theory. **Then** the narrow
residue: author A1–A6 as formulae and check one `axiom ⊨ rule` (e.g. `A3 ⊨ C8`, whose missing
linking premise S2 already exhibited).

**(b) What is build-from-owned.** The Cedar/Datalog/Alloy machinery (decidable, Cedar's core
Lean-verified — *shares the categorical substrate's trust base, does not fork it*, E2 §1; S1)
+ the kernel's Row-2 Lean pattern as template (`decidePolicy_flatten_meet`,
`layered_not_flattenable` — the owned cross-semantics distinguishing theorem, S1). For the
axiom-seam: the entailment *checking* is owned-by-classical proof theory (any sound prover,
S1). Nothing here is a new logic.

**(c) Collapse-test (inline, binding the headline).**
- **Row 1** use *collapses to owned* — re-skinning `Satisfies`/`decidePolicy` under a solver is
  a relabel and a second trust base; do not build it (S3 §Row 1; E3 §4).
- **Row 2** is non-vacuous *only because* `∃state.⋀ᵢ` is non-distributive — Gödel's by-hand
  witness discharges the obligation concretely (S2; S3 §Row 2). If a proposed "cross-rule
  check" *did* decompose into independent per-rule checks, it would be a hidden relabel —
  it does not (S3 §"Hidden-relabel check").
- **axiom⊨rule seam** is **vacuous if the axiom is merely the rule restated**: `A ⊢ C` reduces
  to `A ⊢ A` up to renaming and `decide`/`rfl` confirms a string match — entailment costume
  over a syntactic-equality lint (S3 §axiom-seam). It is **real residue iff** `A` and `C` are
  *distinct* formulas with a **non-`rfl`** derivation carrying content (S3). The A1–A6 encoding
  is GO **as a witnessed novel-attempt**, killed-to-relabel on any `rfl` outcome.

**(d) Public/private + foundation note.** This is **cav2 governance** (private authority
spine). Cedar/Datalog is a **complement, NOT a replacement** of the categorical Lean spine:
Row 3 stays categorical (FOL blind by `count_blind_agrees`), and the Row-2 solver earns its
place by **search performance on whole-ruleset model-finding**, not by foundation — the
foundation is the same Boolean fibre the Lean kernel already uses, and Cedar's verified core is
itself Lean, so no second foundation is imported (E3 §5; E2 §1; S3 §Row 3). Even Row 2 should
first be weighed against doing the finite-model search *in Lean* (single trust base) before
reaching for an external solver (E3 §5).

## 6. Relation to the prior dispatch — "another path?"

The user's question after kodamai-correctness-layer was whether the FOL/model-theoretic
register is *another path* to the `agent⊨spec` bridge. **Answer: yes, but bounded — and a
complement, not a competitor.** It is a genuine second path **only on Row 2** (cross-rule
consistency / whole-constitution satisfiability), where neither the owned Lean files nor the
per-rule closure validator addresses the obligation (E1 §4; E3 §4; S3 §Row 2). On Row 1 it
collapses to the owned Lean kernel; on Row 3 it is provably blind. So it does **not** compete
with the categorical `agent⊨spec` bridge the prior dispatch identified as the open prize — the
two live on different fibres of one hyperdoctrine and complete each other (E3 §"Honest read").
The FOL path's concrete payoff is local and immediate: it lets us enforce CAV2-C13's own
acyclicity, which today we cannot (S2).

---

## Auditor verdict (Bourbaki)

Auditor: Bourbaki, Nicolas (G4 / final_approver)
Date: 2026-06-28
Scope: findings.md §1–6 against agents/01–06 and live repo files

### Checklist results

**1. Citation coverage (P9)**

PASS. Every load-bearing claim in §1–5 carries a parenthetical cite to the return it
rests on (E1/E2/E3/S1/S2/S3 with section anchors). The one uncited line is the §6
framing — "The user's question after kodamai-correctness-layer was whether the FOL/
model-theoretic register is *another path* to the `agent⊨spec` bridge" — which is the
dispatch premise (the question posed to the research, not a synthesized result). Curry's
own frontmatter declares this synthesis does not invent, and S1/E3 do not cite this
framing because it precedes them. Confirmed: this is the only uncited line, and it is
legitimately premise, not a derived claim. No uncited load-bearing claim found.

**2. Owned-is-not-a-kill**

PASS. No KILL verdict anywhere in the matrix or the returns. All three verdicts in the
matrix are GO (already-deployed for Row 1, build-from-owned for Row 2a/2b, novel-attempt
for A1–A6 encoding). Confirmed: A1–A6 encoding is the only novel-attempt, and it carries
an inline collapse-test at §5(c) ("vacuous if the axiom is merely the rule restated"
/ "killed-to-relabel on any `rfl` outcome"). No owned result was marked KILL.

**3. Trust-but-verify the witness (P8) — Gödel's witness**

PASS on the airtight half; PASS (with boundary already stated) on the sharper half.

Verification of the per-rule validator: `cyberAlchemy-v2/validation/authority-kind-closure-validator-SPEC.md`
confirms C-1, C-2, C-3 are exactly unary presence/location predicates — "catch-all row
present", "each kind's artifacts sit in their home location", "no authority artifact in
a non-enumerated location" — with no edge variable, no recursion, and no relation between
two artifacts. This is confirmed directly in the spec (lines 19–25). The claim that C-1..C-3
cannot express acyclicity is airtight: transitive closure is a recursive predicate over edges;
the lints have no edge argument.

Verification of CAV2-C13: `STABLE-REPOSITORY-CONSTITUTION.md` §CAV2-C13 (lines 247–271)
is titled "Value-Cycle Edge Guard" and mandates that authority transitions "must be acyclic
unless schema governance records a contextuality-obstruction review and an explicit
exception." This is the exact rule Gödel names. The gap is real: C13 mandates acyclicity of
`governs`/authority edges; C-1..C-3 cannot state the predicate. The acyclicity-vs-per-rule-lint
gap is genuine and not overstated. The witness is not overclaimed — Defect 1 stands on
CAV2 rules alone (Defect 2 is bounded to an import, as S2's own caveat states, and the
findings.md repeats that caveat at §4 "Honest caveat").

**4. Trust-but-verify the Lean (P8)**

PASS, all four symbols confirmed sorry-free in the actual files.

- `decidePolicy_sound`: present at `AgentPermissionKernel.lean:162`. Confirmed non-`rfl`
  (invokes `decidePolicy_allow_iff`); `#print axioms` line at :209.
- `decidePolicy_flatten_meet`: present at `AgentPermissionKernelAlgebra.lean:98`.
  `#print axioms` at :109.
- `deny_precedence`: present at `AgentPermissionKernel.lean:170`. `#print axioms` at :211.
- `count_blind_agrees`: present at `FunctorialResidueStructure.lean:258–261`. Proof is a
  two-line `funext`/`rw` — no sorry. `grep -c sorry` = 0 across
  `AgentPermissionKernel.lean`, `AgentPermissionKernelComposition.lean`, and
  `AgentPermissionKernelAlgebra.lean`; also 0 in `FunctorialResidueStructure.lean`.

The "Row 3 FOL-blind" claim (`count_blind_agrees`) is a real theorem: `g (Xmerge.obj) = g (Xsep.obj)` for any `g` factoring through the fiber assignment. The line numbers cited in findings.md (`:258–261`) match the file. No sorry detected.

**5. External citations real**

PASS.

- arXiv 2403.04651: real, "Cedar: A New Language for Expressive, Fast, Safe, and Analyzable
  Authorization." Cedar's authorization engine and validator are modeled and proved in Lean
  (correctness, sound slicing, validation soundness), differentially tested against the Rust
  implementation. Cedar Analysis adds a symbolic SMT compiler giving decidable/sound/complete
  policy analysis. What findings.md claims ("Lean-verified engine; decidable/sound/complete
  SMT fragment") is accurate.
- arXiv 2602.16708: real, "Formal Policy Enforcement for Real-World Agentic Systems" /
  "Policy Compiler for Secure Agentic Systems (PCAS)." Policies written in Datalog; admits
  static analyses for contradiction, redundancy, subsumption, and conditional reachability
  on the non-recursive fragment. What findings.md claims ("Datalog⁻, contradiction/
  redundancy/subsumption/reachability, arXiv 2602.16708") is accurate. Note: the paper's
  current title on arXiv is "Policy Compiler for Secure Agentic Systems," not "FORGE: Formal
  Policy Enforcement for Real-World Agentic Systems" (the v1 title). This is a minor
  discrepancy in name only — the content cited (Datalog static analysis, cross-rule defect
  detection, NL→policy pipeline) is correctly attributed to this paper. No correction needed
  to the substance; the arXiv ID is the stable identifier.

**6. Collapse-test binds the headline; complement-not-fork honest; path is a PATH**

PASS.

Collapse-test at §5(c): inline, three bullets, each directly addresses a collapse risk — Row 1
collapses to owned (relabel, second trust base); Row 2 is non-vacuous only because
conjunction-then-existential is non-distributive (Gödel's witness discharges this); axiom-seam
is vacuous if `A` is `C` restated, real only if non-`rfl`. The test binds the headline (§1
explicitly states "Row 1 is a relabel", "Row 3 is FOL-blind by theorem", "Row 2 is build-
from-owned"); §2 repeats the same three verdicts per fibre. The collapse-test is not buried.

Path framing: §5 is titled "Path-clearing — the buildable first step", and §5(d) explicitly
states this is a complement not a replacement, that Row 3 stays categorical, and that the
Row-2 solver should first be weighed against doing finite-model search in Lean before
reaching for an external solver. No overclaim that this is a built integration.

"Complement not fork": confirmed at §5(d): Cedar/Datalog "does not fork it, shares the
categorical substrate's trust base" (because Cedar's verified core is itself Lean). The
categorical residue layer is untouched. §6 does not claim the FOL path is the categorical
`agent⊨spec` prize — it says the FOL path is "another path only on Row 2" and "does not
compete with the categorical bridge." The complement framing is honest throughout.

### Required fixes

None blocking. One minor observation for the record: the paper at arXiv 2602.16708 is
currently titled "Policy Compiler for Secure Agentic Systems (PCAS)" on arXiv; the name
"FORGE" appears in v1 and in the abstract of the HTML version. The findings.md cite
("FORGE / PCAS Datalog⁻", arXiv 2602.16708) covers both names and the ID is stable —
no edit required, but the ambiguity is noted.

**FINAL VERDICT: resolved — accepted**
