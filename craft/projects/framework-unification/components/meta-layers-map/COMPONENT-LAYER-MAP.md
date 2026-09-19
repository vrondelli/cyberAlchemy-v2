---
tags: [framework-unification, meta-layers, component-map, synthesis]
node_type: synthesis
status: draft
last_updated: 2026-07-03
sources: [EXTRACT-META-LAYERS.md, ../recon/INDEX.md, ../recon/MAP-domainspec-impl.md, ../recon/MAP-arcanum.md, ../recon/MAP-cyberalchemy-v2.md, ../recon/MAP-domainspec-v2.md]
---

# COMPONENT ↔ META-LAYERS MAP

Assumes the meta-layers framework (`EXTRACT-META-LAYERS.md`) is **true**, then maps our
actual components onto each part. Maturity tags are lifted from the recon and mean:
**built** = artifact exists and passes its own gate · **using** = built *and* in active,
versioned use · **designed** = spec/design authored, not executed or wired · **researched**
= exploration/tower stage, no shippable artifact. `(tentative)` marks a mapping the sources
don't nail down. Claim ≤ proof: nothing is called *built* that the recon marked
scaffold/candidate/deferred/aspirational. Repos abbreviated: **engine** =
`implementation/domainspec` (v2.1.0, in use), **v2** = `projects/domainspec-v2` (backend
green, UI/drift deferred), **cav2** = `cyberAlchemy-v2` (mostly scaffold, gate `flag`),
**Arcanum** = `../Arcanum` (public, built/in use).

---

## L0 — Domain
- **No owning component — by design.** L0 is the reality before software; the framework is
  explicit it is a referent, not a build target. Our tooling *points at* L0 (via L0.5) but
  nothing *is* L0. Marking anything "built" here would be a category error.
- Feedback only: `L2⇢L0` (software reconfigures the domain) and `L2.5⇢L0` (workarounds
  surface domain change) — see Feedback Edges; neither edge has a built closer.

## L0.5 — Elicitation & Formalization
- engine `domainspec-interview-scope`, `domainspec-interview-kits` (grill/readiness/audit-gap
  modes), `domainspec-start`, `domainspec-brownfield-translation` — **using**. Observe/elicit
  a domain and translate to typed structure — exactly this layer.
- Arcanum `scope-interview`, `structured-interview-kits` (alias `interrogation`),
  `discovery-to-inventory` spell — **built**. The public/reusable elicitation surface.
- v2 `comprehension-novice-test` + `spec-comprehension model` (M1–M4) — **researched**.
  Studies *where* elicitation-to-formalization stalls; not itself an elicitation tool.
- *Theory names us here:* the extract records DomainSpec independently converging on this
  same missing layer ("Domain Interpreter Protocol"). Strongly supported.

## L1 — Model Domain Formalization
- engine spec taxonomy: **25 meta-types + 29 edges** + vault graph schema (22 edge types),
  `domainspec-spec-feature`, `domainspec-sync-registry`, `domainspec-feature-glossary` —
  **using**. The formalized understanding as an authored typed graph.
- v2 **DS-D1.1–14 meta-type cards** + `meta-types.yml` machine registry + `RELATIONSHIPS`
  edge-law + Concept Registry / aspect file — **built** (backend green). The next-gen L1
  "Ontology A"; UI meta-types DS-D1.15–25 **designed** (deferred).
- **node envelope** (the per-node instance twin, MT-INST `instances.ts`) — **built** for the
  14 backend types (machine instance generate/validate green); the fuller node-envelope
  contract is **designed (tentative)**, not a finished surface.
- v2 **two-plane boundary** (authoring plane vs contract plane) — **built** as doc/definition;
  maps onto L1's *operational (tacit) vs architectural (explicit)* two-register split
  `(tentative)` — the correspondence is ours, not stated in the extract.

## L1.5 — Compilation Surface (the deterministic Δ)
- v2 `test-derivation-engine` (parse→derive→`obligation_key`→emit; **byte-stable**, no LLM in
  path; `src/rules` is the private moat) — **built but partial**: `obligation_key` +
  round-trip green, parser/δ-rules still typed stubs per its own README. This is the literal
  home of **T = f(C, R, Δ)** the extract cites as proof-of-concept.
