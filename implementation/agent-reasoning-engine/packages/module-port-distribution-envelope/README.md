# Module Port Distribution Envelope

This package materializes and verifies the L8 Linux x64 distribution-envelope
candidate. Verification is offline and covers the exact artifact manifest and
packaged Rust verifier bytes before any installation or execution.

The embedded Ed25519 key is a deterministic public test fixture. A valid test
signature proves the verifier mechanics only: it is not a release signature,
does not establish an identity or custody chain, and cannot make an envelope
release-eligible.

Packaged-artifact verification requires the binary's filesystem mode to match
the signed `0555` mode exactly. Git records only whether a regular file is
executable, so a normal checkout materializes that tracked binary as `0755`.
Callers validating the repository checkout may explicitly select
`verification_context: "git-checkout"`. That context accepts only this exact
`0555` to `0755` representation and only when Git confirms that the file is a
tracked executable whose working-tree bytes still match the index. It does not
relax signature, digest, size, path, regular-file, or symlink checks, and it
does not assert that the checkout has packaged-artifact permissions.

Run:

```sh
node scripts/materialize-test-envelope.mjs
node --test test/*.test.mjs
```

## Open Questions

- Which separately authorized release owner and protected key-custody system
  would be eligible to sign a real release envelope?
- Which additional platform artifacts should receive separate envelopes?
