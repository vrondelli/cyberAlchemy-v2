---
role: SKEPTIC finder
dispatch: oss-tooling-candidates for domainspec-v2
corpus: internal (projects/domainspec-v2/) — read-only, nothing modified
posture: adopt-conservative (the tool carries the burden of proof)
date: 2026-07-08
---

# OSS tooling candidates for domainspec-v2 — the skeptic's brief

## Framing (read first)

domainspec-v2 is not tool-starved. It is a governance project whose load-bearing
invariant is **byte-stable determinism under claim ≤ proof**: the engine derives
`expect(...).toBe(<value>)` obligations from a spec and the emitted bytes must be
reproducible on any platform, in any order, forever. Most "add an OSS solver/prover/
store" pitches trade that invariant, or the project's non-collapse discipline, for
capability the repo has already decided it does not need at this altitude. Two of the
six candidate areas were *already adjudicated by a frozen internal dispatch*
(`meta-type-formalization/research/2026-07-02-formalism-and-primitives/findings.md`),
which reached "No DSL, no FOL/SMT/Lean" on its own. My job is to hold that line and to
separate the one real friction (a test-runner split) from the tool gaps that are not gaps.

The single most important document for an advocate to reckon with is that frozen findings
file; the single most important code fact is the determinism contract at the top of
`impl/test-derivation-engine/src/formal/eval.ts:1-14`.

---

## Area 1 — SMT solvers (Z3 / CVC5): **REDUNDANT and discipline-breaking**

**What we already do.** The formal obligation surface is a *closed, decidable arithmetic
grammar*, not an open satisfiability problem:

- `impl/test-derivation-engine/src/formal/ast.ts:58-61` — the entire expression algebra is
  `+ - * / min max` plus five folds (`sum|product|min|max|count`), a ternary, a range,
  a count-cap, and a piecewise. Anything outside it returns `{kind:"unparsed"}`
  (`ast.ts:12`) and re-routes to a `coverage_gap` — it is never guessed.
- `impl/test-derivation-engine/src/formal/eval.ts:116-215` — a pure, total, deterministic
  evaluator computes the *value* directly in exact BigInt rationals. There is no search,
  no constraint model, no "find an assignment." The answer is a fold, not a solve.

**Why an SMT backend is redundant.** SMT earns its keep when you must decide
*satisfiability / meaning* over an open formula space. This grammar has no free variables
to solve for at emit time — vars are bound by the fixture env (`eval.ts:120-124`) and the
result is *evaluated*, not *satisfied*. A one-step evaluator already dominates.

