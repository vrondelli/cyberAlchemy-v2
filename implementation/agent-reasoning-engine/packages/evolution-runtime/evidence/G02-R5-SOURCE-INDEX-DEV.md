# G02 r5 source-index development, 2026-10-01

Status: private development. No r5 **24-task campaign** is frozen or
dispatched; two separately frozen evaluator-exposed pairs completed. The first
needed terminal-only recovery, the second did not. There is no G02 superiority
claim.

## Source-only successor candidate

The r4 24-pair campaign stopped after its first task without a matched score.
The other 23 tasks were never dispatched. A [versioned source-only derivation](../research/g02-product-r4/derive-g02-r5-cohort-r1.py)
(SHA-256 `6e02397acb416f6d00af89141a3639bb9af837509a3bd76ce763d81f92c7c471`)
retained those 23 and put one newly ranked Ansible Pro task in the exposed
first task's slot, preserving the 9/6/6/3 Ansible/Open Library/qutebrowser/vuls
mix. It excluded the frozen r4 IDs, older branch manifests, and earlier smoke
tasks; ranking used the original fixed SHA-256 seed and source fields only.
The replacement is `SWE-Bench-Pro__python__maintenance__bugfix__1cae51cc` at
base commit `6382ea168a93d80a64aab1fbd8c4f02dc5ada5bf`, fetched and pinned
under an exact Git ref. The candidate is `source-only-candidate-not-frozen`,
SHA-256 `a6bfe7c3ed6f4f87e70e6f30bf67790e3edfc26f7f9322c18aa129f3b61488c0`.

## Eligibility correction and index limit

All 24 tasks have nonempty native reference files and available exact commits.
The first [eligibility audit](../research/g02-product-r4/audit-g02-r5-native-eligibility-r1.py)
produced SHA-256 `0feabf5377072f064e8ae6054ae0bb296d80633b152e8201f285e3f667d44a72`
but **its source-reachability result is invalid**: it applied an older
code-extension filter to a runner that actually indexes bounded text files
independent of extension. Retain this failed receipt; do not use its 38-file
ceiling claim. The corrected [pre-budget audit](../research/g02-product-r4/audit-g02-r5-native-eligibility-r2.py)
(result SHA-256 `f6c3f32224d89324e11ab9cc72ab77a6526568d30a9293705c89522292df2466`)
found **169/172** reference-file occurrences tracked, text-like and at most
1 MiB; three are untracked in the base trees. It explicitly leaves the
ordered 32 MiB index budget unchecked.

The separate [full-budget evaluator](../research/g02-product-r4/audit-g02-r5-index-budget-r1.py)
simulated the pinned r4 base index's sorted tracked-file order, 1 MiB file cap,
first-8192-byte NUL exclusion, and 32 MiB cumulative budget before inspecting
reference membership. Its result SHA-256 is
`137df8750a6e6f6e7f6a97b9442a0d8a29bca5aacf8c66a5bc99097f5d7ba78a`:
**162/172** reference-file occurrences indexed, with a 24/24 task
denominator. One untouched Ansible task has **0/1** reference files in the
32 MiB index; another Ansible task has 2/9. This is index reachability, not
proof of actual agent acquisition, selection or native quality. Git symlink
worktree resolution is not simulated.

At exploratory **64 MiB and 96 MiB** index budgets, the same evaluator found
**169/172** occurrences indexed in each case; the three remaining misses are
untracked. Thus 64 MiB is the smaller of the two observed equal-reachability
choices on this development candidate, not a prospective optimum.
A [no-model memory probe](../research/g02-product-r4/probe-g02-r5-index-memory-r1.mjs)
on a pinned Ansible checkout measured approximately **1.46 s and 292,000 KiB
maximum RSS** for 32 MiB, **2.50 s and 372,020 KiB** for 64 MiB, and
**5.04 s and 440,912 KiB** for 96 MiB, under a 768 MiB Node heap limit.
The respective index sizes were 4,732 / 7,843 / 18,764 files. This does not
yet prove full 1 GiB container safety or
all-in ARE token/time efficiency. The exact base-overlay source SHA-256 is
`1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89`.

The candidate, failed/corrected audits, full-budget audit and versioned code
were checksum-compared to the private WSL cold copy at
`/home/vlad_/are-benchmark-archive/g02-r5-source-index-development-20261001/`.
No credential or model request was included.

## One exposed 64 MiB paired diagnostic

