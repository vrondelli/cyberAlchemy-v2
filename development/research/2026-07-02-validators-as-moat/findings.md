---
node_type: research
is_session: false
status: candidate
boundary: INTERNAL — strategy; intended-not-shipped
created: 2026-07-02
authored_by: domainspec-subagents-strategy (research dispatch 2026-07-02-validators-as-moat)
final_approver: parent
note: Paths repo-root-relative from domainspec-core/. Freezes the validators-as-moat strategy split.
---

# Validators as moat? (FROZEN findings)

**Question.** Should we make **all validators the moat** — "if you want to validate, use our API"?

**Dispatch.** research, 5 agents / 2 tensioned groups, check-tension PASS (first pass).
Returns: [research.md](./research.md). Lenses: [lens-moat-economics.md](./lens-moat-economics.md) (Porter) ·
[lens-reproducibility.md](./lens-reproducibility.md) (Shannon) · [lens-adoption.md](./lens-adoption.md) (Christensen).
Verifiers: [verify-defensibility.md](./verify-defensibility.md) (Taleb) · [verify-openness.md](./verify-openness.md) (Meadows).

## One-line answer
**No — don't make all validators the moat.** "All validators = moat" is **over-gating on 4 of 7 assets**
(theater on reproducible checks, it kills authoring, and for the Arcanum validator it breaks a *verified*
public charter) — and it **misses the real risk**. Reframe: the split is **authoring-aid (free) vs
at-scale-assurance (paid)**, not validator-vs-moat. Validation-as-a-**service** is viable — but as a
**distribution** play (switching cost + telemetry), **not** as algorithmic IP. The only genuine moats are
the **δ-engine**, **Kodamai's agent⊨spec**, and the **corpus (as data)**.

## The frozen per-asset split
| # | Asset | Verdict | Moat type | Why |
|---|---|---|---|---|
| 1 | Structural table-walk validator | **PUBLIC** (free authoring aid) | none | set-membership over a *published* table; a weekend rebuild; gating = theater + toll on the on-ramp |
| 2 | P5 boolean-predicate | **PUBLIC criterion**; gate only *hosted at-scale enforcement* | none (criterion) | need is post-adoption; **pin the gate at parses-to-Bool** — satisfiability-drift turns it into an engine oracle |
| 3 | Cross-graph Cedar/Datalog | **PAID at-scale SERVICE, not a moat**; publish the *what* | borrowed | tooling is *published* (Cedar/Datalog/Alloy/Z3); its only defensibility is borrowed from the corpus (#5) — clone-able in weeks; sell the hosted run as convenience, don't spend moat budget here |
| 4 | **δ-engine derivation** | **MOAT — keep dark**; free tier = LLM generator | **algorithmic** | the real secret; cite results, withhold mechanism |
| 5 | **Accumulated corpus** | **MOAT — gate access + free example-slice** | **data** (privacy, not gating) | irreproducible *as data*; do not launder it into gating a reproducible check |
| 6 | **Kodamai agent⊨spec** | **MOAT — keep dark**; sell attestations over committed work | **algorithmic** | unpublished ⊨ verifier |
| 7 | Arcanum artifact-governance validator | **PUBLIC** (charter — verified) | none | `arcanum/` is a separate public repo (`cyberAlchemyAI/Arcanum.git`); gating = charter breach + frozen-import re-work |

## The surprise (the actually-important finding)
The leak surface is **not** the public validators — it's the **free/gated *services* becoming oracles**.
Making validators the moat would spend energy on the wrong thing while these stay open:
- **The free LLM generator** must not become an **unmetered `derive-via-API`** — input→output pairs distill
  the engine. Meter/degrade; **results only, never a raw derivation oracle** (Taleb #4, highest).
- **Kodamai ⊨** must not be an **arbitrary-pair oracle** — decision-boundary extraction clones ⊨. Sell
  attestations over *committed* work, not on-demand judgments (Taleb #6).
- **Hosted P5** pinned at parses-to-Bool; **never wire engine-*derived* edges into the gated Datalog**
  (over declared edges it leaks nothing; over derived edges it projects engine output) (Taleb #2/#3).
- **"Cite results, withhold mechanism"** is load-bearing, not optional — the published taxonomy (25 types,
  29 edges, `T=f(C,R,Δ)`) is a bounded, charter-sanctioned I/O shape-disclosure, safe only while the
  mechanism stays dark.

## What must stay FREE to keep the funnel alive (Meadows)
Public schema + structural validator (as a *local, runnable* gate) · the P5 criterion + operator grammar ·
the frictionless free LLM generator · a *runnable* corpus example-slice (representative sample, not a
coverage manifest) · the Arcanum validator · the *statements of what* #3 and #6 check. Witness for funnel
death: a first-time author arriving via the free generator cannot ship if "valid" is secret behind a paid
API — that gate fires on 100% of first-authors and converts self-serve into a paid tutorial.

## Reconciliation with frozen boundaries (all intact — no re-work)
- meta-type formalism (*"public criteria, private engine"*) — **unchanged** (this confirms it).
- Arcanum-→cav2 import (Arcanum validators PUBLIC by charter) — **unchanged** (gating #7 would have broken it).
- mint baseline — **unchanged**. The 2026-06-24 free/paid decision (audits + LLM generator FREE) — **untouched**.

## Recommendation (decision-ready)
Adopt the **authoring-aid-free / at-scale-assurance-paid** model, NOT "validators = moat":
1. Keep #1/#2-criterion/#7 public (the funnel).
2. Protect the three real walls (#4 engine, #6 Kodamai, #5 corpus-as-data) — and harden the **service
   surface against oracle-extraction** (the metering rules above). This is where the moat budget goes.
3. Offer validation-as-a-service as a **distribution** product (hosted #3 + hosted P5 + metered corpus
   access), priced as convenience/assurance, publishing the *what* — accepting it's a distribution moat,
   not algorithmic IP.

## Residue (claim ≤ proof)
- Business/adoption verdicts are reasoned from open-core/SaaS precedent, not measured (Porter/Christensen marked reasoned-not-cited).
- Taleb's "#3 tooling is published + the corpus FOL-dispatch called Row-2 net-new 'inflation'" is agent-cited
  (`2026-06-28…FOL findings`); the public-tooling fact (Cedar/Datalog/Alloy/Z3) is independently true.
- The telemetry/data moat is bounded by corpus governance (usage-as-authority forbidden; cross-app tracking KILLed) — Porter's flag; honor it.
