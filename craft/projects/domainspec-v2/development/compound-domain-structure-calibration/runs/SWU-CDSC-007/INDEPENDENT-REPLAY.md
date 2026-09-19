---
generation: 001
replay_state: identical
process: fresh-node
auditor: task-session-manual
---

# Independent Replay: Generation 1

## Method

A fresh Node process loaded the three frozen evidence receipts, invoked the
accepted fixture evaluator independently for each receipt, then invoked the
suite evaluator with replay state `identical`. Canonical result bytes and all
record/generation handles were compared with the stored generation artifacts.

## Result

| Artifact | Outcome | Stored handle | Comparison |
| --- | --- | --- | --- |
| F1 | `EXPLAINED` | `record:sha256:9bcb2a315e6505cd01ab5f7aff4c37679ac3d0e4dc9f9238915702bb05289b2d` | identical |
| F2 | `EXPLAINED` | `record:sha256:c84b16072ad39c2c00d31b4752d7ffd4edf5d695b615051a2d8fb1ef501e14cb` | identical |
| F3 | `INSUFFICIENT-EVIDENCE` | `record:sha256:9a72141764fb06c6a21d330c0bc1493e4ca9efd7dc54db2e5619e6b6ed747d53` | identical |
| Suite | `CALIBRATION-DEFER` | `record:sha256:27cae41ddaec3618808bae8371726ed740ede4f6c4f012136ecf925c7a8b47e2` | identical |

Generation handle:
`generation:sha256:2ff6a0109e08f188388d580125ab6b185b4ff5f198300cb6bd5db0d9fe31349f`.

## Conclusion

Replay agrees with generation 1. This establishes deterministic treatment of
the frozen inputs only; it does not establish semantic truth, identity,
irreducibility, portability, pattern admission, or promotion.
