# G01 confirmation r8 — evaluator label adjudication before scoring

Status: evaluator-only source analysis after all 24 predictions were sealed at SHA-256 `de79a4336d8e8830d027e037b492e816caac452c7a38e0b0edca941cb1b4c674`; no score had been computed when this rule was recorded.

The first authenticated GitHub compare pass returned 24 complete, exact-identity responses. A subsequent independent direct-tree pass fetched all 24 complete, untruncated passing Git trees and compared their blob OIDs against the pinned failing-commit code-only Git indexes. Nineteen old-source path sets matched the compare output. Five did not (ordinals 1, 3, 18, 21, 23): each GitHub compare response has `status: diverged`, so its `files` list is relative to the merge base and includes source paths that are unchanged between the exact failing and passing snapshots. The direct-tree sets are nonempty for all 24 cases and are the exact failed→passed snapshot deltas specified by the [frozen treatment protocol](G01-BUGSWARM-GRAPH-CONFIRM-R8-TREATMENT-PROTOCOL-2026-10-04.md). Therefore score against the direct-tree path sets for **all 24 cases**, not a mix of compare and tree labels. Do not select the label definition per case based on a model result.

The compare result SHA-256 is `6551cb670fb12c8857937ceb684d6ed68dee90c79a179ffff0dee547b2b7ef73`. Direct-tree result SHA-256 is `ac7afb30a2cc62432551cbecfdcf4bbac0186cf2098975c435fda8f981cc8469`. Both are private evaluator-only receipts under `graph-confirm-r4/evaluator-only/`. The path-set discrepancy is a protocol diagnostic, not evidence of an ARE gain. Direct-tree labels remain patch-path proxies, not proof that each changed file caused the failure.

## Open Questions

- Does independent review agree that direct snapshot deltas, rather than merge-base-relative compare lists, instantiate the frozen label definition?
- Do the post-seal matched scores pass the conjunctive r8 gate? The 23/24 strict-response validity observation already fails one component.
