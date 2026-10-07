# Current Auth technical-evidence successor v8 (candidate)

This successor validates the exact v7 intermediate binding, independently
re-enumerates the **v5-defined** selected source set, includes the previously
deferred timeout integration test, and runs the trace-feature API all-targets
suite. The enumerated inventory must be exactly the reconstructed v6 source
set plus that one test. The v5/v6 historical files and v7 intermediate file
are preserved.

This is not a complete Auth technical source binding: the v5-defined inventory
does not include external SQL `include_str!` inputs or the optional trace
crate's source closure. It is not a proof of the business rule across all
native decision entrypoints. `runtime_guarantees_observed` remains false.

From the checkout root:

```sh
python3 auth-foundation/implementation/scripts/test-current-evidence-successor-v8.py
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v8.py
```

## Open Questions

- Which independent endpoint/effect closure and runtime observations can
  establish all-path no-call and raise the runtime guarantee claim?
