# G02 r8 mixed-source candidate, 2026-10-01

Status: **terminal failed campaign**: one pair attempted without a matched
score and 23 unattempted. It is not a superiority result. It excludes all 24 IDs selected for the terminal
[r7 campaign](G02-R7-SCREENED-COHORT-CANDIDATE.md). The r7 failed pair and its
operator-stopped comparator remain separate evidence and cannot be rewritten
as an r8 attempt.

A new source-only SHA-256-ranked pool was sealed before evaluator access:
eight tasks each from Ansible `Pro`, Django `Verified`, Astropy `Verified`,
and Svelte `Multi`, from remaining eligible supplies of 27, 116, 9, and 13.
The pool SHA-256 is
`ff0eb2511efb20c5d86b13a391984782a98d309a7f911216a440833f595dc389`.
An independent evaluator exported only native-gold-nonempty bits; **32/32**
were true (screen SHA-256
`9efcc8c5c95c7ac93a1ebde5baf81af73e06d9aaf22a8f0dd1f978fe4b451d0b`).
The predeclared first-six-per-repository selector chose 24 tasks without an
eligibility skip; candidate SHA-256
`da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196`.
Some unselected r7 pool rows had already had their nonempty bits examined,
but none of the selected r8 IDs was in the r7 24-task campaign or its
reference-reachability audit.

All **24/24** selected exact commits passed source hydration and pinned-image
offline checkout (SHA-256
`3c1aa620dbc84c75e3e17fb09b8456ca8c7c25e93cc47e4fe20af2c22f4ef893`).
All **24/24** passed the unchanged 64 MiB index path (SHA-256
`c760036ea1910437d1d4da39a54f891f4bd819bfe322191de04e585fcb295376`),
the no-model named-source guard (SHA-256
`de0d0ddc07dab1e24e793f9752ce866b84e8dfafd2f7618b9ea3b47865c0e68c`),
and no-model task preparation (SHA-256
`80f1a1cb19ba836140466278b29a225b50e0bad5de211a6534047df1b043a127`).

The versioned r8 adapter binds the selected cache root, fresh-root prefix,
and 24 **exact** Git `safe.directory` entries, not a wildcard; its manifest
SHA-256 is
`a0856e7115d66df83e7fd5ff4cb44d583a4bfdc531fe6470f726d18f7d5fc7fa`.
The selected cache mount is readable as UID 65532. A pinned-image,
network-isolated non-root check read each exact commit with that Git
configuration, **24/24** (SHA-256
`834c1da21fc8177b3033fb2151558499f71d3d46dae1acebae9b9a0ce1d705d1`).
No ranker, 64 MiB budget, deletion-only policy, DSH cap, model protocol, or
native scorer changed. This directly addresses the two r7 pre-model
infrastructure defects but does not prove whole-arm reliability.

An evaluator-only replay of the actual checked-out worktrees reproduced the
Node index counts/bytes on **24/24** tasks. It found **83/87** native
reference-file occurrences inside the fixed index (SHA-256
`a93694f4ab7961f550b4033a06797d1248082361b37d8bd8195ecdda024ca481`).
No reference paths were exported to the selector, and the four misses will
not be used to alter task selection or policy. The changed Pro/Verified/Multi
population supports at most an explicitly scoped mixed ContextBench claim,
not the old Pro-only four-repository claim. A refreshed same-account
tokenizer/tiny-generation probe passed HTTP 200/200 (SHA-256
`08ab8a2aefa5ce196bd218eac2e1cd03b4fb5c312331ebb36151afa2877f289d`).

The separately named 24-task r8 definition is frozen at SHA-256
`20a60393c1125894965c759b3138c5997c55c9792fa752cc6506831aa602ae57`.
Its fixed gate requires 24/24 valid matched pairs, both paired native quality
intervals wholly above zero, and known-token plus all-in arm-time ratio
intervals wholly below one. The 521 MB WSL cold source/tool copy under
`/home/vlad_/are-benchmark-archive/g02-r8-qualified-source-20261001/`
passed four independent remote-to-local `rsync --checksum` comparisons:
all exact caches, receipts, tool snapshot, and 24 preparation roots. The
frozen definition also has a matching WSL SHA-256 copy. No score follows from
these pre-dispatch checks.

## Frozen r8 outcome

