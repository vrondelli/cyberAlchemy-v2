# G01 second development cohort r3 — single archive-cap exception

Status: fixed after the 24-case r2 acquisition receipt and before any r3
request. R2 admitted 23 exact failed-commit archives under a 200 MiB
compressed cap. Only case 10, `mlflow/mlflow` at failed commit
`0bfcb26fee2785b7067b897bc1ec94e4e8806faf`, exceeded that cap;
the bounded read returned 209,715,201 bytes. This is a capacity denial,
not source unavailability or a reason to replace the case.

Preserve all 23 r2 archives and the r2 receipt. Make exactly one new
GitHub codeload HTTPS request for case 10 with a 512 MiB compressed cap.
Require gzip magic, the single exact repository-and-commit-prefix tar root,
more than one member, and nonzero regular-member bytes. If it exceeds the
cap or fails validation, stop source admission; do not silently replace or
score 23 cases. If admitted, produce a separately versioned 24-case receipt
that binds every retained r2 archive hash and the new case-10 hash.

The later code-only projection remains independently bounded at <=1 MiB
per `.py`/`.java` file and <=64 MiB per case, with safe paths. This exception
does not raise that projection bound or grant model calls, gold access,
reserved-confirmation access, VPS transfer, or publication.

## Open Questions

- Does the case-10 tarball fit 512 MiB and pass exact-root checks?
- Does its code-only projection fit the unchanged 64 MiB bound?
- How can the HTTP-provisional logs/diffs be authenticated or reproduced?
