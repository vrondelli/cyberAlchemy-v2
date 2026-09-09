# Local alchLang exchange through ARE and KEP

This prototype runs two **ARE Coding-Agent Runtime scripted turns**. Agent A
produces an exchange envelope; KEP encrypts it, grants co-ownership to B and
opens it for B; B compiles the exact alchLang source and returns a compiled bundle and receipt;
KEP records B's signed acknowledgement. The sender verifies the receipt's
content binding and P-256 signature. `DEMO-RESULT.json` contains the actual
compiler output strings in `bundle.files`, alongside `receipt.bundleSha256` and
per-file hashes. The signature binds that bundle digest; A verifies every file.
The return travels through the local ARE artifact handoff, not a second encrypted
KEP delivery. Bundles are JSON data, bounded to 400 KiB and 128 safe relative
filenames; they are not automatically extracted or executed. Identical replay returns the same receipt
without another protocol transition.

## Simulation without KEP

Run from the repository root:

```bash
python3 -B cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/alchlang-agent-exchange/v1/simulate.py
```

Optionally append the path to your own `.alch` file. This requires Python 3 and
this repository's existing Docker-backed Node/tsx environment. It does not build
Rust, start the KEP bridge, use encryption, call a live model or use credentials.

A scripted ARE turn writes A's source envelope. The simulator passes its JSON
bytes in memory to B's compiler receiver, which validates and compiles the source.
A second scripted ARE turn writes B's bundle and receipt. A's verification code
checks the returned files. The script also checks altered-file rejection and
identical replay. These roles follow predefined actions; they do not independently
choose tools or reason with a live model. The compiler call is made by the local
orchestrator on B's behalf.

The terminal displays each step, filenames, sizes and a generated TypeScript
preview. Each successful run saves `source.alch`, `result.json`, and all generated
files under `compiled/` in a new `/tmp/alchlang-simulation-*` directory. The printed
path is on the host and remains available for inspection. Generated code is not
executed. Hash verification is an integrity check against the locally trusted
receipt; it is not a remote identity signature.

## Run and test

From `/home/vrondelli/projects/domainspec-core`:

```bash
python3 -B cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/alchlang-agent-exchange/v1/validate.py --write-evidence
```

This builds the Rust bridge offline using its Cargo.lock, verifies two identical
alchLang/DomainSpec builds, runs the receiver and integration tests, and executes
the demo. It writes `PRODUCT-TEST-RESULT.json` and `DEMO-RESULT.json` only on PASS.
Omit `--write-evidence` to inspect results without replacing evidence files.
The validator requires Cargo and the repository's Docker-backed Node toolchain
with its existing cached dependencies. There is no dependency download fallback.

For repeat runs, optionally reuse an external Rust build directory:

```bash
KEP_BUILD_TARGET=/tmp/kep-alchlang-agent-build python3 -B cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/alchlang-agent-exchange/v1/validate.py --write-evidence
```

After editing model or implementation sources, explicitly regenerate the model
views before validation:

```bash
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- node --import tsx ../../../cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/alchlang-agent-exchange/v1/build.ts
```

Rust build output stays outside the repository. During a run the validator copies
only the executable into an automatically cleaned `.run-*` directory so the Node
container can invoke it. ARE creates and removes two separate temporary fixture
workspaces. Neither agent writes repository source files. No hook is invoked and
no commit is created.

## What is actually exercised

- ARE's existing `runModelDrivenCodingTurn`, scripted model transport, reasoning
  journal and independent verifier, once per agent. Each turn may replace only
  `artifact.json` in its disposable workspace.
- Existing KEP `ProductionCryptography` with XChaCha20-Poly1305 content encryption
  and HPKE X25519 recipient envelopes. Private keys are generated for each run,
  remain process-local and are never included in evidence.
- Existing KEP `EncryptedCoownershipState`: originator initialization, signed
  grant adding B, and B-signed decryption acknowledgement. The state has two
  owners, revision 2 and one acknowledgement after successful completion.
- Existing alchLang 0.4.0-candidate.0 parser/compiler; received code is compiled,
  never executed. `alchlang-source-v1` is this integration's wire profile, not a
  new canonical language release.
- Payload and envelope digests, authenticated local sender/recipient binding,
  bounded input, malformed source/version rejection, ciphertext and signature
  tampering, duplicate delivery and conflicting correlation/acknowledgement.

## Boundaries

These are two local scripted ARE roles orchestrated in one Node run, backed by
one disposable Rust bridge. They are not independently deployed agents or live
model sessions. The bridge binds local identities to ephemeral verification
keys; it does not establish a remote identity trust registry. Receipt signatures
are checked against that local session key.

Ciphertext storage is a process-local content-addressed map outside the protocol
state. There is no PostgreSQL persistence, external artifact host, Solana call,
finality claim, wallet, payment, remote service or deployment. Recipient plaintext
travels from the trusted local bridge to the compiler over its local pipe.

The receiver retains at most 128 successful receipts in memory. Same exact
sender/recipient/correlation/envelope replays; conflicting bytes fail. A restart
clears replay state, so this is not durable exactly-once delivery. The native
bridge accepts one delivery per process, has bounded line frames, and supports
only that delivery's acknowledgement and exact replay. The local orchestrator
validates the compiler receipt before asking the bridge to sign it; the bridge
is not a general remote signing service.

## Construction and evidence

`prototype.json` owns four prototype definitions, the unregistered four-node,
three-relation business scaffold, product/business behavior and the user's ARE
selection. `exchange-model.alch` expresses the model. The authored DomainSpec
project is `domainspec/project.json`; `build.ts` generates the graph and system
scaffold in `generated/`, with exact source and implementation bindings.

`exchange.ts`, `are-host.ts`, `kep-transport.ts` and `bridge/src/main.rs` are
separately authored adapters. The validator binds their bytes, compiler sources,
ARE's relative module dependency graph, KEP Rust sources, DomainSpec build sources,
registries, tool wrapper and Cargo lock. It rejects source drift during testing.
Generated compilation is deterministic; demo ciphertext, keys and signatures are
fresh per run and therefore are intentionally not byte-identical.

`PARTIAL-TEST-RESULT.json` is historical evidence from before the ARE selection.
Use the current `PRODUCT-TEST-RESULT.json` for this integrated candidate.
A test PASS grants no product approval or operational activation.

Construction frontier: complete local exchange available for testing and product
review, with no causal construction blocker. Operational residue remains separate:
repository owner owns publication/deployment (not authorized); Context/runtime
owner owns future durable session checkpoints (not required for this prototype).
Production identity, persistent transport and live-model operation require later
product scope and tests, and are not implied by the local result.