The first ordered pair was dispatched once. ARE reached
`final_context_selected` in six model calls and **57,907** known tokens.
DSH reached **26 model calls / 960,981 known tokens** without a final
selection, then its next request was rejected **before dispatch** with
`dsh-transport.request-budget` under the frozen 1,000,000-token episode
budget. The comparator container exited 1 after 340.78 s. Transport
accounting reports zero unknown-usage dispatched requests. Since one arm
failed, the driver did not create a paired pre-score seal, native scores,
or pair decision; the ordinary scored-pair auditor correctly rejected the
missing decision. The complete failed root and driver output have a
checksum-verified private WSL copy under
`/home/vlad_/are-benchmark-archive/g02-product-replication-r8-20261001/`.
The independent unscored-stop audit is SHA-256
`46ae6500ecd0063923e9e3087a81dec704348c341e099daaf3ee031782604558`;
its WSL copy passed a fresh remote-to-local checksum comparison.
The exact VPS failed root is retained. The strict **24/24 validity gate
failed**, and none of the other 23 frozen tasks will be dispatched under r8.
No r8 paired quality estimate or superiority claim exists. A separate
exposed DSH-only budget diagnostic cannot retroactively fix r8.

## Separate exposed 2M-token comparator diagnostic

The already failed Ansible task was separately frozen for a DSH-only run
with a 2,000,000-token total episode budget; its 1M request context,
16K output cap, model, transport, and ARE policy stayed unchanged. The
diagnostic freeze SHA-256 is
`de850eef9b3422f56bad66c1a31eb9328107f5180f11fb4a9c79bcaaf18ef530`,
and its versioned tool manifest SHA-256 is
`472d5ac9579e708aadff2e3fdc883a40d706e7645b82227d2769e60e5b59bb83`.
It also **failed without a final selection**: 36 model calls consumed
1,958,808 known tokens (1,930,628 input; 28,180 output). Attempt 37 was
rejected before dispatch as `dsh-transport.request-budget`, with zero
unknown-usage dispatched requests and no unsettled attempts. This is
comparator-budget failure, not evidence of a bad credential or an ARE quality
result. The complete 112 MB raw root, freeze, and tool snapshot are at
`/home/vlad_/are-benchmark-archive/g02-r8-dsh2m-exposed-diagnostic-20261001/`;
remote-to-local whole-tree checksum checks passed. Neither the exposed
diagnostic nor the source-only r9 successor candidate authorizes a new
campaign at the unqualified 2M comparator setting.

## Separate exposed selection-only comparator diagnostic

The r8 DSH instruction asked the agent to *attempt a patch* before submitting
source context. Its 2M-token trace contains 13 edit attempts, five rejected,
and no final selection. That is a materially different task from ARE's
source-selection episode, so raising the token cap alone is a poor repair for
the G02 comparison. A separately frozen test on the same already-exposed r8
task instead asked DSH to use read/search tools only and make a source
selection without patching. All other settings, including the original 1M
episode cap, 1M request window, and 16K output cap, were unchanged. Its
freeze SHA-256 is
`8cea32ba0c1851c3d2d77067c665ad185fe06128af1a4c95b0d6f7f014266c6e`;
tool manifest SHA-256 is
`e501ab831365dd4bc3e090462f5cb0f1c8a5aa9e1e4b336c81b4c8905af96c9f`.

DSH completed with a sealed final context selection, **14 model calls / 279,004
known tokens**, zero unknown-usage requests, and **zero edit calls** among 21
repository-tool calls. The pre-score seal is SHA-256
`e1e4d740b4c52919fe31b494515d488dee2eb4f478f46765d449e5c8f8144312`.
Its exposed native File-F1 / Span-F1 were **0.83333 / 0.23330**. The original
r8 ARE selection was separately projected and post-hoc scored on a copy of
its failed-pair root: **0.66667 / 0.23144** at 57,907 known model tokens.
The DSH selection found five of six native gold files; ARE found three of
six. All six gold files were index-reachable under the r8 source index.
The [read-only audit](../research/g02-product-r4/audit-g02-r8-selection-only-exposed-r1.py)
(SHA-256 `bea21ec8039db19d00a58ec08e332510b44cbd7c9d462abd07c0a48684b35269`)
recomputed the hashes, transport/tool validity, and F1 values. The full
private diagnostic, tool, freeze, and post-hoc projection copy is
`/home/vlad_/are-benchmark-archive/g02-r8-selection-only-exposed-20261001/`;
four remote-to-local whole-tree checksum comparisons passed.

