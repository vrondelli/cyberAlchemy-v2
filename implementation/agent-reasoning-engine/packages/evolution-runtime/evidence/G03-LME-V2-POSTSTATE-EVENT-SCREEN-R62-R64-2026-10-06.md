# G03 LongMemEval-V2 r62–r64: action→post-state source witnesses

## Source-only result

The [r62 event selector](../research/g03-beam-r1/screen-lme-v2-poststate-events-r62.py) resolved observed control IDs against the preceding AXTree, bound each action to its successor state, and carried changed post-state UI groups. It found 3,347 control-resolved events in the verified 200-trajectory R48 public-source pack and returned bounded top-five candidate events for all 26 exposed R35 questions. Its private WSL screen is `/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48/POSTSTATE-EVENT-SCREEN-R62.json` (SHA-256 `dceda7cd3d8cb0d03b19b25828839a5ab3f81c4a864458ac02dc573b71662960`). The screen read question text, public state/action fields, and their verified manifest only; it read no gold, evaluator fields, confirmation questions, model thoughts, credentials, or tool outputs.

R62 put the actual Loaner Laptop `Order Now`→Order Status event third and a Postmill `Save`→updated sidebar event fourth for the two previously diagnosed cases. Its first Incidents-menu result was wrong: it rewarded the question's **excluded** `Edit personal filters` label as an exact action anchor. [R63](../research/g03-beam-r1/screen-lme-v2-poststate-events-r63.py) separated excluded quoted anchors from positive anchors and added explicit action and destination-page cues; its screen SHA-256 is `c62ff057d12aa56fb8fc52a51173679b0629f74899796bded437fd9b9883654d`. The Filters control still lost because its AXTree label included a literal private-use glyph escape. [R64](../research/g03-beam-r1/screen-lme-v2-poststate-events-r64.py) normalized that glyph without changing the pinned inputs; its private screen SHA-256 is `842a7163513f23c7cf02a2b38d6223bea45e8884ebf30d2e71133eab5721fee9`.

R64 ranks these **four previously exposed diagnostic witnesses** first:

| Question | Top source event | Decisive source carried |
| --- | --- | --- |
| `01307e07` | `Filters` open, trajectory `1d56a4d6`, state 10→11 | Complete expanded menu, including all three Incident labels. |
| `1d864942` | `Back`, trajectory `6ea56646`, state 26→27 | Destination title is **Reviews**, not Pending Reviews; the answer decision still needs an exact-predicate check. |
| `4dffe641` | `Order Now`, trajectory `013696c4`, state 44→45 | Order Status table contains the `Total` row and adjacent `-` value. |
| `77258cda` | `Save`, trajectory `2d00b63d`, state 4→5 | Changed complementary profile panel shows the new biography text. |

This is a **post-reference, source-only diagnostic**, not 4/4 answer accuracy, independent transfer, or a broad source-reach pass. All 26 top-five lists being nonempty is insufficient: many static, negative, multi-view, and procedure questions still select merely related actions (for example, a generic Search action for the Magento price-filter question and a forum-creation action for the separate post-downvote question). No GLM reader/judge, fresh reserve, or confirmation call was made. The failed r18–r21 transfer and unopened 140-question confirmation partition remain unchanged. No new superiority claim is admitted.

## Next gate

Retain r64 as an event witness branch, not as the whole benchmark reader. Build a question-operator router that distinguishes action→post-state questions from static closed-set, negative, multi-view, and procedure comparisons. Each branch must return a typed direct-support, contradiction, near-match, or insufficient status with the exact entity/actor/target and bounded source spans. Screen *every* exposed question for answer-bearing source reach before a frozen reader/scorer and fresh prospective reserve cohort. Explicitly test the Magento Back/Pending Reviews predicate and the post-downvote separate-count predicate; a correct source span alone did not prevent earlier wrong GLM answers. Native V2 superiority additionally requires its fixed reader/judge/latency protocol.

## Open Questions

- What source-only coverage criterion across all question operators is strong enough to justify provider spend?
- How will the operator router avoid using question-type metadata that the official memory `query` API does not expose?
- Can exact absence in a complete UI group be certified without confusing absence of evidence with evidence of absence?
