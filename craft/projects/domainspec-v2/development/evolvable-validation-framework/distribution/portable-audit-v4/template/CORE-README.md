# EVF executable-only audit workflow

Use `./evf` for every command in this guide. Version 0.4 enforces filesystem
containment around this workflow, including compilation and verification.
The workspace is writable; the kit and permitted runtimes are read-only.
See [CONTAINMENT.md](CONTAINMENT.md) for the exact boundary and limitations.

EVF helps you run a specific audit and preserve evidence of what happened.
You describe the requirement, identify the files and tool that check it, and
declare the expected answers. EVF binds that description to exact file contents,
runs the checks, exercises a deliberately wrong case, repeats the checks, and
asks a separate verifier to check the saved evidence.

This is a runnable **0.4.0 candidate**, not an automatic repository auditor or a
proof that a whole program is correct. It contains no CRABS source or private
audit records. You can use it with your own local checks without access to the
repository where EVF was developed.

## What you need

- Linux x86-64, Python 3.10 or newer, `unshare` from util-linux, and the
  distribution's non-setuid `/usr/bin/bwrap` (Bubblewrap).
- Permission to create Linux user and network namespaces. `doctor` tests this;
  there is no fallback that silently drops isolation.
- The supplied binaries were built on Ubuntu with glibc 2.39. Older Linux
  installations may require a local rebuild. Windows/macOS need a Linux VM;
  Docker or WSL can also restrict namespaces, so check rather than assume.
- A C compiler named `cc` for the included example only. Rust is needed only
  when rebuilding EVF, not when using the supplied binaries.

The kit does not install packages, change system settings, fetch repositories,
or contact an audit service. Run it as an ordinary user.

## Run the included example

First verify the downloaded archive against the separately supplied
`SHA256SUMS`, then extract it and enter `evf-audit-kit-0.4.0`.

```bash
./evf doctor
demo_parent="$(mktemp -d)"
./evf init "$demo_parent/audit"
./evf build-example --workspace "$demo_parent/audit"
profile="$(./evf freeze --workspace "$demo_parent/audit" | python3 -c 'import json,sys; print(json.load(sys.stdin)["profile"])')"
./evf run --workspace "$demo_parent/audit" --profile "$profile" --trust-local-providers
```

`run` prints an absolute `evidence` path. Copy that value into:

```bash
./evf verify --workspace "$demo_parent/audit" --evidence '/absolute/path/printed/by/run/EVIDENCE.json'
```

The example checks ordered insertion for all six permutations of three distinct
integers. Its deliberately broken mode appends values in arrival order; five
of the six cases must be rejected with `ORDER_MISMATCH`. Both modes execute the
actual C program. This is a small finite executable check, not a theorem about
every integer, every program state, memory safety, or CRABS.

The first result should be `status: passed`. The verifier should report
`verdict: passed` and `aggregate_state: passed`. Every run gets a fresh evidence
directory; rerunning does not overwrite the previous result.

## Use it for your own audit

Create a dedicated directory for the audit, or start with another `init` copy.
Build the unchanged example before experimenting with it; `build-example`
deliberately refuses to build modified code. Build your own tool explicitly.

The owner supplies three things:

1. **A requirement and its limit.** Write an `obligation.md` explaining the
   property, assumptions, inputs, bounds, and what a pass cannot establish.
2. **A real check.** Supply a trusted executable, or an interpreter and script,
   that reads the input path passed as a separate `{input}` argument and prints
   one compact JSON object. For example, a C test harness can emit
   `{"outcome":"pass","reason_code":"ORDER_PRESERVED","cases":6,"failed_cases":0}`.
3. **An audit specification.** Edit `audit.json` using the example as a template.
   Do not copy an observed result into the expected answer just to get a pass.
   Derive the expectation from the requirement, independently of the program.

The specification fields map to concrete actions:

| Field | What you provide | What EVF does with it |
| --- | --- | --- |
| `sources`, `obligations` | Requirement files and unique obligation names | Hashes the files and requires every name to have a declared check |
| `bindings` | Code, build records, binaries, and other relevant files | Binds the run to their exact bytes; this is not proof that a compiler implemented the requirement correctly |
| `checks[].executable`, `args`, `tool_files` | Exact executable and its declared dependencies | Runs it with the selected input and restricted environment; checks dependency hashes |
| `checks[].expected` | The complete expected positive JSON object | Requires exact JSON equality, including `outcome: pass` and a reason code |
| `negative_controls` | An intentionally wrong input/mode and its expected rejection | Requires a normal JSON result with `outcome: fail` and the declared reason; crashes and timeouts do not count as detecting the intended defect |
| `claim_ceiling` | Plain-language limits on the conclusion | Records the limit with the evidence; does not strengthen it into a theorem |

Use workspace-relative paths for audit files. An executable or additional tool
may have an explicit absolute path. Declare interpreter scripts and additional
tools in `tool_files`; existing relative file arguments are also pinned.
For installed tools outside the fixed system-support paths, repeat an explicit
`--runtime /absolute/dedicated-installation` grant on the `freeze`, `run` and
`verify` commands. Files named in a specification cannot grant host mounts.
System libraries, compiler correctness, hidden imports, and every possible file
read are **not** automatically discovered or proven. The audit author remains
responsible for declaring sufficient inputs and meaningful checks. Keep the
workspace stable while freezing and running it.

