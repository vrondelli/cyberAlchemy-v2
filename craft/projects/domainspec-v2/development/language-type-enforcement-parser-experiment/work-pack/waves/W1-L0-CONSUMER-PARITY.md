---
module: language-type-enforcement-parser-experiment
wave: W1
layer: L0
status: blocked-by-w0
updatedAt: 2026-07-17
docType: work-pack-wave
---

# W1: L0 Consumer Parity

- Layer question: does the shared discriminator eliminate silent skips and
  produce exact-cause parity without positive drift?
- Entry gate: SWU-LTE-001 receipt pass and fresh overlap preflight.
- Included, serially:
  1. [TASK-LTE-02 / SWU-LTE-002](../tasks/TASK-LTE-02-CONTENT-ADAPTER.md);
  2. [TASK-LTE-03 / SWU-LTE-003](../tasks/TASK-LTE-03-ENGINE-PARITY.md);
  3. [TASK-LTE-VERIFY](../tasks/TASK-LTE-VERIFY.md).
- Parallelization: prohibited because SWU-LTE-003 validates the prior adapter.
- Exit evidence: eight exact code/subject/detail rows across both consumers,
  three-pack positive equality, all declared build/test checks, and residue
  receipt.
- Promotion: evidence answers the L0 continue/pivot/stop question; it does not
  schedule L1 automatically.