**Why it is discipline-breaking (the byte-stability answer to the dispatch's core question).**
The determinism contract is explicit that exactness lives in **BigInt numerator/denominator
space, formatted to a decimal string only at the very end, and only when the result is a
terminating decimal** (`eval.ts:1-14`, `eval.ts:180-204`). An SMT backend breaks this on
three independent axes:

1. **Model non-determinism.** Z3/CVC5 return *a* model, not *the* model; model values,
   ordering, and even which disjunct is chosen vary across versions, seeds, and tactics.
   Emitting `toBe(<smt-model-value>)` makes the EXPECTED bytes depend on the solver build —
   exactly the "summation-order / platform" drift the contract was written to kill
   (`eval.ts:5-9`).
2. **Rational vs float/real.** SMT reals are their own arithmetic; round-tripping to a
   JS-numeric-literal-safe string reintroduces the formatting ambiguity the terminating-
   decimal guard (`eval.ts:180-194`, returns `null` for `1/3`) deliberately refuses.
3. **Totality-as-null.** The engine's contract is "every partial op returns `null` →
   coverage_gap, never a throw, never a guess" (`eval.ts:10-14`). An external solver
   process introduces timeouts, `unknown`, and `unsat`-core states that do not map cleanly
   onto that single `null` sink without inventing new emit semantics.

**Prior decision, on record.** The frozen dispatch already ruled: **"SMT (Z3/cvc5) — NO.
Its natural use is satisfiability/meaning, which approaches the δ-rule moat"**
(`.../2026-07-02-formalism-and-primitives/findings.md:44`). The moat-boundary rule is that
the public contract "validates **shape**, never **meaning**" (`findings.md:65-70`); the
moment a check needs a solver for satisfiability it has crossed into the private δ-engine
and must be recorded as a DEFINE-FALSIFIED boundary, *not* built as a public checker.
Adopting Z3 would be walking straight across that line.

**Verdict: tool does not earn its place.** No open satisfiability surface exists; the one
place a solver is admitted (cross-graph) is explicitly *not* SMT (see Area 6).

---

## Area 2 — Alloy / TLA+: **already installed; the gap is an unfinished example, not a missing tool**

**What we already do.** The alloy-tla-modeling tower is `executable-surface-ready`, scope
`local-research-only`:

- Tooling is installed and wrapped: `research/alloy-tla-modeling/tooling/README.md:6-24`
  ships an idempotent installer plus SANY/TLC and Alloy CLI wrappers, pinned jars
  (`tla2tools-1.7.4`, `alloy-6.2.0`), a checksum policy (`tooling/README.md:92-94`), and a
  gitignore discipline that keeps downloaded jars out of the checkout
  (`tooling/README.md:14-24`).
- Both example models exist and have *run*: `README.md:68-69` — the Alloy sketch is
  `bounded-pass-with-syntax-repair` (pass in scope 8), the TLA+ sketch is
  `counterexample-captured`.

**Why "add Alloy/TLA+" is a non-request.** The tools are present and exercised. The tower's
own closure gates say what is actually open: **"Final learning pack complete: partial"** and
**"the TLA+ freshness model has repair residue"** (`README.md:24`, `README.md:80-88`). That
is *modeling work on one example* (repair/reframe the freshness semantics, then decide
whether to generate from the fixture contract — `README.md:84-88`), not a tool acquisition.
Buying/adding another formal tool does not close a residue that is about the *content of the
`.tla` file*.

**Discipline guardrails already in place.** Promotion is fenced: `BRIDGE-DECISIONS.md:34`
— "Promotion into DomainSpec validators or templates requires a separate approved task…
it must not mutate canonical taxonomy or relationship definitions." Alloy-6-temporal and
TLAPS are already parked as `future-work` with explicit do-not-use conditions
(`BRIDGE-DECISIONS.md:11,13`), and "Alloy or TLA as proof engine for all DomainSpec" is a
hard **block** (`BRIDGE-DECISIONS.md:15`). The non-overclaim posture is baked into the
one-sentence result: TypeScript stays the extraction/bounded-witness layer; formal tools
are lanes, "without overclaiming that … Alloy, or TLA+ alone proves saga correctness"
(`README.md:24`, project `README.md:45`).

**Verdict: not a tool gap.** Any advocate energy here should be re-labeled "finish the
OrderFulfillmentSaga TLA+ freshness model," which is a task-session, not an adoption.

---

## Area 3 — Lean / Coq: **deliberately deferred, with the deferral reasoned and dated**

**Where it is deferred and why.** Two independent records defer theorem-prover work:

- Saga tower: **"Defer Lean"** as an explicit decision (`dcb-saga-correctness/SYNTHESIS.md:103`),
  because "TypeScript alone is not a proof" but the obligation is not yet a stable, small
  theorem (`SYNTHESIS.md:83-103`). Alloy tower echoes it: "Defer Lean until there is a
  stable theorem small enough to justify theorem-prover work" (`alloy-tla-modeling/TOWER.md:76`).
- Formalism dispatch: **"Lean — NOT for per-instance validation (overkill)"**
  (`findings.md:46-49`). Its real, bounded value is named precisely: the
  `deriving DecidableEq`/`Decidable` idiom, the owned `acyclicity_not_unary` cross-edge
  boundary proof, and a **deferred** P5-parser soundness proof — but only *if P5 ever
  becomes a published public-contract artifact*, at ~1–2 days from an owned head-start, and
  even then it is "not proportionate now: it changes zero accept/reject verdicts"
  (`findings.md:48-49`).

**Why a tool push is premature, not wrong-in-principle.** Lean is not banned — the repo
already owns Lean assets it cites (`domainspec-lean-formalization/…AgentPermissionKernel*.lean`,
`GovernsAcyclicity.lean`; `findings.md:58-63`). The skeptical point is proportionality: the
gating condition ("a stable theorem small enough," "P5 published as a public artifact") is
*not yet met*, and the honest residue is on record — the P5 `BoolExpr`/`parseFormal` grammar
"does not yet exist," so the soundness proof is "a from-owned *shape*, written over a new
grammar, deferred" (`findings.md:76-77`). Adopting Coq/Lean tooling now would be building the
prover before the theorem — proof-mass with no verdict it changes, i.e. a claim > proof
violation dressed as rigor.

**Verdict: correctly deferred.** The trigger to revisit is specific and internal (P5 becomes
public); until then a prover changes zero verdicts.

---

## Area 4 — Property-based testing (fast-check et al.): **boundary emission is deterministic-by-fixture; PBT fights the contract**

**What we already do.** Emission is *value-derivation against a fixed fixture env*, not
random exploration. `eval.ts:116` — "Same (expr, env) → same Rational, always." Existing
tests are example-based and exact: `eval.test.ts:2` uses `vitest`'s `describe/it/expect`
over the parser + evaluator; the engine's whole promise is byte-stable golden output.

**Why PBT is redundant *here*.** The evaluator's totality is already exhaustively
*structural*, not statistical: every partial operation (`div0`, empty min/max fold,
unbounded fold over `DEFAULT_MAX_FOLD`, non-numeric cell, non-terminating decimal) has a
closed `null` branch (`eval.ts:46-53, 90-93, 145-171, 180-194`). These are enumerable edge
classes covered by targeted fixtures, not a large input space needing sampling. A property
like "eval is total" is *already a type-level/branch-level invariant*, not a thing to
fuzz toward.

**Where PBT actively fights discipline.** A generative harness introduces a **seed** — a
hidden non-determinism source — into a pipeline whose entire reason for existing is to have
no hidden state (`eval.ts:5-9`). Shrinking and seed-drift make failures non-reproducible
across runs/versions, which is the opposite of byte-stability; and a randomly-discovered
counterexample that emits a value would need to survive the terminating-decimal guard to
even be expressible. PBT's genuine strength — finding *unexpected* inputs — is low-value
against a grammar that *by construction* rejects everything outside a tiny closed set to
`unparsed`/`coverage_gap`.

**Narrow admissible use (flag, not adopt).** If PBT ever enters, it belongs on the
*parser round-trip* (`parseArith ∘ print = id` over generated in-grammar ASTs) as a
dev-time property with a **pinned seed**, never in the emit path and never producing golden
bytes. That is a testing tactic, not a project-level tool adoption, and it does not touch
the determinism contract.

**Verdict: redundant in the emit path; at most a pinned-seed dev nicety on the parser.**

---

## Area 5 — Event-sourcing stores (EventStoreDB / DCB infra): **decided toy/discipline-only, on purpose**

**What we already decided.** DCB is scoped as a *freshness guard*, not a store:

- `dcb-correctness/SYNTHESIS.md:4-6` — "DCB is not a replacement for DomainSpec validators.
  It is a freshness guard for validator-derived correctness claims." Tension 3 explicitly
  weighs "infrastructure-heavy (event storage, live projections, append conditions, tag
  indexes)" against "discipline-first (existing source refs, checksums, code tags, validator
  verdicts, registry snapshots)" and resolves: **"Start with the discipline-first option.
  Only introduce event-store mechanics if the toy proof shows repeated value"**
  (`SYNTHESIS.md:62-76`).
