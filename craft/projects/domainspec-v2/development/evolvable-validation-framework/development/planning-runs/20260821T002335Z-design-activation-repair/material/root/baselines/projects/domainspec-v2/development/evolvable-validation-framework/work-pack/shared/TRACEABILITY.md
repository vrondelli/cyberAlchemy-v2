---
artifact: work-pack-traceability
status: candidate
updatedAt: 2026-07-20
---

# Traceability

| Requirement | Source | Planned artifact | First proof evidence |
| --- | --- | --- | --- |
| graph identity | test-engine IR + findings | normalized graph JSON | graph digest |
| node/edge admission | relationship registry | structural validation result | accepted `enforces` edge |
| obligation derivation | `rules/index.ts` | obligation JSON | deterministic obligation key |
| executable test | `emit/tests.ts` | generated test case | test result |
| binding | missing end-to-end bridge | binding JSON | adapter and fixture digest |
| evaluator | structural checker + planned local evaluator | evaluator JSON | scoped verdict |
| receipt | `residue/receipt.ts` | receipt JSON | replayable input digests |
| composability | removal/non-collapse rule | negative mutation | rejected edge/receipt |
| real-application consumption | accepted `DEC-GCP-002` + versioned IOLM consumer contract | external `SWU-IOLM-DSC-A` | fresh receipt bound to exact EVF handles, unchanged IDs/provenance, semantic/view invariance, parity negatives |
| breadth consumer consumption | BTE core and integrated consumer manifest | external `SWU-IOLM-DSC-B` | distinct fresh 13-kind/16-signature consumer receipt; narrow receipt rejected |
