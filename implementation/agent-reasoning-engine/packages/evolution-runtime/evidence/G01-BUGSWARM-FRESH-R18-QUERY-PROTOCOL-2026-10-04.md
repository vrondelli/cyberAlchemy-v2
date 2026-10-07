# G01 fresh r18 — unchanged failure-query transfer

Status: fixed before r18 query projection, ranking, labels, or GLM calls. Transfer the exact development-r2 query rule SHA-256 `6aa2d5b98b70b7529345d3176f686e23cfa1e59ff58cb697f190f792f6e36872`: up to 256 bytes of failed-test names, then the ANSI-stripped tail of the authenticated failed-job log, with the same sensitive-pattern redaction and a final 1,024-byte UTF-8 cap. Do not tune the query from evaluator labels or model outcomes.

Input identities are the r14 final source/log result SHA-256 `2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1`, r17 code-only projection SHA-256 `6f76dafa33ed79a1ddfba5a3278e95ccb39161513ff35bc23dc927ce13dd1992`, and failure-side metadata SHA-256 `5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686`. For retained slots, use the r13 admission receipt and its declared log source: `r12-reused` resolves only to `preflight-r12/HTTPS-LOG-XX.gz`, and `r13-new-capped-get` resolves only to `header-r13/HTTPS-LOG-XX.gz`. For replacements, read the final r14 attempt receipt/body. Recheck exact job, failed SHA, repo, log length and SHA-256. Stop if any identity or log fails; do not shrink the 24-case denominator.

Store only query rows and a source-only seal in private WSL storage. No passing source, evaluator gold, model response, or VPS full source tree may enter this stage.

## Open Questions

- Do all 24 repaired slots reproduce a bounded query from the unchanged rule?
- Will unchanged ARE, graph-r2, and r9 acquisition paths produce complete source-only rankings and sealed packets before evaluator access?