- The first implementation hypothesis is a flat **JSONL ledger** — five events —
  "enough for the first proof" (`SYNTHESIS.md:126-135`). Not a store; a file.
- Saga packet agrees: DCB is "feasible for saga correctness only as a freshness and
  concurrency guard around accepted proof evidence… not the behavioral proof engine"
  (`dcb-saga-correctness/SYNTHESIS.md:8-14`), and "A DCB toy without non-rerunnable evidence
  is over-built" (`SYNTHESIS.md:76`).

**Why a store is discipline-breaking here.** The Authority Model's non-collapse rules say
detection ≠ correction and a drift signal ≠ convergence (`authority/AUTHORITY-MODEL.md:154-159`,
rules 1-2), and that "expected values come from the spec, never from running the
implementation" (rule 5). An event-sourcing runtime is *implementation reality*; wiring the
correctness surface to a live projection store risks exactly the circular self-validation
rule 5 forbids, and it imports append/projection/concurrency machinery to guard a set of
facts most of which are "deterministic and should be rerun or content-hashed before
acceptance" (`dcb-saga-correctness/SYNTHESIS.md:76-82`). DCB is meant to cover only the
*residual* non-rerunnable facts (waivers, external receipts) — a JSONL ledger over existing
IDs, not a database.

**Verdict: adopting an event store would be building the infrastructure the synthesis
explicitly gated behind "if the toy shows repeated value" — and the toy hasn't.**

