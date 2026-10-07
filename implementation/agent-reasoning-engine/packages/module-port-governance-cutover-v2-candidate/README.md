# Module Port v2 candidate preview

This path tests the exact injected Alch semantic adapter and the separately
bound v2 configuration. It consumes a candidate Rust verifier receipt and
composes the Module Port. It never reports an activated cutover. The receipt
has `runtime_admission_verified: false`, and a successful preview retains
`runtime_admitted: false`, `activation_selected: false`,
`cutover_completed: false`, and `enforcement_active: false`.

From the repository root:

```bash
tools/toolchain/run cargo test --offline --manifest-path implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/Cargo.toml --bin are-module-port-v2-candidate
node --test implementation/agent-reasoning-engine/packages/module-port-governance-cutover-v2-candidate/index.test.mjs
```

The source-only preview above does not substitute for a packaged verifier
artifact, distinct admission and operational decisions, or an activation
protocol.

The additive packaged candidate now lives in `packaged-preview.mjs`. It
anchors its production-facing call to this checkout, verifies the separate v2
binary and manifest plus their recorded compile inputs, runs that binary
directly from a verified file descriptor, checks its receipt, verifies the
transitive executable JavaScript closure, and only then imports and composes
the existing candidate Module Port. It accepts no caller-supplied receipt and
does not invoke Cargo or a package manager at startup:

```bash
node implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/scripts/build-v2-candidate-artifact.mjs
node --test implementation/agent-reasoning-engine/packages/module-port-governance-cutover-v2-candidate/*.test.mjs
```

This is packaged **candidate preview**, not an activated cutover. It retains
`runtime_admitted: false`, `activation_selected: false`,
`cutover_completed: false`, `enforcement_active: false`, and
`effect_authorized: false`. The historical v1 builder/artifact/cutover and
its decisions are not repinned or reused.

This local mutable checkout is not an immutable or signed distribution.
JavaScript source may still change concurrently between digest inspection and
module loading. The preview therefore does not claim an adversarially
race-free activation boundary or protected release custody.

## Open Questions

- What owner test result and protected custody would justify review of this
  exact candidate binary and manifest for a later admission decision?
- What operational readiness and rollback evidence will a real cutover need?
- Which immutable or otherwise protected distribution/loading contract will
  close the JavaScript inspection-to-import race for a real cutover?
