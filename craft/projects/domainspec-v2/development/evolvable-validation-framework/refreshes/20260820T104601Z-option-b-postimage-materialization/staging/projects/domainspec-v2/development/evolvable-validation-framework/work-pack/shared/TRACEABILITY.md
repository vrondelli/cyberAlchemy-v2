---
artifact: work-pack-traceability
status: candidate
updatedAt: 2026-08-20
---

# Traceability

| Requirement | Source | Planned artifact | First proof evidence |
| --- | --- | --- | --- |
| graph identity | test-engine IR + findings | normalized graph JSON | graph digest |
| node/edge admission | relationship registry | structural validation result | accepted `enforces` edge |
| semantic expectation | selected machine predicate `evf.key-door.has-key.v1` | closed typed equality AST | expected true/false vector from fixture vars |
| fixture input | expected-free two-case fixture | independent evaluator and runtime call arguments | no embedded oracle/result |
| obligation derivation | raw edge + `rules/index.ts` | O_gen obligation JSON | exact equality with validation-owned O_spec, cardinality one |
| binding | exact selected binding contract | one fresh binding JSON | all source/graph/predicate/input/runtime/O_spec digests joined |
| executable test | strict `emit/tests.ts` mode | one generated test ID | two ordered calls, one aggregate assertion, one child-result ID |
| evaluator | typed predicate evaluator + guarded runtime projection | expected/observed vectors | independent deep equality |
| receipt | selected receipt schema + raw replay | sixteen negative and one positive receipt | replayable input digests, tamper/omission rejection |
| composability | failure matrix and sixteen mutants | typed negative receipts | 16/16 killed at earliest valid boundary |
| closeout | `CLOSEOUT-CONTRACT.md` | E -> P -> O -> T | exact joins and `successor_executed:false` |
| real-application consumption | accepted `DEC-GCP-002` + versioned IOLM consumer contract | external `SWU-IOLM-DSC-A` | fresh receipt bound to exact EVF handles, unchanged IDs/provenance, semantic/view invariance, parity negatives |
| breadth consumer consumption | BTE core and integrated consumer manifest | external `SWU-IOLM-DSC-B` | distinct fresh 13-kind/16-signature consumer receipt; narrow receipt rejected |
