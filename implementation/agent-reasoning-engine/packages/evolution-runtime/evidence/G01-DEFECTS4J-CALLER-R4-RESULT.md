# G01 caller-informed fresh r4 — 2026-10-06

The frozen confirmation gate **failed**. All30 provider responses were valid;
two criteria failed: only three additional top-three hits versus the strongest
baseline, and one modified-class label absent from the exact buggy tracked tree.
No superiority claim, threshold relaxation or retrospective pass is supported.

## Preliminary numeric readout

Metrics below use successfully mapped gold files. Because the mapping criterion
failed, they are an incomplete-label readout, not a valid complete confirmation.

| Comparator | MRR@8 | Hit@3 |
|---|---:|---:|
| GLM caller-informed reader | 0.80556 | 27/30 |
| Caller production ARE | 0.65667 | 22/30 |
| Caller unfiltered-RepoMap fusion | 0.62750 | 24/30 |
| Caller production fusion | 0.59865 | 22/30 |
| Original production fusion | 0.55865 | 22/30 |
| Caller production RepoMap | 0.51056 | 18/30 |
| Caller unfiltered RepoMap | 0.34786 | 15/30 |

MRR deltas exceeded .10 against every comparator. All preregistered RepoMap/
fusion project-sign-flip p values passed .05: caller unfiltered fusion .001953125,
caller production fusion .00244140625. Against caller production ARE, p was
.05078125: do not round this into statistical significance or assert significant
superiority against every comparator. Absolute Hit@3>=24 passed; relative Hit@3
advantage>=6 failed (27−24=3). GLM mapped-file mean gold recall@8 was .88333;
that value excludes an unmapped class and must not be treated as full-label recall.

## Attribution and label-validity issue

Post-score mapped-file candidate reach was28/30 before and after caller expansion:
no gains or losses on this fresh cohort. Two misses were retrieval, one reranking:

- JacksonCore-7: no caller observations; gold is outside the final union but
  inside expanded-query ARE top20.
- JxPath-8: one caller observation; gold absent from both final union and
  expanded-query ARE top20.
- Time-7: three caller observations; mapped gold reachable but reader failed Hit@3.

JxPath-7 has five modified-class labels. Four map uniquely; the fifth,
`CoreOperationRelationalExpression`, has neither package-suffix nor basename
match in the exact buggy tracked tree. No fixed revision or patch was opened to
explain its origin. This is a label-to-buggy-corpus representability problem,
not a parser error demonstrated by the evidence. Preserve the original failed
score. Do not drop the class/case, add fixed source to candidates, or retroactively
repair the confirmation. The diagnostic reports mapped-file reach and flags the
incomplete case separately.

A later bounded fixed-string diagnostic found no occurrence of
`CoreOperationRelationalExpression` anywhere under this buggy checkout's
`src/java`. This strengthens the observed absence but does not establish when
or how the class was introduced; no fixed source or patch was opened.

## Execution and provenance

30 fresh cases, 15 previously seen projects, zero overlap against96 earlier cases.
JacksonXml was exhausted in the source census and omitted without replacement;
the absolute24 and relative6 requirements were retained. Csv-7 had zero first-
failure non-harness frames and stayed in the denominator with empty stack/caller
evidence. All30 source counts/digests agreed across comparator corpora. The policy
delivered39 snippets on22 cases, eight with none, and every snippet included its
trace line. Observed maximum24 candidates.

Provider usage:102,523 prompt and1,214 completion tokens. Sum of generation
request times109,097ms; tokenizer8,845ms. No retries. Every prompt+512 fit8192.
Source remained in WSL; only bounded packets/protocol/receipts went to the VPS.
Prediction seal was written before first fresh label access. WSL/VPS generation
result digests match. Six fresh-policy tests, selector parity and compilation/
syntax checks passed. These component times are not an all-in cost comparison.

Evidence:

- [Frozen protocol](G01-DEFECTS4J-CALLER-R4-PROTOCOL.md):
  `cb3d0cde7f3aa5b2bfcb2034bceb1248116348ba3d017be7d91d1ae66ec2588a`.
- [Packets](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/PACKETS.jsonl):
  `9cf325c8e3cf2c805214e8f48572e20432860d4ab65f17576ecb7cae91ca99dd`.
- [Generation](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/GENERATION-RESULT.json):
  `8ec2ef0d22367e22c3413bee76af587d18f1cd421e0b6cf4d6ee40082ff5f732`.
- [Prediction seal](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/PREDICTION-SEAL.json):
  `d6a861322ae99bf68bbf9d7a5572b78bf28493eab5a26b2da74e1fa9805505df`.
- [Immutable score](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/SCORE.json):
  `b45d7e57f34f68c5a67d4ec6ff66611113d1c526c633975794c9491bd2e3e2aa`.
- [Post-score diagnostic](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/REACH-DIAGNOSTIC.json).

## Open Questions and next development boundary

The r4 policy is terminal; its cases are now exposed development, never fresh
again. Before another confirmation, develop broader source-only retrieval and
stronger evidence-window coverage over full exposed cohorts, with matched-width
and caller-informed comparator controls. Do not spend on an unchanged fresh
cohort hoping for a favorable gate. Separately define a prospective corpus/gold
representability contract that does not require opening fresh labels before
prediction; score missing targets explicitly without post-result exclusions.
Any changed evaluation contract requires separate prospective admission and
cannot repair r4. Same-project/public training exposure, file-only RepoMap,
modified-file proxy labels, live ARE and total cost remain limitations.
G02 still trails DSH; broader G03 transfer remains unresolved. The broad goal
remains active; the bounded G03 five-type approved claim does not generalize here.
