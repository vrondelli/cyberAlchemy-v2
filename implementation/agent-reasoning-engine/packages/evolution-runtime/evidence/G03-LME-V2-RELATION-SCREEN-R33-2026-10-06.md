# G03 LongMemEval-V2 r33: exposed relation-retrieval screen

## Scope and result

This is a private, source-only screen on the **26 already-exposed reserve-development questions**. It reads the pinned r18 question/packet manifest, r31 question-only retrieval plans, r32 retrieval candidates, and trajectory states. It does **not** read evaluator gold, judge responses, or any of the 140 confirmation question fields. It makes no GLM calls. Generated query plans remain untrusted retrieval hints, never reader evidence.

The [r33 selector](../research/g03-beam-r1/screen-lme-v2-relations-r33.py) adds each candidate's immediate source successor and scores observed relations: named page title, named predecessor title, quoted question anchor visible in the state, expanded control, and click-to-post-state. It keeps a bounded lexical-rank tie-breaker. It does not yet build reader packets or extract answers.

The private `RELATION-SCREEN-R33.json` is at `/home/vlad_/are-benchmark-archive/g03-lme-v2-query-plan-run-r30/` (SHA-256 `3fba8409406cc4f35de86e34ae522e98b32247242fcb76940d48d4ad9b9dc269`). Its builder SHA-256 is `71464544aa680aaea428aecc3352603ace89e86e481beec9f4e423b9a6fa655c`. All 26 rows completed; no candidate set was empty. Twelve of 26 top states had a positive relation score; five had at least 30 relation points. These counts are **not** answer reach or accuracy.

This first screen is **superseded**: a subsequent audit found that it used multiple-choice distractors as retrieval intent for one Expense Line question. The corrected [r34–r39 continuation](G03-LME-V2-RELATION-PACKETS-R34-R39-2026-10-06.md) reran the screen with question-stem isolation before any reader calls. The current selector source implements that correction; the builder SHA above identifies the earlier run, not the current source bytes.

Three previously identified source witnesses were recovered without reading gold:

| Exposed question | Observed source witness | r33 position | Remaining issue |
| --- | --- | --- | --- |
| `4dffe641` | Loaner Laptop state 44 → Order Status state 45 in trajectory `013696c4` | 1 | Reader must use the target page's right-side Total field, not a different laptop order. |
| `01307e07` | Full Incidents Filters menu in trajectory `1d56a4d6`, state 11 | 1 | Prior reader omitted a visible exact-set item; whole-control rendering and extraction remain unproved. |
| `83a77f9d` | Expanded forum sort menu in trajectory `2e66df34`, state 2 | tied 1 with two other forum menus | Need a deterministic tie and complete ordered-region rendering before answer scoring. |

The other 14 top states had no positive relation feature. The selector is therefore only a diagnostic candidate, not an admitted replacement for r18, and the failed r18–r21 transfer gate remains failed. No G03 V2 superiority claim is supported. The official LongMemEval-V2 leaderboard additionally uses a fixed reader/judge and latency contract; this GLM-adapted screen is not that protocol.

## Next bounded experiment

On these exposed questions, construct source-only packets for the three relation-witness classes above: entity→destination page, expanded whole-control, and ordered neighbor. Screen packet completeness and ambiguity before any reader requests. Freeze the selector and packet rule, then test answer quality against the existing exposed controls. Only a distinct, prospectively frozen independent reserve cohort can justify opening a new superiority gate; the 140-question confirmation partition remains closed.

## Open Questions

- How should equally ranked expanded menus be disambiguated without consulting answer labels?
- Can one bounded packet preserve all exact-set and ordered-menu items without swamping the reader?
- Do relation features transfer beyond these source witnesses and raise absolute accuracy enough to meet a fresh prospective gate?
