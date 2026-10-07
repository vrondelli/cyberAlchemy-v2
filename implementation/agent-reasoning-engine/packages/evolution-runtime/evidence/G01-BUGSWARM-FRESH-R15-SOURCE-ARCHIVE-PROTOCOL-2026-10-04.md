# G01 fresh r15 — exact failed-source archive acquisition

Status: fixed before r15 archive download. Inputs are the 24-slot r14 source/log result SHA-256 `2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1` and independent audit SHA-256 `7ffa068558092b0be67c997f86266806a34199ea0710c5bae562609e32008696`. No labels, rankings, or model outputs have been opened for these cases.

For each final slot in order, download the exact failed commit from GitHub codeload HTTPS `legacy.tar.gz/{40-hex-SHA}` into private WSL mode-700 storage, with no automatic retry or replacement. Allow at most 256 MiB compressed per archive. Require HTTP 200, complete declared `Content-Length` when present, gzip integrity, a single expected repository/SHA-prefix root, safe relative member paths, at most 250,000 members and 4 GiB regular-file bytes, and no duplicate projected code path. The code-only projection preview includes `.py` for Python or `.java` for Java, regular files at most 1 MiB each and at most 64 MiB per case; at least one source file must remain. Preserve every attempted download byte count/hash, including partial or failed bodies, and one receipt per slot. Do not fetch passing source or patch labels. No full archive or checkout goes to the VPS.

Stop the r15 archive gate if fewer than 24 pass. A larger but otherwise valid archive, repository rename, or transport issue needs a separately versioned source-only repair; do not silently change the cap or shrink the denominator. Successful r15 source archives still require code-only materialization and evaluator-only label admission before ranking or GLM calls.

## Open Questions

- Do all 24 exact archives fit the 256 MiB compressed and 64 MiB projected-code bounds?
- Are any source roots renamed despite the original failed-commit URL returning 200?
- Do all eventual evaluator gold paths survive this source-only projection?
