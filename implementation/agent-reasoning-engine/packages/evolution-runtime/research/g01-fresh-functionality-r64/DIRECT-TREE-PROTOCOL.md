# G01 r66 direct-tree admission protocol

Status: frozen candidate before any r66 archive transfer or direct-tree read.
Claim ceiling: cohort admission only; no ranking, provider call, metric, or superiority.

Input is the 26 provisional r65 web-diff-admissible Python cases in original
source order, pinned by `WEB-DIFF-RESULT.json` SHA-256
`6215ab0c9877581554252c0d1e980614fd74262c05ef0fb990c6a84355e46072`
and r64 source-preflight SHA-256
`877b040f027375c61af9e23666d3429a4af810e08fac29b359d63e7cd35be30e`.
The r64 GitHub API compare admission is terminal invalid: it required a
nonexistent `head_commit` field and returned 0/28 by parser error. R65 does
not repair r64 and is only a supply prefilter.

For each of the 26 cases, retrieve one exact failed-commit and one exact
passed-commit `codeload.github.com` tarball over HTTPS, zero automatic
retries, 128 MiB compressed cap each. Keep failed archives source-side and
passed archives evaluator-only. Require safe tar paths and an exact commit
suffix in each archive root. Compute Git blob OIDs of regular `.py` files
from both trees. Admit a case only if its failed tree contains 1–3 non-test
Python source paths whose blob OIDs differ in the passing tree, no non-test
Python source is newly added, and the old-side paths match r65's provisional
web-diff paths exactly. Require the failed-source Python projection to fit
64 MiB, with each file at most 1 MiB. Preserve every case's exact failure
reason; do not replace or select based on performance.

If at least 24 cases pass, freeze the first 24 in source order. Otherwise
stop this admission candidate and expand the score-blind population before
any GLM request. The selected source-side manifest may carry IDs, repository,
commits, archive digests, and source roots, but no gold path or passing
content. A separate evaluator-only manifest owns direct-tree target paths.

## Open questions

- Do 24 of 26 cases survive exact tree and size admission?
- Are BugSwarm logs for the admitted cases independently authenticated and
  small enough for the fixed 8K query budget?
- What independent comparator and all-in cost evidence will bound a later
  superiority claim after ranking?
