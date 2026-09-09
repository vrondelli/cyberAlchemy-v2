---
agent_name: "Wisnesky, Ryan"
role: explorer
label: E1-owned-axiomatic
dispatch_id: 2026-06-28-constitution-fol-validation-path
date: 2026-06-28
status: complete
methodology: precedent-sweep owned-in-repo
angle: "what constitution-validation we already own as a proto-logical system; FOL is build-from-owned, cross-rule layer is the only open residue"
---

# E1 — Owned Axiomatic Sweep

Explorer: Wisnesky, Ryan (categorical databases / functorial schema lens).

Corpus swept:
- `implementation/domainspec/AXIOMS.md`
- `implementation/domainspec/CONSTITUTION.md`
- `cyberAlchemy-v2/authority/definitions/reviews/constitution-invariant-axiom-role-review.md`
- `cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md`
- `cyberAlchemy-v2/validation/authority-kind-closure-validator-SPEC.md`
- `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean`
- `domainspec-lean-formalization/lean-engineer/AgentPermissionKernelComposition.lean`
- `domainspec-lean-formalization/lean-engineer/AgentPermissionKernelAlgebra.lean`
- `domainspec-lean-formalization/lean-engineer/AgentPermissionKernelSession.lean`

---

## Owned inventory

| File : Symbol / Section | What it validates | Check-class | Machine-checked vs spec vs prose |
|---|---|---|---|
| `AXIOMS.md` : A1–A6 (each axiom names "Governs: C_n, C_m") | Axiom-to-rule attribution — each axiom claims to govern one or two constitution clauses | **Prose attribution** — the link is naming, not derivation; no inference rule is applied | Prose only |
| `CONSTITUTION.md` : Rule Catalog table (`Rule ID → Rule Statement → L4 Axiom → L6 Gate`) | Per-rule binding: each rule maps to one axiom and one gate; the table is the "derivation chain" | **Prose attribution** — "Derivation Chain" section is a 1-step list, not a proof; the axiom→rule link is attribution by enumeration | Prose only |
| `CONSTITUTION.md` : Gate column (e.g. `validate-governance-chain`, `validate-signals`, `validate-orphans`) | Per-rule enforcement: each rule has a named deterministic gate or workflow step | **Per-rule decidable (spec level)** — gates are named CI/workflow checks; they are specified but not formalized | Spec (CI gate names); no machine proof of gate soundness |
| `CONSTITUTION.md` : Enforcement Notes §2 ("Any new governance rule must include Axiom and Gate mapping") | Closure property: no ungated rule is admitted | **Per-rule structural check** (manual / review-mode) — enforced by convention, not by a validator | Prose convention |
| `constitution-invariant-axiom-role-review.md` : Relation Model section (`invariant → axiom → constitution rule → validator/gate → artifact behavior`) | Role-separation and derivation pattern: proposed chain of derivation between term kinds | **Prose schema** — "a default pattern, not a law"; it describes what the chain _should_ be but does not enforce or check any step | Prose only |
| `constitution-invariant-axiom-role-review.md` : Provisional CAV2 Distinction table | Term-boundary spec: distinguishes invariant / axiom / constitution as roles | **Definitional spec** — no validator, no entailment check | Prose spec |
| `STABLE-REPOSITORY-CONSTITUTION.md` : CAV2-C1–C17, Validation mode column | Per-rule mode annotation: each rule carries `hybrid`, `review`, or (implicit) `deterministic` | **Per-rule mode spec** — the mode says what _kind_ of check applies, but does not execute the check; no cross-rule consistency is asserted | Spec (mode annotation); no machine check |
| `STABLE-REPOSITORY-CONSTITUTION.md` : Validation Adapters table | Per-rule adapter binding: each rule names its current enforcement mechanism | **Per-rule decidable (partial)** — some adapters are markdown lint / link check (C-1), others are review-only; no adapter covers consistency between rules | Partial spec; some adapter logic is decidable but not formalized |
| `STABLE-REPOSITORY-CONSTITUTION.md` : OQ-1 ("Which rules can become deterministic first?") | Open question: the document self-declares that cross-rule / model-level checking is unowned | **Explicit open residue** — constitution itself states this is open | Prose (open question) |
| `authority-kind-closure-validator-SPEC.md` : C-1 (closure row present) | Structural presence check: the default-deny catch-all row exists in the authority-kinds table | **Per-rule decidable** — a markdown lint; can be built now | Spec (candidate, not built) |
| `authority-kind-closure-validator-SPEC.md` : C-2 (kinds in their home) | Per-kind location check: each enumerated kind's artifacts sit in their declared folder | **Per-rule decidable** — a filesystem/path lint | Spec (candidate, not built) |
| `authority-kind-closure-validator-SPEC.md` : C-3 (no artifact in non-enumerated location) | Per-artifact closure check: flags any authority artifact not in an enumerated location | **Per-rule decidable** — a path lint against a closed list | Spec (candidate, not built) |
| `authority-kind-closure-validator-SPEC.md` : R-1 (unenumerated governing kind) | Cross-rule / schema-level detection: a _new_ kind that governs but is not in the table | **Review-mode** — explicitly not deterministic; blocked pending OQ-1 (kind-declaration convention) | Spec (review only; build-blocked) |
| `AgentPermissionKernel.lean` : `decidePolicy_sound`, `decidePolicy_allow_iff` | Per-constitution soundness + completeness: the executable monitor agrees exactly with the relational spec `Satisfies`; no false allows or false denies | **Per-rule decidable, machine-checked** — `decidePolicy P r = allow ↔ Satisfies P r` is a proved theorem; this is a per-policy-set (single constitution) soundness proof | Machine-checked (Lean 4, Mathlib) |
| `AgentPermissionKernel.lean` : `deny_precedence` | Cross-rule (within one layer) property: any `forbid` matching in any layer forces `deny` regardless of other rules | **Cross-rule within a single layer, machine-checked** — `deny_precedence` is a genuine intra-layer cross-rule interaction theorem: it says the _interaction_ of a forbid rule with all other rules forces the outcome | Machine-checked |
| `AgentPermissionKernel.lean` : `add_layer_restricts` | Cross-layer monotonicity: adding a layer can only narrow authority | **Cross-layer composition property, machine-checked** — this is a cross-rule / cross-layer property: it reasons about how all rules in one layer interact with all rules in another | Machine-checked |
| `AgentPermissionKernel.lean` : `layered_not_flattenable` | Cross-layer architectural distinction: layered intersection-of-authority is provably not expressible as a single-set Cedar policy | **Cross-layer structural theorem, machine-checked** — exhibits a concrete request where layered and flattened semantics disagree; this is a model-checking-style witness at the constitution level | Machine-checked |
| `AgentPermissionKernelComposition.lean` : `satisfies_append`, `decidePolicy_append_allow` | Cross-layer composition law: `decidePolicy (P ++ Q) r = allow ↔ (P allows r ∧ Q allows r)` — the allow-set of composed policies is the intersection of component allow-sets (meet-homomorphism) | **Cross-layer composition / model-checking, machine-checked** — this IS the "state ⊨ whole-constitution" theorem for the permission constitution: it says two independent governance tiers composed give the meet of their individual verdicts; this is NOT per-rule, it is a theorem about the behavior of the whole composed ruleset | Machine-checked |
| `AgentPermissionKernelComposition.lean` : `append_restricts_left`, `append_restricts_right` | Cross-layer entailment restriction: if the composed policy allows, each component must allow on its own | **Cross-layer entailment (one direction), machine-checked** | Machine-checked |
| `AgentPermissionKernelAlgebra.lean` : `decidePolicy_append_meet`, `decidePolicy_flatten_meet` | N-tier composition law: flattening N policy layers and deciding equals the meet of per-policy decisions; the decision map is a monoid homomorphism from `(LayeredPolicy, ++, [])` to `(Decision, meet, allow)` | **Cross-layer model-checking, machine-checked** — `decidePolicy_flatten_meet` is a "state ⊨ whole-constitution" theorem for N tiers: it checks the entire composed ruleset in one formula | Machine-checked |
| `AgentPermissionKernelSession.lean` : `vetoGuard_vOr_allow_iff`, `vetoGuard_refines` | Cross-veto composition: independent trace-level guards compose as a meet-semilattice; combined guard allows iff both allow | **Cross-rule composition, machine-checked** — this extends the cross-layer law to trace-level monitors; each veto is an independent rule-like guard, and the combined behavior is a proved property of their interaction | Machine-checked |
| `AgentPermissionKernelSession.lean` : `vetoes_independent` | Non-vacuity witness: two independent vetoes each block different requests; the lattice is genuinely 2-dimensional | **Model-checking witness, machine-checked** — a concrete state (two traces, two requests) demonstrating the independent behavior of two rules | Machine-checked |

