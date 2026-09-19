# W2S-L1 - Successor Evidence Producers

Layer question: can selected policies and decisions become independent,
immutable evidence records?

- Tasks: [absence](../tasks/TASK-UIR-ABSENCE.md),
  [dossier policy](../tasks/TASK-UIR-DOSSIER-POLICY.md), and
  [relationship decision](../tasks/TASK-UIR-RELATIONSHIP-DECISION.md).
- SWUs: SWU-UIR-012, 013, and 014.
- Entry: plan/dispatch pass; SWU-012 additionally requires SWU-011.
- Exit evidence: corpus generation 002, dossier-policy generation, relationship
  owner-decision generation, replay, and three Task Session receipts.
- Promotion: SWU-UIR-015 is unlocked only when all three pass.
- Parallelism: eligible only after `domainspec-subagents-strategy` confirmation;
  one disjoint SWU and receipt per worker.
