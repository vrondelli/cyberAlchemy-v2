---
tags: [framework-unification, meta-layers, residue, skeptic-audit]
node_type: audit
status: draft
last_updated: 2026-07-03
audits: [COMPONENT-LAYER-MAP.md]
against: [EXTRACT-META-LAYERS.md, ../recon/INDEX.md, ../recon/MAP-domainspec-impl.md, ../recon/MAP-arcanum.md, ../recon/MAP-cyberalchemy-v2.md, ../recon/MAP-domainspec-v2.md]
---

# MAP RESIDUE — honesty audit of the component↔layer map

Scope: the *mapping* only. The meta-layers theory is assumed true and is not challenged.
Verdict up front: the map is unusually disciplined — it uses `(tentative)`/`designed`
markers honestly, self-discloses its worst seam (L2.5), and tags cav2 as `designed`/`flag`
rather than inflating it. The residue below is real but concentrated, not pervasive.
Counts: **4 forced fits · 4 holes · 4 orphan classes · 1 hard + 2 soft overclaims.**

---

## Forced fits

1. **L2 ← v2 `impl/` "buildable engine" (category mismatch).** The theory's L2 is
   "code, schema, APIs, event log — implements L1." v2's `impl/` is the
   `test-derivation-engine` + validators + meta-type schemas — it *derives tests and
   validates the spec*; per MAP-domainspec-v2 it emits **no** `backend/`, `apps/`, or
   `examples/` (those exist only in the v1 engine). So v2 `impl/` is L1.5 (derivation) +
   L6 (enforcement) machinery wearing an L2 hat. The maturity tag ("built, G1–G3 green")
   is accurate; the *layer* is wrong. This is the one real L1/L2-vs-tooling conflation in
   the map — everywhere else L1 (meta-types/cards/taxonomy) and L2 (implement/apps/backend)
   are kept cleanly distinct.

2. **L4 ← cav2 decisions ledger as "archaeological excavation of premises."** L4 is
   "the premises beneath L3's rules… excavated after contradiction." Per MAP-cav2 the 6
   signed records are *product/authority* decisions (engine-moat/free-paid boundary,
   Saturn disclosure, HMI promotion, ResonantOS standalone) — governance choices, not
   epistemic premises under a rule. The *mechanism* (`decision-gate`) fits L4 fine; the
   *ledger content* does not. The genuine L4 is the engine's `premise/` folder + Via-Negativa
   axioms, which the map also (correctly) cites — so cav2 here is padding, not the load-bearer.

3. **L1 ← v2 two-plane boundary ↔ operational/architectural two-register (disclosed stretch).**
   The map itself flags this `(tentative)` and admits "the correspondence is ours, not
   stated in the extract." Authoring-plane-vs-contract-plane (spec tooling) is a different
   axis from tacit-practitioner-vs-explicit-builder (human knowledge). Honestly labeled, so
   this is a weak-fit the map already owns — noted, not indicted.

4. **L2.5 ← Arcanum `goal` spell as "actuator analog" (`(tentative)`).** Map concedes it
   "drives development frontiers, not a production L2.5." Fair self-flag; it is filling an
   empty layer with the nearest built thing rather than a true fit.

---

## Holes (theory parts with no built/using closer — the build list)

1. **L2.5 operational-signal producer — THE hole.** The live sociotechnical layer's
   distinctive output (operators, overrides, runbooks, workaround detection) has **no
   builder**. The map names it "the weak seam / the one missing floorboard," and the recon
   confirms every built signal path (`emit-signals` = *session epilogue*, `signal-observer`
   = *telemetry bundles*) is build-time/agent-dispatch telemetry, never runtime-operational.
   This is the highest-leverage gap: it starves the (built) Signal Protocol of its theorized
   input and blocks the feedback half of the stack below.

2. **Feedback / evidence loop `L2.5⇢L0` + Saturn — nowhere built.** The map is explicit:
   "no built closer… the same gap Saturn (nowhere built) is meant to close." The entire
   intent↔reality-with-evidence loop — the third pillar — has zero implementation. Distinct
   from hole #1: even given an L2.5 producer, the return edge that reconfigures L0/L3 is
   unbuilt.

3. **L1.7 Physical Telemetry (compilation-trajectory instrumentation) — unbuilt.** The
   theory wants node-activation / token-entropy / geometric-Δ instrumentation of the
   *derivation path*; the only built kin (`telemetry/agents/`, `build-telemetry-bundle.ts`)
   instruments **agent dispatch**, and cav2 Attestation is provenance, not trajectory. The
   theory itself flags L1.7's position as open, so this is a hole in an admittedly-open part
   — real, but lower priority than #1/#2.

