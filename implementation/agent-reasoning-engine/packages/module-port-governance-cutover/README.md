# ARE Module Port governance cutover

This package is the synchronous startup enforcement point for the exact
activated Module Port subject. It verifies the compiled Alch cutover contract,
activation decision, operational authorization, Rust binding admission, and
static configuration by digest. It then verifies and directly invokes the exact
packaged Linux x64 Rust release artifact, without invoking Cargo or a compiler,
and only composes the reviewed static module set when the receipt passes.

Any missing, drifted, substituted, malformed, or failing input returns a
blocked result with no port. There is no partial composition or fallback.
Successful cutover makes the exact module set available but retains
`effect_authorized: false` and `authority_effect: none`.

Run its focused tests from the repository root:

```sh
node --test implementation/agent-reasoning-engine/packages/module-port-governance-cutover/test/*.test.mjs
```

## Open Questions

- Which separately built and tested artifact should represent another operating
  system or architecture?
