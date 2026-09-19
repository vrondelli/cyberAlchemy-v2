# Handoff Pack: BTE L0A Repair Through L8

## Strict Coverage

Status: pass for the campaign control surface and the current L0A repair.

Future implementation details are intentionally dynamic. Before each later SWU
executes, Context Builder must produce a strict pack covering its exact
consumed handles, outputs, writes, fixtures, negatives, validation, and stop
conditions.

## Selected Stream

| Field | Value |
| --- | --- |
| Stream ID | `BTE-L0A-REPAIR-THROUGH-L8-ONE-SHOT` |
| Work-pack | `../../WORK-PACK.md` |
| Execution pack | `../../EXECUTION-PACK.md` |
| Dispatch | `../../EXECUTION-DISPATCH.json` |
| Current candidate | `SWU-BTE-L0A-REPAIR-001` |
| Route | L0A repair → L0B → L1 → L2 → L3 → L4 → L5 → L6 → L7A/L7B → L8 |
| One-shot meaning | one autonomous campaign; one SWU per Task Session |

## Coverage Obligations

| ID | Obligation | Status |
| --- | --- | --- |
| `G1` | Record explicit full-stream selection and approval. | covered |
| `G2` | Bind the current frontier and preserve historical evidence. | covered |
| `G3` | Require exact per-SWU instantiation and strict context coverage. | covered |
| `G4` | Constrain each mutation to the current SWU write scope. | covered |
| `G5` | Preserve independent owner, freeze, admission, consumer, and release gates. | covered |
| `G6` | Require terminal receipt, audit, and Invoke Refresh before advancing. | covered |
| `G7` | Name layer verification and terminal BTE completion evidence. | covered |
| `G8` | Stop on ambiguity or failed proof and return an exact unblock action. | covered |
| `G9` | Limit fallback exploration to named gaps and report its effect. | covered |
| `G10` | Keep the native Goal at or below 4,000 characters. | covered |

## Ordered Campaign

| Order | Layer | Task | Entry gate | Goal action |
| ---: | --- | --- | --- | --- |
| 1 | L0A repair | `TASK-BTE-L0-PROOF-PRIMITIVES` | ready after profile activation | select and execute `SWU-BTE-L0A-REPAIR-001` |
| 2 | L0B | `TASK-BTE-L0-PROOF-PRIMITIVES` | current L0A verification plus independent red freeze | instantiate and execute exact semantic-validation SWU |
| 3 | L1 | `TASK-BTE-L1-FORMATION-V2` | L0B ValidationReceipt | instantiate exact formation-v2 SWU(s) |
| 4 | L2 | `TASK-BTE-L2-SUCCESSOR-SOURCES` | L1 receipt | instantiate exact successor-source SWU(s) |
| 5 | L3 | `TASK-BTE-L3-COMPILER-GRAPH` | L2 receipt | instantiate exact build/replay SWU(s) |
| 6 | L4 | `TASK-BTE-L4-CATALOGUES` | L3 handles plus owner admissions | obtain six validation-owner freezes through their owner route |
| 7 | L5 | `TASK-BTE-L5-PROOF-UNIT` | one stage-eligible frozen member | prove one complete obligation-to-replay unit |
| 8 | L6 | `TASK-BTE-L6-CORE` | L5 mechanism plus all freezes/admissions | execute six-catalogue exact breadth |
| 9 | L7A | `TASK-BTE-L7A-IOLM` | exact green L6 core | consumer-owned IOLM run plus BTE replay |
| 10 | L7B | `TASK-BTE-L7B-BODY-WAR` | same exact green L6 core | consumer-owned Body War run plus BTE replay |
| 11 | L8 | `TASK-BTE-L8-AGGREGATES` | both fresh L7 replays | consumer and terminal exact aggregates |

No predetermined SWU count is asserted after L0. Invoke must distill each layer
into the smallest coherent executable units once exact handles exist.

## Current Frontier

`SWU-BTE-L0A-REPAIR-001` may append one LF to exactly eight mismatching contract
schemas and `validation/diagnostics.ts`, plus emit one append-only Task Session
receipt. It may not change the matching ninth schema, historical receipts,
validation inputs, semantic validators, planning/Craft/read models during the
Task Session, UI, public Arcanum, or later layers.

## Gate Rules

- Pack-first: profile, handoff pack, index, approval, then current SWU pack.
- Exactly one selected current candidate and one Task Session at a time.
- A predecessor `pass` is not sufficient without its exact terminal receipt and
  independent audit.
- Invoke Refresh owns frontier reconciliation and later SWU instantiation.
- Independent owners keep their freeze, admission, and consumer authority.
- Counts and producer status are diagnostic; exact handles and replay prove.
- Passing BTE evidence remains non-admitting.

## Stop Rule

Stop rather than widen when a candidate, handle, owner, scope, fixture,
negative, write path, validation surface, audit verdict, or next route is not
exact. Return the evidence inspected, completed receipts, exact unblock action,
and whether earlier layers remain valid.
