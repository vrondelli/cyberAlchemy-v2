# Live matched-tool qualification 59

Real GLM-5.3-Flash, pinned official DSH 0.1.5-rc.2, isolated existing VPS.
Five model calls and five tokenizer calls completed. Provider usage reconciles:
8,060 input + 1,575 output = 9,635 model tokens; zero unknown calls and no retries.
All measured request reservations were 3,615–4,882 tokens including 512 margin
and 2,048 output, below 8,000. Actual prompt usage was two tokens below the
corresponding tokenizer measurement in each call.

DSH read value.js, changed 1 to 2, checked the patch, and submitted the observed
base read ID. The independent local base remains value 1. NATIVE-EXPORT.json
binds the real raw streaming exchanges and tool records to the unchanged native
ContextBench trajectory format. This is a one-file setup fixture, not a benchmark
quality result, paired comparison or token-savings claim.

The harness and proxy both exited zero; SETTLEMENT.json records their terminal
states. Large source caches were not created. Retained local evidence is about
400 KiB. Startup copy-path errors occurred before containers or paid calls and
were repaired without replaying any model stage.

The deployed exact source list is SOURCE-BINDINGS.json. Local transport code later
added stricter seal loading and corrected an oversized-response in-memory unknown
counter; do not equate the later local digest with this deployed fixture. The
retained seal passes the later strict reconciliation test.

## Open questions

Native compaction is not qualified: the harness model catalog remained 32,768,
while the external experimental admission limit was 8,000. Explicit reasoning
settings still need matching to the ARE arm. The four real paired tasks remain
unexecuted. Work order is in ../DEEPSEEK-COMPARISON-DAG.md.
