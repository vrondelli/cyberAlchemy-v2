# G02 r11 hybrid source shortlist — exposed rejection

Status, 2026-10-04 UTC: **rejected before any GLM call or actual ARE read**.
This is development on the already exposed r11 tasks, not an independent
campaign or superiority result.

The [source-only sealer](../research/g02-product-r4/seal-g02-r11-hybrid-shortlist-exposed-r1.py)
(SHA-256 `9cb8fe75d068d122c5216ef58c9db818d07e3238401127bc7bf9e79f81457ef6`)
verified the fixed 12-task relation union, task/issue/base-commit identities,
and exact WSL source-file sizes. It decoded the two JSON-string issue values
only when valid, then ranked read-cap-eligible relation candidates using
issue-to-code BM25, filename term IDF, and fixed direct-relation priors.
The top 12 per task formed a 144-file **chooser shortlist**, not proposed
ARE reads. It accessed no native label, DSH output, score, or model response.
The write-once private `SOURCE-SEAL.json` SHA-256 is
`1ebc6cf69ee9032415d754130054c6f3fe864a850d586a76538a23ed0dbd31e8`
under `/home/vlad_/are-benchmark-archive/g02-r11-hybrid-shortlist-exposed-r1-20261004/`.

The separate [evaluator-only auditor](../research/g02-product-r4/audit-g02-r11-hybrid-shortlist-exposed-r1.py)
(SHA-256 `a92efd1a5418e30a2405d36d7c1a1b22d82faa36f61b70b76914cd2f1242983f`)
verified all source and label pins and exported counts only. Of the 12
read-cap-eligible missing gold files in the union, **5** appeared in the
144-file shortlist, across **three** repositories: Ansible 3, nlohmann/json
1, Sympy 1, Django 0. The predeclared model-spend gate required at least
**6/12** eligible hits across at least two repositories, so it **failed**.
`EVALUATOR-AUDIT.json` SHA-256 is
`80ba64e152dcd467545ce5413e03c775e1584606be77b3ebcffc43f15db64358`.

Five hits in 144 candidates do not establish that GLM could choose them
within a three-read limit. This version must not trigger chooser calls or a
fresh G02 cohort. The source-only lexical/graph shortlist has not solved the
selective localization problem: seven eligible files are still absent from
the packet, and the prior live code-anchor episode showed that adding
apparently relevant reads can worsen native File-F1 and Span-F1. Do not
lower the gate or tune this version against the now-opened audit counts.

## Separately sealed rank-depth diagnosis

A [source-only r2 depth sealer](../research/g02-product-r4/seal-g02-r11-hybrid-depth-exposed-r2.py)
(script SHA-256 `febb063d5820dee0dec617577b3c9492fdbe8d8e90fc4d30a16c678e662cc555`)
reran the *unchanged* r1 ranking function on the same 12 exposed tasks. It
verified task, issue, base commit and source-file sizes, pinned the r1 script
and source seal, and reproduced every r1 top-12 list exactly. It sealed
top-96 all-file rankings **before** opening labels at private source SHA-256
`7e2c65289f0dd8e45822dd313c037945d48ba6e45fe4825fef5cea19f7453a63`.
No DSH output, native gold, model response or score entered the sealer.

The separate [evaluator-only depth audit](../research/g02-product-r4/audit-g02-r11-hybrid-depth-exposed-r2.py)
(script SHA-256 `215d8171e479d7942988db07170e371d0fd0a52866adc9d656976b7fddc02335`;
private receipt SHA-256
`95ccfb61ad950a38bded59c0365c89d9d1f05f6dee310ff20964dd79180ebb79`)
found the following cumulative coverage of the **same 12 read-cap-eligible
missing gold files in the relation union**:

| Per-task ranked depth | Candidate paths across 12 tasks | Eligible gold reached |
| ---: | ---: | ---: |
| 12 | 144 | 5/12 |
| 24 | 288 | 7/12 |
| 48 | 576 | 9/12 |
| 96 | 1,136 | 12/12 |

At depth 24, hits span Ansible, nlohmann/json, and Sympy; Django remains
zero because this union has no eligible missing Django gold. The unchanged
ranker therefore has a **cutoff problem as well as a candidate-generation
problem**: two additional eligible files lie at ranks 13–24, but ten of the
22 total missing gold files remain outside the read-cap-eligible union.
The earlier 12-file gate did not pass and is not retroactively amended.
A new 24-file packet would double chooser candidates and needs a separately
fixed evidence-packing/token budget, three-read/abstention rule, model-cost
ceiling, and exposed-development quality test before any fresh cohort. The
depth curve alone is not a GLM chooser, native F1, cost, or superiority result.

