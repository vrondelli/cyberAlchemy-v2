# Current Auth technical-evidence successor v4 (candidate)

This successor retains the v3 content-addressed historical preimages and
recomputes current inputs after the authorization API's production pool became
concrete. It does not rewrite the frozen node-13 candidate, its EVF record, or
the v3 binding. The production `cfg(not(test))` path holds
`SqliteAuthService<SystemDecisionClock>` directly; a private trait-object
pool exists only in unit-test builds. A separate integration test compiles the
normal library and exercises an ALLOW and a pre-gate DENY through its public
builder. The current V4b source/Cargo projection is replayed and remains
indeterminate for runtime guarantees.

The verifier inherits v3's exact historical preimage checks, local Cargo
closures, selected source-shape checks, owner-scope lineage, bridge isolation,
and offline technical replay. Source-shape checks and an integration test do
not prove all native call paths or all transitive effects. In particular,
legacy SQLite and adapter entrypoints remain an open inventory and policy
enforcement task. No formal semantic admission, TDE/F5/EVF satisfaction,
deployment, publication, or runtime guarantee follows from this binding.

From the repository root:

```sh
python3 -m unittest auth-foundation/implementation/scripts/test-current-evidence-successor-v4.py
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v4.py --print-expected
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v4.py
```

## Open Questions

- Which remaining native decision-producing entrypoints can be reached in
  active artifacts, and how will each be guarded before every downstream call?
- Which admitted FormalClaim and TDE-derived cases will bind the accepted
  BusinessMeaning without transferring historical candidate authority?
