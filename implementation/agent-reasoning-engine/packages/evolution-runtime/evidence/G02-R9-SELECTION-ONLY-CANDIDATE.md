# G02 r9 selection-only mixed-source candidate, 2026-10-01

Historical preparation status: source-qualified before dispatch. R9 is now
**terminal failed after pair 2**, with one valid scored pair, one raw-sealed but
unscored pair, and 22 unattempted pairs. It is not a superiority result. The
prior [r8 attempt](G02-R8-MIXED-SOURCE-CANDIDATE.md)
is terminal failed and cannot be repaired by this candidate.

The fixed source-only succession rule retained all **23** r8 unattempted IDs
in order and replaced only the exposed first Ansible task with the next
source-ranked eligible Ansible row from r8's 32-task pool. It did not use
native scores or the selection-only comparator outcome to choose an ID.
The [candidate selector](../research/g02-product-r4/select-g02-r9-after-budget-stop-r1.py)
output SHA-256 is
`87527bcef71cdd6d4b99fd008b67379a846f592798e8e658d1ec27cf13ef9c10`.
The new task is `SWE-Bench-Pro__python__maintenance__bugfix__0bac5789` at
commit `585ef6c55e87c10c1ce7d59ebe9c33dd6dbe5afb`. Its prior
evaluator exposure is limited to the native-gold-nonempty bit from the
sealed r8 pool screen; its labels and score were not used for selection.

