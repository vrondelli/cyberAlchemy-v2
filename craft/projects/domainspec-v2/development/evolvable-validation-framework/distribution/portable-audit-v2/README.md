# Portable EVF with formal adapters

The deliverable is [EVF audit kit 0.2.0](artifacts/evf-audit-kit-0.2.0-linux-x86_64.tar.gz).
Its checksum is in [SHA256SUMS](artifacts/SHA256SUMS). This is a Linux x86-64
evaluation candidate, not an approved product or a CRABS correctness certificate.

The archive includes runnable Soufflé, Alloy, CBMC, and Lean adapters, EVF's
runner and separate verifier, positive and negative examples, four checked
example claims, and a plain-language explanation of their exact scope.
Third-party runtimes are separate prerequisites; versions, hashes, release
links, and setup commands are included.

After extraction, start with `README.md` and `FORMAL-CLAIM.md`.
`python3 check_examples.py` checks the shipped historical evidence without
installing solvers. `formal-run` creates fresh owner-local evidence after
the exact tools are installed and bound.

The Lean example proves that sorting any two natural numbers gives the same
pair regardless of input order, under its recorded assumptions. CBMC checks
a related C harness. Soufflé and Alloy check the supplied three-node graph.
These are separate claims; none proves CRABS's implementation correct.

## Validation and publication state

See [VALIDATION.json](VALIDATION.json) for the exact archive-bound results.
The extracted archive was checked outside the repository using copied tool
installations: 14 original CLI tests, 28 adapter contract tests, 8 real-tool
integration tests, all four formal example runs, and formal verification passed.
This validates those examples and package workflows, not arbitrary owner code.

The previous 0.1.0 archive and frozen EVF source candidate were preserved.
The validation report records the state at build time, before commit or push;
its publication fields are historical, not a live branch-status check.
This candidate is included as the reproducible build dependency for
[the 0.3.0 TLC package](../portable-audit-v3/README.md). Branch publication does
not establish recipient delivery or repository access. Any owner audit runs
on the owner's machine and requires the owner's relevant source files.

## Reproduce the package construction

`template/` contains the authored extension sources. `assemble.py prepare`
layers them onto the immutable 0.1.0 archive and refuses an existing `kit/`
directory. It does not replace an existing candidate.

Run the kit tests and real formal examples using the included guide. Then
export the exact supplied example claims from a verified run:

```bash
python3 -B record_example_claims.py --workspace /absolute/example-workspace \
  --claims /absolute/example-workspace/.evf-formal/run-ID/FORMAL-CLAIMS.json
python3 -B kit/check_examples.py
python3 -B assemble.py archive
```

The exporter checks the real EVF evidence and accepts only the shipped example
bytes. It preserves native stdout/stderr and tool artifacts, but replaces
producer executable paths with symbolic names. The resulting files explicitly
identify themselves as portable evidence projections, not original EVF receipts.
The archive step rechecks these claims, hashes, and private-locator exclusions,
and refuses to overwrite an existing archive.

Full owner-local receipts stay in the audit workspace. Tool/library trust,
unsigned provenance, non-hermetic execution, and lack of hostile-code
filesystem isolation remain explicit limitations.
