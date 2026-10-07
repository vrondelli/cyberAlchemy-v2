# G01 r69 bounded alternate-client log transfer

R68 is terminal at 19/24 authenticated, byte-complete logs. Five exact
cases returned HTTP 200 with only 32,577 bytes despite larger HTTPS HEAD
lengths. R69 tests one `curl --http1.1` GET per those five transport-only
failures, no automatic retries and no range reconstruction. It keeps the
same job URL and 8 MiB cap. Complete means HTTP 200, exit 0, exact r68
HEAD length, strict UTF-8, and byte receipt. R69 cannot retroactively pass
r68; a new cohort admission version must join its successes with r68's
unchanged 19 cases before any ranking or provider call.

No labels, rankings, scores, or GLM requests are used.

## Open questions

- Does HTTP/1.1 avoid the repeatable 32,577-byte transfer truncation?
- If not, which score-blind source-order replacements can provide five
  authenticated logs without changing the claim population after scoring?
