# Glossary

| Term | Definition | Status |
| --- | --- | --- |
| Test/configuration incompatibility | A bound test requires DOM facilities while its generated runner declares Node. This does not prove a product defect. | linked to accepted research |
| Failure evidence | A bounded, sanitized, digest-bound record of an unsuccessful builder command. It is diagnostic evidence, not passed validation. | project-local candidate |
| Retained failure artifact | The admitted `oew.failure-evidence.v1` record outside the temporary workroot. It is not a retained workspace. | project-local candidate |
| Failure evidence reference | Generic terminal metadata pointing to producer-owned evidence: status, path, digest, schema, producer, gate, issue, and unavailable reason. | partial; reusable public shape requires separate maintenance |
| Consumed authorization | The admitted attempt was used; the same authorization cannot fund another attempt. | linked |
| Retry authorization | Fresh explicit authority for a later attempt; never inferred from evidence persistence. | linked |
| Compatibility decision packet | A non-selecting comparison of test-side and config-side repair branches with evidence, costs, and gates. | project-local candidate |
| Stronger blocker | A failure that supersedes the original command blocker, such as evidence persistence or cleanup failure. | project-local candidate |

Glossary promotion is not requested. Private schema names and implementation
prose must not be copied into public Arcanum.
