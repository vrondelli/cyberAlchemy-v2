---
module: language-type-enforcement-parser-experiment
wave: W0
layer: L0
status: selected
updatedAt: 2026-07-17
docType: work-pack-wave
---

# W0: L0 Parser Foundation

- Layer question: can a pure, buildable discriminator classify the frozen
  registry grammar with exact accounting and no domain-owner imports?
- Entry gate: design Distill pass; plan Distill pass; SWU-LTE-001 selected;
  write-scope dirty-overlap preflight clean.
- Included: [TASK-LTE-01](../tasks/TASK-LTE-01-REGISTRY-KERNEL.md),
  SWU-LTE-001 only.
- Dependency order: none.
- Parallelization: none; one selected SWU.
- Exit evidence: focused kernel matrix, root/engine typecheck, engine build,
  changed-file list, and Task Session receipt.
- Promotion: W0 pass opens W1; it does not promote beyond L0.
