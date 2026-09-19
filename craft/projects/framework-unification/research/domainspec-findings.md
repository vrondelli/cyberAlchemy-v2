---
tags: [framework-unification, arcanum, domainspec, agentic-system, subagents-findings]
node_type: subagents-findings
is_session: false
layer: architecture
nature: reference
status: active
version: 0.1.0
last_updated: 2026-06-15
implements: [R16, R17, R18, R21, R22, R23 of domainspec-subagents-strategy-constitution.md]
---

# Subagents-Findings — `framework-unification`

> Preamble (Context + Goal, R23) followed by **Dispatch record** → **Findings** → **Analysis** (R16 order).
>
> **Pragmatic adaptation (recorded honestly):** the canonical chain wants a verbatim
> `domainspec-research.md` for R17 citations. That per-child file was never persisted for the
> original research dispatch, so by user decision (2026-06-15) the **research source is
> [`RESEARCH.md`](./RESEARCH.md)**, the synthesis, not a verbatim research file. Citations
> therefore resolve to RESEARCH.md *sections*, not `#agent-N` anchors — which lowers the
> Fidelity grade below; nothing is fabricated.

---

## Context

The previous session (`sessions/2026-06-15-2219-framework-unification.md`) asked whether three
project folders — `cyber-alchemy-lean-fusion`, `dispatch-composition-attack`,
`domainspec-language` — describe the same system. Three read-only research agents
(dispatch `2026-06-15-system-highlevel-research`) swept the checked-out corpus and the synthesis
landed in [`RESEARCH.md`](./RESEARCH.md). An inline investigation was insufficient because the
question spans three folders + the engine description and needed independent concern-separated
reads. A later edit (dispatch `2026-06-15-research-md-lean-permguard-edit`) added the Lean formal
backing and PermGuard to RESEARCH.md.

## Goal

Produce the structured findings that gate **discovery**: confirm whether the three folders are
one engine or separate products, name how the layers communicate, and surface the duplicated
owners and open seams a single-owner discovery must resolve.

---

## Dispatch record

> Implements R18 (schema) and R21 / R22 (grading).

**Mode:** `task-fan-out` (3 parallel read-only research agents) → synthesis *(R19)*

**Per-agent table:**

| Agent id | Model | Difficulty justification | Token budget | Declared output shape |
|----------|-------|--------------------------|--------------|-----------------------|
| `agent-1` | `unrecorded` | broad corpus sweep — concern: pillars/pipeline | `unrecorded` | structured synthesis fragment |
| `agent-2` | `unrecorded` | broad corpus sweep — concern: communication/signals | `unrecorded` | structured synthesis fragment |
| `agent-3` | `unrecorded` | broad corpus sweep — concern: three-layer mapping | `unrecorded` | structured synthesis fragment |

> Per-agent model/budget/spend were not persisted in a `domainspec-research.md`; recorded as
> `unrecorded` rather than invented (R18 honesty over completeness).

**Sequencing:** parallel set (3) → single synthesis into RESEARCH.md.

**Recursion budget actually used:** depth = 1, breadth = 3, total agents = 3.

**Actual spend:** `unrecorded` (no per-child telemetry file persisted).

**Four-component grade** *(R21; judgments marked per R22):*

| Component        | Score (0–1) | Note |
|------------------|-------------|------|
| Coverage         | `0.8` (judgment) | The three-layer question is answered with a shared-spine argument and a duplicated-owner list; the engine itself was mapped by description (arcanum submodule uninitialized), so engine-internal coverage is partial. |
| Independence     | `0.7` (judgment) | Three concern-separated reads, but the verbatim per-agent outputs are gone, so non-overlap can no longer be inspected — judged from the synthesis shape. |
| Fidelity         | `0.5` (judgment) | Lowered deliberately: claims trace to a synthesis (`RESEARCH.md`), not a verbatim research file with `#agent-N` anchors. Honest, but weaker than the canonical chain. |
| Cost discipline  | `n/a`            | declared budget vs actual: `unrecorded / unrecorded`. |

> **R22 reminder:** three of four components are judgments dressed in numbers; only cost is
> mechanical, and here it is unrecorded.

---

## Findings

> Every load-bearing claim cites a section of [`RESEARCH.md`](./RESEARCH.md) (R17, pragmatic).

### F1 — The three folders are three layers of one engine, not separate products