This is **not** an r8 recovery or matched prospective result: the comparator
instruction changed after the r8 ARE response existed, and the ARE score is
post-hoc. It instead establishes a feasible, more task-matched comparator
protocol and a concrete ARE missing-file quality gap to address on exposed
development data before freezing any successor. The existing r9 source-only
candidate remains undispatched; its provisional 2M patch-attempt DSH tool
builder must not be used as though the comparator were qualified.

## Separate exposed ARE API-contract instruction diagnostic

A versioned [generic ranker instruction](../research/g02-product-r4/build-g02-api-contract-ranker-r1.mjs)
(SHA-256 `1f33f5b237cfb49a3ef6b59f31f63037b1dc732008c9b782fc8a45a900d0069a`)
asked ARE, for public API migration/deprecation issues, to search production
consumers of named classes/constants, read likely callers at the pinned base,
and justify selected files against issue requirements. It did not supply gold
paths, change the model, or add a deterministic file hint. A separate exposed
freeze (SHA-256 `b674835aee312a15f2ff5318ba265d1d19dfc846f74691f953dd8be51a0665ba`)
preceded one ARE-only GLM dispatch on the already exposed r8 Ansible task.
The prepared run's `FREEZE.json` SHA-256 is
`18964aaa9067ca376f40368cae6254dc2c3442fbb90b7f4895be502736aebecd`;
its derived tool manifest is
`3b177136eae025aadd78a13d4867c5a565af6bc998fe275218eb370a069c8431`.

The run reached `final_context_selected` in **9 calls / 95,637 known tokens**.
Its pre-score seal SHA-256 is
`6885017e3f933129feba0b7f7d23dd2951202a9e9148ae8ef2cdf340094d3953`;
the policy projection seal is
`3e70459f61bf977608afffa3cd069a46ac6ad8d23d2daede8940b2c4f582b3b6`.
Native File-F1 remained **0.66667**, exactly the same three-file final set as
the original post-hoc r8 ARE score. Span-F1 rose **0.23144 → 0.47240**
(+0.24096), while known tokens rose **57,907 → 95,637**. ARE still did not
read the missing `task_queue_manager.py` or `utils/display.py` consumers.
The [independent read-only audit](../research/g02-product-r4/audit-g02-r8-api-contract-exposed-r1.py)
(SHA-256 `d505b33ff747332e145a616f1d9f06545dacebbd41aad0f25346713073b02f11`)
recomputed the task, file-set, seal and native-score bindings. The complete
private root, tools and freeze are at
`/home/vlad_/are-benchmark-archive/g02-r8-api-contract-exposed-20261001/`.
A fresh independent sorted file/symlink-content manifest matched the VPS and
WSL copies: root **9,960 files / 82 symlinks** (digest
`faab56246d84ca9bd3137f9daf44957d4233c72221e2f6c01642815ab16bec6b`),
tools **30 files** (digest
`8a1351bbe622a09d30844ace00c6cddc2691744bc893eb04ecd614c11628f845`),
and freeze **1 file** (digest
`fc176f759d25254b0e501b44e397cfd190841444d5bc22e90473034d67e427d4`).

This is an exposed same-task, one-arm development observation against a
post-hoc baseline score; stochastic continuation or the changed instruction
could explain the span difference. It **failed the intended acquisition
test** and has no transfer, matched-pair interval, or superiority standing.
Do not alter or dispatch r9 on this evidence alone.

For a bounded transfer check before spending r9, the already
evaluator-exposed r6 source candidate contains Ansible task
`SWE-Bench-Pro__python__maintenance__bugfix__18d7bbbc` at pinned commit
`e094d48b1bdd93cbc189f416543e810c19b2e561`. Its issue independently
mentions public backward-compatibility behavior, legacy YAML constructors,
`Templar` overrides, and CLI errors; the cold exact-commit cache contains
the named constructor and templar definitions in production source. The r6
receipt records a successful offline checkout and 64 MiB index of 5,474
files. At selection time this was a **source-only transfer target**, not a
model run, score, quality result, or confirmation that the API-contract
instruction works.

## Exposed r6 API-contract transfer result

