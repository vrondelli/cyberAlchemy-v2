# Independent amended final review

The bounded amended evaluation is complete. **The joint 15% target remains unmet:**
LongMemEval passes its limited development criterion; ContextBench does not.

Independent replay verified both source freezes, the raw usage audit and native
research records. Total known spending is **1,292,617 model tokens**, including
**4,781 judge tokens**, with no unknown usage. All seven valid ContextBench
predictions were independently reconstructed against retained pinned source trees,
and their native metrics were checked. All 16 LongMemEval rubric outputs were
checked against reported counts.

| Benchmark | Control → treatment tokens | Reduction | Quality | Disposition |
| --- | ---: | ---: | --- | --- |
| LongMemEval | 75,384 → 23,912 | 68.28% | 5/8 → 7/8 correct; 8/8 answers in both arms | Limited development gates passed |
| ContextBench | 626,119 → 567,202 | 9.41% | 3/8 → 4/8 valid; Span-F1 3.66% → 16.07% | Token and full-selection gates failed |

ContextBench's gain is 12.41 percentage points; it does not waive the failed gates.
The single independent LongMemEval history over 8K saved 77.29%, improving 1/2 to
2/2 correct. Four exposed tasks repeated twice and same-model judging limit any
general claim. This ContextBench intervention excludes H72 terminal handles and
does not supersede their earlier confirmation.

Independent timestamp reconstruction confirms **2 + 2** simultaneous local API
request lifecycles in stage1 and **4 + 4** in stage2, with no non-200 generation
responses. This establishes observed capacity, not a causal speedup or a blanket
future guarantee. The original zero-exposure checkout failure, false scaling gate
and all quality failures remain preserved under the explicit amendment.

The successor DAG retains the original small-window objective, 8,000-token request
boundary, 15% cumulative-cost gate and native research method. It separates evidence
validity, stopping/reuse hypotheses and untouched LongMemEval confirmation without
relaxing current criteria. Native work closure records evidence dispositions,
not achievement of the unmet joint target.

## Storage and open questions

Source-dependent reconstruction is complete. Owned source clones remain retained
at review time; subsequent completed-cell cleanup must preserve all receipts,
captures, snapshots, native scores and bindings and receive a separate receipt.
Broader confirmation, ContextBench efficiency and remaining mechanism questions
are owned by [NEXT-ROUND-DAG.md](NEXT-ROUND-DAG.md#open-questions).
