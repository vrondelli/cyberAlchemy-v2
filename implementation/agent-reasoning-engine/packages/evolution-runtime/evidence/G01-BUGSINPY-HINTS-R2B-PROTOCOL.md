# G01 BugsInPy r2b: prospective complete-index capacity amendment

Status: **replaces r2 before source projection, model dispatch, or r2 gold.**
The [r2 paired protocol](G01-BUGSINPY-HINTS-R2-PROTOCOL.md) is retained as
a failed no-model preflight candidate, not silently edited. Its frozen
24-case cohort remains unchanged at SHA-256
`77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c`.

The source-only [index preflight](../research/arb-trace2code-r1/preflight-bugsinpy-index-r1.py)
found **22/24** cases under r2's 64 MiB complete-index cap. The two
Ansible cases required 93,053,131 and 75,747,781 eligible regular-text
bytes. No patch, fixed output, GLM response, or score was opened, and no
case was dropped. The original r2 24/24 admission gate is therefore
unachievable under its 64 MiB rule, so it must not dispatch.

R2b changes **only** the uniform complete-source-index cap from 64 MiB
to **128 MiB** for *both* paired arms and every frozen case. Per-file
1 MiB, binary, path, link, query, chunk, prompt, provider, response,
scoring, uncertainty, completeness, and claim rules are exactly those in
the r2 protocol. The 128 MiB cap exceeds the observed source-only maximum
of 93,053,131 eligible bytes without a case-specific exception. A fresh
no-model 24/24 projection, actual ARE index-coverage check, and memory
rehearsal must pass before provider dispatch. No alternative arm or cohort
is authorized by this amendment.

## Open Questions

- Does the uniform 128 MiB index pass 24/24 actual ARE coverage without
  exhausting WSL memory, including the 17,831-file Ansible case?
- Once r2b is fully source-sealed, does the hinted arm beat the unhinted
  arm on untouched r2 tasks under the unchanged quality gates?