That r6 task was subsequently tested in **two frozen ARE-only arms** on its
same pinned commit. The baseline used the unchanged ranker; the candidate
added only the generic API-contract instruction. Both used the same fixed
64 MiB source index, model/transport, token caps, and r2-trained deletion-only
policy. A first no-model preparation failed because restored cache ownership
triggered Git trust; after exact-cache ownership repair, a first baseline
dispatch settled at **zero model calls** with a cache-directory traversal
error. Both failed roots remain in the lineage. A versioned symmetric harness
repair added the exact cache to each arm's `safe.directory` config and opened
the parent directory to UID 65532. The separately prepared r2 pair was
[frozen](../research/g02-product-r4/freeze-g02-r6-api-transfer-exposed-r2.py)
before either live arm, freeze SHA-256
`5508f4a81e01ea0405d9be42fd8f6df33f9b372843c5c84fdd3cd3ee0b0ddadf`.
A same-account readiness probe passed tokenizer/tiny-generation HTTP 200/200
(sanitized receipt SHA-256
`ede7ee741a55cfb6bd233460d1c59eb2cf2d19c5dc44656f8ffba871bbd64c02`).

Both live ARE arms completed with zero unknown-usage requests. Their raw
predictions and costs were sealed **before** policy projection/native scoring
(seal SHA-256
`9494e8f1acdedd3be56e8c6aa52a150706f87208a28efdbfc095dad47996f69f`).
The baseline used **18 calls / 227,500 known tokens / 176.617 seconds** and
selected five raw files, four after fixed pruning. The API-contract arm used
**9 calls / 94,201 known tokens / 110.669 seconds** and selected eight raw
files, five after pruning. Native File-F1 was **0.53333 → 0.62500**
(candidate minus baseline **+0.09167**), but native Span-F1 was
**0.45327 → 0.31823** (**−0.13505**). Candidate/baseline known-token and
arm-duration ratios were **0.41407** and **0.62660**. The candidate added
`lib/ansible/_internal/_templating/_jinja_bits.py` and
`lib/ansible/utils/display.py` to the final selection while dropping
`lib/ansible/cli/__init__.py`; the aggregate score alone does not assign
causality to individual files. The [native result](../research/g02-product-r4/score-g02-r6-api-transfer-exposed-r2.py)
SHA-256 is `16e524f00c7ab5c76aa5fe1519f311727a157b834d9af9f7b9767955b8e30655`.

An evaluator-only post-score interval check explains the next diagnostic
target without changing the result: the dropped CLI file has a native
reference interval at lines 715–752, which the baseline selected at
720–749. The candidate's newly selected Jinja-bits interval overlaps its
reference only at lines 160–188, and its Display interval 670–739 is much
wider than the nearby 709–719 reference interval. Other files and native
character weighting also affect aggregate Span-F1, so these observations
are **not** a per-file causal decomposition. They suggest testing
issue-requirement preservation and span precision on separate exposed tasks;
these evaluator intervals must not become selector hints for r9.

The [independent archive audit](../research/g02-product-r4/audit-g02-r6-api-transfer-exposed-r2.py)
(script SHA-256 `d606b9b40e84504d7d39ed274a63a4d565de215b3ef48f6072ad5f8adbd4adb7`;
receipt SHA-256 `0eefc94739af17e8929c30893336083ea5f4dbb69131ceabdf68e4d2f9b3b672`)
recomputed task/source/policy/score/cost bindings and the mixed deltas.
The complete private archive is
`/home/vlad_/are-benchmark-archive/g02-r6-api-transfer-exposed-20261001/`.
Fresh independent sorted file/symlink-content manifests matched the VPS for
baseline **10,983 files / 120 symlinks** (digest
`26bebc858c3a812574f873c656666814f7d8fe8cc2d6f0cba0b62cdf5db6b0ed`)
and candidate **10,975 / 120** (digest
`67fd3399674ce3e5fe51f5afec7fd80d492e67ecdbb8f4eda58dc6eb3aea8b96`);
the freeze, both tool trees, and the zero-call failure also matched.

This is a **mixed exposed development result**, not a matched DSH comparison
or independent transfer population. It does show an ARE file-acquisition
and cost signal on a second Ansible issue, but the Span-F1 regression means
this exact instruction is **not qualified for r9** or a superiority claim.
Further work must improve span choice while preserving the acquired files
and efficiency, then test a separately frozen prospective cohort.

## Separate exposed r7 requirement-preservation result