---

## Honest read

### Check-classes owned vs open

**Check-class 1 — Per-rule decidable checks**

Status: **owned, partially built, partially spec only**.

- `AXIOMS.md` and `CONSTITUTION.md` own this at the prose/spec level: every rule has a named gate and an axiom attribution. The gates exist as CI workflow names (`validate-governance-chain`, `validate-signals`, etc.) but no formal proof of their soundness is in the repo.
- `authority-kind-closure-validator-SPEC.md` owns the design for three per-rule presence lints (C-1, C-2, C-3) but none are built (build-blocked pending OQ-1).
- `AgentPermissionKernel.lean : decidePolicy_sound` + `decidePolicy_allow_iff` own per-constitution soundness (the permission constitution only, not the governance constitutions in `CONSTITUTION.md` or `STABLE-REPOSITORY-CONSTITUTION.md`) and this is **fully machine-checked**.

**Per-rule decidable** is owned in two registers: prose/spec for the governance constitutions, machine-checked for the permission constitution. The gap is that the governance-constitution gates are named but not formalized.

**Check-class 2 — Cross-rule consistency (within one constitution)**

Status: **partially owned — machine-checked for the permission constitution only, open for governance constitutions**.

- `deny_precedence` (`AgentPermissionKernel.lean`) is a cross-rule theorem for the permission constitution: it reasons about the interaction of a `forbid` rule with all other rules in a layer and proves the outcome is forced.
- For the governance constitutions (`CONSTITUTION.md` rules C1–C11, `STABLE-REPOSITORY-CONSTITUTION.md` rules CAV2-C1–C17): **no cross-rule consistency check exists**. No theorem asks "do C1 and C3 together entail a contradiction?" or "does the A1→C1 attribution conflict with the A1→C6 attribution?" These are open.

