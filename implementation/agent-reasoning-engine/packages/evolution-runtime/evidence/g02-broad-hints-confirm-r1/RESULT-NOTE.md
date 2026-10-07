# G02 broad hints — fresh matched NodeBB pair, joint gate failed

The source-only task `SWE-Bench-Pro__javascript__maintenance__bugfix__e31ec45c`
was fixed before looking at its gold. The task file was extracted using only
eight input columns; no gold, patch, or tests were mounted for generation.
ARE and DSH ran the same pinned NodeBB commit with the same GLM credential.
Both arms settled with a valid final context selection and known model usage.

| Arm | Span-F1 | File-F1 | Model tokens | Wall seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE broad hints, 20-call cap | 0.36282668 | 0.53333333 | 67,206 | 126.99 |
| DSH control | 0.31618991 | 0.55555556 | 260,281 | 157.15 |

ARE improved Span-F1 and used fewer tokens and less time, but missed the
strict File-F1 gate. No four-way win or broader G02 claim follows. The ARE
prediction selected four files, all gold; DSH selected seven, five gold.
The extra DSH hit was `src/posts/index.js`, which ARE had not delivered.

An input-format diagnostic after scoring found that this task's
`problem_statement` contains literal `\\n` sequences and enclosing quotes,
not newline characters. The clause splitter used by the broad-primer overlay
therefore treated the whole issue as one long clause and truncated it at
1,024 bytes. The first captured prompt did contain the primer, but only six
unique hints were generated. This is a general parsing defect in the
intervention, not evidence that a full multi-clause primer failed. The next
development screen may normalize this source-only field before clause
splitting; this task is now exposed and cannot serve as confirmation again.

The ARE [receipt archive](G02-BROAD-HINTS-CONFIRM-ARE-RECEIPTS.tar.gz) has
SHA-256 `fb48092923e38b5f698917de5c56c26f5ffc6275d9716ab82025d54d7ed6f5e7`.
The DSH [receipt archive](G02-BROAD-HINTS-CONFIRM-DSH-RECEIPTS.tar.gz) has
SHA-256 `92d48fed5120a626371371671cd715be55712ab75c4dc328550d140e0377a789`.
Both exclude source checkouts and credential values. VPS run root:
`/opt/are-benchmark-runs/g02-broad-hints-confirm-r1`.

The reused ARE launcher wrote the exposed task's DSH thresholds into its
`STARTED.json`; those stale numbers are metadata only and were not used for
this pair's scoring or comparison. The table above uses the same-instance
DSH export and native score.

## Open Questions

Does safe normalization of double-encoded issue text improve acquisition
enough to clear both quality metrics while retaining the token/time gains on
an untouched cohort?
