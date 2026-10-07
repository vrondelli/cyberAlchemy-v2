# G03 LongMemEval-V2 r75–r76: trajectory-first source screen

## Result

The pinned [official LongMemEval-V2 method description](https://github.com/xiaowu0162/LongMemEval-V2)
uses distinct raw-state, transition-event, and workflow-note evidence pools.
The local r75 experiment applied that architectural idea without importing
benchmark answers or model thoughts: it indexed **200** public-source
trajectories as observed-goal/action/page notes and ranked the top five notes
for each of the **26** exposed reserve-development questions. Its private WSL
receipt is
`/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48/TRAJECTORY-NOTES-R75.json`,
SHA-256 `e6bc27cf3c7c76c184d1c4d84994c7c6e9bda476bc2da5a003823c97b805e270`.
The notes are *observed paths*, never certified successful procedures: the
source pack has no trajectory success field.

The r76 hierarchy then restricted whole-UI-group ranking to the r75 top-five
trajectory candidates per question. It read **69** distinct candidate
trajectories and returned nonempty top-five groups for all 26 questions. Its
private WSL receipt is
`/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48/HIERARCHICAL-GROUPS-R76.json`,
SHA-256 `9e0c16cb2ab20a86421e11f03a614363bae439c26db363bb0d4750fa2e45dc1d`.
Both screens used only question text/domain and pinned public trajectory
fields. They read no gold, evaluator, question-type metadata, confirmation
question field, credential, or model thought.

The source screen found useful new paths: the question about reaching the
oldest order ranks an observed `My Orders > Page 4` trajectory first, and the
image-submission question retrieves a `Create submission` state. But **nonempty
is not answer-bearing reach**. The image state has `Image` radio unchecked;
its form cannot establish the absence of a local upload field after selecting
Image. The Loaner Laptop Total question's top trajectory note is an unrelated
dashboard-chart task, and the Expense Lines returns question still ranks
navigation and protocol content above the asked field. The shared-approvals
question's top five regions cover Problem and Change Request, not a complete
three-form comparison. The exact r75/r76 candidate is therefore **not
admitted to a reader run or independent transfer**.

## Next mechanism

Build typed, *scope-complete* source facts from the already indexed trajectory
states and transitions. For each question, identify the exact entity, page,
control, and requested state (including selected radio/menu and post-action
state), then return `direct`, `contradicts_premise`, `near_match`, or
`insufficient` with source coordinates. Multi-view questions require all named
views; negative claims require a complete scoped control or repeated
equivalent state, not merely absent text in a top-k snippet. Screen the full
26 exposed questions before any new GLM requests. The failed r69–r74 6/26
reader result and closed 140-question confirmation set are unchanged.

Scripts: [r75 note screen](../research/g03-beam-r1/screen-lme-v2-trajectory-notes-r75.py)
and [r76 hierarchical group screen](../research/g03-beam-r1/screen-lme-v2-hierarchical-groups-r76.py).

## Open Questions

- How many exposed questions have a complete answer-bearing source in the
  200-trajectory small haystack, independent of ranking?
- Which UI groups can be treated as complete when state changes reveal
  conditional controls or screenshot-only elements?
- How should source-fact status be represented so the fixed reader receives
  evidence, not a benchmark-specific answer rule?
