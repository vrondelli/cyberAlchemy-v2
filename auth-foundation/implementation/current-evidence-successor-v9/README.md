# Current Auth technical-evidence successor v9 (expanded candidate)

V9 preserves v5–v8 evidence bytes. It validates v8, then expands its
v5-defined 78-path inventory with exactly five cross-package SQL `include_str!`
inputs and the three files of `authorization-trace`. It checks that the API
trace-feature normal Cargo closure adds exactly that local package and runs
the named concrete timeout integration test. Hashes are checked before and
after the test.

This is an **expanded enumerated source binding**, not a complete compiler
input closure. Full compiler dep-info for normal and test/trace targets has
not yet been reconciled. The all-path no-call and runtime guarantee claims
remain unproved and `runtime_guarantees_observed` remains false.

From the checkout root:

```sh
python3 auth-foundation/implementation/scripts/test-current-evidence-successor-v9.py
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v9.py
```

## Open Questions

- Which additional local inputs, if any, appear in dep-info for normal and
  test/trace targets, and how will compiler-input completeness be checked?
