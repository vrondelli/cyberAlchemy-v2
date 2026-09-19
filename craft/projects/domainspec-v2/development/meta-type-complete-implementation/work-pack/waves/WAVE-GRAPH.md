# Wave Graph

```mermaid
flowchart LR
    A[MTCI-001 candidate] --> B[MTCI-002 owner gate]
    B --> C[MTCI-003 canonical assets]
    C --> D[MTCI-004 reciprocal ontology]
    D --> E[MTCI-005 design closure]
    E --> F[MTCI-006 observation contract]
    F --> G[MTCI-007 TypeScript trust lane]
    G --> H[MTCI-008 Python]
    G --> I[MTCI-009 Rust]
    H --> J[MTCI-010 parity]
    I --> J
    J --> K{runtime required?}
    K -- yes --> L[MTCI-011 runtime]
    K -- no --> M[MTCI-012 closeout]
    L --> M
```

MTCI-008 and MTCI-009 are the only planned parallel wave. Execution requires a validated dispatch, exact user confirmation, registration, native spawn/join/close, and all-lane receipts. Until then, the route remains planned.