A second source-only development task was chosen from r7's already
evaluator-exposed but performance-unseen pool: Ansible ordinal 17,
`SWE-Bench-Pro__python__maintenance__bugfix__d131db7a` at commit
`59ca05b70994b07a9507f61a0871146a4991b262`. Its issue independently
names `safe_eval`, the `AnsibleModule.safe_eval` wrapper,
`check_type_dict`, deprecation, accepted dictionary inputs and error
handling. No gold path or native score selected it. The pinned cache and
64 MiB index were already source-qualified. A versioned
[ranker builder](../research/g02-product-r4/build-g02-requirement-preserving-ranker-r1.mjs)
retained the generic API-consumer instruction and added a generic rule to
preserve independently supported issue requirements and select narrow source
spans. It supplied no task-specific file or line hint. Both ARE-only arms
were [frozen](../research/g02-product-r4/freeze-g02-r7-requirement-exposed-r1.py)
before model dispatch (freeze SHA-256
`00574c2cc35758791e9329c6870baf7ab86f229a70bb9c04be4a8c6351a7aad1`),
and a fresh same-account tokenizer/tiny-generation probe passed 200/200
(sanitized receipt SHA-256
`a3cc740a2dd99a5b177c0571494f47a406030a76feeea3168b125d512f3a2837`).

Both arms reached valid final selection with zero unknown-usage requests.
The baseline used **8 calls / 55,310 known tokens / 85.040 seconds** and
selected four raw files, three after unchanged pruning. The requirement
arm used **8 calls / 53,382 known tokens / 85.378 seconds** and selected
five raw files, four after pruning. Predictions and costs were sealed
before policy projection/native scoring (seal SHA-256
`c0a5c865fb706b8a65ba174e8f2c5329682be88a178d961cc5785b2ba64f9356`).
Native File-F1 rose **0.44444 → 0.60000** (**+0.15556**), while Span-F1
fell **0.17785 → 0.16151** (**−0.01633**). Candidate/baseline known-token
ratio was **0.96514** and duration ratio **1.00397**. The final candidate
added `lib/ansible/module_utils/common/parameters.py` to the baseline
three-file set. [Result](../research/g02-product-r4/score-g02-r7-requirement-exposed-r1.py)
SHA-256 is `3e7acf01128dcfd79d747580a1f5fb179d7aa402f2d67c3d50eb8c94471e3804`.

The evaluator-only post-score interval check makes the failure mode concrete:
the newly selected `parameters.py` span is lines 40–69, while its native
reference intervals are 569–637 and 688–785. Thus the new file contributes
to File-F1 but its chosen span misses the relevant sections. These opened
reference lines are diagnostic evidence only; they are not admissible
task-specific instructions or hidden tuning data for r9.

The [independent archive audit](../research/g02-product-r4/audit-g02-r7-requirement-exposed-r1.py)
(script SHA-256 `b50a8182b99b80da3147ee5614cc21ca30576712c6af8ebdfff85e1690c5af27`;
receipt SHA-256 `e06ff15c78184fc09f672657bbfe486cdc92a38c9b3b50353389a4801f2133f3`)
recomputed the task/source, raw and pruned selections, seals, native F1 and
cost ratios. The complete private archive is
`/home/vlad_/are-benchmark-archive/g02-r7-requirement-exposed-20261001/`.
Independent sorted file/symlink-content manifests matched remote and WSL
for the baseline **10,171 files / 120 symlinks** (digest
`5b8942cf65c46c99a83a1fd654eae6a602e3bc2ca6b44f1982b06d0279871a2a`)
and candidate **10,172 / 120** (digest
`252ab46231619cef0ed6dbe39f59e52f489e58a1ffd444dc3111accaf0c213f8`),
as well as the freeze and both tool trees.

This is another **mixed exposed ARE-only result**. The generic preservation
sentence did not solve span quality or all-in time, and neither task supplies
a matched DSH interval. Do not promote either prompt variant to r9. The
next mechanism should be source-grounded span selection tested across
predeclared exposed tasks, without converting their opened labels into
unreported holdout tuning.

### Delivered-evidence diagnosis after the r6/r7 scores

The archived, confirmed-read receipts narrow the next problem. In r7's
requirement arm, `parameters.py` was delivered only at lines **40–69**, the
same interval selected in the final prediction. Its source also contains
`check_type_dict` in a validator table and a direct call, and later invokes
the table-resolved `type_checker` in argument and element validation. The
post-score reference intervals are later in that file, but they were **not
delivered**. A selection-only postprocessor cannot recover them from the
confirmed evidence; acquisition must reach the source-level indirect caller
flow before final selection. The issue and pinned-base source, not reference
intervals, are the admissible inputs to such a mechanism.

