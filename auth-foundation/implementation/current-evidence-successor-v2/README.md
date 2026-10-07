# Current Auth technical-evidence successor v2 (candidate)

> Current-status notice (2026-10-04): this candidate verifier is stale after
> the authorization metadata/state/trusted-input reader splits. Its historical
> snapshot set includes mutable D65 candidate outputs whose bytes have changed,
> and its service dependency map still requires removed direct provider edges.
> Do not treat the commands or preservation claim below as passing for the
> present implementation. A separately versioned immutable preimage and
> updated current-source verifier are required before revalidation. That
> successor is now the separate `current-evidence-successor-v3/` candidate;
> this v2 binding remains unchanged as a predecessor record.

This package binds the present Auth service to its actual decision path:
`authorization-service` → `trusted-boundary-pre-resolved-v2-candidate` →
`trusted-boundary-v2` → generated `command-boundary-runtime-v2`. The older
`trusted-boundary` dependency remains only for the public inbound request type.
The service and provider sources preserve matching-row multiplicity; the
owner-accepted BusinessMeaning is pinned, but semantic acceptance is a separate
decision, not a result of this technical replay.

Run from the repository root:

```sh
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v2.py
python3 -m unittest auth-foundation/implementation/scripts/test-current-evidence-successor-v2.py
```

The verifier replays the three existing current DomainSpec CLI targets, then
performs two clean generations from the selected command-boundary v2 source
and compares Cargo, Rust, and receipt bytes with the active v2 runtime. It
checks all seven current Rust crates for formatting, ordinary and warnings-as-errors
compilation, two test runs, exact test-name inventory, and strict Clippy on
handwritten crates. The generated command-boundary kernel has zero Rust tests
in its own crate and is exempt from strict Clippy because generated expressions
trigger style lints; its formatting, compile, and test commands still run. The
surrounding v2 boundary and pre-resolved crates supply behavioral tests.

`binding.json` records exact local source and historical snapshot hashes. Any
changed byte, test-name inventory, wiring, or claim field requires a new
explicit candidate record. The v1 successor and D65 historical receipts are
preserved, not rewritten. No FormalClaim admission, all-path no-call proof,
TDE/F5/EVF satisfaction, deployment, or `runtime_guarantees_observed` follows
from this package.

## Open Questions

- Which admitted v4 FormalClaim and definition binding will carry the accepted
  meaning into TDE without transferring historical v1 receipts?
- Which TDE-derived cases and trusted provider observations will justify the
  post-TDE executable verification request?
