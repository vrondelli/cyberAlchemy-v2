# Compiled-program settlement harness

This isolated workspace runs the existing settlement suite against SBF artifacts
using Agave 4.2.2. Use `cyberalchemy-exchange/run check-sbf` from the repository root.
Direct execution requires `EXCHANGE_SBF_TEST=1` and `SBF_OUT_DIR`; missing binaries
fail rather than falling back to host processors.

The original native harness uses Agave 3.1.11. Its SBPF verifier rejects the current
compiler's v3 ELF layout with `FailedToParse("invalid file header")`. This workspace
keeps that historical dependency lock separate from the current binary verifier.

The two library declarations point directly at the original purchase and KEP Rust
sources. Their newer dependencies supply host types for constructing instructions
and decoding accounts in the current runtime. They are not new protocol sources
or deployment artifacts. `build-sbf` compiles the original manifests and locks;
the same settlement assertions then exercise those binaries through transactions
encoded by this harness. Agave supplies the compiled P-token 1.0.0 program for the
token program address. Host debug symbols are omitted to bound linker memory use.

## Open Questions

Local all-features-enabled runtime tests do not establish a target cluster's feature
activation state or authorize deployment. Program identities, public operation and
real-money delivery correctness remain in the [readiness checklist](../../DEVNET-READINESS.md).