---

## Area 6 — DSL tooling / replacing regex validators: **would fight determinism; the ONE admitted solver is Datalog/Cedar, quarantined — not a DSL, not SMT**

**What we already do.** Validation is decidable table-walk over structural schemas:

- `findings.md:23-34` — "**No DSL** … Validate the criteria with a structural `.schema.yml`
  + a decidable table-walk validator (build-from-owned: `validate-relationships.ts`)."
  The hardest edge check is already "parse + `Set.has()`" (`findings.md:34`) — bounded ∀/∃,
  no solver, no proof.
- The Formal-cell "parser" is deliberately a **recursive-descent over the closed grammar**
  (`ast.ts:156-167`), pure/total/deterministic, "same string → same AST" (`ast.ts:6`). It is
  not a regex pile pretending to be a language, and it is not a general DSL — it is the
  minimal decidable surface.

**Why a bespoke DSL is over-engineering (on record).** The frozen dispatch's direct verdict:
**"DSL — NO. Over-engineering. The `.schema.yml` + a `formal_return_type` key (+ a minimal
internal parser if P5 needs one) *is* the minimal criterion language. A full bespoke
criterion-DSL is demoted"** (`findings.md:40-41`). The moat-safest form of the P5 return-sort
check is a *declarative key* (`formal_return_type: boolean`) rather than shipping inference
code (`findings.md:35`, `findings.md:65-70`) — i.e. *less* tooling, not more.

**Why "replace the regex validators" cuts the wrong way.** The determinism guarantee is a
property of the *closed grammar + total evaluator*, not of the regex per se; the regexes
(`decimalToRational` at `eval.ts:59`, the e-notation refusal at `eval.ts:71-76`) are
narrow, total, and exact. Swapping them for a general parser-generator or a semantic DSL
engine widens the accepted surface — the exact opposite of the design, whose totality
depends on aggressively routing everything unusual to `unparsed`/`coverage_gap`
(`ast.ts:12`). More expressive input tooling means more values the engine could be coaxed
into emitting non-reproducibly.

**Where a solver *is* admitted — and it is not a DSL and not SMT.** Exactly one layer earns
a solver: cross-graph / cross-rule properties (edge cycles, reachability) that a node-local
check "provably can't state" — and the answer is **"Datalog / Cedar … quarantined, separate
validator, NOT SMT"** (`findings.md:36`, `findings.md:42-43`), backed by the owned
`acyclicity_not_unary` proof that node-local ≠ cross-edge. Note the residue: "No
FOL/SMT/Datalog engine is wired into domainspec-v2 today — the cross-graph layer is a
*net-new engine binding on an owned pattern*, not a running import" (`findings.md:73-74`).
So even the admitted solver is a *future task-session on an owned pattern*, scoped to
cross-graph only, not a general DSL adoption.

**Verdict: DSL — demoted as over-engineering; regex→DSL swap — determinism-breaking. The
only solver with a place is Datalog/Cedar, cross-graph-only, and it isn't wired yet by
design.**

