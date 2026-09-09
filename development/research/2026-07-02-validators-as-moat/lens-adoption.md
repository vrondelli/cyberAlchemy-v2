---
dispatch: 2026-07-02-validators-as-moat
role: explorer
agent_name: "Christensen, Clayton"
lens: adoption / free-path funnel dynamics (open-core precedent)
status: complete
boundary: INTERNAL — intended-not-shipped
date: 2026-07-02
claim_discipline: >
  Asset facts cite the corpus. The adoption-dynamics verdicts (funnel impact, what must stay
  free) are REASONED from open-core precedent, not measured — marked [reasoned] throughout.
sources:
  - authority/decisions/2026-06-24-engine-moat-and-free-paid-boundary.md
  - authority/boundaries.md
  - TO-VLAD/TO-VLAD-deterministic-validation-inconsistencies.md
  - development/research/2026-06-28-constitution-fol-validation-path/findings.md
  - development/research/2026-07-01-arcanum-artifact-governance-import/findings.md
  - development/research/2026-06-24-knowledge-market-product-idea/proposal-blueprint.md
---

# Lens: Adoption / Free-Path Funnel Dynamics

> The question the owner is asking — "flip ALL validators to moat, validate-via-our-API?" — is
> not a moat question first. It is a **funnel** question. In an open-core play the moat only pays
> if a funnel keeps filling it. If gating the validators starves the funnel, you have widened the
> moat around a shrinking castle. My whole lens is: **for each asset, does gating it starve the
> free-path funnel that feeds the δ-engine sale?**

## The disruption/open-core frame I'm applying [reasoned]

The moat decision already committed to the winning open-core shape: **δ-engine algorithm + Lean =
sold; audits + LLM generator = free, drive adoption** (`2026-06-24-engine-moat-and-free-paid-boundary.md`
L18-27). That is textbook open-core: the *on-ramp* is free and complete enough to author real work;
the *irreproducible core* is paid. The funnel is: developer authors a spec on the free path →
authored specs need to be *correct* → correct specs get *derived/verified* by the paid δ-engine.

The load-bearing dependency for adoption: **a developer can only author a correct spec if the
definition of "valid" is knowable to them.** The public `.schema.yml` + the per-instance validators
ARE the authoring aid — they are how a developer learns what a well-formed spec looks like without
buying anything. Gate that, and you have moved the *gate to entry* upstream of the free path. That
is the classic open-core self-own: charging for the thing that teaches people to become customers.

**Precedent anchor (why "secret valid" kills the funnel):** every durable open-standard/open-core
play kept the *conformance contract* public even when the engine was closed — you can read the SQL
standard, the LSP schema, the OCI image spec, the Terraform HCL schema, ESLint's rule contract; the
performant/managed *engine* is what's sold. No successful developer standard ever hid "what counts as
valid input." The corpus's own Evidence Exchange blueprint independently reaches the same governing
rule — **"the product becomes useful before tokenization, which reduces both hype pressure and
regulatory risk"** (`proposal-blueprint.md` §6) — i.e. seed the funnel free, monetize later. Same
law, restated for validators: **be authorable before being paid-verifiable.**

---

## Per-asset adoption verdict

### Asset 1 — Structural per-instance validator (table-walk over public `.schema.yml`)
**Verdict: KEEP PUBLIC (must). Gating starves the funnel at the source.** [reasoned]

This is the authoring aid itself. `TO-VLAD` confirms the queries are light table-walks that
quantify over schema fields (`cand.axis ≠ D43.axis`, `specializes`) — the validator is *definitionally*
"here is what a valid instance looks like." If "valid" is secret, a developer cannot author a correct
spec at all; they must round-trip every draft through a paid API just to learn the shape. That is not
a moat, it is a toll booth on the on-ramp — it converts a self-serve free tier into a paid tutorial.
Funnel impact: **severe starvation.** The public schema+validator is exactly the "complete enough to
do real work for free" that open-core requires. Keep it public *and* keep it a real gate a developer
runs locally.

### Asset 2 — P5 check
**Verdict: KEEP PUBLIC (the criterion); gate only a hosted-scale variant. Low funnel risk if
criterion stays visible.** [reasoned]

P5 is one predicate in the same per-instance family — a *correctness criterion* an author must satisfy.
The criterion (what P5 requires) must stay public for the same reason as Asset 1: it is authoring
guidance. What is *safely gateable* is not the criterion but any expensive-to-run *hosted enforcement*
(P5 across a large corpus, in CI, at org scale). Gate the convenience/scale, never the rule. Funnel
impact: **negligible if the rule text is free**; **moderate starvation if the rule itself is hidden**
(same failure mode as Asset 1, smaller surface).

### Asset 3 — Cross-graph Cedar/Datalog (Row-2 cross-rule consistency)
**Verdict: GATE-OK for adoption — but publish the criterion, keep the engine paid. No funnel damage.**
[reasoned]

This is the strongest paid candidate that does NOT starve the funnel, and the reason is structural.
`2026-06-28-constitution-fol-validation-path/findings.md` establishes Row-2 catches defects a per-rule
lint **provably cannot even state** (the `governs`-cycle witness; `∃state.⋀ᵢ` non-distributive, §2, §4).
Adoption logic: a *single author* authoring a *single spec* does not need cross-graph consistency to
write correct work — that need appears only at **whole-ruleset / org / portfolio scale**, which is
exactly where willingness-to-pay lives. So gating the *cross-graph solver as a service* does not block
any individual from authoring correctly on the free path. **Caveat (must):** publish *that* cross-rule
consistency is a property and *what* it checks (so authors know the class of defect exists); withhold
only the run-it-for-you engine. Note also Cedar/Datalog cores are public academic tools (arXiv
2403.04651, 2602.16708) — you cannot moat the *technique*, only your *encoding + hosted run*. Funnel
impact: **none** (need is post-adoption, at scale). Best "paid without choking adoption" asset in the set.

