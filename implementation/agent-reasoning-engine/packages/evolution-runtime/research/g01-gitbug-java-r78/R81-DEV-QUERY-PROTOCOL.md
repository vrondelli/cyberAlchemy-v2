# G01 r81 — development failure-evidence projection

Status: prospective, private, source-only. For the 12 r80 development rows,
read only the pinned GitBug-Java metadata record bound by filename, line,
repository, and exact prior/buggy commit. Select `actions_runs[1]` for
`PASS_PASS` and `actions_runs[0]` for `FAIL_PASS`, as implemented in the
official GitBug-Java `gitbug/bug.py` source. Include only tests whose first
result is `Failure` or `Error` and only their class, method, result type,
and result message. Exclude whole-run output, per-test stdout/stderr,
commit messages, issues, test/bug patches, fixed-side source, and any gold.

Use the prior r37 ANSI and credential redaction rule. Bound test names to
the first 256 UTF-8 bytes, then preserve the suffix of failure type/message
text in a total 1,024-byte query. Bind each query by SHA-256 and seal before
development ranking or evaluator label access. This deliberately narrow
query is a stable baseline input; richer evidence variants must be separately
named and compared at the same information budget.

## Open questions

- Does the 256-byte name cap lose useful failure names in large suites?
- Are result messages sufficient for a strong source-grounded method, or
  must isolated full-CI test traces be admitted separately?
