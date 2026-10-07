# G01 r79 — exact failed-source HEAD preflight

Use the r78b GitBug-Java source-only manifest SHA-256
`eef0efa22d78160613f20d09157b8dc0397bbd81f0a0277f613818cb2bb72002`.
Make one TLS-verified HTTP HEAD request per exact prior/buggy commit to
GitHub codeload. Four workers, at most 53 requests, timeout 30 seconds,
zero automatic retries. Record statuses in frozen source order. This is
availability reconnaissance, not archive admission, label validation, or a
benchmark result. An HTTP 200 does not establish source integrity or size.

## Open questions

- How many original buggy commits remain available?
- Which bounded source archive and Java projection caps are appropriate
before GET, with one deterministic source-order replacement policy?
