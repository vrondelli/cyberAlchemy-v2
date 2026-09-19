---
artifact_id: CDSC2-GAPS-v0.1
status: runtime-amended
---

# Gap Ledger

| ID | Gap | Severity | Owner | Repair path | Blocks first SWU? |
| --- | --- | --- | --- | --- | --- |
| `GAP-CDSC2-001` | Direct validator and frozen schema enum parity is not enforced by one generation-2 entrypoint. | acceptance-critical | SWU-CDSC2-001 | implement versioned parity preflight and negative vectors | no |
| `GAP-CDSC2-002` | Successor suite construction with an explicit predecessor is not exposed by the v1 suite evaluator API. | acceptance-critical | SWU-CDSC2-001 | add generation-2 successor wrapper and tests | no |
| `GAP-CDSC2-003` | The isolated harness has not demonstrated baseline fidelity. | expected | SWU-CDSC2-002 | freeze vectors and pass baseline equivalence | no |
| `GAP-CDSC2-004` | M1 screen substitution consequence is unobserved. | expected | SWU-CDSC2-003 | execute permitted mutation protocol | no |
| `GAP-CDSC2-005` | M2 guard bypass consequence is unobserved. | expected | SWU-CDSC2-004 | execute breaking mutation protocol | no |
| `GAP-CDSC2-006` | Harness evidence does not cover visual behavior or full framework execution. | bounded | final audit | retain as explicit non-claim | no |
| `GAP-CDSC2-007` | Portability and Page/Layout pattern replication remain untested. | deferred | later research owner | route only after a non-deferred calibration | no |
| `GAP-CDSC2-008` | The receipt model conflated the immutable pre-observation matrix with post-observation adjudication and could not represent M1/M2 independently at the explanation boundary. | acceptance-critical | SWU-CDSC2-005A | overlay schema, validator, materializer, and 16 negative vectors implemented and accepted | no; closed by 005A |

The first SWU is decision-clear. Any source digest mismatch, baseline-equivalence
failure, or generation-1 byte drift becomes a runtime blocker and must not be
normalized.

Completed SWU001-SWU004 outputs remain accepted. The new gap changes only the
L2 continuation contract; it does not invalidate the frozen harness or mutation
receipts.