---

## Accidental complexity (real friction, NOT a tool gap): the three-way test-runner split

This is the one place the advocate is right that *something* is wrong — but the fix is
plumbing already designed, not a new tool.

**The friction, verified on disk.** Three test styles coexist under one `impl/`:

- Engine suite → **vitest**: `eval.test.ts:2` imports `describe/it/expect` from `"vitest"`;
  the engine package's `test` script is `vitest run` (`test-derivation-engine/package.json:11`).
- Tag + tools suites → **node:test**: `governance/tags/tools/tests/*.test.ts` and
  `tools/tests/*.test.ts` import `node:assert/strict` + `spawnSync` (verified heads), and
  the root scripts run them via `node --import tsx --test …` (`impl/package.json:25-26`).
- Root `engine:test` shells to the workspace's vitest (`impl/package.json:20`).

So `npm run validate` (docs+rels+content+`tools:test`+`engine:lint`, `impl/package.json:15`)
and the two test runners span **vitest + node:test**, wired by hand.

**Already diagnosed and resolved on paper.** `development/make-it-green/DESIGN.md:34` (G2)
names it exactly: tag tests are `node:test` files "run under `vitest`" and the harness
called `pnpm dlx tsx` with "no pnpm in v2." D2 (`DESIGN.md:45`) is the fix: run tag tests
via `tsx --test`, replace `pnpm dlx tsx` → local `node_modules/.bin/tsx`, "match the code's
actual runner; v2 is npm." My grep for `pnpm` across `impl/**/*.ts` now returns **nothing** —
the pnpm coupling appears already removed, leaving the benign vitest-vs-node:test split.

**The skeptical read.** This is accidental complexity from the v1→v2 fork (imported code
carrying its original runner), not a missing capability. The correct move is *converge on one
runner* (the make-it-green design's direction) — importing another test framework would add
a fourth style, not remove the split. **No tool solves this; discipline does.**

---

## Bottom line (adopt-conservative scorecard)

| Candidate | Verdict | Load-bearing reason |
|---|---|---|
| SMT (Z3/CVC5) | **Reject** | No open satisfiability surface; model non-determinism breaks byte-stability (`eval.ts:1-14`); already ruled NO (`findings.md:44`) + moat line (`findings.md:65-70`). |
| Alloy / TLA+ | **Already have it** | Installed + run (`alloy-tla README.md:68-69`, `tooling/README.md:6-24`); open item is a `.tla` freshness-model repair, a task not a tool (`README.md:80-88`). |
| Lean / Coq | **Correctly deferred** | Gated on "small stable theorem" / P5-goes-public; changes zero verdicts now (`findings.md:46-49`, `dcb-saga SYNTHESIS.md:103`). |
| Property-based testing | **Reject in emit path** | Emission is deterministic-by-fixture (`eval.ts:116`); a seed reintroduces the hidden non-determinism the contract kills. At most pinned-seed parser round-trip. |
| Event-sourcing store | **Reject (toy-by-decision)** | DCB is discipline-first JSONL freshness guard; store gated behind "if toy shows repeated value" (`dcb SYNTHESIS.md:62-76,126-135`); risks rule-5 circular self-validation. |
| DSL / regex→DSL | **Reject DSL; regex-swap breaks determinism** | `.schema.yml` + table-walk is the minimal language (`findings.md:40-41`); only Datalog/Cedar admitted, cross-graph-only, not SMT, not yet wired (`findings.md:36,73-74`). |
| **Runner split** | **Real friction, no tool** | vitest + node:test coexist (`impl/package.json:20,25-26`; `eval.test.ts:2`); fix is convergence per make-it-green D2, pnpm coupling already gone. |

The through-line: every rejected tool trades **byte-stable determinism** or a **non-collapse
rule** for capability the repo has explicitly scoped out. The burden was on the tools; none
of the six clears it at today's altitude. The only honest "yes, later" is Datalog/Cedar for
a cross-graph layer that isn't in scope yet — and it must arrive quarantined, on an owned
pattern, never as SMT.
