# ARE natural-feedback prototype

This isolated candidate connects a bounded English phrase interpreter to the
existing ARE learning lifecycle and persistent ledger. It does not install hooks
or activate ARE in the parent conversation.

## Behavior

| Input | Behavior in apply-scoped mode |
| --- | --- |
| From now on, use plain language. | Learn a current-interaction preference from a completed observed episode. |
| That's too technical. | Prepare plain-language guidance for this response; offer adjacent confirmation when a completed source episode exists. |
| Remember that preference. | Retain the immediately preceding pending preference only after that response completed. |
| For this answer, use technical detail. | Suppress retained guidance for this request, add temporary technical guidance, then restore retained guidance next request. |
| Pause learning. | Disable natural preference promotion and guidance reuse. |
| Resume learning. | Enable apply-scoped mode without replaying feedback received while off. |
| /are disable plain | Disable reuse of the plain-language lesson; no physical deletion. |

Examples, concise explanations and plain language are the supported preferences.
The complete phrase grammar is in `interpreter.mjs`. Recognition requires the
whole input to match. Quoted, conditional, mixed and unsupported wording does
not create a natural-feedback lesson. Generic “yes” is not confirmation.
Default observe mode emits no preference guidance. Retained here means within
the configured current interaction, including across adapter process restarts;
it does not mean a global user preference across conversations.

Original request text is passed unchanged to the existing lifecycle. The ledger
records request digests, pending source turn, completed source episode, learned
transitions and projections. A projection distinguishes reusable lessons from
temporary items. Hook output is prepared guidance; actual host delivery and model
behavior remain untested for this candidate.

## Validation and reproduction

Run from the repository root with Node:

```sh
node --test --test-reporter=tap cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/natural-feedback-v1/adapter.test.mjs cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/natural-feedback-v1/interpreter.test.mjs
```

Tests run the real adapter in fresh subprocesses against disposable file ledgers.
See `TEST-RECEIPT.json` and `TEST-OUTPUT.tap` for the completed result and
`MANIFEST.json` for source hashes. These are local product-test results, not a
native canary, benchmark against plain-text summaries or product approval.

The first run had 37 passes and four subprocess timeouts at five seconds. No
failed behavioral assertion was observed in that run. The host subsequently
reported load averages 8.75 / 15.73 / 16.23; this does not establish the exact
cause of the timeouts. The test-only subprocess limit was increased to 30 seconds.
Reporting corrections also added three regression tests before the final run.
No production timeout setting was changed.

## Next frontier

Product construction: expand language coverage using an explicit evaluation
corpus, then address steering and compaction boundaries. General language
understanding and improvements to reliability, cost or maintenance remain
unmeasured. This slice learns supported response preferences; it does not yet
learn new executable capabilities or autonomously improve its implementation.

Operational support: host integrator owns another isolated native canary and
later installation work. The previously authorized four Luna turns are exhausted;
this candidate used zero model calls. The prior native canary applies only to
its older candidate. Product approval and activation remain separate decisions.
