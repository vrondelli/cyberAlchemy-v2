# Module Port v2 candidate verifier artifact

This directory contains a separately built Linux x64 release binary for the
v2 injected-Alch configuration. It is not the historical v1 artifact. The
manifest records the exact candidate Rust compile inputs, binary digest,
platform, and no-effect ceiling. It makes no release-signature, custody,
admission, activation, or deployment claim.

From the repository root, rebuild or check without overwriting different
existing bytes:

```bash
node implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/scripts/build-v2-candidate-artifact.mjs
node --test implementation/agent-reasoning-engine/packages/module-port-governance-cutover-v2-candidate/*.test.mjs
```

The builder checks the locked compiler host and ELF x86-64 identity, rejects
uncontrolled target/flags environment variables, and refuses a source digest
mismatch or a different pre-existing v2 artifact/manifest. It never writes the
v1 artifact directory. The packaged preview directly executes this binary and
still reports admission, activation, cutover, enforcement, and effect
authorization as false.

## Open Questions

- Which exact owner-tested package and protected release custody would be
  eligible for a later admission request?
- Which operational readiness, rollback, and owner decisions would be needed
  before any real activation?
