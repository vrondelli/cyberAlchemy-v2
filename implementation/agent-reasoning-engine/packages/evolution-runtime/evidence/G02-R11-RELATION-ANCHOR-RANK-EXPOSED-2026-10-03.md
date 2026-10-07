# G02 r11 relation-union issue-anchor rank: exposed rejection

Status, 2026-10-03: **rejected exposed development screen; no model call,
actual ARE read, native rescore, or independent claim**.

The [source-only ranker](../research/g02-product-r4/rank-g02-r11-relation-union-exposed-r1.py)
consumed only the sealed 12-task relation union (SHA-256
`7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291`),
the corresponding already-exposed task issue texts, and pinned base source
files. It verified instance/issue/base identity, removed checkbox checklist
lines, extracted backticked and code-like issue anchors plus title terms,
and scored each eligible candidate by code/issue term overlap with
within-pool IDF, path-token overlap, direct import/include relation, and
file-size normalization. A fixed minimum score of 3 and at most three
proposals per task were applied; no gold, DSH output, or score was loaded.
The write-once private `SOURCE-RANK.json` seal is SHA-256
`9a6fd0b65727141de0572ae8825dbd690ba263f6e024dcda10b32d0abb72fc05`.
It proposed three files on each of tasks 1–11 and abstained on task 12.

Only after that source seal, the separate
[evaluator-only audit](../research/g02-product-r4/audit-g02-r11-relation-anchor-rank-exposed-r1.py)
opened the pinned native labels and checked archived ARE prediction/native
file-score parity. Its predeclared development gate required at least six
new gold hits, proposal precision at least 0.5, additive mean File-F1 gain
at least 0.03, and no negative repository mean delta. The audit found **one
new gold hit in 33 proposals**, with **32 false positives**. Additive
mean File-F1 fell **0.535975 → 0.331692** across all 12 exposed tasks;
one task improved, nine regressed, and two tied. Ansible, Django, and Sympy
repository means regressed; the C++ mean improved only in this set-based
counterfactual. The fixed gate failed. The private `EVALUATOR-AUDIT.json`
receipt is SHA-256
`f69998963988eb005576e724e475e5f561c4e13571098d98ec627d6ee079d07e`.

The high-recall relation union did not make generic issue-word overlap a
usable read policy. In particular, the source threshold barely abstained,
so relation presence plus lexical evidence was not selective enough. No
threshold retuning on these opened labels is permitted as independent
evidence. A future candidate needs a separately versioned, source-grounded
code-element or interaction-specific mechanism, then an exposed development
screen and full ARE episode check before any untouched matched cohort. The
negative result cannot support a G02 superiority claim.

## Open Questions

- Which structural code-element links can sharply reduce candidate count
  while still covering missing files across Python and C++ strata?
- Can an abstention rule be calibrated without repeatedly optimizing to
  these same exposed labels, and then tested on a distinct cohort?
