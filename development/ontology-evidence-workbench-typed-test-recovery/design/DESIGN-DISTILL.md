# Design Distill Validation

- Mode: validate.
- Verdict: pass.
- Smallest coherent design unit: producer-local failure preservation plus a
  non-selecting handoff for the independent compatibility decision.
- Split pressure: implementation SWUs must separate pure sanitization, writer,
  builder integration, terminal admission/reference, and closure validation.
- Recomposition: each unit feeds the one recovery boundary described by
  `ARCHITECTURE.md`; none independently claims SWU006 completion.
- Deferred: public Task Session maintenance, Inventory repair, retry/network,
  generalized build, browser acceptance, release.
