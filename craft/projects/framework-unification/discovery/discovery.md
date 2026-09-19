---
tags: [framework-unification, arcanum, domainspec, agentic-system, layers, observability]
node_type: discovery
is_session: false
layer: architecture
nature: explanatory
status: draft
version: 0.1.0
last_updated: 2026-06-15
created_by: victorboscaro@gmail.com
---

# Framework Unification — One Engine, Three Layers

> **What this node is.** A map, not a build order. It records the design space discovered by
> the research synthesis: that three project folders are three layers of one intent→code engine,
> how those layers communicate, the duplicated owners that must collapse to one, and the seams
> the next phase (paired-views) inherits. It does **not** ratify the typed-DAG, decide who owns
> dispatch composition, or claim any aspirational piece is built. Everything operational is OPEN.

This discovery distills [`research/RESEARCH.md`](../research/RESEARCH.md) via
[`research/domainspec-findings.md`](../research/domainspec-findings.md). It is the
`research → discovery` step of the workspace plan; the next step is **paired-views** over the
three layers to assign a single owner to each duplicated concept.

---

## Objective

Give the owner one high-level view to orient by before unification: confirm the three folders
are one engine's layers, name the communication substrate (signal ledgers + `pass|flag|block`),
and pin the two duplicated owners and the one concrete unblock — so the next decision is made
against the real seam, not the framework's headline.

## Context

### What the system is

