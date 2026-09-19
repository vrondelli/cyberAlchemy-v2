---
work_pack_id: WP-CDSC2-R1
status: complete
mutation_mode: closed
complexity: medium
output_mode: split
active_layer: closed
next_owner: evidence-repair
next_swu: none
supersedes: WP-CDSC2-001 L2-L3 continuation only
---

# Refreshed Generation-2 L2/L3 Work Pack

## Objective

Complete generation 2 through separately versioned pre-observation,
observation, and adjudication layers, then evaluate a deterministic v1
compatibility projection without rewriting generation 1 or completed
SWU-CDSC2-001 through SWU-CDSC2-004 evidence.

## Authority

This proposed continuation implements user-selected `DEC-CDSC2-009`. It does
not modify the completed L0/L1 work and grants no type, relationship, pattern,
candidate, activation, or promotion authority.

## SWU Manifest

| SWU | Layer | Parent task | Dependencies | State | Owner |
| --- | --- | --- | --- | --- | --- |
| [SWU-CDSC2-005A](work-pack/tasks/TASK-CDSC2-ADJUDICATION-CONTRACT.md) | L2 | TASK-CDSC2-ADJUDICATION-CONTRACT | 003, 004, DEC-CDSC2-009 | complete | local-fallback |
| [SWU-CDSC2-005B](work-pack/tasks/TASK-CDSC2-ADJUDICATION.md) | L2 | TASK-CDSC2-ADJUDICATION | 005A | complete | local-fallback |
| [SWU-CDSC2-006R](work-pack/tasks/TASK-CDSC2-GENERATION-REFRESHED.md) | L2 | TASK-CDSC2-GENERATION-REFRESHED | 005B | complete | local-fallback |
| [SWU-CDSC2-007R](work-pack/tasks/TASK-CDSC2-VERIFY-REFRESHED.md) | L3 | TASK-CDSC2-VERIFY-REFRESHED | 006R | complete | manual |

All refreshed SWUs are complete. No Task Session SWU remains in this work-pack.

## Wave Index

| Wave | Layer | SWUs | Gate |
| --- | --- | --- | --- |
| [W2A](work-pack/waves/W2A.md) | L2 contract | 005A | overlay/materializer contract negatives pass |
| [W2B](work-pack/waves/W2B.md) | L2 adjudication | 005B | overlay and projection freeze deterministically |
| [W2C](work-pack/waves/W2C.md) | L2 successor | 006R | total evaluation and exact append pass |
| [W3](work-pack/waves/W3.md) | L3 audit | 007R | fresh replay and authority audit pass |

## Layer Slices

| Slice | Output | Entry evidence | Exit gate |
| --- | --- | --- | --- |
| completed L0/L1 | protected generation, parity kernel, harness, M1/M2 | SWU001-SWU004 receipts | immutable and still passing |
| L2a | overlay contract, validator, deterministic materializer | DEC-CDSC2-009 and frozen three-layer handles | negative vectors reject every layer collapse |
| L2b | reviewed overlay and v1 compatibility projection | accepted L2a contract | total separate matrices, deterministic bytes, uncertainty retained |
| L2c | F3 result, successor suite, generation-2 index entry | accepted compatibility projection | total outcome, exact predecessor, identical replay |
| L3 | independent replay and authority audit | accepted generation 2 | exact equality and bounded route |

## Recomposition Proof

The parent F3 receipt remains the pre-observation layer. M1/M2 remain the
observation layer. SWU005A supplies only the missing representation bridge;
SWU005B supplies adjudication and compatibility projection; SWU006R reuses the
frozen v1 evaluator and successor wrapper; SWU007R audits the complete chain.
Together they recompose the original generation-2 objective without reopening
experiment execution or interpretation history.

## Global Done Contract

- Parent F3 and every protected generation-1 file remain byte-identical.
- M1/M2 receipts and predictions remain byte-identical.
- The overlay matrix is total over six parent explanations by two separate
  substitutions.
- Compatibility `Q-06`/`Q-07` derive only from parent `S`, never observed text.
- Parent evaluator code and four-outcome table remain unchanged.
- Any partial/disputed judgment remains `indeterminate` and visible.
- Generation 2 appends exactly once after generation 1.
- Same-process and fresh-process replay agree.
- Every SWU returns Task Session and observability receipts.
- No output claims identity, irreducibility, portability, pattern admission,
  DS-D1/DS-D8 authority, activation, or promotion.

## Blockers

No blocker remains inside this work-pack. Residue is explicit: six substitution
coordinates remain indeterminate, F3 is insufficient, and portability and
direct attestation remain unproved.

## Handoff

Closed. The suite's bounded route is `evidence-repair`, but continuation
requires a new governed package. Do not mutate or append this closed chain.
