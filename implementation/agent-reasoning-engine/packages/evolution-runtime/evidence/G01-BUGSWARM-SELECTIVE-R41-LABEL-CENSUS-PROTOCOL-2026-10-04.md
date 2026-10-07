# G01 BugSwarm selective r41 label census protocol — 2026-10-04

Status: prospectively frozen evaluator-only census  
Claim ceiling: population diagnosis only; no benchmark score

## Objective

Complete the label-admission census for r40 slots 16–24 after r40 stopped at
the added-only slot 15. This stage makes no ranking comparison and cannot
repair or qualify the failed r40 denominator.

## Frozen inputs

- raw BugSwarm metadata: `c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d`
- r34 population: `fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c`
- r36 failed-source projection: `14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395`
- r39 rankings: `9466de334f4d0a2ccd38a4db05b38a1bc8c55beb638542c755c509fb5b319cb9`
- terminal r40 label result: `8140eba19fffce0b5613987582faef09d6774281a9d95269ad587666d7c40963`

## Method

For each ordinal 16 through 24, make one request to the same exact GitHub
failed-to-passed comparison endpoint and apply the unchanged r40 identity,
completeness, response-size, and failed-source target-existence rules.

- maximum requests: 9
- automatic retries: 0
- continue through inadmissible cases to measure the full defect rate
- no passing-source checkout, model call, score, or VPS export

The output combines the 15 r40 receipts and nine r41 receipts into a 24-slot
admission census. It reports only admissible/inadmissible counts and reasons.

## Gate

R41 passes as a census if all nine exact requests produce durable receipts and
the combined result accounts for every slot exactly once. It does not make r40
pass.

## Open questions

- Is added-only repair the only target-existence defect in this population?
- Is the remaining admissible subset large enough for explicitly exposed
  diagnostic scoring?
