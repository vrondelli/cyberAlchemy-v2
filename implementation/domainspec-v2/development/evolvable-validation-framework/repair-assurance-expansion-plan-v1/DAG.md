# Repair Assurance Expansion DAG

Status: L2 complete; Auth Foundation selected for L3 and ready for a fresh
freeze and replay. Task Session excluded.
Authority effect: none.

```mermaid
flowchart TD
  A["A · Preserve baseline and scope"] --> B{"B · Remove obsolete gate"}
  A --> C["C · Freeze L2 contract and controls"]
  B --> D["D · Complete R00–R04"]
  C --> D
  D --> E["E · Complete R05–R08"]
  E --> F["F · Execute 48/48/2"]
  E --> G["G · Run negative controls"]
  F --> H{"H · Compare and explain"}
  G --> H
  A --> R["R · Assign L2 reviewer"]
  H --> I["I · Independent L2 replay"]
  R --> I
  I --> J{"J · L2 promotion decision"}
  J --> K{"K · Select Auth property"}
  K --> L["L · Freeze and evaluate Auth transfer"]
  L --> M["M · Independent Auth replay"]
  M --> N["N · Assemble service candidate"]
  N --> O{"O · Pilot-readiness decision"}
```

All incoming dependencies are required. Diamonds are decision or review gates.
An eligible node does not authorize its effects. Failed, inconclusive and
conflicting outcomes remain evidence and stop success promotion.

The critical dependency chain is A-B-D-E-F/H-I-J-K-L-M-N-O. C, R and G may
be prepared alongside their independent branches only when write scopes do not
overlap and authorization covers any execution.

The product owner selected Auth Foundation as the replacement L3 target on
2026-09-12. The financial-settlement assessment remains deferred evidence until
its real consumer implementation and owner are available; no surrogate consumer
may be substituted. Node L requires a new candidate epoch because two recorded
host-tool identities have drifted since the existing Auth completion evidence.

See [DAG.json](DAG.json) for node exit criteria and blockers, and
[WORK-PACK.md](WORK-PACK.md) for task/SWU mappings.

## Open Questions

See [WORK-PACK.md](WORK-PACK.md#blockers-and-open-questions).
