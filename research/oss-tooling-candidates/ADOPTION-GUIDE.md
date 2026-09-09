# Open-Source Tooling: What We Could Adopt, Where, and Why

**Status:** `candidate` — research deliverable, not authority. Nothing here is ratified.
Produced by dispatch `2026-07-08-oss-tooling-candidates` (parent: `…-oss-tooling-recon`),
`exit_reason: resolved`. Evidence trail in [`research.md`](./research.md); the adjudicated
table in [`findings.md`](./findings.md). This document is the *explanatory* companion: it
carries the context those two assume.

**Claim ≤ proof applies to this document too.** Where a claim rests on a reviewer's
verification rather than a re-check, it says so.

---

## 0. How to read this

Most tooling surveys are a menu. This one is mostly a **defence of the incumbent**, because
that is what the evidence supports. The interesting content is not the eight tools that
survived — it is *why* thirty-odd others didn't, and what that tells us about the shape of
what we've built.

Three things you need before the tool list means anything:

1. **[What the three systems actually are](#1-context-what-the-three-systems-are)** — you cannot
   judge "where would this help" without knowing what the seams are.
2. **[The seven disciplines that constrain adoption](#2-the-seven-disciplines-that-decide-adoption)**
   — these are the selection function. Almost every rejection below reduces to a tool violating
   one of them.
3. **[The fact that both projects already swept this space](#3-we-have-already-swept-this-space--twice)**
   — this sweep is a *second* opinion, not a first one, and it mostly agrees with the first.

Then: **[the tools we could adopt](#4-the-tools-we-could-adopt)** (start with the
[quick-reference table](#40-quick-reference--tool--the-feature-that-would-use-it)),
**[the ones we shouldn't](#5-what-we-should-not-adopt--and-precisely-why)**,
**[sequencing](#6-sequencing--what-to-do-in-what-order)**, and
**[what remains genuinely open](#7-what-remains-genuinely-open)**.

---

## 1. Context: what the three systems are

The private umbrella has three pillars. **DomainSpec** is the *what* (typed intent).
**Arcanum** is the *how* (sigils and spells; the only public pillar). **Saturn** is the *loop*
that closes intent against reality with evidence. `cyberAlchemy-v2` is the private **authority
spine** — it owns the canonical vocabulary and the promotion gates that the rest defer to.

This sweep covered three surfaces, which is why it ran in three lanes.

### 1.1 domainspec-v2 — the deterministic spec→test engine

A TypeScript engine that compiles feature specifications into **test obligations**, with no
LLM in the loop. Its load-bearing property is that the same spec produces the *same bytes*
every time. Concretely:

- A **formal-cell sub-grammar**: a small hand-rolled expression language (ternary, ranges,
  count-caps, arithmetic folds) with a recursive-descent parser in `formal/ast.ts`.
- An **exact-rational evaluator**, `evalRational` (`formal/eval.ts:116-172`), pure and total,
  computing in BigInt rational space so results are byte-stable. Anything the grammar doesn't
  accept is routed to an `unparsed` sink and reported as a `coverage_gap` — *totality depends
  on that routing*.
- **Formal modeling** already in use: Alloy 6.2.0 (structural, bounded counterexamples) and
  TLA+ / tla2tools 1.7.4 (temporal, SANY + TLC), as pinned jars with shell wrappers. Both
  example models have run. One `.tla` freshness model has unrepaired residue.
- **DCB (Dynamic Consistency Boundary)** — reframed as a *freshness guard*: not "is this
  snapshot valid" but "was this correctness claim accepted against the same facts it read."
  Implemented as a flat JSONL append log by decision, explicitly **not** an event store.
- An **authority model** casting three governance kinds — validation (the CHECK), layering
  (the LAW), drift (the TREND) — as a recursive μF/νF (initial-algebra / final-coalgebra)
  chain. The νF "trend" type (`Stream<CheckResult>`) is specified but does not exist in code.

**The seams an outsider would point at:** the hand-rolled evaluator, the unrepaired `.tla`,
the missing νF stream type, the bespoke DCB ledger, the regex-driven Markdown validators, and
the un-mechanized μF/νF theorems.

### 1.2 cyberAlchemy-v2 — the authority spine

A governance layer for knowledge itself. Its goal is to become a **downloadable stable
repository**: a governed base others build on without re-litigating its foundations. Its
central rule is *"authority moves by owner route, not by proximity, usefulness, or repetition."*

- **52 canonical definitions** (`CAV2-D1`…`CAV2-D52`), each a fixed template, cross-referenced
  by stable ID, with a **manually-synced index** (`DEFINITIONS-INDEX.md`) and a **manual drift
  audit** (`DEFINITION-DRIFT-AUDIT.md`).
- **Constitutions**: modular rule sets with glob `Selectors`, per-rule `Validation mode`, and
  Examples/Non-examples. Nearly every rule's "Validation Adapter" points at a *future validator*.
- **A promotion lifecycle**: seven rungs from source evidence → import candidate → local
  authority → stable asset, with named gates returning `pass / flag / block / defer`.
- **A closed, default-deny authority-kind enumeration** plus `forbidden_collapse` fields and
  seven global **non-collapse rules** that keep evidence, ontology, and inventory from silently
  becoming authority.
- **Imports as evidence only**: dispersed material (a `house_project` Obsidian vault) is
  snapshotted with a manifest pinning the source commit hash, then mapped in `source-clusters/`
  recording which source concept was *re-authored* into which CAV2 term — without adopting the
  source's vocabulary as canon.

**The critical fact:** enforcement is entirely manual/prose, and they say so. Consistency is
checked by **dispatching LLM subagents**. The 2026-07-07 contradiction-collapse review found a
real surviving defect (D29 vs D16) that way — which is simultaneously proof the corpus is now
big enough to self-contradict *and* that there is no mechanical way to catch it.

### 1.3 The orchestration layer — how we run agents

This is not a folder; it is a discipline, and it is already an orchestrator:

- A **router → type-skill → form chain**: `domainspec-subagents-strategy` (routes, holds the
  single human confirm gate) → `research` / `review` / `experiment` (type judgment) →
  `register-dispatch` (the form).
- An **append-only YAML dispatch ledger**, two appends per dispatch (spec at launch, outcome at
  close), guarded by a hook that denies in-place edits.
- A **typed group graph**: `connections[]` of `{from, to, type: sequential | zig-zag | feedback,
  loop_cap?}`, dependency-scheduled — a group is READY when its incoming edges have produced.
- **Three dials, smallest scope wins**: `robot_talks` (intra-group confrontation), `zig-zag
  loop_cap` (inter-group exchange), `max_loops` (whole-graph re-run).
- **`check-tension`**, an init-time anti-bias gate: two independent agents verify every n≥2
  group is *pairwise tensioned* against a closed axis vocabulary before the human confirms.
- Execution stays **on the Claude Code turn** — CLAUDE.md route 2: *"prefer native
  skills/subagents over nested model-backed CLI."*

**The seams:** the ledger is write-optimized and query-hostile; there is no per-group progress
record, so an interrupted multi-loop run re-spawns completed groups; and `check-tension` is
pre-flight only, so nothing checks whether the agents *actually* diverged.

---

## 2. The seven disciplines that decide adoption

These are not preferences. They are the constraints that make the systems what they are, and
almost every rejection in §5 is one of them firing.

| # | Discipline | Owner | What it forbids |
|---|---|---|---|
| 1 | **Byte-stable determinism** | domainspec-v2 | Anything returning *a* model rather than *the* value; anything varying by seed/version; anything with `timeout`/`unknown` states that don't map to the single `null → coverage_gap` sink. |
| 2 | **Claim ≤ proof** | both | Asserting more than the evidence sustains. A bounded witness is not a proof. |
| 3 | **Non-collapse** | both | Evidence, ontology, and inventory silently becoming authority. CAV2 rule 2: *ontology models; it cannot decide authority.* domainspec rule 5: no circular self-validation (the engine must not validate itself against a store it produced). |
| 4 | **Prose-first / schema-stable-before-validator** (OQ-1) | cyberAlchemy-v2 | Freezing a validator over a schema that is still a *candidate*. The authority-object schema must stabilize first. |
| 5 | **Authority by owner route, not proximity** | cyberAlchemy-v2 | Promoting a thing because it happens to be nearby. The `ontology_edges` SQL table exists — but only inside the **un-promoted** import. |
| 6 | **Public/private boundary + downloadable base** | umbrella | Shipping a runtime dependency (torch, ClickHouse, a graph DB) or leaking private rules into public policy. Precedent: the import excluded 21 `.obsidian/` files carrying credentials and machine state. |
| 7 | **Turn-driven native execution + one append-only system of record** | orchestration | An external orchestrator owning the event loop (control inversion), or a second store outside the append-only hook. |

**The selection function that falls out.** A tool earns adoption only if it (a) sits on a real
seam, (b) violates none of the seven, and (c) does not duplicate a capability we already own.
That is the entire test. Read §5 with it in hand and every rejection becomes predictable.

---

## 3. We have already swept this space — twice

This matters more than any individual tool verdict.

- **domainspec-v2**, `development/meta-type-formalization/research/2026-07-02-formalism-and-primitives/findings.md`
  — a *frozen* internal finding that independently concluded **"No DSL, no FOL/SMT/Lean."** The
  only admitted solver is Datalog/Cedar, cross-graph-only, quarantined, and not yet wired.
- **cyberAlchemy-v2**, `development/research/2026-06-24-ontology-engineering-precedent/findings.md`
  — mapped DL/TBox, OntoClean, OntoUML, SHACL, RDF+PROV-O, GRADE and TopBraid EDG onto CAV2's
  parts and returned *"build-from-owned or already-deployed"* on ~9 of 11 candidates, with the
  standing instruction: **cite the precedent, do not adopt the tool.**

So the honest framing of this sweep is: an independent second opinion, run with a deliberately
adversarial structure (an advocate reading the external OSS ecosystem against a skeptic reading
our own files), that **largely confirms the first opinion** and adds a small number of
boundary-safe seams the earlier sweeps did not name.

Across ~35 candidates: **1 adopt-on-ratification, 5 pilots, 2 sequenced pilots.** Zero
unconditional adopt-now. Zero platform migrations.

---

## 4. The tools we could adopt

Eight survivors, in the order they clear their preconditions. For each: what it is, **where**
it plugs in, **why** it helps, **what we do today**, and what gates it.

### 4.0 Quick reference — tool → the feature that would use it

| Tool | Feature it would serve | System | Tier |
|---|---|---|---|
| [lychee](https://github.com/lycheeverse/lychee) *(capability, not the binary)* | [Index & cross-reference link integrity](#41-lychee--link-integrity-for-the-authority-spine) — the `.md` link mesh binding [`DEFINITIONS.md`](../../authority/definitions/DEFINITIONS.md) ↔ [`DEFINITIONS-INDEX.md`](../../authority/definitions/DEFINITIONS-INDEX.md) ↔ the [constitutions](../../authority/constitutions/) | cyberAlchemy-v2 | **ADOPT-ON-RATIFICATION** |
| [fast-check](https://github.com/dubzzz/fast-check) | [Metamorphic value-law oracle](#42-fast-check--a-metamorphic-value-law-oracle-for-the-evaluator) over [`evalRational`](../../../projects/domainspec-v2/impl/test-derivation-engine/src/formal/eval.ts) — commutativity, `sum`≡fold, count-cap & empty-fold boundaries | domainspec-v2 | **PILOT** |
| [JSON Schema](https://json-schema.org/) via [remark-lint-frontmatter-schema](https://github.com/JulianCataldo/remark-lint-frontmatter-schema) | [Definition-template conformance — **stable slots only**](#43-frontmatter-lint-stable-slot-subset-only--a-first-deterministic-gate): ID format + required-slot presence, per [`DEFINITION-SCHEMAS.md`](../../authority/definitions/DEFINITION-SCHEMAS.md) | cyberAlchemy-v2 | **PILOT** |
| *native script* (no dependency) | [Index generation](#44-a-native-index-generator--kill-the-manual-sync) — regenerate [`DEFINITIONS-INDEX.md`](../../authority/definitions/DEFINITIONS-INDEX.md) as a projection of [`DEFINITIONS.md`](../../authority/definitions/DEFINITIONS.md) | cyberAlchemy-v2 | **PILOT** |
| [markdownlint](https://github.com/DavidAnson/markdownlint) | [Structural Markdown hygiene](#45-markdownlint--structural-hygiene) beneath the frontmatter layer *(does **not** own template conformance)* | cyberAlchemy-v2 | **PILOT** |
| [OTel-GenAI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) via [OpenLLMetry](https://github.com/traceloop/openllmetry) | [Telemetry emit shape](#46-otel-genai-semantic-conventions--a-wire-format-not-a-store) — a wire format for whatever read-model lands; zero egress, zero store | orchestration | **PILOT** (rider) |
| [pySHACL](https://github.com/RDFLib/pySHACL) ([SHACL](https://www.w3.org/TR/shacl/)) | [The D16 regression-lock](#47-shacl-one-shape--the-d16-regression-lock) — **one** shape (`sh:in` + `sh:minCount`) over the relator enum in [`DEFINITIONS.md`](../../authority/definitions/DEFINITIONS.md) | cyberAlchemy-v2 | **SEQUENCED PILOT** |
| *native field* (no dependency) | [Per-group progress marker](#48-a-native-per-group-progress-marker--cheap-crash-recovery) — crash-recovery so an interrupted re-run skips completed groups | orchestration | **SEQUENCED PILOT** |

Two of the eight are **not third-party tools at all** — they are native scripts/fields, chosen
over their OSS equivalents (LinkML, Temporal/DBOS) precisely because the OSS versions violate
[the disciplines](#2-the-seven-disciplines-that-decide-adoption).

Everything else we looked at is in [§5 — what we should *not* adopt](#5-what-we-should-not-adopt--and-precisely-why),
with the discipline that rejects it named in each row.

---

### 4.1 lychee — link integrity for the authority spine
**Tier: ADOPT-ON-RATIFICATION** · lane: cyberAlchemy-v2 · cost: near-zero

**What.** A fast async Markdown/HTML link checker (Rust). Read: *the capability*, not the
binary — `markdown-link-check` or any equivalent satisfies the same need.

**Where.** The CAV2 authority spine is a mesh of relative `.md` links: `DEFINITIONS.md` ↔
`DEFINITIONS-INDEX.md` ↔ the constitutions ↔ `source-clusters/` ↔ import manifests. Run it in
CI over `cyberAlchemy-v2/**`.

**Why it helps.** A broken cross-reference silently breaks traceability, which is the spine's
whole product. This is deterministic, has no schema dependency, ships no runtime, and adds no
leak surface — so it clears all seven disciplines trivially.

**What we do today.** Manual link discipline. No deterministic gate anywhere.

**Why this one and nothing else.** It is not a tool we found and liked — it is the tool
**CAV2's own constitution already names**. `STABLE-REPOSITORY-CONSTITUTION.md` OQ-1 reads:
*"start with Markdown link checks and source-map field checks before writing broader
validators."* The `C1` Validation Adapter is literally *"Markdown link check plus source-map
review."*

**The gate — and why the tier is not "adopt-now."** That OQ-1 is **status OPEN**. It is a
*recommendation*, not a ratified rule. Adopting on the strength of an unratified open question
would front-run the owner's own decision, which is exactly the failure mode discipline #5
exists to prevent. Ratify OQ-1, then adopt. *(Both final reviewers independently pushed for
this relabel; the original synthesis said "ADOPT-NOW" and overstated.)*

---

### 4.2 fast-check — a metamorphic value-law oracle for the evaluator
**Tier: PILOT** · lane: domainspec-v2 · cost: low, dev/CI only

**What.** MIT property-based testing for TypeScript, with shrinking (auto-minimizes a failing
input) and stateful/model-based runners. Same toolchain — no new language, no new runtime.

**Where.** `impl/test-derivation-engine/src/formal/eval.ts`, against `evalRational`
(lines 116-172). **Not** the emit path.

**Why it helps.** The engine's totality is covered structurally (every branch of a closed
grammar), but its **value-correctness** is covered only by golden fixtures, which sample the
space sparsely. That is the one real soundness gap in the engine. Property-based testing closes
it by generating in-grammar ASTs and asserting *metamorphic laws* — equalities that must hold
regardless of the specific value:

- `eval(a + b) = eval(b + a)` — `add` (L81-83) and `mul` (L87-89) are structurally commutative,
  and `+` routes to `add` (L130-131).
- `sum[…]` ≡ the manual fold — `REDUCER_OP.sum = add` (L106), fold loop (L160-169).
- Count-cap boundary: `coll.length > cap → null` (L148-151).
- Empty-fold identities: `sum→0`, `product→1`, `min/max→null` (L155-159).

**Why it does not break discipline #1.** The seed is pinned, so runs are reproducible.
Generators emit **only in-grammar** ASTs, so the accepted surface is unchanged. It runs off the
emit path and **asserts equalities rather than writing golden byte values**. It strengthens the
proof of the arithmetic core — it is claim≤proof-*positive*.

**A correction worth recording.** The original pitch was a parser round-trip,
`parseArith ∘ print = id`. A reviewer checked the disk: **there is no printer.** `formal/ast.ts`
exports only parsers. That property would have required *building* a printer with no production
consumer, purely to give the test something to check — a manufactured surface. The metamorphic
oracle is the version that survives, and it needs no printer. This is the sweep's clearest
example of adversarial review saving a bad recommendation from itself.

---

### 4.3 frontmatter-lint (stable-slot subset only) — a first deterministic gate
**Tier: PILOT** · lane: cyberAlchemy-v2 · cost: low

**What.** JSON Schema (or equivalent) validation of YAML frontmatter, enforced in CI.

**Where.** Definition-template conformance, per `DEFINITION-SCHEMAS.md`. **Only the stable
slots**: ID format (`CAV2-D*`) and required-slot *presence*.

**Why it helps.** CAV2 has **no deterministic frontmatter gate at all** today; the template is
held by review alone. ID-format and required-slot presence do not depend on the contested parts
of the model, so they can be enforced now.

**Why it isn't the full schema.** Discipline #4. The `NODE-MODEL` is an unamended candidate and
a confidence-field rename is pending a decision-gate. Validating *those* slots would freeze a
schema that is still moving. **Partial enforcement is not a full-schema freeze** — that
distinction is what makes this admissible and the full linter (§5) deferred.

---

### 4.4 A native index generator — kill the manual sync
**Tier: PILOT** · lane: cyberAlchemy-v2 · cost: low · **native script, not LinkML**

**What.** A small deterministic in-repo script that regenerates `DEFINITIONS-INDEX.md` from
`DEFINITIONS.md`.

**Where.** The index is a **projection** of already-stable slots: id, term, one-line summary.

**Why it helps.** The index is currently synced by hand, and a hand-synced projection of a
3,580-line source is a standing drift risk. Regenerating it makes the drift structurally
impossible rather than diligently avoided.

**Why not LinkML** (which the advocate ranked #1). LinkML would generate the index *and* JSON
Schema *and* SHACL *and* OWL from one source — but it pulls the whole RDF/OWL stack and
inherits the OQ-1 freeze (discipline #4). The index slice **does not depend on the contested
model**, so it should not inherit the block. Take the slice; leave the stack.

**Honest caveat (claim ≤ proof).** **No index-drift failure is on record.** This is book-keeping
relief, not a fix for demonstrated pain.

**So why is this a PILOT while the [orchestration read-model](#53-orchestration--rejected) is
DEFERRED, on the same "no proven pain" caveat?** A fair challenge from the coherence reviewer, and the answer is that
the burden is met *differently*: the index generator is a **deterministic projection of
already-stable slots at near-zero cost** — it cannot be wrong, only unnecessary. The read-model
is a build whose *cited payoff metrics are degenerate today* (see §5.3). Cheap-and-certain
clears a lower bar than cheap-and-pointless.

---

### 4.5 markdownlint — structural hygiene
**Tier: PILOT** · lane: cyberAlchemy-v2 · cost: near-zero

**What.** A Markdown style/structure linter. **Where.** CAV2 prose, alongside lychee.

**Why it helps.** Keeps malformed Markdown from defeating the frontmatter layer beneath it.

**What it explicitly does not do.** It does **not** own template conformance — that is §4.3's
job. The original rationale ("enforces the structural regularity the fixed template assumes")
overstated; markdownlint checks generic hygiene (heading levels, list form) and nothing about
`CAV2-D*` slots. Corrected here so nobody adopts it expecting the wrong guarantee.

---

### 4.6 OTel-GenAI semantic conventions — a wire format, not a store
**Tier: PILOT (rider)** · lane: orchestration · cost: near-zero

**What.** OpenTelemetry's GenAI semantic conventions (as emitted by OpenLLMetry): standard
span and attribute names for LLM/agent operations.

**Where.** Whatever telemetry or read-model work lands over the dispatch ledger — emit in
OTel-GenAI shape rather than a bespoke one.

**Why it helps.** Free option-value. Any future backend becomes a drop-in with no
re-instrumentation. Adopting a *format* costs almost nothing and buys portability.

**Why it survived when Langfuse and Phoenix did not.** This was the sweep's clearest **category
error**, caught by the gap-hunter: the original synthesis swept OpenLLMetry into the same
"hosted OSS → DEFERRED" bucket as Langfuse, on **egress** grounds. But OTel-GenAI is a **wire
format, not a store**: zero egress, zero daemon, zero second system of record. Discipline #7
has nothing to bite. Deferring a *format* decision on storage grounds conflated two different
things.

**It is a rider, not a standalone.** It has no consumer until a read-model exists. Adopt it *as
the shape* of that work, whenever it happens.

---

### 4.7 SHACL (one shape) — the D16 regression-lock
**Tier: SEQUENCED PILOT** · lane: cyberAlchemy-v2 · **strictly gated**

This is the only place in the entire sweep where a deterministic tool **beats a demonstrated,
verified failure of the status quo.** It is also the most carefully gated recommendation, and
the sequencing is not optional.

**The demonstrated pain.** `DEFINITIONS.md` carries an unreconciled divergence:

- **D16** (≈ L665-673) mandates that a typed coupling be an explicit typed relation with
  **seven fields**: source, target, relation type, direction, owner, evidence, effect.
- **D29** (≈ L1800-1804, 1827-1828) says axes are coupled by *"an explicit typed relation,
  gate, schema rule, validator, or owner decision"* — **five relator kinds** — and its Formal
  Interpretation lists only **four fields**.

So D29 admits looser relators and fewer fields than D16 requires. This surfaced in the
2026-07-07 contradiction-collapse review only after **two attackers and three verifiers** had
passed over it, and it is **still live and unfixed today**. That is a standing counter-example
to "manual and LLM review is a sufficient backstop."

**Be precise about what it is.** D29 *does* textually defer — *"the dependency must be
represented through CAV2-D16 … before it can govern work."* So this is an **unreconciled
relator/field divergence**, a soft tension, **not a hard logical contradiction**. The earlier
draft of this finding hardened it; the claim≤proof auditor caught that. The divergent
enumeration is nonetheless real and un-collapsed.

**Where the tool goes.** A **single** pySHACL shape over D16: `sh:in` on the relator enum,
`sh:minCount` on the seven fields.

**Why it helps.** Cold-*catching* R1 was hard — it is a semantic-kind mismatch. But
**regression-locking it after the fix is trivially structural.** Once the relator enum is one
rule, "a relator must be a D16 typed relation, and a gate/validator/owner-decision is a
recording instrument rather than an alternative" is a plain enumeration constraint. This is not
a premature validator; it is **a lock on a fix that is already required.**

**The sequence — never reorder it.**
0. **The owner confirms R1/C4 is still live and authorizes the fix.**
   (See [§7.2](#72-is-the-d29d16-divergence-still-live-owner-confirmation-required).)
1. Fix R1/C4 in `DEFINITIONS.md`.
2. **Freeze D16's relation-type enum.** Note carefully: D16's "relation type" is a **free field
   today — no enum exists.** The fix *creates* the enum the shape would lock.
3. *Then* add the single shape.

**Never author the shape first.** That would be a validator over an unstable definition, which
OQ-1 (discipline #4) forbids. And note this is scoped to *one* shape over *one* definition —
**authoring new global shapes stays DEFERRED**, for exactly the reason the lock is permitted:
the lock's target is about to be frozen; the global shapes' targets are not.

---

### 4.8 A native per-group progress marker — cheap crash-recovery
**Tier: SEQUENCED PILOT** · lane: orchestration · cost: near-zero · **native, not Temporal**

**What.** One append-only field on the existing dispatch ledger, recording per-group completion,
under the existing append-only hook.

**Where.** The dispatch ledger. **Why it helps.** Today a dispatch row records *intent* at
launch and *outcome* at close — but **not per-group progress**. So an interrupted mid-loop
`max_loops` run re-spawns groups that already completed: wasted token budget and inconsistent
partial state. The marker lets a re-run skip finished groups.

**Why native and not Temporal / DBOS / Restate.** This is the sharpest adjudication in the
orchestration lane. Every disqualifier stacked against durable execution — a persistent worker
daemon, a determinism tax that fights LLM non-determinism, a **second system of record**
outside the append-only hook — attaches to the *daemon*, **not** to a one-field marker on the
ledger we already have. The original synthesis imported the objections from the wrong candidate
and deferred the cheap native fix on the expensive tool's grounds.

**The arming condition.** `loops_used` is **uniformly 1** across all 141 dispatch rows
(135 `resolved`, 1 `error`) — a reviewer grep-verified this, including on runs that *budgeted*
`max_loops: 2`. The loop is never exhausted, so the crash-resume gap **never bites today**.
Therefore: **build the cheap thing now; arm it on the first `max_loops ≥ 2` multi-group
dispatch.**

**One caveat, stated because it cuts against me.** "It never bites" is partly **selection bias**:
the ledger contains no large multi-loop dispatches *in part because* the capability to survive
their interruption doesn't exist. Absence in the record is weak evidence of absence of need.

---

## 5. What we should *not* adopt — and precisely why

Comprehensive, because the "why not" is the more useful half. Each verdict names the discipline
(§2) that fires, or the capability we already own.

### 5.1 domainspec-v2 — rejected

| Tool | Why not |
|---|---|
| **Z3** | Emit-path use is dead on **discipline #1**: an SMT solver returns *a* model (varies by seed/version); the SMT-real→string round-trip fights the terminating-decimal guard; `timeout`/`unknown` states don't map to the single `null → coverage_gap` sink. The formal surface is a *closed decidable grammar* — the answer is a **fold**, not a **solve**. Also already ruled NO by the frozen 2026-07-02 finding. *(One posture survives as an open question — see [§7.1](#71-z3-posture-a--a-ci-only-differential-oracle).)* |
| **cvc5** | Inherits the Z3 rejection. Optional GPL-link in non-default builds. |
| **Quint** | A pure duplicate of the already-installed `tla2tools`. Its case rests on an **unverified premise** — that the `.tla` freshness residue is stalled on *authoring ergonomics*. The skeptic reads the residue as **content**. Nobody checked which. Adds no capability. |
| **Apalache** | **DEFERRED**, not rejected — a genuinely conditional revisit with a falsifiable trigger: *if TLC actually blows up* on the freshness model. Today the open item is repairing one model (a task), not acquiring a tool. |
| **Lean 4 / Rocq** | Lean: **DEFERRED** on a dated, on-record decision — the repo already *owns* Lean assets; it unblocks on a stable public theorem, and mechanizing today changes **zero** accept/reject verdicts. Rocq: **REJECT** — Lean is the owned prover; a second one is split-brain, plus LGPL-on-extraction. |
| **Hypothesis** | No Python surface in the engine. fast-check covers the seam. |
| **fast-check (original framing)** | The parser round-trip needed a **printer that does not exist** in [`ast.ts`](../../../projects/domainspec-v2/impl/test-derivation-engine/src/formal/ast.ts). Only the [metamorphic re-scope](#42-fast-check--a-metamorphic-value-law-oracle-for-the-evaluator) survives. |
| **EventSourcingDB / Marten** | Importing a durable store to validate the engine risks the Authority Model's **rule-5 circular self-validation** (discipline #3). DCB is scoped as a *freshness guard*, not a store, by decision. |
| **DCB spec / dcb-eventstore** | **DEFERRED** — the DCB *vocabulary* is already adopted. Conform the JSONL ledger to published append-condition semantics as it matures. Not a new adoption. |
| **Langium / Tree-sitter / Xtext** | The frozen finding says *"DSL — NO. Over-engineering."* Deeper: a general or **error-tolerant** grammar **widens the accepted surface**, and the engine's totality depends on routing everything unusual to `unparsed`. Error-tolerance is the opposite of the design. |
| **JSON Schema + Ajv** | A **null-delta lateral swap**: `.schema.yml` + a decidable table-walk is already the minimal declarative validation language. Changes no verdict; adds a dependency for parity. |
| **RDF + SHACL** | **Proof-mass before the artifact.** The "one typed graph" over spec↔code↔ontology is aspirational and not built; single-owner and drift are already enforced prose-side. Revisit only if the graph actually exists. |
| **The vitest / node:test split** | **Not a tool problem.** Accidental complexity from the v1→v2 fork. The fix is *converging on one runner*, a discipline — adding a fourth framework would make it worse. |

### 5.2 cyberAlchemy-v2 — rejected

| Tool | Why not |
|---|---|
| **OWL reasoner** (HermiT / ELK / Openllet) | **Discipline #3, decisively.** Inference-that-*decides* breaks non-collapse rule 2: *ontology models; it cannot decide authority.* CAV2 is by design "a structural signature with no reasoner." The tempting part (explanation routines naming the conflicting axioms) does not survive the rule. |
| **Graph DB** (TerminusDB / Neo4j) | **Discipline #5.** The `ontology_edges` SQL graph exists — inside the **un-promoted** `house_project` import. Promoting it *because it is there* is precisely the proximity-promotion the Authority Rule forbids. Plus an unstable NODE/RELATION-MODEL and a shipped runtime store (**#6**). TerminusDB's git-like versioned schema is a genuinely elegant match for candidate→canonical; it still loses on #5 and #6. |
| **SKOS** (+ VocBench / TemaTres) | Freezes the **candidate** RELATION-MODEL (#4). VocBench's auto-suggest would let the inventory decide authority (#3). Runtime + leak surface (#6). And `DEFINITIONS` + `INDEX` + aliases already approximate a concept scheme. |
| **OPA/Rego + conftest, CUE** | Checking is **already owned** (Cedar + a sorry-free Lean `decidePolicy_sound`). The schema is mid-promotion (#4). And public Rego encoding our axioms risks **leaking the paid moat** (#6). |
| **W3C PROV-O / PROV-DM** | Provenance is **already the design backbone** of the import manifests and source-clusters. PROV-O adds redundant RDF serialization weight. Recorded so it is not mistaken for an open gap. |
| **LinkML** | **DEFERRED.** Inherits the OQ-1 freeze plus the OWL/RDF stack. Its single best slice — index generation — is now met natively (§4.4). |
| **sentence-transformers (SBERT / NLI)** | Demoted from PILOT on three independent grounds: it is a **pre-screen feeding SHACL**, but SHACL is gated *below* it (piloting an on-ramp to a closed road); the skeptic **never tested it** (advocate-only silence is not concurrence); and it ships **torch + hundreds of MB of weights** (#6). Its selling point is thin anyway — NLI-contradiction is a *stochastic model output*, swapping an LLM heuristic for an embedding heuristic. It is not progress toward a deterministic backstop. SHACL is. |
| **Vale** | Redundant with the owner-owned `DEFINITION-DRIFT-AUDIT`, which is a **governance act**, not a lint. Cannot catch semantic drift. Standing friction against the deliberate prose-first voice. |
| **DVC / Frictionless** | Manual hash-pinning covers the current single-import scale. Pipeline runtime unwarranted. |
| **TBX (ISO 30042)** | Speculative interop; no consumer. |
| **SHACL — new global shapes** | **DEFERRED** (distinct from the [D16 lock](#47-shacl-one-shape--the-d16-regression-lock)). OQ-1 forbids authoring shapes over still-unstable definitions. The lock is admissible *only* because the R1 fix freezes its target first. |
| **frontmatter-lint — full schema** | **DEFERRED.** NODE-MODEL is a candidate; the confidence-field rename is pending a decision-gate. The [stable subset](#43-frontmatter-lint-stable-slot-subset-only--a-first-deterministic-gate) is the admissible slice. |

### 5.3 Orchestration — rejected

The through-line: **the native governed dispatch already *is* an orchestrator.** Adopting a
framework inverts control (a Python event loop calls Claude, instead of the model spawning
turns), bypasses the append-only ledger, and re-solves the easy 20% — the graph — while
dropping the 80% that is actually hard: the human confirm gate, the anti-bias rubric, the
closed `exit_reason` vocabulary, and the tamper-evident record.

| Tool | Why not |
|---|---|
| **LangGraph / CrewAI / AutoGen (AG2)** | Redundant: the typed DAG already exists as `connections[]`; roles are a closed enum; AutoGen's GroupChat is our `robot_talks` — but **with collapse detection AutoGen lacks**. Adoption inverts execution and bypasses the ledger (#7). |
| **Google ADK / Mastra / Semantic Kernel / Pydantic-AI / DSPy** | **Mine as patterns; do not adopt.** Same inversion. DSPy's optimizable prompt-programs are the most interesting residue (versioned angle-sets), but the seam is non-acute. |
| **Temporal / Restate** | A persistent worker daemon is the *opposite* of turn-driven (#7). Record durability is **already met** by the append-only ledger. Temporal makes a long-lived *process* durable — but there is no long-lived process; there is a turn. Creates a second source of truth. (Restate: BUSL-1.1.) |
| **DBOS / Inngest / Prefect / Dagster / Argo** | Fallback-note only. With `loops_used` **uniformly 1**, the crash-resume gap never bites — and nothing defers *to* them, since the native marker (§4.8) is the proportionate fix. |
| **Ray / Modal / E2B / Firecracker** | **Wrong scale and wrong threat model.** Our dispatches are n=2/n=3 governed Claude subagents, not untrusted code needing a jail. Parallelism is already free via one-message spawns; the Agent tool's worktree mode already gives filesystem isolation. (Modal: proprietary cloud.) |
| **A2A protocol** | Redundant *inside* the boundary — typed `zig-zag`/`feedback` edges plus verbatim `feedback_prompts[]` give an audit trail A2A lacks. Premature and un-gated *outside* it: an open agent bus fights the single human-confirm gate and the public/private boundary. |
| **Self-hosted Langfuse / Phoenix** | **DEFERRED — and the common reasoning is wrong.** Self-hosted Langfuse has **no egress**; it runs on the operator's own box. It defers on better grounds: a **second store outside the append-only hook** (#7) and ClickHouse operational weight for a single-operator private repo. |
| **Native read-only derived view over the ledger** | **DEFERRED, trigger-gated.** The ledger is a complete structured trace but write-optimized and query-hostile — a real seam. But the *cited payoff metrics are degenerate*: median `loops_used` = 1 for everything; error rate ≈ 0.7% constant. Only "which anti-bias axes recur" has variance, and that is one `grep`. Build it when a real **variance-bearing** query over multi-group DAG topology arises. *(Correction on record: the earlier claim that runs are "single-group" is **false** — many are genuine multi-group DAGs. Only the loop dimension is degenerate.)* |
| **MCP** | **AVAILABLE**, not adopt-now. Already native, orthogonal to orchestration, touches neither ledger nor gates — and has **no named consumer today**. A per-need item with zero current need is available, not adopted. Use it opportunistically to serve a bounded external source to an agent. |

---

## 6. Sequencing — what to do, in what order

Nothing here is urgent. Ranked by clearance-over-cost; each carries its precondition.

1. **[Ratify OQ-1, then adopt a link checker](#41-lychee--link-integrity-for-the-authority-spine).**
   The only item where our own [constitution](../../authority/constitutions/) has already named
   the tool class. Adopt the *capability*. Gate:
   [§7.3](#73-oq-1s-ratification-state-gates-the-one-adopt).
2. **[fast-check metamorphic oracle](#42-fast-check--a-metamorphic-value-law-oracle-for-the-evaluator).**
   No gate. Pin the seed; generate in-grammar ASTs; assert value-laws on
   [`evalRational`](../../../projects/domainspec-v2/impl/test-derivation-engine/src/formal/eval.ts);
   never touch the emit path; never write golden bytes.
3. **[frontmatter-lint stable slots](#43-frontmatter-lint-stable-slot-subset-only--a-first-deterministic-gate)
   + [native index generator](#44-a-native-index-generator--kill-the-manual-sync).** No gate. Lint
   **only** ID-format and required-slot presence. Ship the index generator as low-priority
   book-keeping — and be honest that no drift failure is on record.
   [markdownlint](#45-markdownlint--structural-hygiene) rides alongside.
4. **[The D16 SHACL regression-lock](#47-shacl-one-shape--the-d16-regression-lock).** **Gated,
   and the gate has a step zero:** the owner confirms R1/C4 is live
   ([§7.2](#72-is-the-d29d16-divergence-still-live-owner-confirmation-required)) and authorizes
   the fix → fix R1/C4 in [`DEFINITIONS.md`](../../authority/definitions/DEFINITIONS.md) → freeze
   D16's relation-type enum (the fix *creates* it) → add the single shape.
   **Never author the shape first.**
5. **[The native progress marker](#48-a-native-per-group-progress-marker--cheap-crash-recovery),
   shaped in [OTel-GenAI](#46-otel-genai-semantic-conventions--a-wire-format-not-a-store).**
   Build the one-field append-only marker now; **arm it on the first `max_loops ≥ 2` multi-group
   dispatch.** Emit any telemetry in OTel-GenAI wire shape for free backend portability.

**Cross-cutting note — why the same tool earns different tiers.** Tier tracks the *seam*, not
the tool's abstract merit:

- **SHACL** is REJECT in domainspec (a typed graph that does not exist → proof-mass before the
  artifact), SEQUENCED PILOT in CAV2 for one shape (a fix that is already mandated), and
  DEFERRED in CAV2 for global shapes (targets still unstable). Three tiers, one tool, three
  seams.
- **JSON-Schema-style validation** is REJECT in domainspec (a null-delta swap over an existing
  declarative validator) and PILOT in CAV2 (no deterministic gate exists at all). One lane
  already has the capability; the other lacks it.
- **Append-only ledger patterns** appear three times and adopt nothing: domainspec's DCB
  freshness ledger conforms to published *semantics*; CAV2's drift audit is a governance sweep,
  not a store; the orchestration progress marker is a crash-recovery field. Shared pattern,
  three seams, zero third-party event stores.

---

## 7. What remains genuinely open

Carried forward, not resolved. Each is a real question, not a rhetorical one.

### 7.1 Z3 "posture (a)" — a CI-only differential oracle
The advocate pitched Z3 in **two** postures. Posture (b) — an emit-path fallback replacing
`coverage_gap` — is cleanly dead on byte-stability. Posture (a) — a **CI-only differential
oracle** that keeps the hand-rolled evaluator and merely cross-checks its arithmetic, never
inlining a solver value into golden bytes — was **not rebutted; it was collapsed into (b)'s
rejection and never independently tested.** It plausibly does not cross the δ-rule moat, since
the terminating-decimal formatting would stay entirely in TypeScript.

**Status: PLAUSIBLE, not confirmed.** Pursuing it requires **first reopening the frozen
2026-07-02 "SMT — NO" finding**. It is not a standing DEFERRED — it is a question about whether
a frozen decision was scoped too broadly.

### 7.2 Is the D29↔D16 divergence still live? (Owner confirmation required)
Two independent agents read `DEFINITIONS.md` and report the divergence is **live and unfixed**,
with line references. I have not personally re-verified it. **The entire §4.7 sequencing hangs
on this**, so it wants an owner's eyes before anything is scheduled. Note also that the `sh:in`
enum the shape would lock **does not exist yet** — the R1 fix creates it.

### 7.3 OQ-1's ratification state (gates the one "adopt")
`STABLE-REPOSITORY-CONSTITUTION.md` OQ-1 is **status OPEN**. Until ratified, lychee is a
*recommended-but-unratified* first validator. Surface OQ-1's state before treating §4.1 as
immediately adoptable.

### 7.4 No post-hoc anti-bias *realization* check
`check-tension` is **pre-flight only, by explicit design** — it certifies the agents are
tensioned *by construction*. The ledger stores angles, prompts, and `exit_reason`, but **not
full agent findings**. So *"did the agents actually diverge, or did they collapse into agreement
despite the gate?"* is currently **unanswerable from the record.**

This is a real capability gap. It is also low-value today, and the proportionate close is a
**future native eval** (persist findings; score divergence) — **not** Langfuse. Flagged, no
tier change.

---

## 8. The honest summary

We looked hard, with an adversarial structure designed to make adoption *easy to argue for*,
and found that the incumbent design wins almost everywhere — not from inertia, but because
seven explicit disciplines rule out most of what the ecosystem offers, and because both projects
had already reasoned their way to the same conclusions independently.

What the sweep actually bought:

- **One tool our own constitution already asked for** (a link checker) that we simply have not
  turned on.
- **One real soundness gap** in domainspec's evaluator, closable with a property-based
  metamorphic oracle that strengthens rather than threatens determinism.
- **One verified, live governance defect** (D29↔D16) that our LLM-only review demonstrably
  failed to catch, and one carefully sequenced shape that would lock it shut once fixed.
- **Two cheap native fixes** for orchestration gaps that a heavyweight platform would have
  solved expensively and wrongly.
- **A corrected residue ledger**: a manufactured test surface removed, a category error
  (wire format vs store) fixed, an egress claim corrected, a false "single-group" fact struck.

The rest is precedent, already owned. Cite it; do not adopt it.
