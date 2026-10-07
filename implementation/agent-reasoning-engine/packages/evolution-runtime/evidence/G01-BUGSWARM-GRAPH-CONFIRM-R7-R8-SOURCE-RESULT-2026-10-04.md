# G01 reserved confirmation r7/r8 — candidate and packet source gate

Status, 2026-10-04: **source-only candidate and packet construction passed 24/24; tokenizer and generation have not run.** No gold, score, passing-commit code, or provider response was opened.

The unchanged development-r3 test-edge rule was transferred over the sealed r6 graph rankings. It produced 24 complete rankings, identical full file sets, and passed exact source-tree checks. Its `TEST-EDGE-RANKINGS.jsonl` SHA-256 is `e59b008fbde1ed1934d057e1c46fc7174dd1570ef98c797eb44f29161dd984d0`; seal SHA-256 `f2b2e8bf0d871875bb555c486ae866e3fd32050ba5ef0fe5848e21b3b96ec641`.

The [prospectively fixed r7 rule](G01-BUGSWARM-GRAPH-CONFIRM-R7-CANDIDATE-PROTOCOL-2026-10-04.md) preserved each graph/test-edge top-30 union, then applied the exposed development failure-line, test-alias, and rare-stem strata using authenticated original failure logs. All 24 source-only candidate lists passed identity and uniqueness checks; they contain 1,068 candidate placements in total, 218 stratified additions, and at most 80 candidates per case. The sole 50-file union took 30 rather than 31 additions under the predeclared cap. Candidate bytes SHA-256: `91784df7b72cae7502bd742248ac7b1d499e33d27a62ed265a936e7b0caa5056`; seal SHA-256: `f0b38a2157995ad763ce6aa4e327ac0ccbe900bc0f98f41596e7441865d1c364`.

The unchanged deterministic query-overlap excerpt rule built 24 raw-listwise GLM packets. Maximum prompt size is 19,619 UTF-8 bytes, below the fixed 24,000-byte cap; maximum candidates is 80. Packet bytes SHA-256: `f311bb898823756015e5a0cc4ea2d1918ed29f0cbabafcc283e13623188cd5b5`; seal SHA-256: `20b43fcb0d3d5de2ed17222848eb58f0d4298a5222a3eaff0c5ce48e07d9e682`. The private artifacts are under `/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r4/{rankings-r7,candidates-r7,packets-r8}`.

Next: same-account tokenizer admission on the VPS, one raw-listwise GLM call per admitted case, prediction seal, then evaluator-only authenticated labels and matched scoring under [the prospective r8 gate](G01-BUGSWARM-GRAPH-CONFIRM-R8-TREATMENT-PROTOCOL-2026-10-04.md). Source-only candidate counts are not gold reach or accuracy results.

## Open Questions

- Do all exact prompts fit the same-account 8K token limit?
- Can all 24 generated responses satisfy the strict JSON contract without transport failure?
- Does the untouched, authenticated matched score clear the fixed quality gate?
