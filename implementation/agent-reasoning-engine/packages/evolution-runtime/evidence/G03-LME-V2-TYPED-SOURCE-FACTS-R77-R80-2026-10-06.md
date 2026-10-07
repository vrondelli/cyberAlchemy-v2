# G03 LongMemEval-V2 r77–r80: typed source-fact screen

## Source-only result

The r77 compiler introduced conservative evidence states—`directly_supported`,
`contradicts_premise`, and `near_match`—with question-text operator parsing and
exact public trajectory coordinates. It scanned the pinned 200-trajectory
small haystack for complete tablists and expanded sort controls, then used
the already frozen r61 UI, r64 action→post-state, and r75 observed-path
screens. The r78 correction strips AXTree icon codes from control labels and
checks the actual post-`Back` Reviews grid before certifying a destination
mismatch. R79 exposed a coverage bug in the group parser: it omits long tables.
R80 parses the full table boundary and checks **the Status column**, finding
an Approved review after `Back`; a mere page-title mismatch or unrelated
gridcell was not treated as proof.

Across all **26** exposed reserve-development questions, r80 emits **4
directly supported, 3 contradicted premises, and 19 near matches**. The
supported or contradicted cases cover: the complete Filters substring set,
Magento Back destination, Loaner Laptop Order Status Total, the scoped Order
View tablist, oldest-order pagination, same-page biography sidebar change,
and the expanded forum-sort list. This is **7/26 source-fact coverage**, not
7/26 answer accuracy. Nineteen operators or source scopes remain unresolved;
the candidate fails the broad source-reach screen and is **not admitted to a
GLM reader run, independent transfer, or confirmation**.

The private r77 and final r80 WSL receipts are respectively
`/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48/TYPED-SOURCE-FACTS-R77.json`
(SHA-256 `7fcd467004415dd3bf7a31b55e87498579c9563ce158061e3d0c99fbefd36775`)
and `TYPED-SOURCE-FACTS-R80.json` in the same directory
(SHA-256 `97217d5d5a03084ad1323b7294c168ac08db1ba61159273ac4df57be86f7bf15`).
The implementation is [r77](../research/g03-beam-r1/screen-lme-v2-typed-source-facts-r77.py)
through [r80](../research/g03-beam-r1/screen-lme-v2-typed-source-facts-r80.py).
Inputs were pinned by SHA-256. No gold, evaluator, question-type metadata,
confirmation question field, credential, or model thought was read by the
screen. The score is not a superiority result and the r69–r74 reader's 6/26
development result is unchanged.

## Consequence for the next candidate

The seven source facts show that exact set extraction and scoped transition
inspection can prevent three observed reader failures. They do not address
the benchmark's wider procedure, gotcha, cross-view, and absent-affordance
questions. A question-specific expansion of hand-written patterns against
the exposed answer set would not supply credible transfer evidence.

The next research candidate should index reusable trajectory knowledge at
insert time—raw state slices, transition events, and goal/path or workflow
notes—and select complete state scopes at query time. It must distinguish an
observed path from a successful procedure, and a missing control in one state
from absence in the applicable view. An all-26 exposed source-reach audit
should precede a frozen fresh reserve transfer. The official
[LongMemEval-V2 repository](https://github.com/xiaowu0162/LongMemEval-V2)
defines the native fixed-reader and accuracy–latency protocol; our custom
GLM-adapted development score cannot be relabeled as a leaderboard result.

## Open Questions

- Which of the remaining 19 questions have enough public trajectory evidence
  for a complete answer, and which are fundamentally image- or state-limited?
- Can a reusable state-scope selector cover multi-view and absent-affordance
  cases without answer-key-specific rules?
- What independent reserve cohort and fixed-reader configuration will make
  the next claim comparable and statistically defensible?