- engine `domainspec-generate-tests` (+ `test-derivation-engine lint`) — **using**. The
  live-today deterministic derivation of TEST-SPEC from spec artifacts.
- Arcanum `test-derivation` sigil (no-LLM, from aspect docs) — **built** (public form,
  registry-lagged).
- *Theory names us here:* Δ / compiling-not-authoring is credited directly to DomainSpec.

## L2 — Model Domain Implementation
- engine `domainspec-implement`, `domainspec-pipeline` (plan→spec→tests→implement→tag→ui→
  observe→infra→verify), `domainspec-ui-implement`, `domainspec-tag-code` — **using**. Turns
  L1 understanding into code/schema/APIs — "implements L1, not L0."
- engine `apps/web`, `backend/`, `examples/` (order/payment/inventory/user-account) — **built**.
  Actual emitted implementations.
- v2 `impl/` buildable engine — **built** (make-it-green G1–G3; CI-wiring G4 deferred).

## L2.5 — Runtime Operation
- engine `apps/web`, `examples/`, `infra/` (compose, prometheus, alert rules) — **built** as a
  runnable stack, but this is the *software*, not the theorized live sociotechnical system.
- The **operational-signal producer** the theory needs here (operators, overrides, runbooks,
  workaround detection feeding the Signal Protocol) — **designed / aspirational**. The recon
  is explicit: the observability *producer* from a live runtime is not built. This is the
  weak seam: L2.5's connective contribution (surfacing "operational workaround formation") has
  no closer.
- Closest actuator analog: Arcanum `goal` spell (autonomous fail-closed DAG) — **built**, but
  it drives development frontiers, not a production L2.5 `(tentative)`.

## Signal Protocol (L2.5 → L3)
- engine `domainspec-emit-signals` (mandatory epilogue → `pipeline-signals.jsonl`),
  `domainspec-signal-observer` (async behavior-level signals from telemetry bundles),
  **11-type signal system**, `validate-signals`/`detect-signals`/`analyze-signals`,
  `build-telemetry-bundle.ts` — **using**. Schema + routing + pruning all present.
- Arcanum `signal-observer`, `observability-setup`, `observed-invocation-loop`,
  `workflow-reflect` — **built**. The reusable telemetry envelope.
- *Theory names us here:* the extract cites DomainSpec's 11-type signal system as the concrete
  implementation of the protocol.
- **Caveat (claim ≤ proof):** what is built routes *pipeline/session* signals (build-time),
  **not** L2.5 *runtime-operational* signals. The machinery is real; its theorized L2.5 input
  source is the same gap flagged above.

## L3 — Governing Rules (L3-C Constitutions + L3-S Skills)
- engine **AXIOMS→CONSTITUTION→gates chain** (A1–A6 ⇒ C1–C11, each bound to a gate),
  `domainspec-implementation-axioms`, `AUTHORITY-MAP.md` — **using**.
- v2 `AXIOMS.md`/`CONSTITUTION.md` (6 axioms→11 rules, Via Negativa) + local authority spine
  + `promotion-policy.md` — **built**.
- cav2 **constitution-governance** artifacts (Stable-Repository, Vault-Concept-Adoption
  constitutions), **authority kinds/postures**, **7-stage promotion ladder**, `pass/flag/
  block/defer` vocab, `invariant→axiom→constitution rule→gate→behavior` chain — **designed**
  (candidate; repo gate `flag`). This is the framework's *rule-creation* machine, authored but
  not yet promoted.
- Arcanum `constitution-governance`, `definitions-governance`, `decision-gate`,
  `discipline-governance` sigils — **built/using**. L3-S = the whole skills catalog (~148
  engine + ~76 Arcanum). Both densities the theory names (L3-C prose, L3-S skill) exist.

## L4 — Epistemic Foundations
- engine **6 epistemic axioms A1–A6** (each "exists because its absence caused harm" — Via
  Negativa), vault `axiom/` + `premise/` folders — **using**. The premises beneath L3.
