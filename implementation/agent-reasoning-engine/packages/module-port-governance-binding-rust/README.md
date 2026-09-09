# ARE Module Port Rust Governance Binding

This candidate Rust binding verifies the exact admitted Module Port configuration
before any later activation boundary can rely on it. It binds the adopted
Constitution, its adoption decision, the runtime-admission decision, compiled
configuration, runtime conformance evidence, and reviewed adapter source by
SHA-256. It also checks the decision semantics and no-effect ceilings.

The verifier rejects missing files, byte drift, symlink substitution, changed
subjects, incomplete prerequisites, altered module identity, evidence mismatch,
and activation or effect smuggling. It does not load modules or activate,
enforce, publish, release, deploy, or authorize effects.

Run from the repository root:

```sh
tools/toolchain/run cargo run --offline --locked \
  --manifest-path implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/Cargo.toml \
  -- --repository-root "$PWD"
```

A `PASS` receipt means only that the candidate binding observed the exact
admitted subject and its prerequisite bytes. The receipt always reports
`binding_admitted: false`, `enforcement_active: false`,
`effect_authorized: false`, and `authority_effect: none`.

## Open Questions

- Which owner decision will admit the exact compiled binding candidate?
- What separate operational authorization and cutover evidence would be needed
  after admission and before activation?
