# Mappings: OEW Thin Prototype

## AdmittedInputSet

**From:** repository paths and predecessor receipts  
**To:** one exact temporary build and browser run

| Source | Runtime target | Transform | Failure |
| --- | --- | --- | --- |
| pinned Understand-Anything archive | temporary workspace root | verified extraction | missing/digest/path mismatch blocks |
| OEW overlay | dashboard `src/oew` | exact allowlisted copy | extra/missing/drifted file blocks |
| entry patch | dashboard `App.tsx` | apply exactly once | preimage or reapply mismatch blocks |
| adapter graph/sidecar/receipt | `/oew-data/*` | immutable byte mapping | identity or digest mismatch blocks |
| Poker-Team fixture refs | visible graph/inspector | existing adapter projection | unknown or non-total mapping blocks |

## BrowserReceiptProjection

Browser observations are projected into a deterministic JSON receipt. The
projection preserves exact assertions and environment bindings but does not
upgrade them to ontology correctness, product acceptance, release, or
production evidence.
