# EVF 0.3.0: TLA+/TLC included

Download the [0.3.0 audit kit](artifacts/evf-audit-kit-0.3.0-linux-x86_64.tar.gz)
and check [SHA256SUMS](artifacts/SHA256SUMS).

This candidate adds TLA+/TLC to the existing Soufflé, Alloy, CBMC and Lean
adapters. It includes actual example claims, portable native-evidence
projections, negative cases, and plain-language instructions.

After extraction, open `TLC-GUIDE.md` for the TLC-only workflow or `README.md`
for all five providers. The owner can supply their model and configuration and
run an audit locally without access to this repository.

## What changed

The earlier research tooling already ran SANY/TLC and retained text receipts.
The 0.2.0 packaging explanation missed that distinction. This version supplies
the portable EVF integration: model/configuration byte bindings, exact runtime
selection, completed safety and temporal checks, native counterexample traces,
positive/negative replay, and independently verified EVF receipts.

The example checks that a counter with limit 2 stays within 0..2 and eventually
reaches 2 under weak fairness. Removing fairness gives a real temporal
counterexample. This is a finite-model result, not a universal theorem or a
CRABS correctness certificate.

TLA+ tools 1.7.4 (including TLC 2.19 and SANY) and the pinned Java runtime remain
separate prerequisites. The archive includes their exact binding contract and
download/setup instructions; it does not embed third-party runtimes.

## Evidence and boundaries

See [VALIDATION.json](VALIDATION.json) for exact archive-bound test outcomes.
One concurrent integration setup had a TLC failure whose native logs were
deleted by the inherited test cleanup. Its cause remains unresolved despite
passing later checks. The harness now preserves failed setup evidence, and
the TLC guide carries this evaluation caveat. This is not a clean-stability
or production-readiness claim.
The 0.1.0 and 0.2.0 archives, original research runner, and frozen EVF sources
were not changed. No CRABS source was edited or audited.

This remains an evaluation candidate. The validation report records the state
at build time, before commit or push; its publication fields are historical,
not a live branch-status check. Publication to the existing
`codex/fresh-master-20260905` branch shares the package for evaluation. It does
not establish product approval, recipient delivery, repository access, or a
completed owner audit.

## Rebuilding this extension

`template/` contains the authored files. `assemble.py prepare` starts from
the immutable 0.2.0 archive, omits its historical claim projections, applies
these templates, and regenerates the integrity manifest. It refuses an
existing kit directory.

Run the tests and real examples using the included guides. Then:

```bash
python3 -B record_example_claims.py --workspace /absolute/example-workspace \
  --claims /absolute/path/to/FORMAL-CLAIMS.json
python3 -B kit/check_examples.py
python3 -B assemble.py archive
```

The exporter accepts only the exact supplied example model, configuration and
request bytes after full EVF verification. Its projections preserve native
tool output while replacing producer tool paths with symbolic names. They
are explicitly historical snapshots, not original receipts or current owner
evidence. A fresh owner run creates its own full receipts.

Archive construction rechecks input digests, projected claims and private
locator exclusions, and refuses to replace an existing archive. Runtime
library trust, TLC fingerprint collision risk, lack of hostile-code filesystem
isolation, and source-to-model correspondence remain explicit limitations.
