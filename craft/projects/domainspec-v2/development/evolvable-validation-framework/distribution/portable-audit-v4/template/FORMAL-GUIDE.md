# EVF — executable checks, formal adapters, and bounded claims

This **0.4.0 evaluation candidate** includes runnable adapters for Soufflé,
Alloy, CBMC, Lean, and TLA+/TLC, as well as EVF's executable runner and separate verifier.
The adapter source is in `adapters/`; you do not have to write a JSON wrapper
before using these five integrations.

EVF (Evolvable Validation Framework) connects a stated requirement, exact source
files, real tool execution, deliberately wrong cases, and a checked claim.
It does not infer a whole-program proof from several smaller passes.

The package also includes five historical checked example claims, their native
evidence projections, and a plain-language [explanation of their scope](FORMAL-CLAIM.md).
Run `python3 check_examples.py` to inspect that historical snapshot without
installing the solvers. This is not a fresh owner audit or a CRABS proof.

## What each adapter consumes and establishes

| Tool | Input created by the audit author | What the adapter runs | Supported conclusion |
| --- | --- | --- | --- |
| Soufflé 2.5 | A closed-world graph and required reachability endpoints | Generates Datalog and tab-separated facts; evaluates `Violation.csv` | The required paths exist in that exact graph |
| Alloy 6.2.0 / Java 17.0.19+10 | The same kind of graph obligation | Generates an exact-node Alloy assertion; runs Sat4j and checks its command/scope/solution records | No counterexample within that exact generated scope |
| CBMC 6.11.0 | A self-contained C harness, assertion descriptions, entry function, and unwind bound | Runs JSON-mode bounded checking with unsigned 32-bit target data model, safety checks, and unwinding assertions | The declared assertions passed for that harness and configuration |
| Lean 4.33.1 | One self-contained proof module, qualified theorem name, exact expected theorem type, and allowed axioms | Typechecks the proof, checks that its theorem has the expected type, and inspects transitive axiom dependencies | That exact mathematical theorem was checked under the recorded assumptions |
| TLA+ tools 1.7.4 / TLC 2.19 / Java 17.0.19+10 | One self-contained TLA+ module, exact configuration, constants, invariants, and at most one temporal property | Runs SANY inside TLC, completes breadth-first model checking, checks temporal completion, and retains counterexample traces | TLC found no violation for those exact model/configuration bytes, under its recorded runtime and fingerprint assumptions |

TDE (Test Derivation Engine) supplies the requirement and neutral obligation
in the larger workflow; EVF selects and runs the evidence tool. This standalone
kit lets the owner author those requirement/request files directly. It does not
include the surrounding TDE product or require access to its repository.

These tools are complementary, not interchangeable. Soufflé and Alloy can check
the same finite graph. The C harness and Lean model can describe a related
algorithm, but this kit does **not** contain a verified C-to-Lean refinement
bridge. Their claims remain separate. TLC checks behavior over time; Lean
checks mathematical theorems. For the dedicated TLC setup and limitations,
see [TLC-GUIDE.md](TLC-GUIDE.md).

## Requirements and tool setup

Use Linux x86-64, Python 3.10+, util-linux `unshare`, distribution Bubblewrap,
and an ordinary user account
that can create user and network namespaces. The EVF binaries were built with
glibc 2.39. Rust is unnecessary for running them; it is needed for rebuilding.

The **adapter code and examples are included**. The large third-party solver,
Lean, and Java installations are **not embedded** in this small archive. Install
or extract their official releases into your own tools directory, keeping each
installation intact. Do not copy only the Lean or Java launcher out of its
installation. Exact release links and executable/JAR hashes are in
`TOOLCHAINS.json`:

