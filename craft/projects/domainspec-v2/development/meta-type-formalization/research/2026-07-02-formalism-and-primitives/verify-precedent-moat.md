---
node_type: research
angle: SKEPTIC — PRECEDENT + MOAT gate (pushes BUILD-FROM-OWNED)
agent: "Quine, Willard Van Orman"
is_session: false
status: candidate
created: 2026-07-02
role: skeptic (read-only except this file)
target_artifact: meta-type formalization — merged proposal set (solver / Lean / minimal explorers)
verifies: projects/domainspec-v2/development/meta-type-formalization/research/2026-07-02-formalism-and-primitives/{formalism-solver,formalism-lean,formalism-minimal}.md
boundary: PUBLIC validation criteria only; engine src/rules δ-rules NEVER encoded/leaked (moat)
claim_discipline: claim ≤ proof — every owned-asset claim spot-checked against a real path/lemma; a found owner ⇒ build-from-owned, never a kill
---

# Precedent + Moat gate — verify the merged proposal set

**Two attacks per item.** (1) PRECEDENT: is it already owned? — a found owner ⇒ build-from-owned
(name the provider path). (2) MOAT: does the item risk encoding/leaking the δ-rules (any
satisfiability / meaning / derivation check)? — flag it.

---

## 0. PATH CORRECTION (load-bearing — both proof-explorers mis-cite the owned repo location)

Both Curry (formalism-lean) and Tarski (formalism-solver) cite the owned Lean kernel as
`domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean` — a **repo-root-relative**
path that resolves to `/home/vrondelli/projects/domainspec-lean-formalization/`. **That sibling
directory does not exist** (`ls` → No such file or directory). The owned repo actually lives at
**`/home/vrondelli/projects/domainspec-core/domainspec-lean-formalization/`** — i.e. *inside*
domainspec-core (a nested submodule/checkout), matching MEMORY `lean-kernel-location-and-status`
("separate repo … main, lean-engineer/"). **The asset is owned and real; the cite is off by a
prefix.** Every downstream reuse must resolve to the in-core path, or the build-from step points at
nothing. This is a PRECEDENT-verification win (owner found) **and** a cite-hygiene flag.

## 1. Owned-kernel spot-check (Curry's cites — VERIFIED, sorry=0)

Grep over `.../domainspec-core/domainspec-lean-formalization/lean-engineer/`:

| Cited lemma/def | Cited loc | Verified? | Actual evidence |
|---|---|---|---|
| `AgentPermissionKernel.lean` exists | — | **YES** | file present |
| `structure Rule … applies : Req → Bool` | :77-80 | **YES** (at :79-81; :77-78 is its docstring) | `structure Rule (Req)`, `applies : Req → Bool` |
| `Decision`/`Effect` `inductive … deriving DecidableEq, Repr` | :50-59 | **YES exact** | lines 50-59 verbatim |
| `decidePolicy_allow_iff` (soundness biconditional) | :99-164 | **YES** (:137) | `theorem decidePolicy_allow_iff … ↔ Satisfies P r` |
| `deny_precedence` | header | **YES** (:170) | proved |
| `matchesGlob_iff` + `GlobMatches` inductive | GlobSpec :42-107,:54 | **YES exact** | `inductive GlobMatches` :42, `theorem matchesGlob_iff … ↔` :54 |
| `governs` + `DecidableRel governs` | GovernsAcyclicity :46-53 | **YES exact** | `def governs` :46, `instance : DecidableRel governs` :52 |
| `acyclicity_not_unary` (inexpressibility separation) | :135-140 | **YES exact** | `theorem acyclicity_not_unary : ¬ ∃ f …` :135 |
| `layered_not_flattenable` (Tarski's solver cite) | Composition | **YES** | proved in AgentPermissionKernel, referenced Composition :25 |
| `sorry`/`admit` count | claimed 0 | **YES** | grep = 0 in Kernel, GlobSpec, GovernsAcyclicity, Args |

Every cited kernel file also carries `#print axioms <lemma>` (Kernel :209-213, GlobSpec :111,
GovernsAcyclicity :108,:142) — the authors gate their own axiom hygiene. **Caveat (inherited from
Curry §6):** verified by *read + grep sorry=0 + #print-axioms present*, **not by `lake build`**.
Claim ≤ proof: "sorry-free by inspection," not "build-gate-clean."

## 2. Owned non-Lean cites (Tarski / minimal — VERIFIED)

- `projects/domainspec-v2/impl/tools/validate-relationships.ts` — **exists**; `canonicalEdges.has`
  at :72 and :98 ✓, `parseTableRow` :225 ✓, `toHeaderMap` :235 ✓. The table-walk idiom is real.
- `development/deterministic-retrieval-thesis/Z3-governance-needs-determinism.md` — **exists**;
  ":21" carries "default-deny requires a **decidable membership test** … Membership in a finite
  typed enumeration is decidable" ✓; ":11" carries the "reproducible ⇒ gateable" chain ✓.
- `domainspec-lean-formalization/research-security/{permguard-product-feature-map,cross-layer-policy-composition}/research/findings.md` — **both exist** ✓ (in-core path).
- `arcanum/framework/SCHEMA-CONSTITUTION.md` — **exists** ✓.
- **No running FOL/SMT/Datalog engine is wired into `projects/domainspec-v2/impl`** (grep for
  z3/soufflé/datalog hits only `node_modules` build tools). This **confirms** Tarski's own honest
  line: the reuse is the *pattern + decidability argument*, not a live solver.

---

## 3. Per-item verdict (already-owned? | moat-leak? | build-from-owned)

**Item 1 — Per-concept structural table-walk validator over `.schema.yml`.**
- Already-owned: **YES.** Provider = `projects/domainspec-v2/impl/tools/validate-relationships.ts`
  (deterministic parse + `canonicalEdges.has`), decidability justification =
  `Z3-governance-needs-determinism.md:21`.
- Moat-leak: **NO.** Reads *declared* structure; no satisfiability/derivation.
- Verdict: **BUILD-FROM-OWNED** — extend validate-relationships.ts's parse+set-membership.

**Item 2 — P5 boolean-predicate = parser + return-sort (contested: bare vs Lean-proven-sound).**
- Already-owned: **the Lean-proven-sound template is owned.** Provider =
  `…/lean-engineer/AgentPermissionKernelGlobSpec.lean` — `matchesGlob` (recursive Bool matcher) +
  `GlobMatches` (inductive Prop) + `matchesGlob_iff` (:54, sorry-free) is *exactly* the
  "executable Bool ↔ named declarative relation" bridge P5 wants. The *bare* parser (return-sort =
  Bool) is owned-adjacent via the `applies : Req → Bool` shape (Kernel :79-81).
- Moat-leak: **bare parser = NO** (return-sort inference is syntactic/typing). **RISK if it drifts**
  to predicate *satisfiability / validity / non-vacuity* → that reconstructs δ-derivation. Flag: the
  `.schema.yml` criterion must say "parses-to-boolean-rooted," never "prove the predicate is
  consistent/true." (Solver §4 and minimal §3 both name this line; I concur and harden it.)
- Verdict: **BUILD-FROM-OWNED** for the optional sound twin (copy the `matchesGlob_iff` template);
  the bare parser is the sufficient floor. See §4 for whether the *proof* is genuinely from-owned.

**Item 3 — Cross-graph / cross-rule = Datalog/Cedar, build from owned FOL/Cedar.**
- Already-owned: **YES (pattern + separation theorem), NOT a running engine.** Providers:
  `AgentPermissionKernel.lean` (`decidePolicy`, `deny_precedence`, `layered_not_flattenable`),
  `AgentPermissionKernelComposition.lean` (cross-layer ∀-conjunction), and — the sharpest owned
  asset — `cav2-governance/GovernsAcyclicity.lean` (`governs`+`DecidableRel`+`TransGen Reach`+
  `acyclicity_not_unary`), which *proves* a node-local/per-rule lint provably cannot state a
  cross-edge property. This IS the owned "FOL/Cedar Row-2 complement" (MEMORY
  `fol-constitution-validation-complement`). But **no Soufflé/Cedar runtime is wired in** — wiring
  one is net-new *engineering on top of* the owned pattern.
- Moat-leak: **NO** for edge-graph shape (cycles, reachability, cross-rule endpoint admissibility
  over *declared* types). It reasons about the declared graph, not δ-derivation. Keep it a
  *separate cross-cutting layer*, never folded into per-concept checks (both explorers agree).
- Verdict: **BUILD-FROM-OWNED** (pattern from GovernsAcyclicity + Composition); the actual
  Datalog/Cedar engine binding is a bounded net-new wire-up, not a reinvention.

**Item 4 — P6 purity + meaning checks = NOT public; syntactic proxy or engine/FALSIFIED boundary.**
- Already-owned: **no positive owner** (correctly — nothing owned should decide semantic purity
  publicly). The only owned thing here is the *boundary discipline* (DEFINE FALSIFIED clause).
- Moat-leak: **YES — this is THE moat item.** Semantic purity / determinism / "what the predicate
  means" = δ-derivation territory (undecidable in general; needs effect-typing or execution). A
  public purity checker risks re-deriving engine behavior. **FLAG (strongest of the set).**
- Verdict: **build only the syntactic no-mutation proxy** (labelled sound-not-complete), and
  **record a FALSIFIED/boundary flag** when a type's well-formedness truly needs derivation. Do
  NOT formalize purity in the public layer. All three explorers converge here; I ratify it as a
  hard moat line, not a preference.

**Item 5 — Primitives-first = structural predicates + optional Lean Decidable twins (P5).**
- Already-owned: **YES.** The `deriving DecidableEq, Repr` idiom (Kernel :53,:59; Args :45,:69) is
  the owned mechanism; four of six primitives (P1,P2,P3,P5-purity) need only `Decidable`, no proof
  (Curry §4). Provider = the kernel enums/records + `decide` discipline.
- Moat-leak: **NO** — structural predicates over declared data.
- Verdict: **BUILD-FROM-OWNED.** The "optional Lean Decidable twins" add machine-checked *rigor,
  not new discriminating power* (Curry §5, honest framing echoing `GlobSpec.lean:21`). Fund them as
  documentation/rigor, not capability.

**Item 6 — DSL = no bespoke DSL; `.schema.yml` + P5 parser is the minimal DSL.**
- Already-owned: **YES.** `arcanum/framework/SCHEMA-CONSTITUTION.md` (schema format) +
  validate-relationships.ts (the loader/table-walk). No new DSL is owned or needed.
- Moat-leak: **NO** (a shape language over declared structure). Minimal §4 notes a marginal moat
  edge: a declarative `formal_return_type: boolean` schema key keeps parser code *out of* the
  public contract vs shipping a hand-rolled grammar — a real (small) moat-posture point, flagged
  not decided; I concur it slightly favors the declarative variant.
- Verdict: **BUILD-FROM-OWNED** (SCHEMA-CONSTITUTION + validate-relationships.ts); no bespoke DSL.

---

## 4. Is the P5 Lean proof genuinely build-from-owned? (the prompt's specific question)

**YES — genuinely, with two honesty caveats.** The template is real, sorry-free, and structurally
identical to what P5 needs: `matchesGlob` (recursive Bool) proved equivalent to `GlobMatches`
(inductive Prop) via `matchesGlob_iff` (`AgentPermissionKernelGlobSpec.lean:54`), plus the
docstring (:20-23) that states *exactly* the P5 motivation ("`Bool` blob" → "named relation" so the
soundness claim "carries genuine meaning"). Curry's proof-cost estimate (~55-line functional-
induction proof, ~1-2 days for a real 8-12-constructor grammar) is calibrated against this owned
file, not invented. So the *proof technique and its cost* are build-from-owned.