### Asset 4 — δ-engine algorithm
**Verdict: ALREADY CORRECTLY GATED — moat; the LLM generator is its free tier. Do not touch the split.**
[reasoned]

Governed already (`2026-06-24` decision; `boundaries.md` §Free/Paid). This is the *irreproducible core*
open-core is built to protect. Critically, it already ships **a free tier — the LLM generator** — which
is the correct pattern: even an irreproducible asset needs a free on-ramp to seed adoption, and the
LLM generator is it (`decision` L22: "the free reference path"). Cite-results-withhold-mechanism is
exactly right: demonstrating determinism/mutation numbers publicly *fuels* the funnel (proof the paid
engine is worth buying) while the `parse→δ→key→emit` pipeline stays secret. Funnel impact: **positive
as configured** — do not add friction to the free LLM generator; that IS the funnel.

### Asset 5 — Accumulated corpus
**Verdict: GATE-OK to sell as data/benchmark — but MUST expose a free tier/read-slice to seed adoption.**
[reasoned]

Irreproducible (a competitor cannot re-accumulate your corpus), so it is a legitimate paid asset — but
irreproducibility does not exempt it from needing a free tier. Adoption dynamics: a corpus you cannot
*see any of* has no gravitational pull; developers adopt standards that come with **examples**. The
Evidence Exchange blueprint's whole thesis is that governed reuse becomes valuable **before money**
(`proposal-blueprint.md` §6, §11 stage 1 "credit-only lineage witness") — i.e. the corpus's network
value compounds by being usable, then monetized. Practical split: **free** = a public example set / read
slice / "shoulders visible" (blueprint §"one-line promise") that teaches authoring and demonstrates the
standard is real; **paid** = bulk access, the full benchmark, derived intelligence, reuse receipts.
Funnel impact: **none if a free example-slice exists; moderate starvation if the corpus is 100% dark**
(no examples = harder to learn to author = slower adoption).

### Asset 6 — Kodamai agent-sat-spec (agent⊨spec verifier)
**Verdict: MOAT — gate fully; no funnel dependency. Publish only *that it exists* + results.** [reasoned]

Per the correctness-moat memory and the FOL findings' framing, this is the unpublished categorical
`agent⊨spec` prize — the *deepest* irreproducible asset, and the one furthest from the authoring
on-ramp. A developer authoring a spec never needs the agent⊨spec verifier to produce correct *source*;
it is a downstream *assurance* product for buyers who already authored and want the agent-correctness
guarantee. So gating it does **not** starve the funnel at all. Same discipline as the δ-engine:
publicize *that* an agent⊨spec check exists and *what it guarantees* (this markets the moat), withhold
the verifier internals. Funnel impact: **none.** Pure sellable upside.

### Asset 7 — Arcanum artifact-governance validator (file-FORM path heuristics)
**Verdict: MUST STAY PUBLIC — it is Arcanum, public by charter, and gating it would break the charter,
not just the funnel.** [reasoned]

`2026-07-01-arcanum-artifact-governance-import/findings.md` is decisive: this validator enforces
**file-FORM via path heuristics** (retention visibility, `.schema.yml` format, markdown-link
resolution), its metadata parser is **advisory-only**, and it is **imported from public Arcanum**
(public framework text, safe direction, Wittgenstein-verified). Two independent reasons it cannot be
gated: (1) **charter** — Arcanum is public by CLAUDE.md rule; flipping it to paid-API would leak/reverse
the public boundary. (2) **funnel** — file-form hygiene is the most basic authoring aid; hiding "your
file must be shaped like this" is the harshest possible on-ramp friction for zero moat value (it is
generic hygiene, not the δ-secret). Funnel impact: **would be severe; also charter-violating.** This
one isn't even a close call.

---

## What MUST stay free/public to grow the funnel

The non-negotiable free tier — the "authorable before paid-verifiable" set:

1. **The public `.schema.yml` + the per-instance structural validator (Asset 1).** The authoring
   contract. Secret-valid = no self-serve authoring = dead funnel.
2. **The P5 *criterion* text (Asset 2).** The rule an author must satisfy — gate scale, never the rule.
3. **The LLM generator (free tier of Asset 4).** Already the designated free reference path; keep it
   frictionless — it is literally the funnel's front door.
4. **A corpus example-slice (free tier of Asset 5).** "Shoulders visible" — enough real examples to
   learn to author and to believe the standard is real.
5. **The Arcanum artifact-governance validator (Asset 7).** Public by charter AND basic authoring hygiene.
6. **The *statements of what* Assets 3 & 6 check** (not the engines) — so authors know the defect
   classes exist and *why* they'd upgrade to the paid tier.

The safely paid set (gate without choking adoption): the **δ-engine algorithm** (4, done), the
**cross-graph Cedar/Datalog engine-as-a-service** (3, need is at-scale/post-adoption), the **agent⊨spec
verifier** (6, downstream assurance), and **bulk/derived corpus access** (5, keep the example-slice free).

## The one-line answer to the owner's question [reasoned]

**"Flip ALL validators to moat" starves the funnel and should be rejected.** The per-instance /
file-form / P5 validators are the *public conformance contract* — the free authoring aid every durable
open standard keeps open — and Asset 7 is charter-bound public regardless. The validators that CAN be
gated (cross-graph consistency, agent⊨spec) are gateable precisely because their *need arises after
adoption, at scale* — not because they're validators, but because they sit downstream of the on-ramp.
The right frame is not "validator vs not"; it is **"authoring aid (free) vs at-scale assurance (paid)."**
Gate the second, never the first.
