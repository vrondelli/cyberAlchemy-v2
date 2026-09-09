# Working live tests — 2026-09-07

Both retention policies now have verified live repairs and continuity passes on
both controlled tasks, on the same final runtime and task-prompt sources. Each
of the four final arms passed all eight independent oracle checks.

| Task | Policy | Oracle | Continuity | Model calls | Tokenizer calls | Min soft headroom |
| --- | --- | --- | --- | ---: | ---: | ---: |
| retention-tool-pairs | recent-observations-v2 | 8/8 | Pass | 6 | 7 | 25 tokens |
| retention-tool-pairs | clear-v1 | 8/8 | Pass | 8 | 10 | 148 tokens |
| exact-json-scoring | clear-v1 | 8/8 | Pass | 6 | 8 | 123 tokens |
| exact-json-scoring | recent-observations-v2 | 8/8 | Pass | 6 | 7 | 115 tokens |

Final evidence: [retention pair](iteration-9/checked-report.json),
[scorer pair](scorer-2/checked-report.json), [all-run summary](summary.json),
[source and test validation](validation.json), [340 passing tests](final-tests.tap).
Candidate JSON and visible traces are in each arm directory. Original fixtures
were unchanged; patches were verified in isolated benchmark copies only.

The four saved candidates were also rechecked in fresh local fixture copies: 
[32/32 independent oracle checks passed](independent-recheck.json), without any
new model or tokenizer calls.

## What changed

The benchmark named a raw archive tool unavailable under source preservation.
Its task now names the offered typed tool, gives the required read/recover/patch
sequence, and asks for JSON-only final output. Fixture bytes, oracle, mutation
scope and continuity predicates are unchanged.

V3 now references exact duplicate objective/pending task text in the prompt rather
than repeating the whole request three times; saved state and distinct content
remain unchanged. Once all allowlisted files have been read and recycling has
occurred, a short user-role directive supplies the exact bounded recovery call.
It disappears when meaningful recovery is confirmed or present in the request.

Finally, V3 projects exact top-level JSON requirements arrays from already-read
allowlisted files as untrusted user-role data, so short acceptance constraints
remain visible alongside the original source. Hashes and native call/result
pairing are verified. Identical arrays deduplicate deterministically; a complete
field is omitted if its envelope exceeds 2048 UTF-8 bytes. This is decoded exact
field data, not a generated summary, new authority, oracle input or fresh read.
It does not count as native result delivery or archive recovery. Full-request
tokenizer admission still includes every attachment.

## Full iteration history

This was an adaptive tuning loop, not an unbiased success-rate benchmark. All
failed arms and operational failures remain in the evidence. The successful
pairs were selected after iteration; they establish working examples, not reliable
general performance or causal attribution to one change.

| Run | Outcome |
| --- | --- |
| 1 | Clearing passed both; V2 prose-prefixed JSON rejected |
| 2 | Both repaired; clearing skipped recovery |
| 3 | Both blocked on strict context admission |
| 4 | Both repaired; V2 skipped recovery |
| 5 | V2 final model timeout; clearing unstarted |
| 6 | V2 credential-resolution failure; clearing unstarted |
| 7 | V2 passed both; clearing candidate failed one oracle check |
| 8 | Both passed continuity but candidates failed oracle checks |
| 9 | Both retention arms passed repair and continuity |
| Scorer 1 | Clearing passed both; V2 used a deferred read ID for recovery and was rejected |
| Scorer 2 | Both scorer arms passed repair and continuity |

All 11 runs together used 139 model attempts and 172 tokenizer attempts.
Each pair retained the 24/48 attempt and 1200-second caps; each arm retained
12/24 attempts and 580 seconds. No run identity was replayed, no failed request
was retried within a run, and no acceptance check was weakened. Fresh repeated
trials were explicitly authorized by the user. The credential bridge was checked
locally after its failure without emitting secret material or calling the network.

Final model dispatches remained below 8000 reserved tokens, with the original
2048 output reserve, 256 margin and 16384 hard limit. This verifies ARE admission
and observable recycling, not the absence of provider-internal compaction.

## Provenance and construction

The final source manifests match each other and current source bytes. The final
340-test suite passed before the last frozen live candidate. The checked reports
passed recorded integrity, policy, accounting and oracle-receipt consistency
checks against the private runs; reports do not rerun or cryptographically
authenticate the oracle. Full private inputs remain under the /tmp directories
recorded in result.json; exports alone are not complete reportRun inputs. Raw
message history and provider reasoning are excluded from the visible exports.

Work follows [PLAN.md](PLAN.md) and the existing CAV2-D65 explicit-finalization
construction. Authority effect none. Defaults remain unchanged; publication,
deployment and default activation remain deferred.

## Open Questions

- How repeatable is the final candidate without further adaptive tuning?
- Does it generalize beyond the two controlled tasks and the 8000-token soft limit?
- Is explicit task-contract configuration preferable to projecting a named JSON field?
- Can we further reduce calls while retaining repair and continuity?
