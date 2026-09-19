# EVF portable TLA+/TLC candidate

Scope: add TLC as the fifth portable provider without changing 0.1.0, 0.2.0,
the original research runner, frozen EVF sources, or CRABS.

Closeout frontier: the TLC adapter, config-bound claims, owner workflow,
diagnostic retention and archive are implemented. The final extracted candidate
passed 82 tests and all five provider runs with formal verification. One
earlier intermittent TLC setup failure remains unexplained and is recorded in
VALIDATION.json and the shipped guide. This is a tested evaluation candidate
with reliability residue, not a clean-stability or product-approval claim.
Runnable follow-up construction is investigation of a retained recurrence.
Operational packaging is complete; publication and owner audits stay deferred.

Product construction: the current frontier is a self-contained TLA+ module,
an explicitly bound configuration, a declared safety/temporal property set,
real SANY/TLC execution, and exact native evidence connected to EVF claims.
The preceding product remains an immutable input, not inherited approval.

Prototype definitions and agent navigation: `source` names the model;
`options.configuration` names a checked configuration file; the options list
the exact specification, constants, invariants and at most one temporal
property. Configuration bytes must match that generated contract. A successful
TLC claim means completed model checking for those exact model/configuration
bytes, with the runtime and fingerprint assumptions preserved. It is not an
unbounded theorem, implementation refinement proof, or owner-code audit.

The product prototype is an owner-authored temporal-model audit. Its value is
reproducible, bounded evidence without access to this repository. The neutral
DomainSpec obligation is retained in `obligation.md` and `audit.json`; the
compiled candidate is the exact EVF profile binding requests, model, config,
adapter code and runtime files. The implementation prototype is a new `tlc`
adapter and the smallest changes to package dispatch and claim verification.
No ontology records or authority decisions are dependencies of this work.

Runnable construction: add strict TLC request/output contracts, safety and
temporal examples, raw trace retention, configuration-drift and incomplete-run
tests, and a full five-provider regression run. Complete the exact testable
archive before reporting example product-test results.

Operational support owner: this task, affecting packaging only. Create
`portable-audit-v3/template/`, `assemble.py`, `record_example_claims.py`,
`kit/`, the 0.3.0 archive/checksum, owner docs, and validation record. Reuse the
0.2.0 template into the new directory and preserve the previous archive.
Use installed runtimes and new temporary test directories; no system installs.

Construction blockers: none identified at entry. Unknown or unsupported TLC
outcomes remain not evaluable; unrelated publication does not block testing.

Deferred operations: product approval, commit/push, recipient delivery and
owner-local CRABS audits. No publication, public Arcanum export, deployment,
credential use, or approval is authorized by this construction evidence.
