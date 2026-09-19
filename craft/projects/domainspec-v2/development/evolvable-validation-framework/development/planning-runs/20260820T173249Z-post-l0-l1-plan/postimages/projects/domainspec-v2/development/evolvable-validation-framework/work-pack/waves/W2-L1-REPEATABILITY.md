---
wave: W2-L1-REPEATABILITY
status: blocked-on-plan-review-and-apply
layer: L1
---

# Wave W2: L1 Repeatability

## Purpose

Execute two serialized, independently closable Rule proofs over one frozen
Financial Settlement source/graph handle.

## Order

1. `SWU-GCP-002-P4` performs additive source/graph reconciliation and strict P4.
2. Its closeout returns a cursor and may expose `SWU-GCP-003-R4`.
3. A fresh Task Session runs R4 with zero graph/source mutation.
4. Independent composite verification joins the two receipts without voting or
   claim strengthening.

## Entry Gate

Exact postimages independently reviewed, explicitly owner accepted, applied by
an authorized Invoke Refresh, and admitted by Work Pack Readiness and
Implementation Readiness. Until then the execution entry is blocked.

## Exit Gate

Two distinct Rule/edge/obligation/binding/test/receipt identities, identical
frozen graph/source digests, all declared mutations killed, zero hidden residue,
and one composite receipt whose ceiling is candidate-local L1 repeatability only.

## Prohibited Expansion

No parallel run, graph-only closure, P4 converse, R5, P3 effect, full settlement,
C0 implementation, provider execution, promotion, release, or production claim.