The engine (internal name CyberAlchemy / agentic-system) keeps **intent, execution, and
evidence mutually traceable**: user intent → structured intent (**DomainSpec**) → routed to
capabilities that execute (**Arcanum**) → every execution emits **signals** that feed back to
correct course, until finished code. DomainSpec says *what*; Arcanum says *how*; Saturn closes
the loop with *evidence* ([RESEARCH.md §The three pillars](../research/RESEARCH.md#the-three-pillars-from-cyberalchemy)).

### How the layers communicate

Not buses or queues — **append-only ledgers (signals)**. Each component writes its own signal
type to its own ledger; coordinators read aggregations. This is the connective tissue of the
unification, together with the shared `pass|flag|block` verdict vocabulary
([findings F2](../research/domainspec-findings.md#findings)).

| Layer folder | Layer | Owns |
|---|---|---|
| `domainspec-language` | **representation** | the language for contracts/schemas that validate pipeline artifacts |
| `dispatch-composition-attack` | **communication / observability** | making multi-agent work an observable signal in the central ledger |
| `cyber-alchemy-lean-fusion` | **epistemology / gate** | the `subset-rule` (claim ≤ proof) + typed residue; backed by a machine-checked Lean repo and (aspirationally) PermGuard for tool-call gating |

---

## Decisions taken

### D-1. The three folders are three layers of one engine, not separate products
- **Decision:** treat `domainspec-language`, `dispatch-composition-attack`, and
  `cyber-alchemy-lean-fusion` as the representation / communication / epistemology layers of one
  engine.
- **Rationale:** a shared spine recurs in all three — residue, dispatch composition,
  `claim ≤ proof`, and observability signals ([findings F4](../research/domainspec-findings.md#findings)).
- **Status:** decided (confirmed by the research sweep).

### D-2. Communication is modeled as append-only signal ledgers
- **Decision:** the unification's connective tissue is the signal-ledger set + the
  `pass|flag|block` vocabulary, not a new API/bus.
- **Rationale:** observed across the corpus; loose coupling depends on it
  ([findings F2](../research/domainspec-findings.md#findings)).
- **Status:** decided (descriptive of the current system).

### D-3. Sequence the unification as research → discovery → paired-views
- **Decision:** build the high-level view first, then run paired-views to assign a single owner
  to each duplicated concept.
- **Rationale:** the duplicated owners (T1, T2) are the unification target and need single-owner
  resolution, not more synthesis.
- **Status:** in progress — this node is the discovery step.

### D-4. Novelty lives in Lean; this workspace is operationalization (judged by usefulness)
- **Decision:** the typed-residue object + theorems are owned by the sibling Lean repo
  (`../../domainspec-lean-formalization`); this workspace operationalizes the lifecycle and is
  judged by **utility, not novelty**. So the fusion `DESIGN.md §5` collapse-test (a novelty bar)
  is mis-scoped here, and the `§7` residue-type question is **Lean-owned and deferred** — a future
  integration point (import the type via the bridge if/when an automated mechanical gate is
  needed), not a blocker of this workspace.
- **Rationale:** owner decision 2026-06-15; already latent in `DESIGN.md §2` (Arcanum = lifecycle
  machine here; Lean = formal conscience there). Stated once in [`../SCOPE.md`](../SCOPE.md).
- **Status:** decided.

---

## Alternatives considered

### A-1. Treat the three folders as separate products/applications
- **Rejected.** The shared spine (D-1 rationale) shows one stack seen from three altitudes, not
  three products. The rest of `projects/` are the actual applications built *with* the system.

### A-2. Map the engine from `arcanum` source
- **Not available.** The `arcanum` submodule is uninitialized, so the engine was mapped from its
  description in `cyberAlchemy/`. Recorded as a seam (OQ-5), not a chosen route.

---

## Open Questions

### OQ-1. Who owns "dispatch composition," and does `v0.5.2` ratify?
**Context:** two homes — the analytical ontology (cyber-alchemy View 03, with debts R30 / `loop_cap` / `experiment` peer-vs-submode) and the executable schema (dispatch-composition-attack, blocked on the `v0.5.2` typed-DAG draft). They point at the same cross-repo decision ([findings T1](../research/domainspec-findings.md#analysis)).
**Recommendation:** primary target for paired-views; assign one owner before ratifying the DAG.
**Status:** OPEN.

### OQ-2. Who owns the `obligation_id` bridge (B-1)? (the residue *type* is Lean-owned — D-4)
**Context:** residue-type appeared to equal the `obligation_id` bridge condition B-1 (domainspec-language) ([findings T2](../research/domainspec-findings.md#analysis)). Per D-4 / [`../SCOPE.md`](../SCOPE.md) §1, the residue *type* is owned by the Lean repo and deferred; what remains here is the operational owner of the bridge.
**Recommendation:** assign the bridge to one owner in paired-views; treat the typed-residue identity as a Lean-side question.
**Status:** OPEN.

### OQ-3. Who builds the observability producer feeding the central ledger?
**Context:** `.arcanum/observability/signals/sigil-invocations.jsonl` has a writer but no producer — the one concrete unblock of the feedback loop ([findings F3](../research/domainspec-findings.md#findings)).
**Recommendation:** scope the producer + Claude hook surface as the first build after owners are assigned.
**Status:** OPEN.

### OQ-4. Where do the Lean backing and PermGuard fit, given both are aspirational?
**Context:** the Lean formal backing certifies the formal residue object, not Arcanum runs; PermGuard is a verified-core reference monitor whose binary exists but was never wired, bounded by a machine-checked egress-bypass negative ([findings F5](../research/domainspec-findings.md#findings)).
**Recommendation:** the boundary is now fixed once in [`../SCOPE.md`](../SCOPE.md) §2 — downstream views link there instead of restating it; keep both aspirational + mapped-by-description.
**Status:** resolved-elsewhere (SCOPE.md §2).

### OQ-5. Initialize `arcanum` (and read `../domainspec-lean-formalization`) for real-code discovery?
**Context:** the engine was mapped by description; the Lean repo was outside the read corpus ([findings cross-cutting](../research/domainspec-findings.md#analysis)).
**Recommendation:** `make bootstrap` / init the submodule if paired-views needs the real engine code.
**Status:** OPEN.

---

## What this discovery does NOT decide / does NOT claim

- Does **not** assign an owner to dispatch composition or ratify the `v0.5.2` typed-DAG (OQ-1).
- Does **not** assert residue-type ≡ `obligation_id` B-1 — it records the suspected identity as open (OQ-2).
- Does **not** claim the observability producer, the unified DomainSpec language, PermGuard, or the Lean backing are built — all are aspirational.
- Does **not** treat the Lean proofs as certifying Arcanum correctness, nor PermGuard as a security guarantee (OQ-4).

---

## Connections

| Document | Type | Description |
|---|---|---|
| [../research/domainspec-findings.md](../research/domainspec-findings.md) | `derives-from` | The findings these decisions and open questions are extracted from. |
| [../research/RESEARCH.md](../research/RESEARCH.md) | `derives-from` | The upstream research synthesis. |
| [../SCOPE.md](../SCOPE.md) | `relates-to` | Scope/conventions; D-4 division of labor, the §2 aspirational boundary, the §3 open-questions rule. |
| [../README.md](../README.md) | `cites` | Workspace scaffold and plan. |
| [../layers/cyber-alchemy-lean-fusion/PERMGUARD-IN-ARCANUM.md](../layers/cyber-alchemy-lean-fusion/PERMGUARD-IN-ARCANUM.md) | `cites` | Source for the aspirational operational gate (OQ-4). |

---

## Source dispatch

- **Research:** `2026-06-15-system-highlevel-research` (3 read-only agents) → [`research/RESEARCH.md`](../research/RESEARCH.md).
- **Lean + PermGuard addition:** `2026-06-15-research-md-lean-permguard-eval` (evaluate) → `2026-06-15-research-md-lean-permguard-edit` (apply), in [`telemetry/agents/subagents-dispatch.yaml`](../../../telemetry/agents/subagents-dispatch.yaml).
- **Findings provenance:** [`research/domainspec-findings.md`](../research/domainspec-findings.md) (pragmatic chain — research source is RESEARCH.md, not a verbatim `domainspec-research.md`).
