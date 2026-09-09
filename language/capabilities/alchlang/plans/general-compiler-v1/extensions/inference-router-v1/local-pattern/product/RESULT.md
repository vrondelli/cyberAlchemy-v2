# Reference product validation result

Current live status: **passed**. [Two real Qwen JSON/SSE requests](../vllm/LIVE-RESULT.json)
completed through the existing service and tunnel, with nonempty output and usage.
The earlier SSH-blocked attempt below is retained as history.

Status: vLLM extension validated locally. Authority effect: none.

All **228 tests** pass across nine suites, bound to the same 1,474-file candidate:
vLLM configuration/transport/CLI (11), package/operator (6), demo (5),
protected/durable (1), local pattern (13), service (121), authentication (38),
custody/TLS (30), compatibility (3). [Current receipt](evidence-vllm/RESULT.json).
File hashes were verified before and after the run, and each suite log is hashed.

The new commands configure/check/test/start a vLLM engine using SSH forwarding or
a trusted HTTPS endpoint. Tests use real sockets and the accepted generated
Alch/DomainSpec service with a vLLM-shaped mock. They cover exact model discovery,
private config files, tokenization, JSON/SSE/usage mapping, reasoning metadata
separation, idempotent replay, errors/redirects/truncated streams, timeout,
SSH argument validation/discovery, tunnel exit, and the CLI lifecycle.

The [live attempt](../vllm/LIVE-CHECK.json) to Vast instance 50212590 stopped at
SSH host-key verification. No configuration was saved and no model inference was
sent. That prerequisite was subsequently resolved; see the current live result above. Local validation does not establish real Qwen or template-tag
compatibility, remote GPU cancellation, production readiness or deployment.

[Setup commands and protocol details](../vllm/README.md).
No DomainSpec schema change was needed: the new translator supplies the existing
local protocol to the accepted generated public service. Protected Auth Foundation
hosting remains its separate rehearsal.

Historical receipts remain unchanged: [214 tests](evidence/RESULT.json) with
[initial manifest](history/initial-review/manifest.json), and
[217 tests](evidence-operator-fix/RESULT.json) with
[operator-fix manifest](history/operator-fix/manifest.json).
The independently accepted base bundle remains unchanged.

## Open Questions

No construction decision remains for the setup script. Verified SSH access and
live model observations are operator prerequisites for the actual remote check.
See [the setup guide](../vllm/README.md#open-questions) for limits and future work.