## Frozen top-24 GLM chooser test — rejected

The [source-only packet builder](../research/g02-product-r4/build-g02-r11-hybrid-24-packets-exposed-r3.py)
(SHA-256 `7728c260b37b839b6387ec5658ec76f0043070a3939876822d69ee57bbc7dc29`)
bound the unchanged ranker's top 24 per task to 12 compact issue/code
packets. It verified exact task, base commit, issue, source sizes and eligible
paths. The maximum packet was 15,109 bytes. Its private packet SHA-256 is
`f82d881f43a9080d8f8996ecbcafbf95edcc18410605336aef0a5bbf9fa4906a`;
no label or comparator output entered packet construction.

The [VPS runner](../research/g02-product-r4/run-g02-r11-hybrid-24-choice-exposed-r3.mjs)
(SHA-256 `fbb7cb1ea7b73794942cf3ce51ae6387af2af6520298dba8235b4ae05d048d69`)
was checked and frozen at SHA-256
`23ffffd250ae3bfb540ef9d995f2bfd87d72de4404eb90c2e0077c5a0a8a6573`
before model dispatch. It fixed GLM-5.3-flash, 12 ordered zero-retry chooser
calls, `reasoning_effort: low`, 1,024 output tokens, at most three new paths,
an 8,192-token prompt-plus-reserve admission, and an advancement gate:
12/12 valid responses, at least six new gold hits across at least two
repositories, proposal precision at least 0.25, and nonnegative mean
counterfactual File-F1 delta. Fresh readiness and all **12/12** tokenizer
admissions passed. All 12 generation requests completed HTTP 200, but
**11/12** responses were valid; task 6 failed the fixed path validator. It
was not repaired, retried, or replaced.

All 29 VPS files were copied to private WSL storage under
`/home/vlad_/are-benchmark-archive/g02-r11-hybrid-24-choice-exposed-r3-20261004/`;
a checksum dry-run found zero differences. A separate
[response sealer](../research/g02-product-r4/seal-g02-r11-hybrid-24-responses-exposed-r3.py)
bound every raw attempt before gold access at SHA-256
`3fc7ff360f87f47aba3ef5b608b0774b140909c8a47adedc7fd3593a41c801c8`:
26 valid proposed paths and **40,242 known chooser tokens**, excluding the
small readiness generation and tokenizer-only calls.

The [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-hybrid-24-choice-exposed-r3.py)
(script SHA-256 `f0596b921de1b03dda842e58686279b8706803ef422dea0442514d2523149c1f`;
private receipt SHA-256
`a58fc4a17c1a1f372b90bf753e356321b1e83bc20eb4f35fac2f88f4a2eddcff`)
recomputed all 12 archived ARE native file scores before a *set-based*,
evaluator-only addition of the proposed paths. Only **2/26** proposed files
were new gold (one Ansible, one Sympy), for **0.0769** precision. Eight
tasks regressed, two improved, and two tied. Mean File-F1 would move
**0.53597 → 0.40503** (delta **−0.13095**); archived DSH mean is
**0.56359**. This is not an actual ARE read, Span-F1 score, or all-in
episode cost. The frozen advancement gate **fails** on validity, gold hits,
precision, and File-F1. Merely doubling a lexical/graph chooser packet is
rejected; no fresh G02 population should be spent on this version. The
remaining development target is a stronger selective relevance/abstention
mechanism, not another top-k expansion of the same chooser.

## Evaluator-only three-read ceiling

A separate [gold-aware ceiling audit](../research/g02-product-r4/audit-g02-r11-read-cap-oracle-exposed-r1.py)
(script SHA-256 `8b2ecf69f68c5fbb281fab5723d6aef23c20dd2449a4be2c43d123b99cc82def`;
private numeric receipt SHA-256
`6eeb0fd117b943b20df250584d1ed0d9fe89fba7b36d7910ae354ddf2fbb092c`)
verified the unchanged source-union, depth-ranking, native-score and label
identities. For each already exposed task and pool depth, it *imagines* a
perfect selector that adds up to three missing gold files, with no false
positives. This is an unattainable upper bound, not a runnable ARE policy.

