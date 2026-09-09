# ARE natural feedback v2

This isolated successor broadens supported wording while retaining the existing
ARE lifecycle and ledger. It accepts polite one-time requests, explicit future
preferences and pending corrections about technical language, length or missing
examples. It neither installs hooks nor activates ARE in this conversation.

| Input | Behavior in apply-scoped mode |
| --- | --- |
| Please keep it brief. | Temporary concise guidance only. |
| Could you give an example? | Temporary example guidance only. |
| Please keep it short in future answers. | Retain concise guidance within this interaction after a completed episode. |
| That answer was too long. | Temporary concise guidance; offer adjacent confirmation. |
| That needed an example. | Temporary example guidance; offer adjacent confirmation. |
| Please remember that preference. | Retain the adjacent pending preference after its response completes. |

“Always” and “remember to” are explicit retention markers for the supported
phrases. They retain guidance only in the configured interaction. Cross-project,
cross-conversation and conditional scopes are unsupported and abstain. Generic
“yes”, negation, quotations, mixed commands and unknown preferences also abstain.
Default observe mode injects no guidance. Pause/resume and disable-reuse keep
v1 semantics; disabling reuse does not physically erase the ledger.

## Development evaluation

The 74 synthetic cases in CORPUS.json were labeled and hashed before v2
implementation. They are visible development examples, not held-out evaluation.

| Measure | v1 | v2 |
| --- | ---: | ---: |
| Exact classifications | 40 / 74 | 74 / 74 |
| Correct explicit persistent preferences | 2 / 14 | 14 / 14 |
| False persistent classifications on nonpersistent cases | 0 | 0 |

BASELINE.json and EVALUATION.json contain hashes and individual failures.
The test suite also applies ten adversarial transformations to every positive
case, covers malformed inputs, verifies evaluator error accounting, preserves
all v1 tests and exercises new forms through fresh adapter processes and the
real file ledger. TEST-RECEIPT.json records the completed suite result.

Run from the repository root:

```sh
node --test --test-reporter=tap cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/natural-feedback-v2/adapter.test.mjs cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/natural-feedback-v2/interpreter.test.mjs cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/natural-feedback-v2/corpus.test.mjs
```

Reproduce the corpus result with `node evaluate.mjs ABSOLUTE_INTERPRETER_PATH`
from this directory; select v1 or v2 interpreter.mjs. It prints JSON and makes no
model calls. Neither corpus agreement nor local tests prove native model receipt,
user satisfaction, lower cost, or an advantage over a well-maintained summary.

## Remaining work

Product construction: independently sourced feedback evaluation, steering and
compaction boundaries, then learning beyond response preferences. Language
coverage is still a finite English grammar. Capability learning remains open.

Operational support: the host integrator owns a future native canary and later
installation; the previous four-turn Luna allowance is exhausted. This candidate
uses zero model calls. Earlier native canary evidence covers its older source
only. Product approval, activation, and publication remain unperformed.
