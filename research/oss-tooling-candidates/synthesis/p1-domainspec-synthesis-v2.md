---
role: SYNTHESIZER — domainspec-v2 lane (REVISED, zig-zag round 2)
supersedes: synthesis/p1-domainspec-synthesis.md
inputs:
  - research/p1-domainspec-advocate.md   (external-OSS advocate)
  - research/p1-domainspec-skeptic.md    (internal-codebase skeptic)
  - round-2 reviewers: INFLATION-HUNTER (over-recommendation) + GAP-HUNTER (under-recommendation)
posture: adopt-conservative — on a genuine tie the skeptic/inflation side wins; the tool carries the burden
prior-finding: meta-type-formalization/research/2026-07-02-formalism-and-primitives/findings.md
  (frozen: "No DSL, no FOL/SMT/Lean"; Datalog/Cedar admitted cross-graph-only, quarantined, NOT SMT)
disk-checks (this round):
  - formal/ast.ts — NO printer/unparse/serialize function exists (only parsers → AST; `unparsed` sink)
  - formal/eval.ts:100-172 — `evalRational` pure/total exact-BigInt-rational; add/mul commutative;
    sum-fold = manual fold over REDUCER_OP.sum; count-cap `coll.length > cap → null`; empty-fold
    piecewise identities (sum→0, product→1, min/max→null)
date: 2026-07-08
---

# domainspec-v2 OSS tooling — REVISED candidate table (P1, round 2)

Adjudication rule unchanged: claim ≤ proof; genuine ties tier down to the skeptic. This revision
resolves the round-2 zig-zag. Net move: **DEFERRED stops being a parking label for pure duplicates**
(Quint, RDF+SHACL, Ajv → REJECT); the fast-check PILOT is **kept but re-scoped** off the missing
printer onto the value-law oracle; the Z3 REJECT stands but records an explicit open question instead
of pretending posture-(a) was rebutted. DEFERRED is retained **only** where a concrete, non-duplicate
revisit trigger exists (Apalache, Lean, DCB-spec).

