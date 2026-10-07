# G01 Defects4J 32-case r1 result

Follow-up: [fresh r2 confirmation result](G01-DEFECTS4J-32-R2-RESULT.md).
The corrected decoder passed 32/32, but candidate reach limited Hit@3 to
20/32 and the frozen composite gate failed. The next step is source retrieval,
not further decoder repair. The original r1 result below is unchanged.

Status: strict prospective gate failed; format-corrected diagnostic shows a
large quality improvement requiring a fresh confirmation cohort. Protocol:
[frozen r1](G01-DEFECTS4J-32-R1-PROTOCOL.md). Source supply and earlier arms:
[source record](G01-EXTERNAL-TRACE-SUPPLY-DEFECTS4J-2026-10-06.md).

All 32 exact buggy worktrees and recorded traces were used across 16 projects.
The Java adaptation of ARE and pinned official RepoMap code have identical
candidate counts, zero omitted Java files, and a 20,000-character source cap.
Packets use their top-ten union plus stack matches; at most 20 candidates
were present per case. Reciprocal rank fusion is a model-free comparator
over the same union. All 32 packets admitted under same-account 8K tokenization.

The VPS completed 32/32 generation requests with zero retries, using 76,736
prompt and 962 completion tokens. Only 17 responses passed the frozen integer
ID validator. Every other response supplied exact decimal IDs as strings,
sometimes bracketed (for example `"4"` or `"[9]"`). A separate deterministic
decoder converted only these unambiguous references, preserving order,
range and uniqueness, and was sealed **after response-format inspection but
before gold access**. It admitted all 32. The original strict arm and gate
remain unchanged. This identifies an output-contract problem: the prompt
did not explicitly require integer IDs, while the validator did.

All predictions and the separate format correction were sealed before
Defects4J modified-class labels were opened. All labels mapped successfully
to exact buggy-source paths. These labels are human-fix modified files, a
proxy for localization rather than proof of semantic root cause.

| Arm | MRR@8 | Hit@3 | Gold-file Recall@8 |
| --- | ---: | ---: | ---: |
| Java adaptation of ARE rank_sources | 0.26935 | 14/32 | 0.57813 |
| Pinned official RepoMap code, adapted Java projection | 0.20837 | 8/32 | 0.43750 |
| Stack-frame locator | 0.21875 | 7/32 | 0.18750 |
| Rank fusion | 0.35138 | 14/32 | 0.54167 |
| GLM, frozen strict integer decoder | 0.31250 | 12/32 | 0.35938 |
| GLM, separately sealed format correction | **0.68750** | **25/32** | **0.71354** |

The strict arm failed every quality criterion: its MRR delta versus fusion
was -0.03888, and project sign-flip p was 0.71619. The format-corrected arm
gained +0.33612 MRR over fusion, with 13 project wins, no project losses,
and descriptive exact project sign-flip p=0.00024414. Against RepoMap its
delta was +0.47913, 14 project wins, no losses, and descriptive p=0.00012207.
Those diagnostic values are encouraging, but the decoder amendment cannot
silently replace the frozen strict arm or turn its failed gate into a pass.

Private WSL evidence is under
`/home/vlad_/are-benchmark-archive/defects4j-rerank-r1/`:

- `PACKETS.jsonl`: SHA-256 `1bbdeee861116ad55f10c44a78dfcba71e9cbe88f2ccabf0bcbaffe462bdae50`.
- `GENERATION-RESULT.json`: `50b12a46b05e6ee6f9ef9f3e8e5dd7b7b6f4bfa87b842aaf619b99c791f8d45b`.
- `NORMALIZED-PREDICTIONS.json`: `9af63a88ebad3d342c56f739862d5514a4b46adb3c1d5406969d8000e3093c2d`.
- `PREDICTION-SEAL.json`: `2095fcbb26ff99fe60b6673ff4f678e91c2bdce83966762c727787f2f325ad5e`.
- `SCORE.json`: `f5965c8aafdd334d4d291b130c02e54465e5f4c9152074cee7b5387a3ec61c3a`.

The VPS stage is `/opt/are-benchmark-runs/g01-defects4j-rerank-r1/`; the WSL
cold copy includes every tokenizer and generation response. Source scripts:
[Java ranker](../research/arb-trace2code-r1/ranked-source-acquisition-java-r1.mjs),
[packet builder](../research/arb-trace2code-r1/build-defects4j-rerank-r1.py),
[VPS runner](../research/arb-trace2code-r1/run-defects4j-rerank-vps-r1.mjs),
[format decoder](../research/arb-trace2code-r1/normalize-defects4j-r1-ids.py),
[scorer](../research/arb-trace2code-r1/score-defects4j-rerank-r1.py).

Next: freeze the corrected decoder and explicit integer-ID prompt, select a
fresh source-order cohort without examining its labels, and repeat all arms
under the same quality criteria. A later integration check must show this
candidate operating inside a live ARE episode. This adapted public Java
comparison supports no cost win, official benchmark leaderboard claim, or
product-wide superiority claim.

## Open Questions

- Does the corrected output contract preserve the gain on fresh cases?
- Does the gain survive a live ARE episode and another language population?
- Can stronger symbol-bearing RepoMap projections change the comparator result?
