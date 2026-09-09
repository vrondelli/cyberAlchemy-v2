# Shared Solana build tools

This optional repository toolchain builds the Exchange and KEP SBF candidates.
It complements the shared native Rust/C launcher; it does not change global Rust
selection or nested toolchain pins.

```sh
tools/toolchain/run python3 tools/toolchain/solana/bootstrap.py
tools/toolchain/run tools/toolchain/solana/run --version
./cyberalchemy-exchange/run build-sbf
./cyberalchemy-exchange/run check-sbf
```

[lock.json](lock.json) selects cargo-build-sbf 4.3.0 and platform-tools v1.57.
The platform archive is checked against the SHA-256 published by the official
[Anza release](https://github.com/anza-xyz/platform-tools/releases/tag/v1.57).
Cargo installs the exact published builder with its upstream dependency lock;
OpenSSL prerequisites are extracted from pinned Ubuntu archives without running
package scripts. No system packages are installed. The platform compiler lives
in the upstream versioned user cache, with an installation receipt; an existing
unrecognized installation is left untouched. The builder lives under the shared
user toolchain directory. Binaries and downloaded archives stay outside Git.

The wrapper selects the platform compiler only for its child process and disables
rustup override management and automatic tool downloads. SBF compilation uses
Anza's specialized LLVM, while native test execution uses the repository compiler.
The official [builder documentation](https://github.com/anza-xyz/cargo-build-sbf)
describes the SBPF v3 target selected by this candidate.

## Open Questions

Only this Linux x86_64/Ubuntu prerequisite lock is provided. Public deployment,
cluster compatibility and program identities remain owned by the Exchange
[readiness checklist](../../../cyberalchemy-exchange/capabilities/project-purchase/v1/DEVNET-READINESS.md).
