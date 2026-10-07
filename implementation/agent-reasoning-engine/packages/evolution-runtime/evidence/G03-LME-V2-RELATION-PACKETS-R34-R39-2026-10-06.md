# G03 LongMemEval-V2 r34–r39: corrected relation packets and exposed answers

## Result and ceiling

The source-only [r33 screen](G03-LME-V2-RELATION-SCREEN-R33-2026-10-06.md) was corrected before further provider calls: multiple-choice options are no longer treated as retrieval intent. Its first version had spuriously promoted an Expense Line state because a distractor mentioned a dropdown. The corrected private `RELATION-SCREEN-R34.json` (SHA-256 `50abffc2fdd91caa0c628d08dc23b8784bb2906df15fb14a50bcda0687f1e556`) leaves **four** top states with relation score ≥30. The 140-question confirmation partition remained closed.

The [r35 packet builder](../research/g03-beam-r1/build-lme-v2-relation-packets-r35.py) changed only those four exposed-development treatment packets (wire SHA-256 `51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9`). Source packets contained the complete Incidents expanded menu, the Loaner Laptop → Order Status transition with the Total table row, the complete forum sort menu, and the laptop date/duration controls. Gold and evaluator fields were not read by either source builder. Four zero-retry, 8K-admitted private GLM reader calls completed validly; the [r36 reader receipts](../research/g03-beam-r1/run-lme-v2-relation-readers-r36.mjs) were copied cold to `/home/vlad_/are-benchmark-archive/g03-lme-v2-relation-run-r36/` (result SHA-256 `41cf6ab666b286366c036bd863a0db17900275ce336777fe12540563a1811246`).

The exposed reference was accessed **after** the reader freeze. Three deterministic evaluations and two arm-blind, zero-retry GLM-adapted abstention judgments were audited. Both judgments accepted the forum answer. The [final r39 score](../research/g03-beam-r1/score-lme-v2-relations-final-r39.py) is privately archived as `FINAL-SCORE-R39.json` (SHA-256 `fc636212a84ecb8928b679a9ebc8e221920625e3bdf589aa7ca40986644b8b5a`):

| Exposed question | r18 treatment | r35 treatment | Observation |
| --- | --- | --- | --- |
| `01307e07` Incidents Filters | wrong | correct | Complete exact-set menu was present and the reader returned all three labels. |
| `4dffe641` Loaner Laptop Total | wrong | correct | Adjacent source state and complete Total row yielded choice C. |
| `83a77f9d` forum sort | wrong | correct, two agreeing adapted judge votes | “Most commented” is the last observed menu item; the reader abstained from inventing a following criterion. |
| `ca8e070b` laptop duration/date | wrong | wrong | The reader answered true; exposed reference is false. Visible controls alone did not resolve the question correctly. |

Applied only as a **counterfactual on the repeatedly exposed 26-question development cohort**, the new treatment would be **8–9/26** correct versus the inherited lexical control **3/26**, up from r18 treatment **5–6/26**. The 25 resolved pairs have six treatment-only and one control-only success, exact McNemar p=**0.125**. This is descriptive after tuning. It misses the prospective r18 gate of ≥14/26 absolute accuracy, ≥8-answer advantage, p≤0.05, and resolved validity. The failed r18 transfer is not retroactively repaired; no independent superiority or official LongMemEval-V2 claim is admitted.

## Next experimental boundary

The next source mechanism must cover more than four strong relation cases and address answer-operator failures like the laptop date/duration question. Screen source sufficiency separately from reader performance on exposed cases, then freeze a distinct candidate and a fresh, untouched reserve-development cohort before any new superiority gate. Do not open the 140 confirmation questions or relax the failed r18 threshold.

## Open Questions

- Which source relation reaches the 14 exposed cases whose r34 top state has no positive relation feature?
- How should the reader distinguish a visible control from the exact affordance asserted in a true/false question?
- Can the mechanism raise absolute accuracy and beat a strong matched control on a fresh independent question cohort under an 8K/cost budget?
