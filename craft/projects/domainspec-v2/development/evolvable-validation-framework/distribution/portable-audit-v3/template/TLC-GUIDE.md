# Running TLA+/TLC with EVF

TLA+ describes how a system can change over time. TLC explores the behaviors
allowed by a particular model and configuration. This adapter connects that
check to EVF's exact inputs, deliberate negatives, raw evidence and claims.

The package includes the adapter, examples, tests, and checked example claim.
The TLA+ tools JAR and Java runtime are separate prerequisites, just as the
other solver installations are. No runtime is silently downloaded or installed.

## Set up only TLC

Use the pinned [TLA+ tools 1.7.4 release](https://github.com/tlaplus/tlaplus/releases/tag/v1.7.4).
It contains SANY and TLC 2.19; these are different version labels for the
release bundle and its checker. Use the Java release listed in TOOLCHAINS.json.
The required JAR SHA-256 is:

```text
936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88
```

For example, download into a new directory:

```bash
tlc_download_dir="$(mktemp -d)"
curl --fail --location \
  https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar \
  --output "$tlc_download_dir/tla2tools-1.7.4.jar"
sha256sum "$tlc_download_dir/tla2tools-1.7.4.jar"
```

Confirm that the printed hash matches. The binding command below also refuses
a different JAR or Java executable. Hashes detect changed bytes; they are not
signatures or independent authentication of a download.

From the extracted kit:

```bash
./evf doctor
tlc_demo_parent="$(mktemp -d)"
./evf formal-init "$tlc_demo_parent/audit"
./evf formal-tools --workspace "$tlc_demo_parent/audit" --trust-local-tools \
  --java /your/tools/jre/bin/java \
  --tlc "$tlc_download_dir/tla2tools-1.7.4.jar"
./evf formal-run --workspace "$tlc_demo_parent/audit" \
  --spec tlc-audit.json --tools '.evf-tools/PRINTED-DIGEST.json' \
  --trust-local-providers
./evf formal-verify --workspace "$tlc_demo_parent/audit" \
  --claims '/absolute/FORMAL-CLAIMS.json/path/printed/by/formal-run'
```

Replace both printed-path placeholders with the actual command outputs.
The TLC-only audit does not require Soufflé, Alloy, CBMC, or Lean. The main
`audit.json` runs all five providers when their runtimes are bound.

## What is bound and checked

The request names the .tla source and `options.configuration` file. Options
declare the specification operator, scalar constant assignments, invariant
names, and at most one temporal property. The .cfg bytes must exactly match
the generated configuration: no additional constraints, unchecked properties,
symmetry settings, overrides, or disabled deadlock checking.

The included configuration is:

```text
SPECIFICATION Spec
CONSTANT Max = 2
INVARIANT Bounds
PROPERTY EventuallyDone
```

Model and configuration hashes appear in the EVF profile, native evidence
record, and resulting claim. A changed .cfg file invalidates current evidence
just as a changed .tla file does. Edit the copied inputs and make a new run;
do not rewrite old receipts.

TLC performs SANY parsing internally, then breadth-first model checking with
one worker, seed 1, and fingerprint index 0. The adapter requires completed
parsing, a nonempty state space, final statistics, an empty exploration queue,
and TLC's explicit success message. If a temporal property is requested,
checking of the complete temporal state space must also finish.

The deliberately negative model removes weak fairness. Its counterexample
shows how progress can be postponed forever. A separate real test introduces
an unsafe increment and checks TLC's invariant counterexample.

The adapter classifies native framed messages and exit status together.
A deadlock, parse/configuration failure, unsupported warning, missing trace,
timeout, or incomplete search is not a target-property pass or negative-control
success. The pinned protocol is described by the upstream
[message constants and exit statuses](https://github.com/tlaplus/tlaplus/blob/v1.7.4/tlatools/org.lamport.tlatools/src/tlc2/output/EC.java)
and [message framing](https://github.com/tlaplus/tlaplus/blob/v1.7.4/tlatools/org.lamport.tlatools/src/tlc2/output/MP.java).

## Limits that stay attached to the claim

This first portable contract accepts one named, self-contained .tla module,
plus Naturals, Integers, Sequences, FiniteSets and Bags from the pinned JAR.
External/nested INSTANCE modules and community modules are not supported.
SANY diagnostics naming an unexpected module are rejected. Constants are
bounded scalar integers, booleans or simple strings; models using larger
configuration languages need a future explicit dependency contract.

The adapter copies the exact pinned JAR into its temporary run directory so
the JAR's optional CommunityModules.jar sibling cannot be picked up from the
owner's installation. The Java runtime and OS libraries remain trusted
dependencies, not a hermetically verified environment.

There is no simulation, checkpoint recovery, arbitrary CLI flag passthrough,
or state-space truncation presented as success. Runs have a 45-second
wall-clock limit, 512 MiB Java heap cap, and bounded captured output. A larger
model that exceeds these limits is not established, not silently approved.

An empty or unsuitable model is still the audit author's responsibility.
TLC uses state fingerprints, so a completed check retains the tool's reported
collision-risk notice. One temporal property per request avoids attributing a
generic temporal violation to the wrong property; use separate claims for
additional properties.

The result is bounded to exact model/configuration bytes. It does not prove
an unbounded theorem or that real C/Rust code implements the model. Only run
trusted sources and tools: network isolation is not filesystem isolation.

## Tests

Evaluation caveat: one five-provider integration setup reported a TLC failure
while another audit was running. Its native logs were lost to the inherited
test cleanup, so the cause is unresolved. Eight later concurrent TLC audits
passed; this does not prove the intermittent problem repaired.
The test harness now preserves failed setup workspaces in a printed diagnostic
directory. Those copies are historical debugging evidence, not current-host
verification receipts. Retain any such directory when reporting a failure.

```bash
python3 -B tests/test_tlc.py
python3 -B tests/test_tlc_live.py \
  --java /your/tools/jre/bin/java --tlc /your/tools/tla2tools-1.7.4.jar
```

The first suite uses synthetic messages to test parser contracts; it produces
no formal claim. The second runs real TLC in new temporary example workspaces,
including positive, temporal-negative, safety-negative, and invalid cases.
