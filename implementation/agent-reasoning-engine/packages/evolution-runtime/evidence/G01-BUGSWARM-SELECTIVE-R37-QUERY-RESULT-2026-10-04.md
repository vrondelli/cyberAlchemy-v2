# G01 BugSwarm selective-GLM r37 — authenticated failure-query result

Status: passed the unchanged query-transfer gate at **24/24**.

Protocol SHA-256:
`636c0076aa8c4dedcc8e40ac21b2e5c44f29da8e2190468a74b6dcc28b4055f5`.
Runner SHA-256:
`fd194749815d238927a6b03bf0fd638e9f5cd0c0ec3363e31199409f7ee6e8f6`.
Queries SHA-256:
`999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65`.
Seal SHA-256:
`ed0e5d6b1f9ef71c1ac64b0d36b1083ee84e41374744a951896216b9b364ad2d`.

R37 applied the unchanged BugSwarm development-r2 projection rule to all 24
authenticated r34 failed-job logs: up to 256 UTF-8 bytes of failed-test names,
then the ANSI-stripped log tail, the unchanged sensitive-pattern redaction, and
a final 1,024-byte cap. All 24 queries are non-empty; the maximum is **1,017
bytes**. No case lacked failed-test names and no sensitive-looking token matched
the frozen redaction rule.

An independent read-only audit rehashed every compressed log and admission
receipt, decompressed and rehashed all 24 raw logs, independently reconstructed
every query from the pinned metadata and rule, and matched all query bytes and
hashes exactly.

The seal records `network_calls=0`, `gold_opened=false`,
`passing_source_opened=false`, `patches_opened=false`, and `model_calls=0`.

## Claim boundary

R37 establishes only complete, authenticated, bounded failure queries for the
sealed r34 mechanism population. It supplies no ranking, accuracy, efficiency,
or superiority result. Next is unchanged ARE and graph-r2 ranking, still before
gold, followed by a disagreement census and treatment freeze.

## Open Questions

- How often do unchanged ARE and graph-r2 disagree at top 1?
- Is that disagreement rate large enough for selective GLM to save materially
  more than the four calls observed post hoc on r25?
- Does the later always-GLM treatment retain its accuracy advantage on this
  new population?
