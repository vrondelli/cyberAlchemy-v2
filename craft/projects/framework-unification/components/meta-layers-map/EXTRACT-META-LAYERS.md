---
tags: [framework-unification, meta-layers, extract, faithful-rendering]
node_type: extract
status: draft
source_repo: business-philosopher
source_dir: assuntos/meta-representations/
last_updated: 2026-07-03
---

# EXTRACT — Meta-Layers Theory (faithful rendering)

Read-only extraction. Rendered charitably, in the source's own terms — not critiqued, not mapped onto our tools.

## Ordered parts (one line each)

1. **L0 — Domain**: the reality that precedes software — entities, relations, rules (regulative/constitutive), internal dynamics, actions. [`meta-layers.md`]
2. **L0.5 — Elicitation & Formalization** *(promoted candidate)*: observing/eliciting the domain (interviews, shadowing, incident review) and translating it into typed structure. [`new-layers-post-domainspec.md`, `proposed-new-layers.md`]
3. **L1 — Model Domain Formalization**: the formalized understanding of the domain, existing in two registers — operational (practitioners, tacit) and architectural (builders, explicit). [`meta-layers.md`, `tese-meta-representacoes.md`]
4. **L1.5 — Compilation Surface** *(promoted candidate)*: the deterministic derivation function Δ that compiles the L1 graph into L2 artifacts — compiling, not authoring. [`new-layers-post-domainspec.md`]
5. **L2 — Model Domain Implementation**: code, schema, APIs, event log — implements L1 (the understanding), not L0 (the domain) directly. [`meta-layers.md`]
6. **L2.5 — Runtime Operation** *(promoted candidate)*: the live sociotechnical system — operators, overrides, runbooks, workarounds — through which L2 is actually enacted. [`new-layers-post-domainspec.md`, `proposed-new-layers.md`]
7. **Signal Protocol** *(named protocol, not a layer)*: the mechanism that routes L2.5's operational signals to L3 as governance input. [`new-layers-post-domainspec.md`]
8. **L3 — Governing Rules**: how L1/L2 should be built, at two densities — L3-C (Constitutions: prose + rationale) and L3-S (Skills: operational extracts). [`meta-layers.md`, `synthesis.md`]
9. **L4 — Epistemic Foundations**: the premises/assumptions beneath L3's rules, typically excavated archaeologically once rules contradict each other. [`meta-layers.md`, `rules-draft.md`]
10. **L5 — Knowledge Navigation**: makes accumulated knowledge across L1, L2, L3 traversable for humans and agents; orientation, not enforcement. [`meta-layers.md`]
11. **L6 — Enforcement (+ self-observability)**: turns L3's conventions into invariants — pre-commit hooks, CI gates; the only layer that actively blocks. [`meta-layers.md`, `new-layers-post-domainspec.md`]
12. **L7 — Semantic Coherence** *(emergent, not built)*: the navigable, self-describing surface that emerges when L0–L6 are aligned; measured, not constructed. [`meta-layers.md`, `synthesis.md`]
13. **Agent Interface**: CLAUDE.md, skills catalog, memory — the interface through which an operator navigates the emergent L7 surface (not L7 itself). [`meta-layers.md`]
14. **Physical Telemetry / L1.7** *(open, unresolved candidate)*: proposed instrumentation of the compilation trajectory itself (node activation, token-entropy, geometric delta) to detect path-integrity violations invisible to L6. [`new-layers-post-domainspec.md`, `open-questions.md` P12]

---

## 1. The layers, in the source's own terms

