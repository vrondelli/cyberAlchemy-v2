# EVF — runnable audit kit

EVF (Evolvable Validation Framework) runs explicitly defined audit checks and
preserves evidence that a separate verifier can inspect. This package lets an
audit author use it without the development repository or its private fixtures.

## Download and start

Download these two files from this branch into the same directory. On GitHub,
open each file and use **Download raw file**; do not save the HTML preview.

- [Linux x86-64 kit, approximately 9 MB](artifacts/evf-audit-kit-0.1.0-linux-x86_64.tar.gz)
- [SHA256SUMS](artifacts/SHA256SUMS)

```bash
sha256sum -c SHA256SUMS
tar -xzf evf-audit-kit-0.1.0-linux-x86_64.tar.gz
cd evf-audit-kit-0.1.0
./evf doctor
```

Follow the included `README.md` to create the example workspace, build its small
C check, freeze an audit profile, run it, and independently verify the evidence.
The same [owner's guide is readable here](template/README.md).

You need Linux x86-64, Python 3.10 or newer, and working Linux user/network
namespaces. The supplied binaries were built with glibc 2.39. The example needs
`cc`; rebuilding EVF needs Rust/Cargo, but running its supplied binaries does not.

## What is included and what is not

Included: EVF's Rust runner, its separate verifier, an owner-facing command-line
interface, a real C example, schemas, exact file manifests, and vendored sources
for offline rebuilding. An owner supplies their own requirements, executable
checks, expected answers, and deliberately wrong cases.

This candidate supports executable checks. CBMC, Alloy, Soufflé, TLA+/TLC, and
Lean adapters are not bundled. It is not an automatic whole-repository audit,
a whole-program proof, or a sandbox for hostile code. Providers have the user's
filesystem permissions even though their network access is disabled.

## Validation

The exact downloadable archive passed extraction and execution tests outside
the development repository. All 8 Rust contract tests and all 14 CLI integration
tests passed; the integration tests passed with both the supplied binaries and
a local rebuild made with an initially empty Cargo cache and network disabled.
See [the archive-bound validation record](VALIDATION.json). This is one-host
Linux test evidence, not a claim that every operating system was tested.

The archive SHA-256 is:

```text
e13b7436bdca93ff9028bce90453f6f61f5994aef1f72bcef80db3600cfeeb5e
```

The validation record's `published: false` describes its creation-time state;
publishing these files does not retroactively change that historical receipt or
grant product approval, deployment authority, or an open-source license.
See the [evaluation notice](template/NOTICE.md).

This branch is in a private repository. Publishing here does not grant another
person access; they need existing repository permission or a separately
authorized delivery of the standalone archive. No CRABS source, owner data,
or private audit records are included in the archive.