| Tool | What | Why it would help (advocate) | Where (seam + file cite) | Are we already doing something similar? | Tier |
|---|---|---|---|---|---|
| **Z3** | MIT SMT solver (arith, quantifiers, bitvectors) | Turn `coverage_gap` into SAT/UNSAT verdicts + unsat-core explanations; WASM/npm in-process | Formal-cell evaluator · `formal/ast.ts:58-61`, `eval.ts:1-14,116-215` | Yes — closed decidable grammar + total BigInt-rational evaluator; answer is a *fold*, not a *solve*. No open satisfiability surface. | **REJECT** — emit-path posture (b) is dead: model non-determinism breaks byte-stability (`eval.ts:1-14`); prior finding froze "SMT — NO … δ-rule moat" (`findings.md:44,65-70`). Round-2: advocate's posture (a) — a **CI-only differential oracle** over the rational core that never emits solver values into golden bytes — is PLAUSIBLE, not rebutted; it is *not adopted* under adopt-conservative + the frozen finding, and is logged as an open question below. Adv+Skep+Infl. |
| **cvc5** | BSD SMT solver; strings/sequences + SyGuS synthesis | Second independent SMT oracle via SMT-LIB 2; string theory; latent synthesis | Formal-cell evaluator (2nd oracle) | Same as Z3 — no seam that needs a solver here. | **REJECT** — inherits Z3's byte-stability + moat rejection; optional GPL-link is a second flag. Adv+Skep. |
| **Apalache** | Apache-2.0 symbolic (Z3-backed) TLA+ checker; inductive invariants | Symbolic checking beats TLC state-explosion on freshness; proves invariants for *all* states | Temporal / freshness · `alloy-tla-modeling/README.md:80-88`, `BRIDGE-DECISIONS.md:11,13,15` | Yes — tla2tools 1.7.4 installed & run; TLA+ sketch is `counterexample-captured`. Alloy-6-temporal/TLAPS parked `future-work`; "Alloy/TLA as proof engine for all DomainSpec" is a hard **block**. | **DEFERRED** — genuine non-duplicate trigger: revisit **only if** TLC actually blows up state-space on the one `.tla` freshness model. Skep>Adv (tie→skeptic). |
| **Quint** | Apache-2.0 TS/npm-native spec language over TLA-the-logic; simulator→TLC→Apalache | Lower authoring friction than raw SANY/TLC; run the spec like a test on the existing npm toolchain | Temporal (authoring front-end) · `alloy-tla-modeling/README.md:68-69,80-88` | Yes — both example models already *ran*; the "specified but not checked" gap is **content** (freshness-repair residue), not authoring ergonomics. | **REJECT** (was DEFERRED) — adopt-conservative resolves the tie: Quint is a pure duplicate of installed tla2tools and adds **no missing capability** (the tower already checks). GAP-HUNTER's PILOT proposal rests on an *unverified* premise — that `.tla` freshness-repair is stalled on ergonomics — which the skeptic reads as content, not authoring cost. Reasserting a revisit condition (ergonomic stall) does not clear the burden. Infl>Gap. |
| **Lean 4 + Mathlib** | Apache-2.0 dependent-type prover; large math library | Mechanize μF/νF duality + catamorphism folds once as permanent machine-checked assets | Deeper-proofs seam · `findings.md:46-49`, `dcb-saga-correctness/SYNTHESIS.md:103`, `alloy-tla TOWER.md:76` | Yes — repo already owns Lean assets (`AgentPermissionKernel*.lean`, `GovernsAcyclicity.lean`); "Defer Lean" is an on-record dated decision. | **DEFERRED** — legitimately deferred with a dated gate: unblocks on "a stable theorem small enough" / P5 becoming a public artifact; changes **zero** verdicts today. Not a duplicate — a gated future asset. Adv+Skep. |
| **Rocq (Coq)** | LGPL-2.1 proof assistant; native (co)inductive types + extraction | Alt prover for μF/νF; extraction emits verified code | Same seam as Lean | Yes — Lean is the already-owned prover; a second prover splits the brain. | **REJECT** — advocate itself says "pick Lean 4"; adopting Rocq alongside owned Lean adds split-brain + an LGPL-on-extraction flag for no marginal theorem. Adv+Skep. |
| **fast-check** | MIT property-based testing for TS; shrinking + stateful/model-based | Metamorphic value-law oracle over the exact-rational evaluator | Formal-cell **evaluator** (not the emit path) · `eval.ts:100-172`, `eval.test.ts:2` | Golden fixtures pin specific (expr,env)→bytes cases but **sample value-correctness sparsely**; there is no printer, so the old round-trip framing was vacuous. | **PILOT (narrow, RE-SCOPED)** — drop `parseArith ∘ print = id` (no printer exists in `ast.ts` — INFLATION-HUNTER confirmed). Re-scope to a **pinned-seed metamorphic evaluator oracle**: generate *in-grammar* ASTs, assert semantic laws in exact-rational space on `evalRational` — `eval(a+b)=eval(b+a)`, `sum[…] ≡ the manual fold`, count-cap & empty-fold piecewise boundary equalities — or cross-check a second tiny reference evaluator. **Clears the discipline bar**: operates on the pure/total evaluator, never the emit path; in-grammar generators leave the accepted surface unchanged; pinned seed = reproducible; asserts equalities, never writes golden byte values. Closes the real soundness-sampling gap. Adv+Skep+Gap. |
| **Hypothesis** | MPL-2.0 Python PBT; rule-based state machines | Gold-standard stateful blueprint for νF stream semantics | νF design reference (Python-side) | No Python in the engine; advocate itself names fast-check primary. | **REJECT** — no Python surface; value is at most a design blueprint already covered by fast-check's stateful mode. Adv+Skep. |
| **DCB spec + dcb-eventstore** | Open Dynamic Consistency Boundary spec + reference types/adapters | Conform the freshness ledger to published append-condition/read-set semantics instead of a private invariant | Freshness ledger · `dcb-correctness/SYNTHESIS.md:4-6,62-76,126-135` | **Yes, largely** — DCB is already the adopted *vocabulary/discipline*; the decided impl is a discipline-first flat JSONL ledger, not a store. | **DEFERRED** — conform to the *semantics* (not a store) as the ledger matures — a low-cost, non-infra, non-duplicate refinement of an owned discipline. Adv (Skep-aligned, anti-store). |
| **EventSourcingDB / Marten** | Purpose-built DCB-native event stores (Marten MIT, on Postgres) | Battle-tested append-condition/optimistic-concurrency enforcement if the ledger goes durable | Freshness ledger (backing store) · `dcb SYNTHESIS.md:62-76`, `AUTHORITY-MODEL.md:154-159` | Yes-by-decision it stays a JSONL file — a store was gated behind "only if the toy proof shows repeated value," and the toy hasn't. | **REJECT** — importing a store now risks the rule-5 circular self-validation the Authority Model forbids (expected values from spec, never from running impl). Skep>Adv. |
| **Langium** | MIT TS DSL framework; grammar→typed AST + LSP | Replace regex feature-pack validators with a typed AST + editor tooling | Feature-pack parser · `findings.md:23-34,40-41`, `ast.ts:12,156-167` | Yes — validation is a decidable `.schema.yml` table-walk; the formal parser is already a pure/total recursive-descent over a *closed* grammar. | **REJECT** — prior finding: "DSL — NO. Over-engineering." A general grammar widens the accepted surface, the opposite of the totality design that routes anything unusual to `unparsed`/`coverage_gap`. Adv+Skep. |
| **Tree-sitter** | MIT incremental/error-tolerant parser + query DSL | Robust partial-parse + declarative tree queries over imperfect Markdown | Feature-pack parsing (alt) | Same as Langium — surface is deliberately closed. | **REJECT** — error-tolerance = accepting *more* input, which is exactly what breaks determinism here. Adv+Skep. |
| **JSON Schema + Ajv** | MIT declarative JSON validation + TS type generation | Lowest-effort regex→declarative swap for structured frontmatter | Feature-pack field validation · `findings.md:23-34,40-41` | Yes — `.schema.yml` + table-walk is already the minimal validation language; a `formal_return_type` declarative key is the moat-safe form. | **REJECT** (was DEFERRED) — INFLATION-HUNTER is right: a **null-delta lateral swap** over an already-schema-driven table-walk. Not determinism-breaking, but it changes no verdict and adds a dependency for parity. Adopt-conservative rejects a capability-neutral swap. Adv+Infl. |
| **Xtext** | EPL JVM/Eclipse DSL framework | Mature ancestor of Langium | Feature-pack (N/A) | N/A — off-toolchain JVM dep. | **REJECT** — advocate itself lists it only so Langium is confirmed the TS-native pick; JVM is a heavier off-toolchain dependency. Adv. |
| **RDF + SHACL** | W3C typed-graph + declarative shape-constraint stack (Jena/pySHACL/rdf-ext) | Make spec↔code↔ontology "one typed graph" queryable (SPARQL) + single-owner/drift invariants executable | spec↔code↔ontology map · single-owner/drift are prose-side in cyberAlchemy-v2 | Prose-side yes (single-owner + drift enforced in the v2 spine); the "one typed graph" itself is **aspirational, not built**. | **REJECT** (was DEFERRED) — proof-mass before the artifact: a SHACL stack for a graph that does not exist, duplicating enforcement the prose spine already does. INFLATION-HUNTER is right that "un-rebutted outside the six areas" was carrying a nonexistent artifact. Revisit only if/when the typed graph is actually built. Adv+Infl. |
| **(Runner split — not a tool)** | vitest + node:test coexist under one `impl/` | — | `impl/package.json:20,25-26`, `eval.test.ts:2`, `make-it-green/DESIGN.md:34,45` (G2/D2) | Real accidental complexity from the v1→v2 fork; pnpm coupling already removed. | **NO ADOPTION** — both finders agree the fix is *converging on one runner* (make-it-green D2), not adding a fourth framework. Discipline, not a tool. Adv+Skep. |