**Caveat A (scope of "from-owned").** What is owned is the **template**, not the artifact: the
`BoolExpr`/`parseFormal` grammar for the Rule Formal cell **does not yet exist** (Curry §6). "Build
from owned" here = *copy a proven proof shape*, then write a new (bounded) proof — not *import a
finished lemma*. Claim ≤ proof: it is a from-owned **head-start**, not a from-owned **result**.

**Caveat B (proof ≠ requirement).** The Lean-proven-sound variant is a *rigor upgrade over a
sufficient bare parser*, not a gate requirement. The DEFINE bar is accept-positive/reject-negative
(minimal §1); a bare return-sort parser already meets it. Fund the Lean twin as
"documentation/credible public-contract artifact" (Curry §5c), and it stays moat-safe **only** if
it proves *parses-to-Bool*, never *predicate-is-satisfiable* (that would drag the δ-semantics into a
theorem — the same flag as Item 4/Item 2).

---

## 5. Summary (≤250 words)

**Precedent stands; one path correction.** Both proof-explorers cite the owned Lean kernel at a
non-existent sibling path; it is real but lives *inside* domainspec-core at
`domainspec-core/domainspec-lean-formalization/`. Fix the prefix or every build-from step aims at
nothing.

**All owned cites verified (read + grep, not `lake build`):** `matchesGlob_iff` (GlobSpec:54),
`GlobMatches`, `structure Rule`/`applies:Req→Bool` (Kernel:79), `decidePolicy_allow_iff` (:137),
`governs`/`DecidableRel`/`acyclicity_not_unary` (GovernsAcyclicity:46,52,135), `layered_not_flattenable`
— sorry=0 in all four kernel files, `#print axioms` present. Non-Lean: validate-relationships.ts
(`canonicalEdges.has` :72/:98), Z3-thesis:21 decidable-membership, both research-security findings,
SCHEMA-CONSTITUTION — all exist. **No running solver is wired into impl** (confirms "pattern reuse,
not engine").

**Owned-asset-to-build-from, per item:** (1) validate-relationships.ts + Z3-thesis:21. (2) GlobSpec
`matchesGlob_iff` template (bare parser floor = `applies:Req→Bool`). (3) GovernsAcyclicity +
Composition (the Row-2 complement; engine wire-up is bounded net-new). (4) *no positive owner* —
boundary discipline only. (5) `deriving DecidableEq` idiom (Kernel:53,59). (6) SCHEMA-CONSTITUTION +
validate-relationships.ts. **Every item is BUILD-FROM-OWNED (no kill), with Item 3's engine binding
and Item 2's proof being net-new engineering *on* owned templates.**

**Moat-leak flags:** Item 4 (purity/meaning) is the hard line — never public; syntactic proxy +
FALSIFIED only. Item 2/P5 leaks *iff* it drifts from return-sort to satisfiability/validity. Item 6
marginally favors a declarative `formal_return_type` key over shipping parser code.

**P5 Lean proof genuinely build-from-owned?** **Yes** — a real, sorry-free, structurally-matched
template (`matchesGlob_iff`); but it is a from-owned *head-start* (write a new bounded proof over a
not-yet-existing grammar), a rigor upgrade over a sufficient bare parser, and moat-safe only while
it proves parses-to-Bool, not predicate-satisfiability.
