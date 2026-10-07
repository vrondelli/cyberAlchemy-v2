# Current Auth technical-evidence successor v7 (intermediate candidate)

This is an explicitly intermediate baseline between the frozen v6 technical
object and a complete current-source successor. It independently enumerates
the selected Cargo closures and source files, then cross-checks those results
against the older v5 instrument. It reconstructs the v6 object from the frozen
v5/v6 bindings, allows exactly 11 reviewed source-hash changes and the now-two
stale historical references, and reruns the current service/D65 sidecar.

The new timeout integration test must be physically present at its pinned
hash, but it is **deferred** from the 77-source intermediate object. This
binding therefore does not claim a complete current source set. Neither its
source-shape checks nor its sidecar replay prove all-path no-call behavior or
runtime guarantees. The v5/v6 files remain unmodified historical preimages.

From the checkout root:

```sh
python3 auth-foundation/implementation/scripts/test-current-evidence-successor-v7.py
python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v7.py
```

## Open Questions

- Can a v8 successor include the timeout test, rerun its trace suite, and
  become the complete current technical source binding without expanding the
  runtime guarantee claim?
