# Prepared Luna repository task

Status: **PREPARED, NOT RUN**. Seven local checks passed, including a mocked
48-call lifecycle, missing-key rejection and an uncertain-delivery stop. These
checks establish harness behavior, not Luna performance. No paid model call has
been made by this package.

Selected task: audit the existing ARE learning loop end to end and produce
source-linked findings on grounding, retention, applicability, revisions,
conflicts, missing outcomes, contradictions, invalidation, replay, evolution,
prior live evidence and local recovery tests.

Luna high reasoning performs twelve checkpoints, each with a draft and one fixed
self-review pass, in both memory treatments. The final deliverables are two audit
reports, draft/final correctness and citation scores, correction/regression counts,
token usage and latency evidence. The same source bytes and questions are used;
prior work stays separate per treatment. See [TASK.md](TASK.md) for the complete
scope, fairness boundaries and interpretation limits.

Budget: $8 run ceiling and $4 per arm, leaving $2 from the reported balance.
With the configured 48-call/200KB/16K-output limits, maximum reservations total
$3.370752 at verified rates. This is a conservative runner bound under the stated
pricing and token-framing assumptions, not a guarantee about other account usage.
The runner pins the standard service tier, disallows tools and model fallback,
and never retries ambiguous delivery. [Official Luna pricing](https://developers.openai.com/api/docs/models/gpt-5.6-luna).

The current login uses ChatGPT and no API key is configured. API billing and
ChatGPT access are distinct authentication paths; see [official authentication
documentation](https://learn.chatgpt.com/docs/auth). The user must identify the
intended balance and securely configure API authentication before this runner
can spend API credit. Do not paste a key into chat or repository files. The
runner uses only OPENAI_API_KEY from its process environment and does not alter
the current Codex login. Price evidence expires after 2026-09-06 and must be
reverified before a later launch.

From this directory, with Node v26.8.1:

```bash
node run.mjs --preflight
node --test runner.test.mjs integration.test.mjs
# Only after secure API configuration:
node run.mjs --live
```

The one-shot RUN.lock and RESULT.json prevent accidental reruns. No automatic
resume, overwrite, production activation or publication is included.

Construction: bounded product-test preparation is complete. Operational support:
API authentication is owned by the user/account owner and is the sole identified
launch prerequisite. Future approval, activation and publication remain separate
product/runtime-owner residue.
