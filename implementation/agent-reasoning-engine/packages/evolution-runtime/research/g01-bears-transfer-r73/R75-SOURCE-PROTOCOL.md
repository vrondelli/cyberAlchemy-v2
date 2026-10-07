# Bears r75 bounded exact failed-side Java archives

Pin r73 source order and r74 HEAD receipts. Iterate all 37 original-order
repositories until 24 are source-admitted, skipping a non-200 r74 HEAD but
retaining a receipt for its disposition. For a HEAD-200 entry, make exactly
one TLS-verified GET to the same codeload exact original buggy SHA, with no
retry. Cap compressed response at 128 MiB, tar member count at 100,000, total
declared tar bytes at 512 MiB, each projected `.java` file at 1 MiB, and
projected Java bytes at 64 MiB. Require a single archive root ending in the
exact SHA, safe paths, no duplicate Java paths, at least one projected Java
file, strict member sizes, and safe types. Store only admitted archives in
private WSL source-only storage. Preserve failed attempts as receipts, never
as source. Freeze the first 24 admitted source repositories; no score, gold
path, patch, fix, or model call may influence selection.

This gate says only that original buggy Java source is obtainable. The Bears
branch's test-change commit and the evaluator's exact old-side fix labels
need separate identity and admission audits before any provider call. No
quality claim follows from r75.

## Open questions

- Do at least 24 repositories pass the compressed/decompressed Java limits?
- Can the failing test details be tied to those exact buggy trees without
  passing source or patch leakage?