- cav2 **decisions ledger** (6 signed decision records), `decision-gate`, **authority
  postures**, **non-collapse rules** — **built** (ledger built; excavation is human-run). The
  "archaeological excavation once rules contradict" = decision-gate + signed decisions.
- Arcanum `residuality-spec` (stressor/premise/residue) — **built** `(tentative)` as premise
  surfacing. v2 `recursive-governance-model` research grounding A-model — **researched**.
- Consistent with theory: L4 is excavated, not pre-written — our axioms are Via-Negativa
  (post-harm), matching "not axioms written in advance."

## L5 — Knowledge Navigation
- engine **vault/** (constitution/axiom/premise/discovery/conceptual/sessions, 22 edge types),
  `docs/registry.json+md`, glossary, `domainspec-context-builder` — **using**. Traversable
  knowledge across L1/L2/L3; orientation, not enforcement.
- Arcanum `ontology-vault`, `inventory`, `necronomicon` (Inventory-And-Ontology substrate
  loop), `ontology-harness`, `x-ray` — **built/using**.
- cav2 `authority/definitions/` (50 CAV2-D* + towers + drift-audit), `ontology/`
  authority-object model — **built** (definitions ledger) / **designed** (ontology model,
  candidate). v2 `definitions/` (D1–D15) + `DEFINITIONS-INDEX` — **built**.

## L6 — Enforcement (+ self-observability)
- engine **hooks**: `spec-validate.sh` (PostToolUse, **fail-closed** on `docs/features/**`),
  `inject-domainspec-axioms.sh` — **using**. The only layer that blocks — present as literal
  fail-closed hooks.
- engine **validators**: `validate-signals`, `validate-governance-chain`, `validate-orphans`,
  `validate-relationships`, `validate-doc-links`, code-tags extract/validate/drift,
  `domainspec-verify-feature`, `domainspec-readiness-gate` — **using**.
- engine **self-observability**: `generate-meta-health.ts` computes **M-001..M-006** — i.e.
  the theory's named metrics **Orphan Rate, Governance Coverage** (+ attenuation audit) —
  **built**. `domainspec-reflect` + tuning loop closes the outer loop.
- v2 `validate-content.ts`, `validate-relationships.ts`, `instances.ts` validators, mt
  fixtures — **built**; CI-wiring of `validate` as a fail-closed gate (**G4**) — **designed**
  (deferred). cav2 authority-kind closure validator — **designed** (build blocked on OQ-1).
- *Theory names us here:* PASS/FLAG/BLOCK verdicts + the health-metric family are lifted from
  the DomainSpec mapping. **Best-supported layer in the whole map.**

## L7 — Semantic Coherence
- **No builder — by design** (emergent, "not a layer you build"). Correctly, nothing claims to
  construct it.
- Measurement proxy: engine `generate-meta-health.ts` + `docs/registry` + Time-to-Alignment
  metric — **built (tentative)** as the "measured, not constructed" surface.
- Self-describing surface analog: Arcanum `x-ray` (context → guided explanation page) —
  **built (tentative)**. Neither *produces* L7; they render/measure it.

## Agent Interface
- **CLAUDE.md** (every repo, route tables) + **skills catalogs** (~148 engine, ~76 Arcanum) +
  **MEMORY.md** auto-memory + `domainspec-orchestrate`/`orchestrate`/`domainspec-help` —
  **using**. The interface to navigate the emergent surface.
- *Theory names us here:* CLAUDE.md / skills / memory are the extract's literal examples. Note
  the framework's insistence that this is the *interface to* L7, not L7 itself — our
  orchestrate/router split honors that.

## Physical Telemetry / L1.7
- **Weakest-supported part.** The theory wants instrumentation of the *compilation trajectory*
  (node activation, token-entropy, geometric Δ) to catch path-integrity violations invisible
  to L6.
- engine `telemetry/agents/` + `build-telemetry-bundle.ts` — **built**, but these instrument
  **agent dispatch**, not the derivation trajectory `(tentative)`, so they miss the actual L1.7
  intent.
- engine `internal_tools/` (`convergence_runner`, `categorical_tooling_guard`,
  `graph_retrieval`) — **built (tentative)** as nearest kin, still not trajectory telemetry.
- cav2 **Attestation/Signer** sigil (tamper-evident provenance) — **designed** (in-dev);
  provenance ≠ trajectory. Overall: **researched / unresolved** — matches the extract flagging
  L1.7's very position (L1.7 vs L4–L6) as open.

---

## Flow — end-to-end construction path through our ACTUAL components

Upward build (each arrow = a real handoff we can point at):

1. **Domain (L0)** — reality; no component. →
2. **Elicit (L0.5):** `domainspec-interview-scope` / `scope-interview` observe it and produce
   stable patterns. **[using]** →
3. **Formalize (L1):** `domainspec-spec-feature` writes the typed graph against the 25
   meta-types / 29 edges; v2 `DS-D1.*` cards + `meta-types.yml` are the next-gen node
   alphabet. **[using / built]** →
4. **Compile (L1.5):** `test-derivation-engine` / `domainspec-generate-tests` deterministically
   derive obligations — **T=f(C,R,Δ)**, compiling not authoring. **[built partial / using]** →
5. **Code (L2):** `domainspec-implement` + `domainspec-pipeline` emit `backend/`, `apps/web`,
   `examples/`. **[using]** →
6. **Run (L2.5):** the stack runs on `infra/`; but the *operational-signal producer* is
   **[designed]** — the one missing floorboard. →
7. **Route signals (Signal Protocol):** `domainspec-emit-signals` → `pipeline-signals.jsonl` →
   `domainspec-signal-observer` (schema+routing+pruning). **[using]** — today fed by
   pipeline/session signals, not yet L2.5 runtime signals. →
8. **Make rules (L3):** signals + contradiction feed `constitution-governance` /
   `definitions-governance` / `decision-gate`; engine `AXIOMS→CONSTITUTION→gates`; cav2
   authority spine + promotion ladder. **[using engine / designed cav2]** →
9. **Excavate premises (L4):** `decision-gate` + signed **decisions ledger** + Via-Negativa
   **axioms** surface the premises beneath the rules. **[using / built]** →
10. **Navigate (L5):** `vault/` + `ontology-vault` + `inventory` + registry keep L1/L2/L3
    traversable. **[using]** →
11. **Enforce (L6):** `spec-validate.sh` (fail-closed) + validators + `verify-feature` +
    `readiness-gate` block; `generate-meta-health.ts` emits Orphan Rate / Governance Coverage.
    **[using]** — the load-bearing floor. →
12. **Coherence (L7):** emergent when L0–L6 align; measured by meta-health, rendered by
    `x-ray`; **navigated** through **CLAUDE.md + skills + memory** (Agent Interface). **[emergent
    / interface using]**.

Sidecar (unresolved): **L1.7 Physical Telemetry** would instrument step 4's trajectory —
**[researched]**, no real closer.

## Feedback edges (downward)

- **L2 ⇢ L1** ("implementation reveals gaps the spec lacked"): closed by engine
  `domainspec-audit-alignment` (ALIGNMENT-REPORT), `domainspec-audit-layering`, and v2
  `DRIFT-CONVERGENCE.md` (the L1↔L2 drift surface L6 tooling can detect). **[using / built]** —
  this feedback edge is genuinely wired.
- **L2.5 ⇢ L0** ("workarounds surface that the domain changed faster than L1 captured"): **no
  built closer.** The theory says this drift is "detectable only by human observation"; our
  only candidate path is `signal-observer` → governance, and its L2.5 input is exactly the
  unbuilt producer from step 6. This is the framework's open loop in our stack — the same gap
  Saturn (**nowhere built**, named future actuator in v2 + cav2) is meant to close.
- Drift trio (per extract): **L0↔L1** (human-only) — unwired; **L1↔L2** — wired (audit-alignment
  / DRIFT-CONVERGENCE, **built**); **operational-L1 ↔ architectural-L1** — the two-plane
  boundary names it, no detector `(tentative)`.
