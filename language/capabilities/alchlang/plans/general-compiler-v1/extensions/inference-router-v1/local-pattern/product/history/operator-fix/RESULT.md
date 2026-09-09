# Reference product validation result

Status: revised local candidate validated. Authority effect: none.

The two findings in [the prior review](FINAL-REVIEW.md) are closed for the current
Linux workspace. The operator runner signals an isolated process group and escalates
to SIGKILL after 500 ms. Regression tests exercise SIGINT and SIGTERM with nested
workers that ignore graceful signals, verify both workers stop and their listener
closes, and reject later work after cancellation. A real child exiting with status 7
proves the shared validation orchestration writes a failed receipt, retains the prior
successful suite and failure log, and does not start the next suite.

A supplementary [actual CLI cancellation](CLI-CANCEL-RESULT.json) during the
nested protected rehearsal also passed: nonzero exit, a failed cancellation receipt,
and both observed child processes stopped. This is separate from the test total.

All **217 tests** pass across eight suites: package/operator (6), demo (5),
protected/durable (1), local pattern (13), service (121), authentication (38),
custody/TLS (30), compatibility (3). The [current receipt](evidence-operator-fix/RESULT.json)
binds the revised 1,465-file manifest and suite log hashes; inputs were checked
before and after validation. These tests exercise local deterministic engines.

The initial 214-test receipt remains in [evidence/RESULT.json](evidence/RESULT.json),
with its original manifest in [history/initial-review/manifest.json](history/initial-review/manifest.json).
The original PACKAGE-RESULT.json describes that historical candidate. Its review
findings are retained as history. The independently accepted base bundle is unchanged.

The [operator guide](OPERATOR.md) describes the workspace dependency and fixture
limits. This revision grants no product acceptance or deployment authorization.

## Open Questions

No user design decision or mock-scope implementation blocker remains from the two
review findings. Optional real-engine, issuer and distribution choices remain in
[OPERATOR.md](OPERATOR.md#open-questions).