The 64 MiB change was versioned as a one-setting difference from the r4 base
overlay; the derived output SHA-256 is
`842e52a88c5b10542a55bb2c43ddc4d0e24adbec2ba0f8c2320fed6b1b6d07bb`.
The [source builder](../research/g02-product-r4/build-g02-r5-index64-dev-r1.py)
and its [exposure-text correction](../research/g02-product-r4/build-g02-r5-index64-dev-r2.py)
made no model calls. The same-account tokenizer and tiny-generation readiness
checks returned HTTP 200/200; the credential was never displayed. A single
Ansible task from the r5 development candidate, `2464eadb`, was separately
frozen under SHA-256
`8a294e55416634635bddc002276fdcb636748dd6011fa62b2424b241332be32d`,
with 64 MiB ARE indexing, the unchanged deletion-only policy, a 16K-output
DSH comparator, zero automatic retries, and explicit evaluator-exposed status.

Both GLM arms settled and the original raw predictions, usage and arm times
were sealed **before native scoring**: raw seal SHA-256
`f34dd537fbb7c4c11484a0bd020ede154cbd1175c16b1ec5880b2cb72cdece13`.
The pair driver then exited nonzero **before scoring** because its r4 policy
projector rejected a `pr5-` run-root name. The full failed-stage raw evidence
was copied to WSL and checksum-compared before recovery. A path-only
[versioned projector derivation](../research/g02-product-r4/build-g02-r5-terminal-projector-r1.py)
accepted the exact r5 diagnostic prefix with all policy logic unchanged.
The [terminal recovery](../research/g02-product-r4/recover-g02-r5-terminal-r1.py)
froze its permitted operations under SHA-256
`bcded5276e5bef48aca6dc82e36498ac4d88ae8886b4ccb08f70510b540f4dac`,
made **zero additional GLM calls**, projected the already sealed ARE
prediction, and natively scored both sealed arms. Its result SHA-256 is
`5647ec196ef7744283f8799f4f03db7eb743f495e790b543f7fcf0fbf0d3ae95`.
An [independent hash/transformation/order/metric audit](../research/g02-product-r4/audit-g02-r5-terminal-recovery-r1.py)
passed at SHA-256
`d7827f0f9ac01b7807a030e4525ca6a68c2e129f78c194267eaee4fa533eff31`.

| Exposed task `2464eadb` | ARE 64 MiB | DSH 16K output |
| --- | ---: | ---: |
| Native File-F1 | **1.00000** | 0.66667 |
| Native Span-F1 | **0.90187** | 0.67762 |
| Known model tokens | **25,306** | 159,563 |
| Arm seconds, including ARE policy projection | **113.22** | 200.85 |

ARE selected one native reference file with two receipt-bound delivery
handles. A source-only replay found that selected file **absent** from the
32 MiB index and **present** in the 64 MiB index. This is a concrete
mechanism-consistent observation, **not** a causal estimate: no matched
32 MiB ARE arm was run on this task, and the task was evaluator-exposed.
The 16K DSH arm completed here, but one completion does not settle comparator
reliability. The pre-recovery and final raw copies, recovery code/receipts,
and derived tools are private under
`/home/vlad_/are-benchmark-archive/g02-r5-index64-exposed-ans-2464eadb-20261001/`.
The final raw copy passed a full remote-to-WSL checksum comparison; unchanged
pre-recovery files were hardlink-deduplicated to conserve space.

## Second exposed Ansible transfer check

A path-only projector guard repair was bound into the [r3 development tools](../research/g02-product-r4/build-g02-r5-index64-dev-r3.py)
without changing policy logic; source manifest SHA-256 is
`1848a111ff2068ca6fbaed0d3fc828d6517efe63bbdcb8d789173a66e61a5f91`.
The next separate exposed task, `83c269c9`, had **2/9** native reference files
in the simulated 32 MiB index and **8/9** at 64 MiB. It was frozen before
model dispatch under SHA-256
`6063ef9a2d94aa9f92ac3d1a5267a7c7748deb2294bcdda7bd1bb0f791388a65`.
Fresh same-account tokenizer and tiny-generation checks returned HTTP 200/200.
Both arms completed, projected predictions were sealed before native scores,
and the direct pair driver exited zero without recovery. The raw pair seal
SHA-256 is
`04f518f31b0e86c1652ca7661df4c52bae349f0cbc78d5cbc3db8e2172ce229a`.
The [independent receipt/transformation/metric auditor](../research/g02-product-r4/audit-g02-r5-second-exposed-pair-r1.py)
passed at SHA-256
`2556695eaf6d6e92a537bcd878089c020c86a64d16fc2b89312b5a320df1467b`.

| Exposed task `83c269c9` | ARE 64 MiB | DSH 16K output |
| --- | ---: | ---: |
| Native File-F1 | **0.46154** | 0.28571 |
| Native Span-F1 | **0.19167** | 0.09648 |
| Known model tokens | **83,160** | 122,274 |
| Arm seconds, including ARE policy projection | 188.38 | **159.98** |

