# Traceability

| Evidence/contract | Execution owner | Planned proof |
|---|---|---|
| `EGI-006` + current four-violation audit | SGRM-006/007 retry | exact dispositions, zero violations, seeded active failure, digest-drift failure |
| `EGI-001`, `EGI-002`, `EGI-005`, `EGI-020` | FPR-01 | census, source dispositions, deterministic drift scan, ratification, mutants |
| `EGI-003`, `EGI-007`, `EGI-008`, `EGI-012` | FPR-02B | exact backend admitted/exercised profile and fail-closed negative matrix |
| required UI profile design and `SWU-UIP-*` receipts | FPR-02U | development mechanics, graph integration, owner packet, and independent audit |
| `EGI-004` | FPR-03 / `FR-FPR-ONTOLOGY-DIRECTION` | accepted direction/precedence decision and total B-to-Spec map |
| `EGI-009`, `EGI-002`, `EGI-008`, `EGI-010`, `EGI-011` | FPR-04 | exact source, tiny Sg, explicit quotient, separate comparator and mutants |

## Artifact Chain

```text
REFERENCE-DISPOSITION.json
  -> ZERO-ACTIVE-RETIRED-ORCHESTRATION-REPORT.json
  -> authority-baseline.yml + authority-baseline-ratification.json
  -> FPR-02 lane contract
       |-> backend product-contract.yml + supported-profile.yml + profile-digest.json
       `-> UI development receipts + authority packet
  -> ontology-spec-direction.md + business graphs + b-s-map.json
  -> spec-source-manifest.json + spec-graph.json + compiler-ir.json
  -> semantic-manifest.json + independent verification receipt
```

Each arrow is receipt-gated. It is not merely a file-existence dependency.