`freeze` creates a content-addressed profile in `.evf-profiles/`. It runs only
an isolation availability probe, not your provider. Review the profile before
using `run`. Changed inputs, scripts, tool binaries, or kit binaries require a
new profile; do not refresh hashes in an old receipt or silently accept drift.
The declared obligation-to-check mapping is an author assertion bound through
the specification, not a semantic proof that the check covers the requirement.

This frontend supports one provider identity per profile, with multiple checks
and negative controls. Each positive check is repeated twice. It uses EVF's
full S0–S12 receipt structure, but early stages bind the owner's supplied
definitions and obligations: they do not invent or independently prove them.

## Which evidence tools are included?

| Evidence kind | Tool in this kit | What is actually supported |
| --- | --- | --- |
| Executable checks | EVF Rust runner plus your trusted executable | Included and tested; the example uses a compiled C harness |
| Saved evidence verification | Separate EVF Rust verifier | Included; checks bindings and receipt consistency without rerunning the provider |
| C bounded model checking | CBMC | Adapter and single-file harness examples included; runtime installed separately |
| Finite relational models | Alloy | Adapter and bounded graph examples included; Alloy/Java installed separately |
| Datalog analysis | Soufflé | Adapter and graph examples included; runtime installed separately |
| Temporal models | TLA+/TLC | Adapter and finite safety/temporal examples included; Java/JAR installed separately |
| Machine-checked theorems | Lean | Adapter and exact checked theorem included; runtime installed separately |

A solver is not interchangeable with a test executable. Use the five typed
integrations described in [FORMAL-GUIDE.md](FORMAL-GUIDE.md) for their supported
claim routes. A custom JSON provider needs its own positive/negative tests and
meaningful tool bindings. This executable lane does not independently establish
a formal theorem. TDE is not included: the owner writes the obligations directly.

## Read the result correctly

| Command and exit code | Meaning |
| --- | --- |
| `run`: 0 | The declared bounded audit passed |
| `run`: 1 | The audit completed with a failed check; inspect its evidence |
| `run`: 2 | Execution was blocked or infrastructure failed; no passing claim |
| `verify`: 0 | The saved evidence is internally valid, including evidence of a failed audit |
| `verify`: 2 | Verification failed or could not be evaluated |

Always inspect `aggregate_state` as well as the verifier's `verdict`.
Valid evidence of a failed check is still a failed audit. A pass never grants
merge, release, deployment, security certification, or acceptance authority.

Profiles bind local absolute tool locations. Moving the kit, rebuilding its
binaries, or changing machines requires freezing a new local profile. Existing
evidence is historical and is not automatically made current on the new host.
Keep the original inputs and tools if you need to verify old receipts.

## Safety and operational limits

`--trust-local-providers` is deliberate acknowledgement that you trust the
provider code. The public launcher confines host file access and the runner adds
its network namespace. Providers may still change the selected writable audit
workspace; containment does not authenticate their output or prevent kernel
exploits. Keep credentials and unrelated code out of the workspace; do not run
EVF as root. See [CONTAINMENT.md](CONTAINMENT.md).

Providers must emit one small JSON object (maximum 4,096 bytes) and terminate
their own descendants. The inherited runner collects pipes after waiting for
the main process: excessive output can cause a timeout, and descendants that
keep pipes open can stall collection. This kit does not claim resource-complete
containment. The 0.4 launcher adds an outer time/output limit and PID namespace,
but no memory/process-count/disk cgroup quotas. Tool installation, source generation, and compilation
are separate owner actions, not something EVF infers permission to perform.

The evidence store is append-only by runner behavior, not immutable storage
against its owner. Hashes detect drift relative to supplied manifests; they are
not signatures and cannot authenticate an attacker-replaced manifest.

## Rebuild or test without the development repository

The archive includes the selected Rust sources, their locked dependencies,
vendored dependency source, Python frontend, schemas, and this example. It
contains neither a Git checkout nor a dependency on one.

The developer-only `build.py` rebuild runs on the host, not through the contained
audit interface. Only use trusted source/toolchains for it. With Rust/Cargo
installed (tested with 1.94.0), run:

```bash
python3 build.py
./evf doctor
python3 tests/test_cli.py
```

`build.py` runs the Rust tests and release build with `--locked --offline`, then
replaces this kit's binaries and regenerates its local file manifest. It does
not install Rust. Vendoring follows the official
[Cargo vendor documentation](https://doc.rust-lang.org/cargo/commands/cargo-vendor.html).
Rebuilding is an explicit new local build, not inherited approval of its bytes.

`SOURCE-PROVENANCE.json` records source hashes and the small export changes.
`BUILD.json` identifies the compiler and platform. `KIT-MANIFEST.json` inventories
the shipped files; `doctor` and every frontend command check their hashes.
For support, share the command, its JSON response, and a redacted specification;
review receipts before sharing, because your own file names and inputs can be
confidential. See `NOTICE.md` for distribution and licensing limits.
