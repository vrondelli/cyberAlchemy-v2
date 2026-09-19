# VISION — the capability foundry (map)

> **What this is.** The high-level map of what we are building: a tool that turns a
> user's **vague intention** into a **useful artifact**. It names the components, the
> stages, the cross-cutting substrate, and how they relate — and points to where each
> part is owned, open, or to-be-filled. It is the navigation surface; the detail lives
> in the sibling docs (`DESIGN.md`, `discovery/MAP.md`, `PERMGUARD-IN-ARCANUM.md`) and,
> soon, in per-domain `context-packs/`.
>
> **Status: skeleton.** The spine is set; the five specialist sections (§5) are stubs
> the domain agents will fill. Nothing here is built. The one load-bearing open gate is
> marked in §7.

## 1. The organizing question

**How do you turn a user's vague intention into a useful artifact?** — where the
artifact may be:

- **knowledge** (text, a Lean file, a phrase, a decision record), or
- **code that executes** something.

Everything below is an answer to that one question, with typed accounting of what is
lost at each step and verified gates on what is done.

## 2. The thesis (and the honest differentiator)

We are **the formal version of a pattern others build informally.** The four-part
decomposition below is *convergent*, not invented here: `ResonantOS/2.0.0-alpha` (a
browser-first agent OS, MIT, alpha) independently built ~80% of it — Delegation Packet ≈
governed lifecycle, `residualRisks`+Logician ≈ epistemic core, capability-grant broker ≈
permguard, executive/worker/verifier ≈ dispatch — **with zero formal verification.**

So the architecture is **not** the moat. The moat is the **formal layer**, on three legs:

1. **typed/categorical residue** (what each transformation provably fails to preserve),
2. **a verified permission kernel** (permguard — a proved decision core for tool-use),
3. **the subset rule** (claim ≤ proof, mechanized as a gate).

Honest scope, bound here so it is never inflated downstream: the formal legs cover a
**core**, not the whole system. permguard verifies a *decision core, not security*; the
residue type is *un-proved as a transfer to agent artifacts* (§7); ResonantOS et al.
prove the pattern is natural, not that we have shipped it.

## 3. Architecture — stages vs substrate

The system has a **flow** (stages, in sequence) and a **substrate** (cross-cutting,
touches every stage). Conflating the two is a modeling error.

```
        ┌──────────── STAGES (the flow) ────────────────────────┐
intent → [1 intent-framing] → [2 dispatch] → [3 verify/residue] → [4 artifact]
                                                                      ├─ knowledge
                                                                      └─ executable code
        └───────────────────────────────────────────────────────┘
        ┌──────────── SUBSTRATE (cross-cutting) ────────────────┐
          • permguard      — verified tool-use governance
          • observability  — runs → evidence ledger
          • memory/archive — persist artifact as knowledge, promote, provenance
        └───────────────────────────────────────────────────────┘
```

- **Stages** = intent-framing → dispatch → verification/residue → artifact.
- **Substrate** = permguard, observability, memory/archive — each touches every stage.
- **The residue flows THROUGH every stage:** each transformation emits what it did not
  preserve; the artifact arrives carrying its accumulated residue ledger. (This is the
  through-line that distinguishes us from informal `residualRisks`.)

### The output type decides which substrate carries the weight

- artifact = **knowledge** → the **residue / subset-rule** legs carry the weight;
  permguard is light.
- artifact = **executable code** → the agent runs tools to build/run; **permguard is
  the critical seam** (verified, fail-closed gate on each tool-call).

## 4. Now vs later

- **Now:** an internal tool for two devs (Victor, Vladimir) to build code. Needs stages
  1–4 + permguard + observability + a minimal memory.
- **Later (product):** provider/runtime routing, a UI/surface, an add-on economy,
  multi-tenant memory. These are **product-stage** and marked as such; do not build them
  into the tool-now.

## 5. Components — the five specialist domains (+1 later)

Each domain is owned by a specialist agent that masters one seam and produces a compact
`context-packs/<domain>.md` (so we load one pack, not a whole subtree). Stubs below are
what those agents will fill.