4. **Drift detectors `L0↔L1` and operational-L1↔architectural-L1 — unbuilt.** Map: the
   first is "human-only, unwired"; the second "the two-plane boundary names it, no detector."
   Only the `L1↔L2` drift edge is genuinely wired (`audit-alignment` / `DRIFT-CONVERGENCE`).

---

## Orphans (built components with no home in the theory)

1. **subagents-strategy dispatch machinery — the headline orphan.** `register-dispatch` +
   `subagents-dispatch.yaml` + `domainspec-subagents-strategy` + the standalone package
   appear **nowhere** in the layer map, yet the recon INDEX calls this "the most-propagated
   capability in the system… if the system has a nervous system today, this is it" (§3, §5).
   The single most-travelled built capability is homeless in the theory — the theory has no
   rung for its own agent-orchestration substrate.

2. **GSD pack (57 skills + 18 agents) — largest orphan by mass.** Vendored in every engine
   checkout, bridged via `domainspec-*-phase-bridge`, unplaced in the map. Defensible as
   out-of-scope third-party delivery machinery — but the map never says so, so it sits
   unaccounted. If the theory means to be a complete account of what runs the build, a
   57-skill execution pack is a conspicuous silence.

3. **mint (cav2) + arcanum-bootstrap (Arcanum) — the "build-the-builder" class.** mint casts
   a full L0–L6 spine onto a *new* repo; arcanum-bootstrap installs the capability catalog
   into a consumer (recon §5: "the declared install path"). Neither is any single L0–L7 rung
   — they instantiate/distribute the whole stack. Pointed, given the project's own objective
   ("a system that builds other systems"): the layer theory has **no layer for the
   meta-operation of building a system**. (Both are in-dev/`designed`, so designed orphans.)

4. **Framework-authoring sigil class (Arcanum).** `sigil-development`, `spellcraft`,
   `skill-decomposer`, `skill-transcriptor`, `invoke`, `refine` author *capabilities*, not
   domain artifacts — a whole meta-tier with no object-layer home. Same shape as #3: the
   theory models building a domain system, not building the tools that build it.

---

## Overclaims (built/using tags the recon contradicts)

1. **L3-S / Agent Interface "~148 engine + ~76 Arcanum" presented additively — double-count.**
   Recon INDEX §3 states the governance sigils (definitions-governance, decision-gate,
   constitution-governance) are "**same three capabilities, two+ homes**," and OQ-4 asks
   whether the engine skills are `arcanum-bootstrap`-*generated* from Arcanum (i.e. copies).
   Summing both catalogs (~224) as L3-S breadth inflates the evidence for the layer by
   counting mirrors twice. The same additive-mirror pattern recurs in **Signal Protocol**
   (engine emit/observe *and* Arcanum signal-observer — recon: "two implementations of the
   same telemetry idea") and **L5** (engine vault + Arcanum ontology-vault + cav2 — recon:
   "three vault/ontology surfaces"). The per-layer count of *distinct* built evidence is
   smaller than the map's tallies imply. This is the map's one hard overclaim.

2. **(soft) L6 metric identity.** The map asserts `generate-meta-health.ts`'s
   `M-001..M-006` *are* the theory's "Orphan Rate / Governance Coverage." Recon confirms
   the metrics exist but never verifies those identities — the equation is the map's, beyond
   the recon evidence.

3. **(soft) L1.7 `internal_tools` "built (tentative)."** Recon only listed the folder
   (`convergence_runner`, `categorical_tooling_guard`, `graph_retrieval`) by name and did
   not establish maturity; "built" leans on file presence.

**Where the map is clean (stated for fairness):** per-item maturity tags are honest — cav2
is `designed`/`flag` (not "built"), the cav2 closure-validator is `designed (blocked)`, v2
`test-derivation-engine` is "built *but partial*, δ-rules still stubs," and x-ray/meta-health
carry `(tentative)`. L0 and L7 correctly claim no builder. L6 is genuinely the best-supported
layer (fail-closed hooks + validators + meta-health, all `using`). The map does **not**
inflate any single component's maturity past the recon — its residue is *layer placement*
(forced fits), *breadth arithmetic* (double-count), and *silence* (orphans), not per-item
maturity lies.