The r6 API-contract arm has a different complementary loss: its confirmed
reads include the newly selected Jinja and display files, but **none** from
`lib/ansible/cli/__init__.py`. The baseline had confirmed CLI reads and
selected that file; the candidate did not. The r6 issue explicitly includes
early CLI fatal-error help text. A better narrow-span policy alone cannot
restore an issue requirement that the candidate never read. The next
source-grounded mechanism must both (1) follow issue-named APIs through
registries/indirect callers to focused reads and (2) preserve one supported
read per distinct issue requirement when a new consumer is added. It must be
tested on a **predeclared exposed development set**, with outputs sealed
before scoring, and cannot be promoted on these two tasks alone.

The r6 baseline and API-contract arms actually received the **same** ranked
primer (canonical receipt digest
`a792a415a81b59201ea84e6331db57d8d776cca99093d51be9ccd9f382b37d2f`)
and the **same seven-file initial packet** (digest
`cb38ff1e6b009ae271a5c02171d8a770300fd517660643f6983bd01b8d6d9a69`).
The primer included a CLI-related path at rank seven, but the shared initial
packet did not include a CLI file. The candidate's later searches returned
no CLI path; the baseline independently searched/read CLI source. Thus the
*between-arm* loss is later allocation/finalization under identical initial
evidence, not a packet difference. Packet diversity could supply a stronger
common CLI lead in a future symmetric test, but this receipt does not prove
that such a change would fix the candidate or its all-in cost.

An exploratory [numbered-requirement packet probe](../research/g02-product-r4/probe-numbered-requirement-packet-r1.py)
(SHA-256 `c062836436df7aad4ceded31d328bde3568ece7b793a2ea8189191e5badeb899`)
uses only issue text, ranked source hints and the initial-packet receipt. It
proposes at most two additional production-source leads for numbered steps
not already represented by the packet, requiring both two meaningful primer
terms and an issue term in the source path. Its first exposed attempt picked
unrelated generic Ansible paths; the path requirement was added **after
seeing that failure**, so this is openly tuned exposed development. The
revised probe proposes `lib/ansible/cli/arguments/option_helpers.py` for
r6 step 5, `lib/ansible/modules/network/nxos/nxos_vrf_af.py` for r5 step 1
(already selected later by ARE), and no leads on r7 or r8. Three synthetic
tests passed. These are candidate *initial reads*, not confirmed delivered
evidence or native improvements. The rule is sparse, does not handle
unstructured requirements, and is **not qualified for r9** without a
separately frozen, symmetric live exposed test with all-in accounting.

A first [source-only Python indirect-call probe](../research/g02-product-r4/probe-indirect-python-calls-r1.py)
(SHA-256 `ab5c0ba0eea71e5a9423c6daffe29015a646d8eaa732f7fde55ae1b14776c982`)
uses backticked issue identifiers, selected pinned-base Python files, AST
registry values, resolver calls and subsequent indirect calls. On r7's
already exposed task and prediction, it returned focused candidate windows
**556–580** and **616–640** in `parameters.py`; it returned no findings on
the r6 candidate. Two synthetic positive/negative unit tests passed. This
is a feasibility observation, not a native-score improvement: the probe has
not been integrated into ARE, sealed as a new live arm, or tested across a
predeclared population. In particular, it does not address r6's lost CLI
requirement. The opened r7 reference intervals must not become rules or
selection inputs for a prospective cohort.

The [four-task exposed source-only set](../research/g02-product-r4/G02-INDIRECT-CALL-EXPOSED-SET-R1.json)
was fixed with task/prediction hashes and base commits before its batch
probe. The [hash-checked runner](../research/g02-product-r4/run-indirect-call-exposed-set-r1.py)
returned **two windows on r7 and zero findings on r5, r6, and r8**
(manifest SHA-256
`2f16eacc4057f3aa9cf9327b79a643ee1145d45b436d027e073b73a939a4a3d6`).
This confirms the rule is sparse and does not solve r6 requirement loss.
It remains a candidate *targeted read lead*, not a replacement selector or
a reason to dispatch untouched r9. A live exposed arm would still have to
show that these hints are delivered, selected, natively useful, and do not
hurt all-in cost or the other issue requirements.

