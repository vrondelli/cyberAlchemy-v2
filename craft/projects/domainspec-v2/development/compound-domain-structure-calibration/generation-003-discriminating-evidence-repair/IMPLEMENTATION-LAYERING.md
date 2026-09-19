---
artifact_id: CDSC3-IMPLEMENTATION-LAYERING-v0.1
status: approved-plan
updatedAt: 2026-07-12
docType: implementation-layering
---

# Implementation Layering: Generation 3 Discriminating Evidence Repair

## Target And Scope

- Target: append-only generation-3 calibration evidence cycle.
- Scope: research workflow with browser experiments and deterministic replay.
- Current state: generation-3 L0-L3 are complete and independently replayed.

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | Included Scope | Deferred Scope | Exit Evidence | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 Contracts And Feasibility | After this layer, we know whether atomic targets and a source-derived browser run can be represented and executed without touching protected inputs. | Validate exact imports, six targets, negative vectors, runtime gate, and one baseline browser vector. | target/import contracts, browser runtime decision, source manifest, baseline | mutations, adjudication, evaluation | schema/direct parity, runtime receipt, baseline equivalence | proceed only if targets and baseline pass |
| L1 Discriminating Evidence | After this layer, we know whether permitted, breaking, and usefulness consequences are observable and deterministic. | One accepted receipt each for `M3-P`, `M3-B`, and `D`. | browser mutations, structured state, finite planners | adjudication and suite outcome | edit-surface diffs, total observations, deterministic planner result | proceed with supported/refuted/indeterminate evidence unchanged |
| L2 Adjudication And Generation | After this layer, we know whether atomic evidence yields a valid complete or explicitly incomplete F3 projection and total generation-3 outcome. | Freeze 36-cell overlay, project v1 receipt, evaluate, append once. | adjudication, materialization, F3/suite results, generation entry | fresh audit and authority routing | replay equality, total outcome, exact predecessor | accept any outcome; never promote |
| L3 Independent Closeout | After this layer, we know whether the entire chain is reproducible and authority-bounded. | Fresh-process replay plus Inventory read model. | protected-byte audit, provenance, receipts, status closure | new evidence or authority work | exact handles, no source mutation, no authority claim | close or flag; no automatic successor |

## Boundary Heuristic

L0 ends before mutation because browser feasibility and baseline fidelity are a
separate high-value decision. L1 ends before adjudication because observations
must not consume explanation judgments. L2 ends after the irreversible append.
L3 is independent verification and cannot repair L2 evidence.

## Non-Regression Guardrails

- Generations 1/2 and all imported UI-repair evidence remain immutable.
- Atomic target digests cannot change after L0.
- Browser evidence cannot be written before runtime and baseline gates pass.
- Later layers preserve truthful supported/refuted/indeterminate states.
- Evaluation code and decision tables remain unchanged.
- No layer gains DS-D1, DS-D8, pattern, candidate, activation, or promotion authority.

## Recommended Next Layer

- Next layer: none in this work-pack.
- First SWU: none.
- Key result: F3 is `INSUFFICIENT-EVIDENCE`; suite is `CALIBRATION-DEFER`.
- Deferred scope: a new governed `evidence-repair` package, portability corpus
  collection, and every canonical authority decision.
