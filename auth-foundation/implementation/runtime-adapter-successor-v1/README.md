# Current compatibility-adapter successor v1 (candidate)

The original `standard-conformance/runtime-evidence.json` and
`runtime-adapter-binding.json` describe the earlier always-on binary adapter.
The v3 archive pins an earlier runtime-receipt preimage; the working legacy
receipt is a later, distinct revision. The verifier checks both identities
without rewriting either record. Neither is current evidence for the modified
runtime adapter.

This successor binds the adapter's current source, manifest, lockfile, tests,
and compiler control. The default build exports shared data types but not raw
decision functions. The `legacy-raw-decision` feature restores the historical
raw adapter for explicitly opted-in consumers. The verifier tests both builds,
including the eight opt-in behavior tests, and checks that the selected public
Auth API and three bridges cannot reach the legacy decision crates.

Run from the repository root:

```sh
python3 auth-foundation/implementation/scripts/test-runtime-adapter-successor-v1.py
python3 auth-foundation/implementation/scripts/validate-runtime-adapter-successor-v1.py
```

This is local compatibility, dependency, source, and test evidence only. The
old runtime receipt remains stale relative to current adapter bytes; this
successor does not claim a selected runtime guarantee or global prohibition on
independent legacy opt-in.

## Open Questions

- When should independent consumers stop opting into the legacy raw adapter?
- Which selected-path all-path and observed-runtime evidence can support a
  future runtime-guarantee claim?