| Pool per task | Oracle mean File-F1 | Oracle added gold across 12 tasks |
| --- | ---: | ---: |
| No extra reads | 0.53597 | 0 |
| Top 12 | 0.58472 | 5 |
| Top 24 | 0.60694 | 6 |
| Top 48 | 0.63375 | 8 |
| Top 96 or full eligible union | 0.65732 | 10 |

Archived DSH mean File-F1 is 0.56359. The top-24 pool therefore has
*theoretical* room above DSH, but the actual r3 chooser's counterfactual
mean was only 0.40503. Candidate recall is a constraint, yet the immediate
top-24 failure is mainly selection precision and abstention. The 12 tasks
have 23 gold files absent from the final ARE selection; one was already
delivered but unselected, leaving the previously reported 22 undelivered.
Only 12 of those 22 lie in the read-cap-eligible union, and an oracle with
three additions per task can use at most ten. This audit is exposed,
gold-aware, File-F1-only and cost-free; it supplies no achievable quality,
Span-F1, independent transfer or superiority estimate. No additional model
call or VPS transfer was made.

## Perfect verifier ceiling — proposed 26-call follow-up stopped

Before dispatching a new GLM verifier on the sealed r3 proposals, a separate
[evaluator-only proposal oracle](../research/g02-product-r4/audit-g02-r11-chooser-proposal-oracle-exposed-r1.py)
(script SHA-256 `3baab7075fcea71350ff000afb04a9f0b7e3ef8e6206314b56d2e2761c6986cc`;
private receipt SHA-256
`d71b1d0a6ca10f5ac70308a71037e344ecb936e168468a3167ba9f71775e82e3`)
checked the fixed 26 model-proposed paths. Even a perfect verifier that
accepted both new gold files and rejected all 24 false positives would raise
the 12-task mean File-F1 only **0.53597 → 0.55602**, below archived DSH
**0.56359**. Thus verification of *only those 26 proposals* cannot clear
the G02 File-F1 comparator on this exposed cohort. The proposed 26-call
follow-up was stopped **before freeze, provider dispatch, or additional
model cost**. A new acquisition mechanism must first surface useful files
that the chooser never proposed. This is a gold-aware ceiling, not a
deployable selector, actual read, Span-F1 result, independent comparison,
or superiority claim.

## Identifier-supported abstention r4 — rejected

A separately versioned [source-only filter](../research/g02-product-r4/seal-g02-r11-identifier-abstention-exposed-r4.py)
(script SHA-256 `6e26603c73e0342a611a2b32d6bab9f4b96560f457a25c1b76e92bec2c62fa35`)
used only the pinned 12 issue/code packets and the 26 sealed r3 chooser
proposals. It retained a proposed file only when one of its sampled code
windows contained an exact issue identifier with an underscore or
lower-to-upper case transition, after a fixed generic-identifier exclusion.
It opened no gold or score. Its private source seal SHA-256 is
`74e48cd65d590708860a64ce926ff8cfd4323d0f9725582dd6bdb1380b45b8ef`;
the rule retained **4/26** proposed paths and changed 11/12 task decisions.

The separate [evaluator-only replay](../research/g02-product-r4/audit-g02-r11-identifier-abstention-exposed-r4.py)
(script SHA-256 `018a706ec519acda7c3fbb352cb18f31c0d91dc48b9728913a871b970c71519c`;
private numeric receipt SHA-256
`55356f1ca5055c50bc1d2d73d60f5d459ccbad480a449215fd95438a5a4a3230`)
found **0/4** new gold files, three regressed tasks, and mean counterfactual
File-F1 **0.53597 → 0.50449**. The presealed development gate (at least two
new gold hits in two repositories, precision at least 0.25, and positive
mean File-F1 delta) failed. This exact-identifier gate is rejected. It also
cannot overcome the preceding perfect-verifier ceiling on the 26 original
proposals. No new GLM call or actual ARE read occurred, and no native
Span-F1, independent result, or superiority claim follows.

## Open Questions

- Can a differently sourced, element-level or trajectory-grounded candidate
  generator cover more missing files before chooser ranking, with a separate
  development set and an abstention rule?
- Which untouched G02 population can test that mechanism after a full
  exposed quality-and-cost qualification, without reusing r11 selections?
