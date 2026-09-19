# Invoke Refresh: W2 local-fallback proposal

This continuation-authored Refresh is complete in `proposal-only` mode. It
does not apply the amendment and does not select or execute a language lane.

## Evidence

- TS004 is current and its frozen observation contract is present.
- Python and Rust product and receipt roots are absent.
- CPython 3.12.3 is available without third-party test/type tools.
- Cargo 1.94.1, rustc 1.94.1, and rustfmt 1.8.0 are available.
- The DomainSpec registrar still reserves `dispatch_type: code`; the experiment
  owner explicitly cannot run code.

## Proposed route

Replace only the unavailable W2 execution mechanism:

1. apply the exact three-file Work Pack amendment;
2. select and execute Python through one local-fallback Task Session;
3. synchronize its terminal receipt through Invoke Refresh;
4. select and execute Rust through a second local-fallback Task Session;
5. join both current receipts at parity.

Python and Rust remain semantically independent. Rust's later scheduling does
not permit it to consume Python artifacts, findings, or expectations.

## Boundaries

No live target, product code, receipt, active ledger, Git state, public
artifact, ontology authority, promotion state, deployment, or release was
changed. Apply authorization and downstream Task Session evidence remain open.
