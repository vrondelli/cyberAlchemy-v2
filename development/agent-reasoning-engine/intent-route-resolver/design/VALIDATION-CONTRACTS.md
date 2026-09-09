# Validation contracts

| ID | Target | Positive/negative contract |
|---|---|---|
| IRR-V01 | request validator | accept exact JSON-only v1; reject missing raw intent, bad posture, unknown version, non-JSON/runtime-native values |
| IRR-V02 | catalog validator | accept finite acyclic catalog; reject digest mismatch, duplicate/missing IDs, cycles |
| IRR-V03 | eligibility | exclusions precede predicates; unresolved material fields stay conditional |
| IRR-V04 | dominance | explicit acyclic dominance only; permutation invariant |
| IRR-V05 | disposition | exhaustive `candidate/ambiguous/no-match/invalid` cases |
| IRR-V06 | clarification | exactly one stable question; no multiple-question payload |
| IRR-V07 | receipt | byte-identical replay and digest verification |
| IRR-V08 | authority | zero imported dispatch/orchestration modules and zero external calls |
| IRR-V09 | JSON runtime port | typed parse/version/shape failures; identical canonical response in Node and Chromium |
| IRR-V10 | selected-local mapper | preserve raw intent/posture/evidence/digest; missing selector becomes unresolved |
| IRR-V11 | add-on boundary | explicit entry points, supported protocols, zero permissions, no runtime SDK imports |

Passing implementation evidence must be generated after Plan by the selected
Task Session. These contracts are not current execution evidence.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
