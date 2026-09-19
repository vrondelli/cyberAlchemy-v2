# ARE versus DeepSeek Harness: real 8K pilot

Four fixed exposed ContextBench tasks ran through both harnesses using GLM-5.3-Flash. All eight outcomes are retained. **ARE produced four scoreable context selections; DeepSeek produced none. Neither arm attempted a patch.**

| Task | ARE Span-F1 | ARE File-F1 | ARE tokens | DeepSeek tokens | DeepSeek outcome |
|---|---:|---:|---:|---:|---|
| 1 | 10.82% | 33.33% | 41,285 | 1,143 | 8K admission stopped |
| 2 | 63.42% | 66.67% | 80,384 | 26,050 | 8K admission stopped |
| 3 | 46.50% | 80.00% | 82,314 | 42,861 | 8K admission stopped |
| 4 | 1.60% | 33.33% | 80,513 | 22,163 | 8K admission stopped |

**Total: ARE 284,496 tokens; DeepSeek 92,217 tokens; combined 376,713.** All model usage is known. DeepSeek stopped early, so its lower usage is not evidence of better efficiency. Its scores are unavailable, not zero. There are no valid scored pairs from which to claim relative quality or 15% savings.

ARE averaged 30.58% Span-F1 and 53.33% File-F1. These measure final selected source overlap with the native annotations, not patch correctness. No edit tool was called and no patch was produced in any outcome, despite the common issue-resolution instruction. This fails the original repair-duty objective.

The control is adapted official DeepSeek Harness 0.1.5-rc.2 with matched source tools, terminal selection and private observed GLM transport. The run used a 32,768-token adapter catalog, a 4,800 estimated-token native compaction trigger, and an externally enforced 8,000 measured-token request ceiling including output reservation. That catalog/admission distinction limits claims about stock native-8K behavior. The separate native-8K qualification also failed on the first fixed task: six calls, 22,117 tokens, and a length-terminated 190-token output. Its actual input was 5,034 tokens. This supports further admission/compaction investigation; it does not rescue the missing control scores.

Predecessor pilot 61 failed setup and retained four unknown-cost requests (32,000 conservative reserved tokens). Pilot 62 retained 60,562 known tokens and no valid scores. Earlier compatibility canaries used 23,484 known tokens. These setup costs are separate from this pilot; none are hidden or treated as successful outcomes.

The coordinator reviewed execution. Independent acceptance remains pending. Four exposed development tasks do not clear ContextBench or establish generalization.

## Subsequent instrumentation audit

The proxy incorrectly treated an unpaid window denial as permanent failure and
returned generic HTTP502. The profile also disabled native overflow recovery.
These control failures therefore cannot fairly rank the harnesses. Recovery67
corrects this behavior and passes offline tests; qualification68 tests it live.
Original outcomes and costs above remain unchanged.

## Open questions

- Can native8K control settings produce a valid final context selection?
- Does reserving the full 2K output prevent otherwise useful compaction requests?
- Why do both harnesses investigate without attempting edits?
- Does a matched, valid pair show any quality/token advantage, and does it survive untouched confirmation?

Machine evidence: RESULTS.json, evidence/EXPORTS.json, evidence/FREEZE.json, evidence/CAMPAIGN-SETTLEMENT.json, and scores/*-native.json.
