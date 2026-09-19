# Framework Unification — Research

> Phase 1 (research) output. Goal: a high-level view of the agentic system that turns
> user intent into finished code (Arcanum engine + the three layer folders), focused on
> **how everything communicates**, so the owner can orient themselves before unifying.
>
> Source: three read-only research agents over the checked-out corpus (`cyberAlchemy/`,
> `projects/`, `docs/`, `research/`, `telemetry/`). The `arcanum` submodule was **not
> initialized**, so the engine is mapped from its description in `cyberAlchemy/`, not from
> source. Dispatch: `2026-06-15-system-highlevel-research` (see `telemetry/agents/subagents-dispatch.yaml`).

## Mental model (one sentence)

The system keeps **intent, execution, and evidence mutually traceable**: user intent
becomes structured intent (**DomainSpec**), is routed to capabilities that execute
(**Arcanum**), and every execution emits evidence (**signals**) that feeds back to correct
course — until it is finished code. The internal name is **CyberAlchemy / agentic-system**.

## The three pillars (from `cyberAlchemy/`)

| Pillar | Role | Question it answers |
|---|---|---|
| **Saturn** | the convergence loop | "what I intended × what happened × what drifted × what proves closure?" |
| **DomainSpec** | structured intent | "what is *meaningful* in the domain" (concepts, specs, tests, signals) |
| **Arcanum** | the engine/mechanism | "*how* to do the work" (sigil, spell, invoke, task-session, gate) |

DomainSpec says **what**; Arcanum says **how**; Saturn closes the loop with **evidence**.

## The intent → code pipeline

```
research → define → design → plan → spec/stories → implement → verify → emit-signals → promotion
```

Each stage **produces an artifact** the next **consumes**. Engine nouns:

- **invoke** — authoring by stages (define/design/plan)
- **task-session** — a bounded unit of work, with a gate and a terminal verdict
- **sigil** — reusable capability; **spell** — composed sigils
- **gate** — decides `pass | flag | block` between stages

The clearest *built-and-proven* pipeline is the **First Working Slice**
(`cyberAlchemy/agentic-system-first-working-slice.md`):
`source → inventory → ontology → context → execution → reflection → promotion gate → operated knowledge`.

## How it communicates (the central question)

Communication is **NOT** message buses or queues — it is **append-only ledgers (signals)**.
Each component writes its own signal type to its own ledger; higher-level coordinators read
aggregations. This is what keeps the pieces loosely coupled.

| Channel | What flows | State |
|---|---|---|
| `docs/signals/delegation-tuning.jsonl` | per-stage telemetry (started→completed/blocked/failed) | **real, populated** |
| `docs/signals/terminal-guard.jsonl` | command execution, retries | **real, populated** |
| `telemetry/agents/subagents-dispatch.yaml` | who dispatched whom (multi-agent) | **real** |
| `docs/signals/pipeline-signals.jsonl` | per-session workflow decisions | **real, sparse** |
| `.arcanum/observability/signals/sigil-invocations.jsonl` | central invocation ledger | **aspirational — writer exists, producer does not** |

**The single most critical gap:** the central observability ledger exists and has a writer,
but **nothing feeds it** — so dispatch/multi-agent work stays invisible until a producer is
built and a Claude hook surface is wired. (This is exactly what the `dispatch-composition-attack`
layer proposes to fix.)

A **second, still-aspirational feeder** of that same central ledger is **PermGuard** — a
verified-core reference monitor (`permguard` binary, sorry-free but never wired into an Arcanum
dispatch) that would emit a per-tool-call `allow/deny` decision (the operational gate on
*tool-calls*, distinct from the epistemic `pass|flag|block` gates on *artifacts*) into
`.arcanum/observability/`. Honest scope: CERTIFIED is the decision core, **not** security — a
machine-checked NEGATIVE bounds it (`curl` via `Bash` provably evades the egress guard;
`isEgress` covers only `WebFetch`). See `layers/cyber-alchemy-lean-fusion/PERMGUARD-IN-ARCANUM.md`.

## The three layers (confirmed)

The three folders are **not applications — they are layers of the engine**, each owning a
part of "how everything communicates":

| Layer folder | Layer | What it owns |
|---|---|---|
| `domainspec-language` | **representation** | the language for the contracts/schemas that validate pipeline artifacts |
| `dispatch-composition-attack` | **communication / observability** | makes multi-agent work an observable signal in the ledger (fills the gap above) |
| `cyber-alchemy-lean-fusion` | **epistemology / gate** | the `subset-rule` (claim ≤ proof) + typed residue that keep junk from being promoted; its `claim ≤ proof` / typed-residue core is anchored on a real machine-checked Lean repo (`../domainspec-lean-formalization`, e.g. `FunctorialResidueStructure.lean`) — but the proofs certify the formal residue object, **not** that an Arcanum run is lossless or correct (fusion `DESIGN.md §4`) |

The rest of `projects/` are **applications built with the system** (autoads, body-war,
whisky-doses, pos-multilevel, goldenquill, sonar-loop) or **research** (ontologize, equalizator).

## Shared spine across the three layers

The same primitives recur in all three — strong evidence they are one stack seen from three
altitudes:

- **Residue** — what a transformation does *not* preserve (cyber-alchemy: typed residue;
  domainspec-language: PCRA / iteration residue).
- **Dispatch composition** — Dispatch→Wave→Layer→Agent with typed DAG edges
  (cyber-alchemy View 03 = the analytical ontology; dispatch-composition-attack = the wiring).
- **claim ≤ proof** — subset-rule gate (cyber-alchemy) ≡ contract obligations + validation
  evidence (domainspec-language).
- **Observability signals** — the `.jsonl` ledgers, `pass|flag|block`, indexed by `dispatch_id`.

### Duplicated owners to resolve (the unification target)

1. **"Dispatch composition" has two homes** — the analytical ontology (cyber-alchemy View 03,
   with open debts: R30 conflict, `loop_cap`, `experiment` peer-vs-submode) and the executable
   schema (dispatch-composition-attack, blocked on ratifying the `v0.5.2` typed-DAG draft).
   They point at the **same unresolved cross-repo decision**.
2. **"Type of residue" has two formulations** — residue-type (cyber-alchemy's central blocker)
   ≡ `obligation_id` bridge condition B-1 (domainspec-language). Resolving one resolves half
   the other.

## Real vs aspirational

Philosophy and governance layers are **mature**; runtime and observability are **still in
implementation**. Built: delegation-tuning + terminal-guard ledgers, dispatch ledger, research
infrastructure, DomainSpec constitution. Aspirational: central observability ledger producer,
meta-governance reflection loops, the unified DomainSpec language, the typed-DAG ratification, the PermGuard operational tool-call gate (binary exists, unwired).

## Open seams carried into discovery

- The `arcanum` submodule is uninitialized — engine mapped by description, not code.
- Two duplicated owners (above) need a single-owner decision.
- The observability producer gap is the one concrete build that unblocks the feedback loop.
- The sibling repo `../domainspec-lean-formalization` (the Lean theorem repo + `permguard` kernel the epistemology/gate layer rests on) was outside the read corpus — like the `arcanum` submodule, that layer's formal backing is mapped by description, not verified here.