- [Soufflé 2.5, Ubuntu 24.04 x86-64 release](https://github.com/souffle-lang/souffle/releases/tag/2.5)
- [Alloy 6.2.0 distribution JAR](https://github.com/AlloyTools/org.alloytools.alloy/releases/tag/v6.2.0)
- [Temurin Java 17.0.19+10 Linux x64 JRE](https://github.com/adoptium/temurin17-binaries/releases/tag/jdk-17.0.19%2B10)
- [CBMC 6.11.0 Ubuntu 24.04 package](https://github.com/diffblue/cbmc/releases/tag/cbmc-6.11.0)
- [Lean 4.33.1 Linux x86-64 distribution](https://github.com/leanprover/lean4/releases/tag/v4.33.1)
- [TLA+ tools 1.7.4, containing TLC 2.19 and SANY](https://github.com/tlaplus/tlaplus/releases/tag/v1.7.4)

For the Ubuntu `.deb` files, `dpkg-deb -x downloaded.deb new-directory` extracts
without installing system-wide. Native library prerequisites still belong to
the host. CBMC uses the explicitly supplied GCC executable and its `cc1`
support executable. No command in this kit installs packages, changes system
settings, downloads tools, or silently substitutes another tool version.

The catalog binds tool executable/JAR bytes, not every standard-library or
dynamic-library dependency. Claims explicitly assume an intact, trusted tool
installation and OS. This is not a hermetic toolchain or a compiler-correctness
proof. Do not strip that assumption when presenting a result.

## Run all five real examples

From the extracted kit directory:

```bash
./evf doctor
demo_parent="$(mktemp -d)"
./evf formal-init "$demo_parent/audit"
```

Bind your actual installed tool paths (replace the illustrative paths below):

```bash
./evf --runtime /your/tools formal-tools --workspace "$demo_parent/audit" --trust-local-tools \
  --souffle /your/tools/souffle/usr/bin/souffle \
  --alloy /your/tools/org.alloytools.alloy.dist-6.2.0.jar \
  --java /your/tools/jre/bin/java \
  --cbmc /your/tools/cbmc/usr/bin/cbmc \
  --lean /your/tools/lean/bin/lean \
  --cc /usr/bin/gcc --tlc /your/tools/tla2tools-1.7.4.jar
```

This prints a workspace-relative `tools` manifest path. Use that value next:

```bash
./evf --runtime /your/tools formal-run --workspace "$demo_parent/audit" \
  --tools '.evf-tools/PRINTED-DIGEST.json' --trust-local-providers
```

The command runs a separate full EVF profile for each claim: two positive
executions, two executions of the deliberate negative, and the independent EVF verifier. It then
reparses saved native tool evidence before issuing supported FormalClaim records.
The Lean profile uses EVF's `theorem` route; the model-checking profiles remain
bounded executable evidence, not unbounded theorems.

Finally use the printed `formal_claims` path:

```bash
./evf --runtime /your/tools formal-verify --workspace "$demo_parent/audit" \
  --claims '/absolute/path/printed/by/formal-run/FORMAL-CLAIMS.json'
```

`formal-verify` does not rerun the providers. It verifies exact file bindings,
the independent EVF receipts, native output classifications, positive/negative
invocation counts, and the claim contents. A changed input, missing record,
weaker bound, wrong theorem type, extra axiom, or stronger substituted claim
must not produce a supported result. Exit 0 means all declared claims were
supported/verified; exit 2 means not established or not evaluable. Inspect the
JSON response and retained run directory for the cause.

## The actual Lean theorem

The included mathematical definition and theorem are:

```lean
def canonicalPair (a b : Nat) : Nat × Nat := (min a b, max a b)
theorem canonicalPair_comm (a b : Nat) :
    canonicalPair a b = canonicalPair b a := by
  apply Prod.ext
  · exact Nat.min_comm a b
  · exact Nat.max_comm a b
```

In plain language: **for every pair of natural numbers, the ascending pair is
the same whichever number arrives first**. The definition is part of the
theorem's scope. Its checked proof depends on the standard logical axiom
`propext` (propositional extensionality); that dependency is explicitly allowed
and recorded, not described as an axiom-free proof. This is stronger than trying a few example numbers, but it
says nothing by itself about CRABS's storage, merge algorithm, concurrent moves,
deletions, or memory management.

The C example expresses the related property for two nondeterministic unsigned
32-bit inputs. CBMC checks its real assertion. We do not combine those two
results into “the C implementation is proven by Lean.” The graph examples are
a different property and remain separate claims too.

The fifth claim concerns a finite TLA+ counter with Max = 2. TLC checks that
it stays within 0..2 and eventually reaches 2 under weak fairness. The negative
removes fairness and produces a stuttering trace refuting eventual progress.
That result remains scoped to this model/configuration, not every parameter
value or a real implementation. See [the claim explanation](FORMAL-CLAIM.md).

## Create your own audit

Edit the copied `audit.json`, the requirement document, and the provider request
files. Each claim needs a positive request, a deliberately wrong request for
the same provider, plain-language assumptions, and explicit limits. You can
remove example claims you do not need and bind only the tools you intend to use.

Graph requests accept up to 64 uniquely named nodes, declared directed edges,
required sources, and one target. IDs cannot contain generated-code syntax.
CBMC requests accept one self-contained C source, an entry function, a positive
unwind bound, and the complete set of user assertion descriptions. Preprocessor
directive tokens are conservatively rejected, even inside comments or strings.
Includes and additional source files require a future dependency contract, not ambient
discovery. Lean requests accept a single module plus its standard prelude;
external imports, added axioms, proof placeholders, `unsafe`, and compiler-trusted
`native_decide` proofs are outside this adapter's contract.

Lean checks both the theorem's exact expected type and its transitive axioms;
this avoids accepting an unrelated theorem merely because its name exists.
See [Lean's axiom-audit documentation](https://lean-lang.org/doc/reference/latest/Axioms/).
CBMC checks its final status and every returned property, requires the declared
assertion denominator, and treats safety/unwinding failures as not established.
See [CBMC's explanation of unwind assertions](https://www.cprover.org/cprover-manual/cbmc/unwinding/).
The graph adapter uses ordinary transitive closure over fixed facts, following
[Soufflé's documented semantics](https://souffle-lang.github.io/tutorial).

The audit author still owns the source-to-requirement correspondence. A
vacuous assumption or a wrong mathematical model cannot be repaired by a tool
exit code. Human descriptions are recorded as author descriptions; the checked
machine property and source hashes are recorded separately in every claim.

## Safety, portability, and evidence sharing

Use the mandatory `./evf` entry point. Version 0.4 confines host file access
through Bubblewrap; see [CONTAINMENT.md](CONTAINMENT.md) for the permitted paths.
Only run trusted tools and sources: the selected workspace remains writable,
and containment does not authenticate a malicious provider's evidence.
Adapter subprocess output and wall-clock time are bounded and their process
groups are terminated. Kernel exploits and resource exhaustion remain outside
the demonstrated boundary.

Raw provider records, EVF receipts, profiles, and FormalClaim bundles are saved
under your audit workspace. Do not edit them in place. They can contain your
paths and diagnostic data, so review them before sharing. Local tool/source
paths must still exist unchanged for current verification; moving machines
requires fresh local bindings and a new run. Historical receipts do not become
current merely by copying them.

Hashes detect drift relative to the supplied package/receipts; they are not
signatures or independent authentication of the producer. Neither publishing
a claim nor passing these tests grants approval, deployment authority, security
certification, or an open-source license. The evaluation notice is in `NOTICE.md`.

The original executable-only commands remain available; see `CORE-README.md`.
The inherited `build.py` is a developer-only host rebuild tool, not a contained
audit command. To run adapter construction tests, use `./evf contained-test
--workspace /absolute/audit --suite test_formal.py`. Real provider
integration and claim-tampering tests require an explicit tools manifest:

```bash
./evf --runtime /your/tools contained-test --suite test_formal_live.py --workspace "$demo_parent/audit" \
  --tools '.evf-tools/PRINTED-DIGEST.json'
```

These tests create their own temporary example workspace and run the five
real providers. They do not audit or modify the owner's project.
