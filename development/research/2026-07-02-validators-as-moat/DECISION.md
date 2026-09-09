---
node_type: decision
is_session: false
status: resolved
boundary: INTERNAL — moat/product strategy
scope: DomainSpec/cav2 validation moat model (governs the public/paid boundary + what gets built)
created: 2026-07-02
decided_by: user via /decision-gate
source_evidence: ./findings.md (research dispatch 2026-07-02-validators-as-moat, 5 agents, gated)
promotion_candidate: cyberAlchemy-v2/VALUE-AND-PHILOSOPHY-PROPOSITION.md (this is a load-bearing value/moat stance)
note: Paths repo-root-relative from domainspec-core/.
---

# Decision — validation moat model

## Question
Should we make **all validators the moat** ("validate-via-our-API"), or adopt the model the research recommends?

## Options considered
1. **Adopt recommended — authoring-aid (free) / at-scale-assurance (paid).** *(selected)*
2. Original: all validators = moat (validate-via-API). Rejected by research — over-gating (theater on
   reproducible checks; kills authoring; breaches verified Arcanum-public charter; forces frozen re-work).
3. Adopt model, defer productization.

## Selected
**Option 1 — adopt the recommended model.**

## Rationale
The 5-agent tensioned dispatch (economics / reproducibility / adoption × defensibility / openness) converged:
a validator's code and its input contract reproduce together, so gating a reproducible check over a public
schema is theater; the only genuine moats are the irreproducible core. "All validators = moat" is a
self-own (charging for the thing that teaches people to become customers). The reframe — **authoring-aid
free, at-scale-assurance paid** — captures the real value without starving the funnel.

## The committed model
**Genuine moats (protect):**
- **δ-engine** derivation — algorithmic; keep dark, cite results, withhold mechanism.
- **Kodamai agent⊨spec** — algorithmic; sell **attestations over committed work**, never an arbitrary-pair oracle.
- **Accumulated corpus** — **data** moat; protected by privacy (gate access + a *runnable* free example-slice), NOT by gating validators.

**Public / free (the funnel — must stay open):**
- structural per-instance validator (#1), the P5 **criterion** (#2), the Arcanum artifact-governance validator (#7 — public by verified charter), the free LLM generator (engine's free tier).

**Paid at-scale SERVICE (distribution, not algorithmic IP; publish the "what"):**
- cross-graph Cedar/Datalog (#3 — defensibility *borrowed* from the corpus, not the checker), hosted P5
  enforcement, metered corpus access.

**Service-surface hardening (the real defensive work — where the moat budget goes):**
- the free LLM generator must be **metered/degraded**, results-only — never an unmetered `derive-via-API` (distills the engine);
- **Kodamai ⊨** sold as attestations over committed work, never an on-demand arbitrary-pair oracle;
- **hosted P5 pinned at parses-to-Bool** (satisfiability-drift turns it into an engine oracle);
- **never wire engine-*derived* edges** into the gated Datalog surface;
- "cite results, withhold mechanism" is load-bearing; the free corpus slice is a representative sample, not a coverage manifest.

## Remaining blockers
None. Gate result **PASS**.

## Deferred / next
- **Productization specifics** (pricing, which paid service ships first — cross-graph vs hosted-P5 vs corpus
  access) — a later plan (`invoke plan` / task-session), not a blocker.
- **Service-surface hardening implementation** (metering the generator, the ⊨ attestation flow, the P5 pin)
  — the concrete engineering follow-on that actually protects the moat; route to a plan/task-session.

## Assumptions
- Business/adoption verdicts are reasoned from open-core/SaaS precedent, not measured (findings residue).
- The telemetry/data moat is bounded by corpus governance (usage-as-authority forbidden; cross-app tracking KILLed) — honor it.

## Implications (no re-work)
Confirms the three frozen boundaries (meta-type "public criteria, private engine", Arcanum-public, mint) —
this decision *ratifies* them rather than disrupting. The just-landed MT0 (public `entity.schema.yml` + md +
validator) is on the correct side of the line (free authoring aid).