**Check-class 3 — Axiom→rule entailment**

Status: **not owned — prose attribution only**.

The `AXIOMS.md` → `CONSTITUTION.md` link (the "Derivation Chain") is an enumerated attribution list: "A1 governs C1, C6." This is NOT a derivation. There is no inference rule, no formal language in which A1 is a formula and C1 is a theorem derived from it. The review document (`constitution-invariant-axiom-role-review.md`) explicitly says this chain is "a default pattern, not a law." The Lean kernel has no axiom→rule entailment theorem — it has a soundness theorem (monitor agrees with relational spec) but the spec itself is authored, not derived from axioms.

**Axiom→rule entailment is fully open across all constitutions in the repo.**

**Check-class 4 — Cross-layer / whole-constitution model-checking (state ⊨ ruleset)**

Status: **owned and machine-checked for the permission constitution; open for governance constitutions**.

This is the most important finding:

- `decidePolicy_append_allow` (`AgentPermissionKernelComposition.lean`) IS a "state ⊨ whole-constitution" theorem for the permission constitution: it says `state satisfies composed-policy iff state satisfies each component policy`. This is a cross-layer, whole-ruleset property.
- `decidePolicy_flatten_meet` (`AgentPermissionKernelAlgebra.lean`) extends this to N tiers: flattening N policy layers and deciding equals the meet of per-layer decisions. This is a full model-checking theorem for the permission constitution.
- `layered_not_flattenable` is a model-checking witness that distinguishes the layered semantics from single-set semantics — it is the certificate that the model is non-trivially cross-layer.
- `vetoGuard_vOr_allow_iff` (`AgentPermissionKernelSession.lean`) extends the same pattern to trace-level monitors: two independent guards compose as a meet, and this is proved.