- **L0 — Domain**: "actions, performed by entities that relate through rules, oriented by their own internal dynamics, that modify the state of the world." Two rule types behave differently — *regulative* (constrain pre-existing behavior) vs. *constitutive* (create the entity's possibility). [`tese-meta-representacoes.md`, `synthesis.md`]
- **L0.5**: "the interface through which the domain becomes knowable at all" — field notes, interviews, shadowing, incident review, regulation extracts. Passed the admission test because DomainSpec independently converged on the same missing layer ("Domain Interpreter Protocol"). [`proposed-new-layers.md`, `new-layers-post-domainspec.md`]
- **L1**: "What has been built by observing L0. Never complete." Operational register is "local, situated, tacit... closest to L0, hardest to externalize." Architectural register is "macro, structural, systemic... more abstract, more transferable, more formalizable — and more distant from the lived reality." The tension between the two is "the problem central that DomainSpec tenta atacar." [`synthesis.md`, `tese-meta-representacoes.md`]
- **L1.5**: "the difference between *authoring* ... and *compiling* ... These have completely different error characteristics." DomainSpec's `T = f(C, R, Δ)` is cited as empirical proof-of-concept. [`new-layers-post-domainspec.md`]
- **L2**: "The implementation of the understanding — not of the domain... The quality ceiling is L1, not L1's accuracy against L0." [`synthesis.md`]
- **L2.5**: "the actually-running sociotechnical system" — its unique failure mode is "operational workaround formation," where "the software may appear healthy while the operating system around it quietly diverges." [`proposed-new-layers.md`, `new-layers-post-domainspec.md`]
- **L3**: "How L1 and L2 should be built... Acts on the object track from outside it. When governance rules live inside the system they govern, they become invisible." [`meta-layers.md`, `synthesis.md`]
- **L4**: "The premises beneath L3's rules... The reasons you uncover when rules in L3 start to contradict each other or break against operational reality." Not axioms written in advance — "archaeological," excavated after contradiction forces the look. [`synthesis.md`, `rules-draft.md`]
- **L5**: "Makes the accumulated knowledge across L1, L2, and L3 traversable... Not enforcement; orientation." [`synthesis.md`]
- **L6**: "Turns L3's conventions into invariants. Pre-commit hooks, CI/CD gates, extraction pipelines. Where L3 prescribes, L6 blocks. It is the only layer that actively prevents violations from landing." [`meta-layers.md`]
- **L7**: "Not a layer you build. It is the navigable surface that emerges when L0 through L6 are aligned... Like temperature is not a particle... semantic coherence is not a layer. It's what layers produce collectively." [`synthesis.md`]
- **Agent Interface**: "not L7 itself. They are the *interface* through which an operator accesses the emergent surface." [`meta-layers.md`]
- **Signal Protocol**: "a structured mechanism that translates operational signals (what happened in L2.5) into governance inputs (what L3 should review)." Needs "a signal schema... a routing rule... a pruning criterion." [`new-layers-post-domainspec.md`]
- **Physical Telemetry**: instruments that "observe how knowledge moved through the topological space during derivation" rather than asking the AI to self-report — trajectory tracking, token-entropy, micro-evaluator delta. Position (L1.7 vs. between L4–L6) is explicitly unresolved. [`new-layers-post-domainspec.md`, `open-questions.md`]

## 2. Claimed flow / connections

Construction flow (upward, per the canonical diagram in `meta-layers.md`):
`L0 →(gives rise to)→ L0.5 →(produces)→ L1 →(compiled by Δ)→ L1.5 →(generates)→ L2 →(necessitates)→ L2.5 →(signals governance)→ L3 →(anchored in)→ L4 →(enables)→ L5, L6 →(when aligned, produce)→ L7`; Agent Interface "navigates through" L7.

Feedback (downward, dashed): `L2 ⇢ L1` ("reveals gaps in" — implementation forces precision the spec lacked); `L2 ⇢ L0` ("reconfigures" — software creates new domain rules; symbiosis if efficiency rises, parasitism if practitioners route around it); `L2.5 ⇢ L0` ("workarounds surface in" — systematic workarounds are the signal that L0 changed faster than L1 captured it). Lateral governance (dashed): `L3 ⇢ L1, L2` ("governs"); `L6 ⇢ L1, L2, L2.5` ("validates," the only layer that blocks). [`meta-layers.md`]

Drift is named as occurring at three points: L0↔L1 (domain changed, understanding didn't — detectable only by human observation), L1↔L2 (spec says one thing, code does another — detectable by L6 tooling), and operational-L1 ↔ architectural-L1 (practitioner knowledge the model never captured — visible only in production edge cases). [`synthesis.md`]

## 3. What each layer produces / requires (explicit claims)

- L0.5 "requires" observation/elicitation before L1 can begin; "begins L1 when elicitation produces stable, repeating patterns — not when the deadline arrives." [`new-layers-post-domainspec.md`]
- L1.5 "requires" a well-typed L1 graph and produces deterministic L2 artifacts via fixed rules Δ — "given the same concept graph and the same 20 derivation rules, the output is identical every time." [`new-layers-post-domainspec.md`]
- L2.5 "produces" runtime signals (runbooks, override workflows, exception queues) that the Signal Protocol routes to L3; DomainSpec's 11-type signal system is cited as the concrete implementation. [`new-layers-post-domainspec.md`]
- L3 "requires" grounding in L4 premises; every active constitution "should have a companion skill" and vice versa. [`synthesis.md`]
- L4 changes should follow a decay curve: high volatility early (premises still being excavated), rare changes once stable; "L4 Volatility" is a named health metric. [`meta-layers.md`, `rules-draft.md`]
- L6 "requires" L3 conventions to enforce and L4 grounding to justify blocking; produces PASS/FLAG/BLOCK-style verdicts (per the DomainSpec mapping) and the health metrics: Orphan Rate, Governance Coverage Ratio, L6 Friction Rate, L4 Volatility, Time-to-Alignment. [`meta-layers.md`]
- L7 "requires" nothing directly built — it is produced only when L0–L6 are aligned; it cannot be given instructions. [`synthesis.md`]