## Net verdict

After the round-2 zig-zag, exactly **one** candidate survives as a scoped PILOT and it is not the
one originally framed: **fast-check re-scoped** from a vacuous printer round-trip (no printer exists on
disk) to a pinned-seed **metamorphic value-law oracle** over the pure `evalRational` core — it closes a
genuine soundness-sampling gap while staying off the emit path, so it clears the determinism/discipline
bar. Everything else stays out: the three former DEFERREDs that were really pure duplicates (Quint,
Ajv, RDF+SHACL) are corrected to REJECT under adopt-conservative, and DEFERRED is now reserved for the
three candidates with concrete non-duplicate revisit triggers (Apalache on state-explosion, Lean on a
public stable theorem, DCB-spec on ledger maturation). SMT stays frozen-rejected on the emit path.

## Residual open questions

1. **Z3 posture-(a) — CI-only differential oracle over the rational core.** The determinism-kill
   defeats emit-path posture (b), but a solver used *purely in CI* to differentially validate the
   BigInt-rational arithmetic — asserting `evalRational` agrees with an SMT model, never inlining
   solver output into golden bytes — was **not** rebutted, only *not adopted* under adopt-conservative +
   the frozen 2026-07-02 "SMT — NO" finding. Status: PLAUSIBLE, deferred as an open question. Revisit
   requires first reopening the frozen finding; do not treat this note as a standing DEFERRED.
2. **Quint ergonomic-stall premise (unverified).** The PILOT case for Quint hinges on the `.tla`
   freshness model being blocked on *authoring cost* rather than *content*. The skeptic reads it as
   content. If a future task-session shows authoring friction is the actual blocker, Quint reopens as a
   PILOT candidate — until then the premise is unmet and the row stays REJECT.
3. **Cross-graph / cross-rule layer (unchanged from v1).** Edge cycles + reachability remain
   provably beyond a node-local check; **no advocate OSS tool fills this** — the only admitted solver is
   Datalog/Cedar, cross-graph-only, quarantined, not SMT, not yet wired by design
   (`findings.md:36,42-43,73-74`). Owned-pattern task-session, not an OSS adoption this lane can bank.
