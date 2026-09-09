# TASK-OCGP-VERIFY-001 — Read-Only Prototype Closure

Layer: closure  
Status: planned; all runtime receipts absent  
SWU exemption: read-only closeout verification; no source or Plan mutation

## Purpose

Verify that the nine completed units recompose into the approved L0–L2
candidate prototype without silently granting L3, product, semantic, or
promotion claims.

## Entry Gate

- all nine terminal receipts independently validate;
- all nine Invoke Refresh owner receipts exist and match their preflight
  baselines;
- no successor is selected;
- Poker Team and every protected selector remain unchanged.

## Read-Only Verification

1. run the full Node test suite;
2. verify each terminal receipt with the independent verifier;
3. execute two fresh O13 runs in temporary roots;
4. compare canonical result and projection bodies byte-for-byte;
5. assert exact lineage `F1 → R1 → D1`;
6. assert `D2` remains visible and excluded;
7. assert the separate `specializes` case is indeterminate;
8. verify protected input digests and denied-write evidence;
9. check every capability-honesty axis.

No repository file may be changed. If a durable closure receipt is desired,
route it through a separately approved Invoke Refresh; this task itself returns
the review result to the caller only.

## Pass Result

Allowed wording:

> The private L0–L2 finite ontology-oriented candidate-graph prototype is
> reproducible for the pinned policy and fixtures, including the synthetic
> Poker Team O13 witness.

Forbidden wording includes canonical ontology, semantic truth, Poker Team
acceptance, promotion, publication, production readiness, security, or general
ontology support.

## Failure

Any missing, stale, conflicting, non-deterministic, or authority-inflating
evidence yields `blocked` or `fail`; no partial green count establishes
closure.
