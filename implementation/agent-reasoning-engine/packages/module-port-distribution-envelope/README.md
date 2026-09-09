# Module Port Distribution Envelope

This package materializes and verifies the L8 Linux x64 distribution-envelope
candidate. Verification is offline and covers the exact artifact manifest and
packaged Rust verifier bytes before any installation or execution.

The embedded Ed25519 key is a deterministic public test fixture. A valid test
signature proves the verifier mechanics only: it is not a release signature,
does not establish an identity or custody chain, and cannot make an envelope
release-eligible.

Run:

```sh
node scripts/materialize-test-envelope.mjs
node --test test/*.test.mjs
```

## Open Questions

- Which separately authorized release owner and protected key-custody system
  would be eligible to sign a real release envelope?
- Which additional platform artifacts should receive separate envelopes?
