# TDE to EVF L2 hardening candidate

Status: prototype candidate; unapproved
Authority effect: none

L2 preserves the L0 obligation and L1 Souffle/Alloy meanings. It adds one
bounded question: can stale, malformed, missing, timed-out, oversized, drifted,
replayed, tampered, unresolved, or contradictory evidence ever become success?

The evaluator recomputes source, obligation, fact, translation, runtime,
receipt, raw-output, timestamp, and comparison checks. It records every check.
When a prerequisite is missing, dependent checks remain visible as
`NOT_EVALUABLE` with their causal blocker.

## Plan implemented

1. Recheck the exact subject and obligation identity.
2. Recheck each provider receipt and embedded raw output.
3. Recheck freshness and exact runtime/translation bindings.
4. Join only comparable outcomes, without voting.
5. Run the complete deterministic negative-control matrix.
6. Block L2 completion if any degraded control reaches `SUPPORTED_BOUNDED`.

New provider families, TLA+/TLC, Lean, SMT, packaging, scale, approval, and
runtime admission are deferred beyond L2.

## Validate

Construction tests, including synthetic exact-evidence negative controls:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 validate.py
```

Current real-provider evidence and the full matrix:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 validate.py --use-local-runtimes
```

The latter verifies the L1 local runtime hashes before invoking Souffle 2.5 and
Alloy 6.2.0 on Temurin Java 17. A passing result is evidence for this exact
construction candidate only. It grants no product approval, runtime admission,
publication, release, deployment, or external-effect authority.