### Live exposed r6 numbered-packet test — mixed and not promoted

The r6 issue was reused *after* the packet rule had been tuned on it. A
same-ranker ARE-only baseline/candidate test was prepared and frozen before
model dispatch. The first candidate integration freeze was zero-call and
preserved. A second candidate failed at Docker OCI startup (`exit 125`) when
the read-only image could not create a new file mount; it made **no GLM
call**. The versioned repair embedded the identical helper code in the
already-mounted episode source. This r3 candidate was frozen before its own
first model dispatch, after the earlier baseline had completed but **before
either prediction or native score was opened**. The [r3 freeze](../research/g02-product-r4/freeze-g02-r6-numbered-packet-exposed-r3.py)
SHA-256 is `cedcee6cfbea8fa060d154c3564a6300c5be38a0bd03e52a775eb2addda0e33f`.
The fresh same-account readiness probe passed tokenizer/generation HTTP
200/200 (receipt SHA-256
`74ae077bf9d38446596f7abe3cbb5c4dc572ca6860d0c8f9b822f1080d3eda3b`).

Both arms completed with zero unknown-usage dispatched requests. The
candidate's eighth initial read was the source-only proposed CLI lead,
`lib/ansible/cli/arguments/option_helpers.py`, and its delivery was
confirmed. Both raw predictions and costs were sealed before fixed r2-trained
pruning or native scoring ([pre-score seal](../research/g02-product-r4/seal-g02-r6-numbered-packet-exposed-r3.py)
SHA-256 `57ea0348e7d30813c525d5a6543bda4dce9d8799d3198c983d10d8e569d4edfb`).
The unchanged policy retained six files in each arm; both final sets included
`lib/ansible/cli/__init__.py`.

| Exposed ARE-only r6 arm | Native File-F1 | Native Span-F1 | Known tokens | Model calls | ARE runner seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| Same-ranker baseline | 0.588235 | 0.259341 | 121,979 | 10 | 103.764 |
| Numbered packet | 0.588235 | 0.308284 | 174,182 | 11 | 162.570 |

Thus File-F1 **tied**, Span-F1 rose **0.048943**, known tokens rose
**42.80%**, and ARE runner time rose **56.67%**. Policy-projection time was
not separately timed in this exposed test, so these are not all-in arm-time
ratios; the candidate already fails the known-token and runner-time directions
without it. The [native result](../research/g02-product-r4/score-g02-r6-numbered-packet-exposed-r3.py)
SHA-256 is `4dad3621fc3146a7612dbe8c62b190411b8cefcdeaa29b5507a434de13d9d8e5`;
an [independent recomputation](../research/g02-product-r4/audit-g02-r6-numbered-packet-exposed-r3.py)
passed with receipt SHA-256
`049603657a5ff7b8a13dbad2f8494a636db0048ee87bd20ffb1a9ad1be2106f2`.
The complete private roots, failed attempt, freezes, tools and scripts are
cold-copied at
`/home/vlad_/are-benchmark-archive/g02-r6-numbered-packet-exposed-20261001/`.
Remote-to-WSL `rsync --checksum --dry-run` found no differences in all nine
copied roots; no benchmark container remains running. Raw evidence was not
deleted from the VPS.

This is a useful confirmed-delivery and Span-F1 signal on a reused exposed
task, but not a quality-plus-efficiency improvement, causal packet estimate,
matched DSH result, or prospective superiority. The numbered-packet rule is
**not qualified for r9**. The next G02 design must avoid a 43% token increase
and preserve requirement coverage on more than this tuned issue.

## Open Questions

- Why does this DSH task continue beyond 36 calls and 1.96M known tokens
  without final selection under the patch-attempt instruction, and can the
  selection-only protocol transfer without edit calls or invalid outputs?
- Can ARE close the exposed missing-file gap using gold-blind, receipt-backed
  acquisition and selection without losing its token/time advantage?
- Does the API-contract span gain transfer to another already exposed task,
  and can a separate acquisition mechanism actually deliver missing consumers?
- Can a fresh successor preserve the 23 r8 unattempted IDs, replace the
  one exposed Ansible task by a source-only rule, and complete 24/24?
- Will paired stratified quality and known-token/all-in-time intervals pass
  the frozen four-condition superiority gate?