ARE selected four receipt-delivered files, three of them native reference
files. **All three selected reference files are outside the simulated 32 MiB
index and inside 64 MiB.** This is mechanism-consistent, not a causal
32-versus-64 live comparison. ARE used 10 model calls and DSH 12, yet ARE was
28.40 seconds slower. Quality and known-token advantages on this pair do not
erase the time regression; the predeclared four-condition observation is
**false**. Its full raw evidence and derived tools are private under
`/home/vlad_/are-benchmark-archive/g02-r5-index64-exposed-ans-83c269c9-20261001/`,
and the raw copy passed a full remote-to-WSL checksum comparison. The two
exposed pairs share a repository and were selected for index stress, so they
cannot support a cross-repository or fresh-cohort superiority claim.

Receipt-only timing anatomy for `83c269c9`: ARE's ten provider model calls
sum to **133.073 s** and ten tokenizer calls to **3.886 s** within its
188.237-second raw arm. One successful model call took **47.556 s** and
returned 15,805 response bytes. The 64 MiB no-model index probe took about
2.50 s on a related Ansible checkout. The provider-call outlier exceeds the
28.40-second arm-time deficit, but the arms followed different trajectories;
these facts do not prove that indexing, provider variability, or any one call
caused the paired time regression. They identify what to instrument in the
next cost-qualified candidate.

## Remaining untouched supply after these diagnostics

The [source-only supply census](../research/g02-product-r4/audit-g02-r6-source-supply-r1.py)
bound the current task-bearing G01/G02 manifests, all 24 frozen r4 IDs, the
r5 replacement and the two earlier smoke IDs, then counted eligible Parquet
rows without opening native gold, scores, or task-specific evidence. Its
private result SHA-256 is
`26851947a40bf4d218dc1ad1e6e52b294ccf8619dd139b5e58086439d49ca947`.
The old four-repository Pro mix cannot be repeated untouched: remaining Pro
counts are **39 Ansible, seven Open Library, one qutebrowser, zero vuls**.
Across all Pro repositories only **50 tasks in six repositories** remain under
these exclusions, strongly Ansible-skewed. The wider ContextBench source
partitions have more supply—**310 Verified across 12 repositories, 229 Multi
across 23, and 171 Poly across 11**—but their cache, adapter and scorer
eligibility is not established. A fresh Pro-only 24-pair claim would need a
new, openly skewed population definition; a broader product claim needs a
separately admitted cross-partition protocol and source preflight. Do not
recycle the evaluator-exposed r5 IDs as untouched holdout tasks.

## Consequence for campaign design

### Exposed 32 MiB issue-path priority test, 2026-10-02

A separate gold-blind source-only simulator reserved up to 8 MiB of the
unchanged 32 MiB budget for tracked files whose paths matched issue names or
terms, then filled the remainder in Git tree order. It sealed all 24 r5
development task index-path sets before evaluator access (source-seal SHA-256
`5956ac21e23ea6187789f7e2867620b2eaa57508634cb8f490789e8f0d7f687d`).
The evaluator-only audit (SHA-256
`8bac9b1afd955f6b18e1d9c461cf0843951d74c2c877a2925487321d1d7050dc`)
found **164/172** native reference-file occurrences reachable, versus
**162/172** for the original 32 MiB order: two tasks gained one file each,
none regressed. This remains below the existing **169/172** reachability of
64 MiB. Both receipts are checksum-matched to private WSL cold storage under
`/home/vlad_/are-benchmark-archive/g02-r5-priority32-development-r1-20261002/`.
This is exposed index simulation, not actual delivery, native F1, cost, or
superiority. The small gain does not justify replacing the r9 64 MiB source
or dispatching its untouched candidate. R9 remains unfrozen.

The 64/96 MiB budget ideas were investigated **after** evaluator-only reference
reachability for these 24 IDs was inspected. They are now development evidence
for any index-budget revision, not an untouched superiority holdout for that
revision. Do not silently relabel this candidate as a fresh r5 replication.
A source-only budget rule needs a separately selected untouched evaluation
cohort and full runtime memory/cost accounting. A later claim
requires a separately selected untouched matched cohort, frozen protocol,
complete attempt accounting, native scores, efficiency intervals and
independent audit. The original r4 failure remains terminal and separate.

## Open Questions

- Can wider indexing improve acquisition/selection without exceeding the 1 GiB
  ARE container or erasing time advantages? The second pair is a time
  regression despite fewer known tokens and model calls.
- Will a 16K-output DSH comparator reliably complete a fresh paired campaign?
- Which untouched tasks remain after all frozen, dispatched, smoke and
  evaluator-exposed IDs are excluded under a new source-only draw?