- **Claim:** `domainspec-language`, `dispatch-composition-attack`, and `cyber-alchemy-lean-fusion` are the **representation**, **communication/observability**, and **epistemology/gate** layers of one intent→code engine (CyberAlchemy / agentic-system).
- **Evidence:** [`RESEARCH.md` §The three layers (confirmed)](./RESEARCH.md#the-three-layers-confirmed)
- **Implication:** discovery should map one engine with three owned layers, not unify three products.

### F2 — Communication is append-only signal ledgers, not buses

- **Claim:** the layers stay loosely coupled because each component writes its own signal type to its own append-only `.jsonl`/`.yaml` ledger; coordinators read aggregations — there is no message bus/queue.
- **Evidence:** [`RESEARCH.md` §How it communicates (the central question)](./RESEARCH.md#how-it-communicates-the-central-question)
- **Implication:** the unification's connective tissue is the ledger set + the `pass|flag|block` vocabulary, not an API surface.

### F3 — One concrete gap blocks the feedback loop: the central observability ledger has no producer

- **Claim:** `.arcanum/observability/signals/sigil-invocations.jsonl` has a writer but nothing feeds it, so dispatch/multi-agent work is invisible; `dispatch-composition-attack` is the layer proposing to fix it.
- **Evidence:** [`RESEARCH.md` §How it communicates (the central question)](./RESEARCH.md#how-it-communicates-the-central-question), [`RESEARCH.md` §Real vs aspirational](./RESEARCH.md#real-vs-aspirational)
- **Implication:** the single highest-leverage build for discovery to scope is the producer + hook surface.

### F4 — A shared spine recurs across all three layers

- **Claim:** residue, dispatch composition, `claim ≤ proof`, and observability signals appear in all three folders — strong evidence of one stack seen from three altitudes.
- **Evidence:** [`RESEARCH.md` §Shared spine across the three layers](./RESEARCH.md#shared-spine-across-the-three-layers)
- **Implication:** the spine primitives are the candidate concepts for single-owner assignment in paired-views.

### F5 — The epistemology/gate layer has a real formal backing, with an explicit honesty border

- **Claim:** the `claim ≤ proof` / typed-residue core is anchored on a machine-checked Lean repo (`../domainspec-lean-formalization`); a second, still-aspirational feeder of the central ledger is **PermGuard** (operational gate on tool-calls). Both carry a CERTIFIED-vs-ASSUMED border — the proofs do **not** certify Arcanum runs, and a machine-checked negative shows `curl` via Bash evades the egress guard.
- **Evidence:** [`RESEARCH.md` §The three layers (confirmed)](./RESEARCH.md#the-three-layers-confirmed), [`RESEARCH.md` §How it communicates (the central question)](./RESEARCH.md#how-it-communicates-the-central-question)
- **Implication:** discovery must keep the formal/operational backing marked aspirational + mapped-by-description, never as a correctness guarantee.

---

## Analysis

> Tensions and cross-cutting reasoning. Each claim cites RESEARCH.md (R17, pragmatic).

### T1 — "Dispatch composition" has two homes

- **Held by `cyber-alchemy View 03`:** the analytical ontology of Dispatch→Wave→Layer→Agent (open debts: R30 conflict, `loop_cap`, `experiment` peer-vs-submode).
- **Reality in `dispatch-composition-attack`:** the executable schema, blocked on ratifying the `v0.5.2` typed-DAG draft.
- **Evidence:** [`RESEARCH.md` §Duplicated owners to resolve](./RESEARCH.md#duplicated-owners-to-resolve-the-unification-target)
- **Impact:** one cross-repo decision owns both; until assigned, the DAG model stays unratified. High — this is the primary unification target.

### T2 — "Type of residue" has two formulations

- **Held by `cyber-alchemy-lean-fusion`:** residue-type is the central blocker (what *type* fires the subset-rule gate).
- **Reality in `domainspec-language`:** the same condition appears as the `obligation_id` bridge B-1.
- **Evidence:** [`RESEARCH.md` §Duplicated owners to resolve](./RESEARCH.md#duplicated-owners-to-resolve-the-unification-target)
- **Impact:** resolving one resolves half the other; a single owner should hold both. High.

### Cross-cutting observations

- **Maturity is split:** philosophy/governance layers are mature; runtime/observability are still in implementation — discovery should not present aspirational pieces (producer, unified language, typed-DAG ratification, PermGuard) as built. [`RESEARCH.md` §Real vs aspirational](./RESEARCH.md#real-vs-aspirational)
- **Two corpora were not read:** the `arcanum` submodule is uninitialized (engine mapped by description) and the sibling `../domainspec-lean-formalization` was outside the read corpus. Both are seams discovery inherits. [`RESEARCH.md` §Open seams carried into discovery](./RESEARCH.md#open-seams-carried-into-discovery)

---

## Open Questions

> Per the workspace convention ([`../SCOPE.md`](../SCOPE.md) §3) every informational object carries
> this section. These are the items these findings leave open for discovery to own.

- **OQ-1. Are the duplicated owners (T1, T2) one decision or two?** — **Context:** T1 (dispatch
  composition) and T2 (residue-type ≡ `obligation_id` B-1) each have two homes. **Recommendation:**
  resolve in paired-views / a dedicated dispatch. **Status:** OPEN (owned downstream by discovery
  OQ-1/OQ-2).
- **OQ-2. Is the pragmatic research source acceptable long-term?** — **Context:** these findings
  cite `RESEARCH.md` sections, not a verbatim `domainspec-research.md` (Fidelity 0.5). **Recommendation:**
  accept the disclosed adaptation for an orientation workspace; persist a verbatim research file only
  if a future artifact needs agent-level provenance. **Status:** deferred.
- **OQ-3. Backfill the unrecorded per-agent telemetry?** — **Context:** model/budget/spend were not
  persisted for the original research dispatch. **Recommendation:** backfill from the dispatch ledger
  only if cheap; otherwise leave `unrecorded`. **Status:** deferred.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [../SCOPE.md](../SCOPE.md) | `relates-to` | Workspace scope/conventions (open-questions rule §3; aspirational boundary §2). |
| [./RESEARCH.md](./RESEARCH.md) | `derives-from` | The research synthesis these findings are extracted from (pragmatic research source). |
| [../../../sessions/2026-06-15-2219-framework-unification.md](../../../sessions/2026-06-15-2219-framework-unification.md) | `derives-from` | The session that ran the research dispatch and scaffolded the workspace. |
| [../../../telemetry/agents/subagents-dispatch.yaml](../../../telemetry/agents/subagents-dispatch.yaml) | `cites` | Dispatch ledger: `2026-06-15-system-highlevel-research` (research), `2026-06-15-research-md-lean-permguard-eval`/`-edit` (the Lean+PermGuard addition). |
| [../discovery/discovery.md](../discovery/discovery.md) | `derives` | The discovery node these findings feed (same-folder, pragmatic chain). |
