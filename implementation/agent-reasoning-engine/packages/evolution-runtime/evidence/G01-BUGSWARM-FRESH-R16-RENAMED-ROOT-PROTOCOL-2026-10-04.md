# G01 fresh r16 — renamed-owner tar-root repair

Status: fixed after r15 terminal result and before r16 inspection. Input is the exact r15 source result SHA-256 `f89074fa0239d68423ab0d2f2824ba9e21f534222aa8f90409b8bc02f58e0eae`. R15's 21 admitted archives remain unchanged; only slots 1, 6, and 20 are re-inspected. No download, passing source, label, rank, or model output is part of r16.

For each of the three byte-pinned complete gzip archives, require the original r15 requested HTTPS codeload URL to contain the exact 40-hex failed commit and historical `owner/repo` pair, HTTP 200, and complete transport evidence. Accept a changed owner in the tar root only if **exactly one** top-level root exists, it ends in `-<requested-repository-basename>-<failed-commit first seven hex>`, and its prefix is a nonempty safe GitHub-style owner token. Every member must remain under that root, use safe relative POSIX paths and no backslashes or `..`, with at most 250,000 members and 4 GiB regular member bytes. Project only language `.py` or `.java` regular files at most 1 MiB each; require at least one, no duplicate projected path, and at most 64 MiB total projected bytes. No other r15 gate is relaxed.

Seal an r16 receipt joining the unchanged 21 r15 admissions and the three independently re-inspected cases. If any fails, stop the whole 24-case source gate; do not shrink the denominator or substitute using labels.

## Open Questions

- Are all three rename-root archives otherwise safe and within the same code limits?
- Can the 24 byte-pinned archives be materialized into exact failed-code-only roots without evaluator leakage?
