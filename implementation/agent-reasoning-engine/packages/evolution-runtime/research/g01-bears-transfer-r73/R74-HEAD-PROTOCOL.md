# Bears r74 exact-source HEAD preflight

Read the pinned r73 source-only 37-repository order. Make one TLS-verified
HTTP HEAD request per exact original buggy commit to GitHub codeload, with
no retries and no model, patch, diff, or label access. Record response status,
final URL, advertised length if present, and errors. Do not treat status 200
as proof of a complete or bounded archive; this only narrows source
availability. Preserve all 37 results, including failures, in original order.

The next source-admission protocol must freeze compressed-byte and projected
Java limits before GETs, permit only score-blind source-order replacements,
and verify exact archive roots and source identities.

## Open questions

- How many exact buggy commits return a non-error HEAD, and how many archives
  later pass byte-safe Java source projection?