For the **governance constitutions** (`CONSTITUTION.md`, `STABLE-REPOSITORY-CONSTITUTION.md`): no `state ⊨ whole-constitution` theorem exists. There is no formalization in which a "state" (a repository configuration, an artifact set, a session trace) is checked against the whole ruleset. The per-rule mode annotations exist, but no composition theorem.

### Is the cross-rule layer the only open residue, or is more already owned / more still open?

**Precise answer (resist inflation):**

More is already owned than "the cross-rule layer is the only open residue" claims.

The Lean kernel owns **cross-rule consistency, cross-layer composition, and N-tier model-checking** — but only for the permission constitution (a single, typed, decidable policy object). This is a real and substantial ownership. The `decidePolicy_append_allow` and `decidePolicy_flatten_meet` theorems are genuine cross-rule/whole-constitution theorems, not per-rule checks.

But this ownership does NOT extend to the governance constitutions (`CONSTITUTION.md`, `STABLE-REPOSITORY-CONSTITUTION.md`). For those:

1. **Axiom→rule entailment**: open everywhere. No owned derivation chain exists anywhere in the repo.
2. **Cross-rule consistency within governance constitutions**: open. No theorem checks whether CAV2-C1 and CAV2-C2 are jointly consistent, or whether the A2→C2 and A2→C7 attributions create any interaction constraint.
3. **State ⊨ whole-governance-constitution**: open. No formalization checks a repository state against the whole ruleset of `STABLE-REPOSITORY-CONSTITUTION.md`.
4. **Axiom→rule entailment for governance axioms (A1–A6)**: the axioms are stated in natural language with harm evidence; they are not formal predicates from which rules are derived.

**The cross-rule layer has two parts:**

- **Part A (intra-permission-constitution)**: owned and machine-checked. `deny_precedence`, `add_layer_restricts`, `decidePolicy_append_allow`, `layered_not_flattenable`, `decidePolicy_flatten_meet` together constitute a complete owned cross-rule/whole-constitution theory for the permission object.
- **Part B (governance-constitutions)**: genuinely open. Cross-rule consistency, axiom→rule entailment, and state⊨whole-governance-constitution are all open for the governance domain.

**The per-rule decidable layer also has a gap**: the closure-validator (C-1..C-3) is spec-only, not built.

### Is FOL build-from-owned?

**Partially yes, partially net-new.**

FOL's per-rule decidable side collapses to owned: the per-rule mode annotations, the named gates, and the closure-validator spec all own this territory at the spec level. The Lean kernel owns it at the machine-checked level for the permission constitution.

FOL's cross-rule, axiom→rule-entailment, and governance-constitution model-checking side is **net-new residue** — it is NOT owned anywhere in the repo for the governance constitutions. The permission constitution's cross-layer theorems demonstrate that this territory is buildable (the Lean kernel shows the shape of what a solution looks like), but the governance-constitution instances are not built.

The genuinely open residue is:
1. Axiom→rule entailment for governance axioms (A1–A6 → C1–C11 as a formal derivation, not prose attribution).
2. Cross-rule consistency of the governance rules (no pairwise or global consistency check).
3. State ⊨ whole-governance-constitution (no model-checking theorem for `CONSTITUTION.md` or `STABLE-REPOSITORY-CONSTITUTION.md` rules).

The permission constitution's `decidePolicy_flatten_meet` is the closest owned analog — it is the template for what (3) would look like if the governance rules were formalized as a typed decidable policy object.
