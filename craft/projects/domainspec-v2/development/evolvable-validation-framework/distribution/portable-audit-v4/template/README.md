# EVF 0.4: audits with filesystem containment

This Linux x86-64 evaluation candidate includes the EVF runner, independent
verifier, and Soufflé, Alloy, CBMC, Lean, and TLA+/TLC adapters.

Use `./evf` for every executable workflow. It creates an isolated filesystem
before any compiler, tool-version probe, audit provider, or verifier runs.
If containment is unavailable, the command stops. There is no unsafe fallback.

## What can an audit access?

- The one audit workspace you selected: readable and writable.
- The package, explicitly selected runtime installations, and listed system
  runtime directories: read-only.
- A private temporary filesystem and private process/device view.
- Other home files, projects, host services/sockets, and the host network:
  not exposed by the launcher.

This protects the host's files outside the permitted paths. It does not make
a malicious tool's results trustworthy, prevent changes inside the writable
workspace, defeat kernel exploits, or prevent resource exhaustion. Use a
dedicated workspace containing only the material needed for the audit.
Do not put credentials in it. Do not run EVF as root.

## Requirements

Linux x86-64 with compatible glibc (the binaries were built with glibc 2.39),
Python 3.10+, util-linux `unshare`, and distribution-installed non-setuid
`/usr/bin/bwrap` (Bubblewrap). User, mount, PID, network, IPC and UTS namespaces
must work. Bubblewrap 0.9.0 is the tested runtime; the CLI checks actual namespace
creation and blocks failures. It does not install software or change host policy.

Java and the formal tools remain separate installations. Their exact releases
and executable/JAR hashes are in `TOOLCHAINS.json`. Follow the installation
notes in [FORMAL-GUIDE.md](FORMAL-GUIDE.md). Keep complete Java and Lean
installations intact. GCC/cc1 are required for the CBMC example.

## Run the five examples

```bash
./evf doctor
./evf formal-init /absolute/new-audit

./evf --runtime /absolute/dedicated-tools formal-tools \
  --workspace /absolute/new-audit --trust-local-tools \
  --souffle /absolute/dedicated-tools/souffle/usr/bin/souffle \
  --alloy /absolute/dedicated-tools/alloy.jar \
  --java /absolute/dedicated-tools/jre/bin/java \
  --cbmc /absolute/dedicated-tools/cbmc/usr/bin/cbmc \
  --lean /absolute/dedicated-tools/lean/bin/lean \
  --tlc /absolute/dedicated-tools/tla2tools-1.7.4.jar --cc /usr/bin/gcc

./evf --runtime /absolute/dedicated-tools formal-run \
  --workspace /absolute/new-audit --tools '.evf-tools/PRINTED-DIGEST.json' \
  --trust-local-providers

./evf --runtime /absolute/dedicated-tools formal-verify \
  --workspace /absolute/new-audit --claims /absolute/PRINTED/FORMAL-CLAIMS.json
```

Replace the illustrative paths. Repeat `--runtime PATH` for separate dedicated
installations or individual JAR files. Every file below a selected runtime
directory is readable by the audit, so never select your home or project tree.
The grant applies only to that command; an audit file cannot add host mounts.
Use the same runtime paths for binding, execution, and current verification.

Each JSON response includes a `containment` launch diagnostic listing the
permitted paths and runtime identity. This is not a signed attestation or a new
formal proof. Native tool results remain scoped to the stated models and bounds.

## Guides and evidence

- [CONTAINMENT.md](CONTAINMENT.md): exact boundary, denial tests, limitations.
- [FORMAL-GUIDE.md](FORMAL-GUIDE.md): what each adapter consumes and checks.
- [TLC-GUIDE.md](TLC-GUIDE.md): safety, fairness, temporal properties and traces.
- [FORMAL-CLAIM.md](FORMAL-CLAIM.md): five supplied mathematical/model claims.
- [CORE-README.md](CORE-README.md): executable-only audit workflow.
- [NOTICE.md](NOTICE.md): evaluation and redistribution boundaries.

`python3 -B check_examples.py` checks the five historical example projections
inherited unchanged from 0.3.0. It does not run tools or establish containment.
Fresh owner-local runs produce their own full EVF evidence. None of the included
examples proves CRABS correct, and this archive does not include surrounding TDE.

One earlier intermittent TLC integration-setup failure remains unresolved. The
failure was closed (no supported TLC claim); later passes did not establish its
cause or repair. Keep this caveat when sharing the evaluation candidate.

To run construction tests with containment:

```bash
python3 -B tests/test_containment.py
python3 -B tests/test_cli.py
./evf contained-test --workspace /absolute/new-audit --suite test_formal.py
./evf contained-test --workspace /absolute/new-audit --suite test_tlc.py
./evf --runtime /absolute/dedicated-tools contained-test \
  --workspace /absolute/new-audit --suite test_formal_live.py \
  --tools '.evf-tools/PRINTED-DIGEST.json'
```

The first two suites are host-side test controllers; they create synthetic
temporary files and launch contained subprocesses. They do not audit a real
repository. Other test suites execute inside the selected boundary. Failed
integration setup diagnostics are retained under the workspace's `.evf-test-tmp/`.
Direct internal Python/provider or Rust-binary invocation is not the supported
contained interface. Python execution paths reject a missing launch context;
the inherited Rust binaries are low-level internals, not standalone sandboxes.