1. **Intent & Goal-framing** *(stage 1)* — vague intent → structured goal contract
   (success criteria, scope, priority). Source: CyberAlchemy method (Orient/Discover);
   ResonantOS GoalWorkspace / Delegation Packet. — *[to fill]*
2. **Dispatch & Orchestration** *(stage 2 + substrate)* — route a goal to an agent
   ensemble; the explorer→skeptic→writer→auditor adversarial dispatch; anti-bias;
   observability. Source: `research`/`register-dispatch` skills + telemetry; TO-VLAD
   `DISPATCH-COMPOSITION-MODEL`; ResonantOS Delegation Fabric. — *[to fill]*
3. **Verification & Residue** *(stage 3 — the epistemic core)* — subset rule, typed
   residue, collapse-test, what-is-not-preserved. Source: `lean-formalization/` residue
   files, `victors-intuition`, CLAUDE.md triggers; ResonantOS Logician/`residualRisks`
   as the informal foil. — *[to fill]*
4. **Permission & Tool-governance** *(substrate)* — the verified reference monitor,
   capability grants, the CERTIFIED-vs-ASSUMED border. Source: permguard /
   `AgentPermissionKernel.lean`, `SECURITY-TOWER.md`, `PERMGUARD-IN-ARCANUM.md`;
   ResonantOS capability-grant broker (ADR-026) + approval tiers (ADR-012). — *[to fill]*
5. **Memory & Artifact-lifecycle** *(substrate)* — persist an artifact as knowledge,
   provenance, promotion/approval tiers, the knowledge|code bifurcation. Source:
   `theorem/sessions/` + vault ontology; **ResonantOS Living Archive** (the strongest
   external prior art — source-integrity + human/strategist/auto tiers). — *[to fill]*
6. **Provider & Runtime** *(later / product-stage)* — which model/runtime executes a
   step, cost/quality routing, fallback. Source: `claude-api` skill; ResonantOS
   Provider/Compute Fabric. — *[deferred]*

## 6. Ownership map (who owns what — cite, don't rediscover)

- **Dispatch/observability** — owned & written by `Arcanum/TO-VLAD/DISPATCH-COMPOSITION-MODEL.md`.
- **Verified authz core** — owned by Cedar (Lean, AWS Verified Permissions) / seL4 / XACML.
- **Session taint→egress** — owned as *research* by FIDES / CaMeL (unshipped).
- **The governed-synthesis lifecycle** — owned by Arcanum/CyberAlchemy.
- **The convergent informal whole** — `ResonantOS/2.0.0-alpha` (prior art the pattern is natural).
- **Un-owned, ours to make:** the formal layer's three legs (§2) — and even those are
  *engineering on owned components*, claimed honestly, not as novelty.

## 7. The one open gate (load-bearing)

**Does an artifact-level residue carry a TYPE that mechanically fires the subset-rule
gate, or does it collapse to prose?** (`discovery/views/01-residue-type.md`.) The whole
epistemic core (stage 3) and residue-as-through-line (§3) depend on this. Until resolved
(via a `research` dispatch in the theorem repo), it is marked **OPEN** — the vision is
assembled around it, not on top of a closed answer.

## 8. Venue & boundary map (so placement stops drifting)

| Repo | Visibility | Holds |
|---|---|---|
| `domainspec-core/projects/cyber-alchemy-lean-fusion/` | private | this VISION + DESIGN + discovery + the context-packs (the map) |
| `domainspec-lean-formalization/` (+ `theorem/`) | private | Lean formalization, residue, permguard kernel, research dispatches |
| `Arcanum/` | **public** | the CyberAlchemy method, sigils/spells — concept-level only; NO private internals |
| future `agentguard/` | public (planned) | the permguard verified kernel, when extracted |

Rule: private research stays in domainspec-*; only concept-level material goes to public
Arcanum.

## 9. Next route

1. **This frame** is the target structure for the five specialists.
2. **Dispatch the five domain specialists** (§5) — each produces its `context-packs/<domain>.md`
   and fills its §5 stub. This builds the map collaboratively without overloading one context.
3. **Resolve §7** (the residue-type gate) via a `research` dispatch when ready.
4. **Synthesize** the packs into the full map; then — and only then — consider building.
