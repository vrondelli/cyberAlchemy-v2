# G01 BugSwarm selective-GLM r29 — authenticated source/log admission

Status: fixed before network access. This stage tests availability for the 24
rows sealed by the r28 metadata census. It does not access labels, patches,
passing-commit source, rankings, model outputs, or scores.

Bind the r28 census at SHA-256
`f4aead7a1201f114fe89d6da36226c4aeab5f4712f6114d1165632f9b2f2258a`.
Attempt all 24 rows exactly once in ordinal order. Use HTTPS only and allow
redirects only to HTTPS. For each row:

1. issue a corrected HEAD request to the exact failing-commit archive at
   `codeload.github.com`; do not apply a body-size option to HEAD;
2. fetch at most 65,536 bytes from the BugSwarm failed-job page and require
   the page identity to match the sealed repository, image tag, job, and
   provider evidence;
3. issue a corrected HEAD request to the raw failed-job log and require a
   positive content length no larger than 8 MiB;
4. only when the three preceding checks pass, fetch the raw failed-job log
   once with the 8 MiB cap and require HTTP 200, exact byte-length agreement,
   and strict UTF-8;
5. preserve every response receipt and bounded body privately in WSL,
   including failures.

Use zero automatic retries. Do not replace a failed row in this stage. Seal a
24-row result and stop with a non-passing admission status unless every row is
admitted. Any replacement queue must be separately versioned, preserve the
fixed language denominator, continue in the pinned BugSwarm source order,
exclude every previously selected or attempted repository, and remain
score-blind.

The only passing condition is 24/24 authenticated source/log availability.
Passing authorizes no source archive download, ranking, provider call, label
access, or claim. It only makes the fixed population eligible for the next
source-only stage.

## Open Questions

- How many r28 rows pass exact source/log admission on the first attempt?
- Are any failures caused by repository renames, unavailable commits, large
  logs, or incomplete BugSwarm page identity?
- If replacements are required, can the fixed denominator be restored without
  exhausting repository-disjoint candidates?