The r9 cache hydration receipt is SHA-256
`89591dbec004a998ce5252d674bc2e146a570eed7f7413d8ca71e20c0a3f7104`:
23 immutable exact r8 caches were hardlink-reused and one new exact shallow
Ansible cache was hydrated and offline checked out. A separate versioned
[selection-only adapter](../research/g02-product-r4/build-g02-r9-selection-only-tools-r1.py)
binds that cache root, the r9 scratch prefix, and 24 exact non-root Git
`safe.directory` entries. Its manifest SHA-256 is
`cf371c480949974e2589e99d84e89476b29e487c60037a3840a373b864f2f659`.
The ARE 64 MiB source index, r2-trained deletion-only policy, model,
transport, native scorer, DSH 1M episode/request budgets, and 16K output
cap remain unchanged. The material protocol difference from r8 is that
DSH is instructed to **select source context without attempting a patch**.
The separate [exposed feasibility test](G02-R8-MIXED-SOURCE-CANDIDATE.md#separate-exposed-selection-only-comparator-diagnostic)
finished validly on one task; it does not establish 24-task reliability or
comparative quality superiority.

The no-model [incremental preflight](../research/g02-product-r4/preflight-g02-r9-selection-only-r1.py)
passed **24/24** exact UID-65532 cache/Git-trust reads and **24/24** task
preparations, with SHA-256
`ed2fac9d1391566441b5c189490a52d6aee59d8f2d04fee04d4c28053f58c61a`.
It hash-bound and task-matched the 23 inherited r8 cache, source-index,
named-source, and preparation receipts; it reran the named-source guard,
offline checkout, and fixed 64 MiB index for the new task. Its index used
14,001,169 source bytes. The evaluator-only
[actual-worktree replay](../research/g02-product-r4/audit-g02-r9-replacement-reachability-r1.py)
agreed with that index and found **3/3** native reference files reachable,
without exporting paths to the selector (SHA-256
`515ef2b95eb04422331eb996a9fe76119e5595f5182e52289942e980d9dff230`).
For the inherited 23, the r8 evaluator-only index result remains the
unchanged source evidence; it does not predict live agent selection.

The private WSL cold source snapshot is
`/home/vlad_/are-benchmark-archive/g02-r9-qualified-source-20261001/`.
The cache tree, receipts, tool snapshot, and all 24 preparation roots passed
remote-to-local `rsync --checksum` comparisons. A mistakenly targeted
dry-run compared the cache child against its parent destination and printed
prospective additions; it made no changes. The corrected comparison of the
whole remote cache root against the WSL cache destination had no differences.

At this preparation stage the candidate was deliberately **not frozen or dispatched**. On the
already exposed r8 task, the selection-only DSH comparator improved its
termination behavior but achieved higher File-F1 than the unchanged ARE
selection. Spending this untouched 24-task cohort before testing an ARE
missing-file acquisition improvement would consume the claim population
without a positive exposed quality signal. The provisional 2M patch-attempt
r9 builder is superseded for this candidate and must not be used.

## Exposed API-consumer closure falsification

A separate gold-blind [source-only rule](../research/g02-product-r4/seal-api-consumer-closure-exposed-r1.py)
(SHA-256 `adfc4bb3d8b7bcd6a9939b8c1044e5a53f2d8ab11df3ecb646fb5d033979f00c`)
searched pinned-base production files for uncommon CamelCase API names from
the issue and proposed at most two new reads per task. It excluded already
delivered/selected r8 paths, made no model calls, and sealed all **25** source
rows before gold access (source seal SHA-256
`339787220e7d6e723b2f4e5be60f163a760f441d2dba421106cf7f84b00e7ae4`).
The independent evaluator-only [label audit](../research/g02-product-r4/audit-api-consumer-closure-exposed-r1.py)
(script SHA-256 `bc6fac5de9cdfe5045f5eacf877fdcb3696d9f2910f72ef2a3f1fe0762972b47`;
result SHA-256 `d01f04e251e380cadf48865826f73b3e4afc037d423bca0f0223061f4ccde409`)
found one correct proposed `task_queue_manager.py` read on the already
exposed r8 failed task, but only **3 gold / 11 false** proposed reads across
the separate 24-task r7 source population (seven tasks fired). The private
source seal and result are in
`/home/vlad_/are-benchmark-archive/g02-api-consumer-exposed-20261001/`;
the result passed a remote-to-local checksum comparison. This mechanism is
**rejected as an automatic r9 addition**. It has no delivered-read receipt,
native F1, or all-in cost result, and its low transfer precision would risk
erasing ARE's quality and efficiency gains. Do not retune it to the exposed
r7 labels and present that as independent validation.

A separate [ARE-only API-contract instruction diagnostic](G02-R8-MIXED-SOURCE-CANDIDATE.md#separate-exposed-are-api-contract-instruction-diagnostic)
on the already exposed r8 task increased native Span-F1 but left File-F1 and
the selected three-file set unchanged, at higher known-token cost. It therefore
does **not** qualify the missing-file acquisition mechanism or change this
r9 candidate's **then not-frozen / not-dispatched** status.

A later [two-arm exposed r6 transfer](G02-R8-MIXED-SOURCE-CANDIDATE.md#exposed-r6-api-contract-transfer-result)
did acquire a larger final file set and improved native File-F1 by **0.09167**
while using **0.414** of baseline known tokens, but it **regressed Span-F1 by
0.13505**. Its pre-score seal, independent audit and complete private archive
passed. This mixed, evaluator-exposed task cannot qualify the instruction for
r9 or establish ARE-over-DSH superiority. R9 remained untouched, unfrozen and
undispatched at that stage.

A separately frozen [r7 requirement-preservation development test](G02-R8-MIXED-SOURCE-CANDIDATE.md#separate-exposed-r7-requirement-preservation-result)
then improved File-F1 by **0.15556** on a different issue but regressed
Span-F1 by **0.01633**, with essentially tied arm duration. Its independent
audit and whole-tree private archive passed. Thus both API-oriented prompt
variants show a file-acquisition signal but fail the complete G02 quality
condition on exposed tests. Neither changes r9's not-frozen/not-dispatched
status.

An additional [live exposed r6 numbered-packet test](G02-R8-MIXED-SOURCE-CANDIDATE.md#live-exposed-r6-numbered-packet-test--mixed-and-not-promoted)
confirmed delivery of a source-only CLI lead and gained **0.04894 Span-F1**,
but File-F1 tied while known tokens rose **42.80%** and ARE runner duration rose
**56.67%**. Its zero-call container failure, repaired freeze, pre-score seal,
independent audit, and private archive are preserved. This tuned, reused task
did not qualify the packet rule or alter r9's then-unfrozen status.

## Indirect-call trigger transfer, 2026-10-02

The unchanged Python AST registry-to-indirect-caller probe, previously positive
on one exposed r7 task, was run source-only against all **32** sealed r2/r3 G02
reviewer packets without opening gold or scores. Fifteen packets selected no
Python files; across the other **17 pairs / 56 selected Python files**, it
produced **zero findings**. The private receipt SHA-256 is
`1ed4c9aa589563f901f17b96aafa31cca1553f1d0a7080848c15a742d053e030`,
checksum-matched to WSL cold storage under
`/home/vlad_/are-benchmark-archive/g02-indirect-call-exposed32-r1-20261002/`.
This fixed rule is too sparse to justify a live r9 acquisition arm by itself;
the earlier r7 hit remains a task-specific development observation, not
transfer or native quality. No GLM call, fresh task exposure, or r9 promotion
followed.

## Frozen r9 outcome, 2026-10-02

The exact selection-only r9 successor was frozen before dispatch at definition
SHA-256 `0e09204d97fd78153d3e1f2c2d477fd1be0901fec6c3911606b083549bbf0073`.
It bound the 24-task source candidate, 23 unchanged r8 unattempted IDs, one
source-ranked replacement for r8's exposed first ID, exact cache and no-model
preflight receipts, the read/search-only DSH tool tree, and a fresh same-account
tokenizer/tiny-generation readiness probe (HTTP 200/200, SHA-256
`aa8f62d64e9cb2f6f0ce30828bbd2d6228b491f714cc26c7a998fb45b81aad37`).
The frozen definition and freezer have matching WSL cold copies under
`/home/vlad_/are-benchmark-archive/g02-product-replication-r9-20261002/`.

The guarded serial run attempted the first two ordered pairs exactly once and
stopped before pair 3. Pair 1, an Ansible Pro task, finished validly and passed
the independent receipt and metric audit (SHA-256
`64fc31cebaf379a07dc2f2056718bfc7f92294372ee7f53b19bd04bf25da5b38`).
ARE versus DSH native File-F1 was **0.40000 vs 0.50000**, Span-F1
**0.57886 vs 0.63491**, known tokens **77,748 vs 24,753**, and arm seconds
**102.51 vs 45.66**. DSH used read/search-only tools, with no edit call.
This is one losing pair, not a cohort estimate.

Pair 2, a Django Verified task, completed both model arms and sealed their
predictions and complete known usage before any native score (raw seal SHA-256
`25ff57a4af17125efd21904ef289d4e316e6c65a9fd133682346203e55b0540a`).
ARE used **43,931** known tokens / **61.481** seconds; DSH used **30,452** /
**51.058** seconds. The frozen selected-file projector then failed before
scoring: its pinned packet builder searches only `SWE-Bench-Pro__*.json`, so it
raised `StopIteration` on the `SWE-Bench-Verified` task file. There is no
`PAIR-DECISION.json`, native score, or independent scored-pair audit for pair
2. The serial auditor correctly failed `decision-missing` and stopped. Its raw
VPS root remains intact; its WSL raw archive passed a full remote-to-local
checksum comparison. Pair 1's checksum-verified raw scratch was reclaimed only
after archival. The failure does not authorize a frozen-source hotfix, retry,
top-up, or claim from the valid subset. A separately versioned successor must
repair mixed-source task discovery and demonstrate its full no-model projection
path for all three source prefixes before any new GLM campaign.

An isolated prospective mixed-source packet implementation
([source](../research/g02-product-r4/receipt-packet-mixed-source-r1.py), SHA-256
`08a3417a8dfaa3e28a0360bb361019cd67fbd72fceffa2a61eb95b6e988ccb5b`)
now accepts exactly one task file with the Pro, Verified, or Multi prefix and
binds its instance ID to the sealed prediction. It found exactly one
task/binding match in all **24/24** r9 no-model preparation roots: six Pro,
twelve Verified, six Multi. On the 31 still-available historical Pro source
roots, its complete packet tuple exactly matched the pinned old builder in
**31/31** cases; the one missing historical source root was not reconstructed.
It also matched the old builder on r9's archived Pro pair 1. On r9's preserved
Verified pair-2 root, a no-write invocation of the otherwise unchanged
projector succeeded: 18 delivered reads, two originally selected files, one
retained, candidate SHA-256
`0ce2549511636b00ffafa30a8c1b28c845d918d7d32b62af158c86cf4112f37c`.
This is **source-only repair evidence**, not pair-2 score recovery, a change
to frozen r9, or r10 campaign qualification. The next separately versioned
source must bind this module into the actual driver and prove the full
projection/scorer path across the mixed population before new model calls.

A separately versioned [r10 projector](../research/g02-product-r4/project-g02-r10-mixed-pruning-r1.py)
(SHA-256 `846dde045ec4c7bf533207d0a03f23f823eb1db39edaba0392d88d80c0030e5a`)
then bound that packet module while retaining the exact r9 trained model,
features, probabilities, threshold, and deletion-only transformation. On a
checksum-matched **copy** of r9's already-exposed raw pair 2, it sealed the
same candidate prediction SHA-256
`0ce2549511636b00ffafa30a8c1b28c845d918d7d32b62af158c86cf4112f37c`
before native scoring. The independent
[replay auditor](../research/g02-product-r4/audit-g02-r10-mixed-replay-r1.py)
bound the old raw seal, unchanged arm predictions, exact commits and clean
worktrees, new packet/projector/policy hashes, score order, and recomputed
native metrics. Its private result SHA-256 is
`db1b9105e713c5e9852923cbdc0fcff6bbd9b5a6439a64fdd11997d512df7e1c`.
For this **terminal development replay only**, ARE versus DSH File-F1 was
**0.50000 vs 0.57143** and Span-F1 **0.23603 vs 0.14994**; the previously
sealed known tokens were **43,931 vs 30,452** and raw arm seconds **61.481 vs
51.058**. The r10 projector fixes the crash but does not make r9 a valid
24-pair campaign or resolve G02's quality/efficiency deficit. There were no
new model calls. The compact result, prediction/policy receipts, native
scores, and code are checksum-matched in WSL cold storage at
`/home/vlad_/are-benchmark-archive/g02-r10-mixed-replay-r1/`. The exact
264 MB VPS replay copy was reclaimed after that verification; the untouched
r9 failed-pair VPS root and its full WSL raw archive remain available to
reconstruct it. The next source qualification still needs a full no-model
driver/scorer test for all three task prefixes before any fresh campaign.

A further evaluator-only score of the **unchanged sealed raw ARE prediction**
for exposed pair 2 (prediction SHA-256
`2a2376a3950543c4ce32a04ce37b21c96437c52a388dd75cfb877209031c5740`;
score SHA-256 `b2c60382646dd346cc0fdd5aa68f741fbf9bdf1520b7a91ddb4abb04267e91c8`)
found File-F1 **0.40000** and Span-F1 **0.14409**. Thus the fixed
deletion-only policy **improved** this pair to **0.50000 / 0.23603** by
removing one false selected file; it did not cause the remaining File-F1
deficit against DSH's **0.57143**. ARE read five distinct source files but
never acquired one of the comparator's relevant backend implementations.
This is a post-score exposed diagnosis, not a general causal estimate or a
selector hint for a fresh cohort. It shifts the next G02 development question
toward issue-grounded **cross-file acquisition**, while preserving the already
qualified pruning mechanism. The raw score has a matching private WSL copy
beside the replay receipts.

The first prospective **issue-anchored Python call-definition rule** was
[sealed source-only](../research/g02-product-r4/seal-issue-call-definition-r1.py)
across all 17 available, already-exposed r2/r3 pairs with selected Python
source (12 r2, five r3). It looked only for an exact `snake_case` issue
identifier within a method call in an ARE-selected span, then for up to two
previously undelivered tracked definitions; no gold, DSH, or scores were
opened. The private source seal SHA-256 is
`785456daee45320c1f8f6487b6821e02fc5f0b250368b997c7bb9b213b93ae8d`,
checksum-matched to WSL cold storage under
`/home/vlad_/are-benchmark-archive/g02-issue-call-definition-r1-20261002/`.
It matched a call on **1/17** tasks but proposed **0** new files. Its exact
issue-code-anchor requirement is too sparse to be a general G02 acquisition
candidate; there is no reason to open evaluator labels or dispatch a live arm
for this rule. A broader source-grounded candidate must be separately sealed
and tested, not retroactively substituted into this receipt.

2026-10-02 r10 driver-source step: a [versioned source derivation](../research/g02-product-r4/derive-g02-r10-mixed-driver-r1.py) pinned the r9 driver and r10 mixed-source projector/packet hashes, then changed exactly one future driver binding from the Pro-only projector to `project-g02-r10-mixed-pruning-r1.py`. The private candidate tools and manifest are under `/home/vlad_/are-benchmark-archive/g02-r10-mixed-driver-candidate-r1-20261002/`; manifest SHA-256 `38f146ac0486b8c3787fb3a84d128f3f745a4bdae9a000d8ea749f156b3a409d`. Node syntax, Python syntax, the exact one-binding driver delta, and all manifest source hashes passed. This is **source construction only**, not full Pro/Verified/Multi no-model driver/scorer qualification, a fresh cohort, a freeze, or a G02 result. The failing r9 campaign and its receipts remain unchanged.

The candidate packet module was also replayed source-only on the checksum-archived r9 Pro and Verified raw roots: both bound exact source and prediction identities, with 19 and 18 delivered reads respectively. No sealed Multi raw pair exists for an equivalent replay. This remains two-prefix packet evidence only, not a complete three-prefix driver/scorer preflight.

A separate synthetic Multi fixture used r9's already assigned but unattempted ordinal-24 task and its pinned, clean Svelte base checkout. One deliberately synthetic read/selection of `packages/svelte/src/index-client.js:1-10` passed the unchanged mixed packet module with exact task/prediction/commit bindings, zero model or gold access. Its private receipt is `/home/vlad_/are-benchmark-archive/g02-r10-multi-fixture-r1-20261002/FIXTURE-RECEIPT.json`. This completes **prefix-level packet testing** for Pro, Verified, and Multi, but the Multi fixture is not a real arm trajectory and does not qualify the full driver, policy, native scorer, or G02 claim.

The same synthetic Multi prediction now passed the pinned evaluator-only native
scorer against the checksum-bound ContextBench gold dataset, with no scorer
error and zero model calls. The source checkout matched the fixture's exact
commit and tree; score SHA-256 is
`34d73a8600880d768d326eaf7d3af4c88e97673a05f54fa171944f37bc00c43f`.
The private [scorer receipt](/home/vlad_/are-benchmark-archive/g02-r10-evaluator-source-r1-20261002/MULTI-SYNTHETIC-SCORER-RECEIPT.json)
records the scorer, manifest, dataset, prediction, and checkout bindings.
The deliberately irrelevant selection scored zero overlap, as expected; this
checks compatibility, **not** real-arm quality or superiority. The complete
candidate driver still needs an end-to-end no-model test on all three source
prefixes before a fresh freeze.

The exact r10 projector and pinned r9 trained model were then executed in a
read-only local filesystem namespace on three roots, with the WSL NumPy
dependency pinned to the VPS version **2.3.5**. All **Pro, Verified, and Multi**
`check-source` calls passed without a new model call or evidence mutation.
Pro's candidate bytes match the frozen r9 scored prediction exactly; Verified's
match the separately scored r10 replay exactly. Multi's projected JSON is
semantically identical to the synthetic prediction that passed the native
scorer. The [three-prefix receipt](/home/vlad_/are-benchmark-archive/g02-r10-projector-qualification-r1-20261002/THREE-PREFIX-NO-WRITE-RECEIPT.json)
binds the input, projector, policy model, and output hashes. This closes the
prefix-level projector/scorer compatibility question but **not** the complete
future driver's no-model qualification or any real Multi quality question.

2026-10-02 r10 development-only candidate: the [source-only selector](../research/g02-product-r4/derive-g02-r10-dev-pool-r1.py)
excluded all G01/G02 manifested tasks, the entire earlier r7/r8 G02 screened
pools, r9's 24 selected IDs, r14's 24 selected IDs, and all **233** reserved
ContextBench confirmation IDs. Under this stricter exposure rule Astropy had
zero untouched tasks, so the predeclared changed population uses Sympy in its
place. The remaining source-valid development supply in the four exact strata
was **22 Pro/Ansible, 77 Verified/Django, 36 Verified/Sympy, and eight
Multi/Svelte**. A seeded score-blind 32-task pool (eight per stratum) was
sealed before evaluator access at SHA-256
`6e2f76c4ed258ff5e21f7dabf81bb8794d60b4b628d24aa0e29525f9c35662e5`.
An evaluator-only nonempty-bit screen found **8/8, 8/8, 8/8, and 7/8**
eligible respectively, exporting no gold paths or scores; receipt SHA-256
`7cd3e5e014799c65fe0eb0e90558964abcc74f51c0aa7f10e9f820f78ee17c79`.
The predeclared first-six-eligible rule selected a **24-task, four-origin**
candidate, six per stratum, SHA-256
`1139a5877bcd686a63468bc75ff490963d4416313d1968ea64cc7dd43bc621dd`.
An independent WSL join confirmed exact bit-order selection, development-only
membership, and zero overlap with r7/r8 screened pools or r9 selected IDs.
All three receipts are checksum-matched between VPS and private WSL cold
storage under `/home/vlad_/are-benchmark-archive/g02-r10-dev-pool-r1-20261002/`.
At this preparation stage it was **not frozen or dispatched**. Later source
preflights passed, but the [frozen r10 development run](G02-R10-TERMINAL-NOTE.md)
failed pair 1 before benchmark model dispatch because the shallow cache had no
ref for the actual arm clone. R10 is terminal with no score or superiority.
The changed development population supports no original confirmation or
general ContextBench superiority claim.
At selection time the VPS reported only **1.7 GB** available on the root
filesystem and **4.2 GB** in `/tmp`; neither is an admission receipt for new
24-task cache hydration. Do not dispatch from this candidate without an exact
storage rehearsal and verified cold archival of any terminal scratch that is
reclaimed.

The six missing Sympy base commits were fetched as exact public source into a
new durable WSL bare cache, with all commit/tree bindings verified; receipt
SHA-256 `ebf37e561d79a05f0152ae8e1fb7bdf524d3b3f2d381617cc898a8fdaaf00142`.
Its 39-file VPS copy matches the WSL byte-tree digest
`7771b4767b01f0896892e7c62fe8dac2d444d3997ab292e0840f577f4ea39f9e`.
The original local-cache packaging attempts r1/r2 stopped before task 1
because file transport was disallowed and then the partial parent could not
serve a shallow pack. Their exact ~80 KB VPS roots remain failed diagnostics;
they were not reused or represented as passing receipts. A separately
versioned r3 fetched each exact public commit into its own guarded shallow
cache and verified **24/24** commit, tree, and origin bindings. Its 243 MB
cache tree is cold-copied to WSL and passed an rsync checksum dry-run with no
differences; receipt SHA-256
`6b45df00666864ecd32bda22eb3312ef3ff64514fc0bafe1bcc766cb0cba04ad`.

The r10 source preflight then passed **24/24** nonroot exact-cache reads,
network-disabled isolated checkouts, clean commit/tree checks, and executed
64 MiB index probes. The largest checkout was 105,065,970 bytes. Its journal
and receipt are hash-matched in private WSL storage; receipt SHA-256
`5bab09f2e8637ed010dc53e2a0ce2d25d60b88b83beffdea32c35c90131f3a41`.
An evaluator-only actual-worktree audit agreed with the executed index counts
and byte totals on **24/24** tasks, but only **87/91** native reference files
were indexed. Four reference files were missed across four tasks: two Ansible
and two Svelte. No reference paths or scores were exported. Its matching
private receipt SHA-256 is
`5dd0be24c5e7c2ba3a0b8af67126d2998755b77ed935fdbb419ac69768af196d`.
An evaluator-only classification of those four misses found **4/4 absent
from the pinned base checkout**, not omitted by the 64 MiB budget, per-file
cap, or binary filter. No paths were exported; the private receipt SHA-256 is
`31531c64802ae8b20c7891a6098016980293b8c085fadc578e85addb096db897`.
Thus the index covers **87/87 reference files that existed in the base
trees**; a source-ordering change cannot recover files introduced only by
the target patch. This resolves the index-coverage concern for this candidate,
but says nothing about actual agent acquisition or selection. The full
mixed-source driver was not qualified by these component checks; the later
r10 live attempt exposed the missing clone/ref prerequisite. None of these
receipts supports superiority.

## Open Questions

- Which gold-blind, receipt-backed acquisition and final-selection mechanism
  improves ARE File-/Span-F1 on exposed development tasks without erasing
  its token/time advantage?
- Does the selection-only DSH protocol complete with zero edit calls and
  valid final selections across a separate prospective 24-task cohort?
- Can the next separately versioned mixed-source driver pass full no-model
  packet, projection, and scoring-path qualification across Pro, Verified,
  and Multi before dispatch?
- Will a fresh matched successor clear 24/24 validity and both quality plus
  both efficiency interval gates?
