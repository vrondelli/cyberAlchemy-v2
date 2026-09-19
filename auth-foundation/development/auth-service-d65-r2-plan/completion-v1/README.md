# Auth Service and Authorization API completion

This successor work package follows the user's request to finish Auth Foundation.
It selects the current in-process service and the existing socket-free API as
the product boundary. Login, tokens, a network listener, and deployment remain
separate products or operational effects.

## Construction frontier

Run `complete.py` to reconstruct the current source graph and ontology
projections, bind the implementation and formal inputs, execute local tests and
behavioral mutations, freeze the candidate, and join independently verified EVF
evidence with all 43 service obligations and five API obligations. The historical EVF epoch 002 has source and collection drift and is
not current evidence. Its immutable inputs and receipts are preserved.

The construction chain remains definitions, ontology scaffolds, product and
business contracts, DomainSpec source and compiled projections, implementation,
frozen candidate, current E0–E3 evidence, and then a product-owner decision.
No completed stage or owner decision is inferred from the historical plans.

Exact semantic dependencies are the five `AUTH-SERVICE-*.v1-candidate.json`
contracts in the parent directory and the definitions, ontology, and product
contract in `../authorization-api-v1/`. All records in those selected documents
are inputs. No ambient ontology runtime is a prerequisite.

Runnable work includes local tests and evidence preparation. Full completion
requires the complete service denominator, six cause-specific behavioral
mutations, the seven EVF seams, and Auth-specific formal correspondence; the
API's older single stale-candidate control cannot substitute for those checks.

## Reproduction

The selected compiler is the immutable working copy in `compiler-snapshot/`.
Its `PROVENANCE.json` links every copied source hash to the original DomainSpec
CLI path. Concurrent edits to the original compiler invalidated earlier runs;
this snapshot makes the candidate reproducible without changing that work.
The snapshot is a build input, not a promoted compiler source or release.

The runner uses the selected Rust and Lean toolchains, Node with the CLI's tsx
loader, a C compiler, and the existing EVF producer, verifier, and Lean provider.
This workstation uses Rust 1.98.1, Lean 4.33.1, Node 26.8.1, and Zig 0.16.0.
Tool paths and hashes are bound in the generated profiles. Offline Cargo caches
must contain the locked dependencies before entering the network-isolated EVF.

```sh
export PATH=/home/vrondelli/.cache/auth-completion/build-tools/bin:/home/vrondelli/.cargo/bin:/home/vrondelli/.elan/bin:$PATH
export CARGO_TARGET_DIR=/home/vrondelli/.cache/auth-completion/auth-cargo-target
export AUTH_EVF_BIN=/home/vrondelli/.cache/auth-completion/auth-evf-target/debug
export AUTH_ZIG_BINARY=/home/vrondelli/.cache/auth-completion/build-tools/zig-x86_64-linux-0.16.0/zig
python3 -B complete.py
```

The current outputs are `PRODUCT-CANDIDATE.json` and `PRODUCT-TEST-RESULT.json`.
Failed earlier evidence remains historical. The formal claims cover the Auth
policy and compiled Rust type/signature/mapping correspondence; they do not
prove arbitrary Rust execution or universal compiler correctness. Typed
contract checks and behavioral evidence are recorded separately.

## Operational work

The Auth product owner owns the final digest-bound product decision. The EVF
and formalization owners own their exact evidence bindings. The storage and
platform owners own migration provisioning, external caller identity, TLS,
capacity budgets, and listener activation. Publication and deployment belong
to their respective owners and are deferred. None blocks local construction.

## Open Questions

- Which exact successor input epoch replaces stale `AUTH-EVF-EPOCH-002`?
- Does current evidence satisfy every required E0–E3 check for one candidate?
- Does the product owner approve that exact tested candidate?

This package grants no admission, approval, activation, release, or deployment.
