# G01 Defects4J production-aware r3 fresh-case result

Status: strong prospective MRR improvement, but the frozen composite gate
**failed** on the six-hit relative advantage. Protocol:
[r3 freeze](G01-DEFECTS4J-32-R3-PROTOCOL.md). Development predecessor:
[production-aware reader](G01-DEFECTS4J-PRODUCTION-DEV-R1-RESULT.md).

All 32 source-order cases across the same 16 Git projects were retained, with
zero case overlap with r1 and r2. These are held-out cases, not held-out
projects. All exact buggy worktrees were clean. ARE and pinned official
RepoMap had equal Java candidate counts and raw-source projection digests,
with zero omitted files. Both original and production-filtered retrieval arms
and both fusion arms were frozen before generation and gold access.

The initial policy was frozen before cohort selection. Before provider requests,
a technical input-admission correction raised the private ranker's internal
query guard from 1,024 to 16,384 bytes because the complete eight-frame view
could reach 1,362 bytes. No query was truncated and no scoring/tokenization
rule changed. Prior admitted-query rankings matched exactly; all complete fresh
views ranked successfully. This does not change the native ARE tool schema
or demonstrate live integration. The final amended protocol was pinned in
the runner before tokenizer/generation calls.

All 32 tokenizer admissions and generation requests were valid. Complete
predictions, source bindings and runner/protocol hashes were checked and sealed
before the first r3 modified-class label read. Every label mapped successfully.

| Arm | MRR@8 | Hit@3 | Gold-file Recall@8 |
| --- | ---: | ---: | ---: |
| Original Java ARE | 0.27455 | 14/32 | 0.59821 |
| Production-filtered ARE | 0.54587 | 20/32 | 0.79018 |
| Original adapted RepoMap | 0.19740 | 8/32 | 0.34821 |
| Production-filtered adapted RepoMap | 0.27842 | 9/32 | 0.59821 |
| Stack locator | 0.28125 | 11/32 | 0.34375 |
| Original retrieval fusion over treatment union | 0.39063 | 18/32 | 0.72321 |
| Production-aware fusion over treatment union | 0.60707 | 22/32 | 0.75446 |
| GLM on production-aware candidates | **0.79688** | **27/32** | **0.82143** |

The MRR gain over the strongest comparator, production-aware fusion, was
**+0.18981**, with exact two-sided project sign-flip **p=0.00390625**:
nine project wins, zero project losses and seven ties. All MRR deltas exceeded
.10. All four prespecified RepoMap/fusion project-p requirements passed, as
did Hit@3>=24/32 and complete mapping. However, GLM had only **five** more
Hit@3 successes than the strongest comparator (27 versus 22), rather than
the required **six**. Thus `gate_passed=false`. No threshold was relaxed and
this result must not be called a passed preregistered superiority campaign.

## Failure attribution and next mechanism

Follow-up: [caller-context source screen](G01-DEFECTS4J-CALLER-CONTEXT-SCREEN-2026-10-06.md)
reaches 30/32 exposed cases versus 28/32 for two matched-width controls.
This is development reach only; the frozen r3 failed gate remains unchanged.

A separately written post-score diagnostic found 28/32 candidate unions
contained any gold file. GLM succeeded at Hit@3 on 27 of those 28. Four misses
were candidate retrieval; one was reranking. This is diagnostic attribution,
not additional confirmation. The source-order cases are now exposed.

Next: evaluate a general caller-evidence mechanism across the complete exposed
cohort. Derive bounded exact-buggy source observations around retained Java
frame locations, use caller symbols/references to improve production-file
candidate reach, and improve evidence windows rather than relying primarily
on package/import headers. Keep the stronger production-aware baselines.
Screen source reach and bounded reader quality before any new fresh cohort.
Do not repeat this unchanged policy on more fresh cases merely to obtain the
missing sixth hit, and do not tune a rule for the single named reranking miss.

## Cost and evidence

32 tokenizer calls and 32 generation calls, zero generation retries;
84,186 generation prompt tokens and 944 completion tokens. Sum of generation
response elapsed times: 53,510 ms. Source acquisition, indexing and tokenizer
time are separate; no all-in cost superiority over zero-model baselines follows.
All bounded VPS response receipts were archived in WSL; credentials and
reasoning records were not copied.

Private WSL root: `/home/vlad_/are-benchmark-archive/defects4j-production-r3/`.
VPS root: `/opt/are-benchmark-runs/g01-defects4j-production-r3/`.
The generation result's SHA-256 matches the VPS copy.

- Cohort manifest: `5557e042a5e3a1d5b58f9793d01c58941fbcc4b8067e36de918226a727ffcf32`.
- Final protocol: `bed29bfba7483bd82809c1a77e95b0142f0e23dd8d9414072602f1f3181ce104`.
- `PACKETS.jsonl`: `2ef2d9726c8b7117053b0c2fae945c62f210ff919309801db2b439a20a5dc139`.
- `GENERATION-RESULT.json`: `6ba3b7a58042438b7971f5a7b2e92dd0e900c34e11acc25044e96820cc37f0de`.
- `PREDICTION-SEAL.json`: `a88cbb27a232fb67654f64a1428c7b25cfdef10dec01a3a22f4b712f463a5646`.
- `SCORE.json`: `5ffdbcf100130667661b87d6c8d58f99039ca73faf125fa4d633567dce04b0e1`.
- `CANDIDATE-REACH-DIAGNOSTIC.json`: `276116b2ed3c46faab3a727cd77cd11f357ac4bc13fcc3c2d1cbe6bab86b41ee`.

Sources: [packet builder](../research/arb-trace2code-r1/build-defects4j-production-r3.py),
[runner](../research/arb-trace2code-r1/run-defects4j-production-vps-r3.mjs),
[scorer](../research/arb-trace2code-r1/score-defects4j-production-r3.py).
Decoder/production-selection tests passed (3/3), source scripts compiled,
runner/ARE-seal syntax checks passed, and metric/sign-flip toy checks passed.

## Claim boundary and Open Questions

This result concerns public Java human-fix modified-file localization using
an adapted file-text RepoMap projection. Possible pretraining exposure,
trace-path cues and same-project case holdout remain caveats. It does not
prove semantic root cause, ContextBench Span-F1, official leaderboard results,
symbol-bearing baseline superiority, cross-language or unseen-project transfer,
live ARE operation, all-in cost wins, or product-wide superiority. G02/G03
remain separate campaigns; the full active goal is not complete.

- Can caller-source observations improve missing-file reach generically?
- Can richer bounded source windows improve the remaining reachable miss?
- Will a new frozen mechanism pass the unchanged stronger gate on fresh data?
- What gains survive symbol-bearing baselines and a live ARE episode?
