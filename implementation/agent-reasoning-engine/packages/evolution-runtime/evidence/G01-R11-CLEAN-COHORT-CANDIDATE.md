# G01 r11 changed-population clean cohort — stopped private campaign

Status: **r1 and r2 failed evaluator-only native-reference/index admission
before any GLM task or score**. The separately named r3 passed admission and
was later frozen as the private r11 campaign described below. Keep all failed
preflight attempts intact; they do not become scored pairs.

## Source-only draw and exact caches

The [r1 selector](../research/g01-fast-live-v1/propose-g01-r11-clean-cohort-r1.py)
used only the pinned ContextBench source fields, conservative G01/G02 exposure
IDs, evaluator-only clean/not-clean bits, and count-only known index failures.
It excluded all 24 r10 frozen IDs and did not open gold paths/content, native
scores, or model outcomes. After known index failures, **77 unused clean tasks**
remained. The immutable private `/opt/are/evolution-runtime/g01-r11-clean-cohort-candidate-r1/COHORT-CANDIDATE.json`
has SHA-256 `dd8a659b36e5f9f6dd13fe7dfb452eb75793777a0348791fa65f302349ebb458`;
the selector SHA-256 is `7f8b4cf06e50a8b7d6ee43b5f137aaae7299d7837b3ba34112e206eb9ef57dc9`.
It is **preflight-only, not frozen**: 24 tasks from 15 origins, capped at two per
origin/repository, with declared changed-population quotas of C++ 4, Go 1,
Java 1, JavaScript 2, TypeScript 2, and Python 14. This mix cannot support a
general language-balanced claim. The source candidate and script are hash-
matched in `/home/vlad_/are-benchmark-archive/g01-r11-clean-cohort-candidate-r1-20261001/`.

The [WSL exact-commit hydrator](../research/g01-fast-live-v1/hydrate-g01-r11-caches-wsl-r1.py)
fetched and verified all **24 commits across 15 origins** without labels or
models. Its durable WSL `SOURCE-CACHES.json` SHA-256 is
`3ba3eb07aa15ae371e5bcb1cb07156b33d36cba8f609d25531ed3ad31e7ff063`;
the 15 bare caches total **225,292,613 apparent bytes** and remain under
`/home/vlad_/are-benchmark-archive/g01-r11-source-caches-r1-20261001/`.
The entire staging tree was copied to the VPS's new
`/tmp/are-g01-r11-source-caches-r1/`; a checksum dry-run found no differences.
The first verifier stopped without a receipt on Git's UID ownership check;
the failed script SHA-256 `915af9a0d7c8e2a1e3baf0a08001208b488ac247b2a068409b1d2af0eb2f6306`
is preserved. A local, exact-path `safe.directory` flag repaired only that
check. The [repaired verifier](../research/g01-fast-live-v1/verify-g01-r11-vps-cache-transfer-r1.py)
confirmed **24/24** commit/tree bindings; private `VERIFY.json` SHA-256 is
`d41c94642eec173aadaea9f47c7efe01e811175d4893ffb040cc6095f63a56ce`.

## No-model admission and terminal r1 outcome

The [r11 preflight](../research/g01-fast-live-v1/preflight-g01-r11-runner-index-r1.mjs)
passed **24/24** pinned cache checks, **24/24** isolated checkouts and
**24/24** bounded task-specific indexes. Its private
`RUNNER-INDEX-PREFLIGHT.json` SHA-256 is
`8b3632c700ecf3f562127b7f1242e435a2c64eb1424bb632624fe7655905b36b`.
The VPS root had about **594 MB** free, but all new Git caches and scratch were
placed on tmpfs; about **3.0 GB** remained there during the checks. No retained
raw archive was deleted. A source-only lower bound identified the largest
four-checkout regular-file allocation as about **406 MB** (MUI), below the
available tmpfs with a 1.25 GiB provisional reserve. This lower bound omits
logs, metadata and model output; it is not a live-run capacity rehearsal.

The separate [evaluator-only native-reference audit](../research/g01-fast-live-v1/audit-g01-r11-index-gold-coverage-r1.py)
replayed each pinned index digest before opening labels inside the evaluator.
Its immutable `GOLD-INDEX-COVERAGE.json` SHA-256 is
`9aeada6938354b98bd34941e68afb06cce91ce9e8e41b1236aa67eb34e29fac8`.
All **24** tasks were audited, but only **55/56** distinct native reference
files were index-admitted: one TypeScript file on
`SWE-PolyBench__typescript__maintenance__bugfix__7827bc22` was excluded;
none was absent. A separate count-only diagnosis found `admission-stopped`
on five annotation occurrences of that one file at **1,999,887** index
postings, close to the two-million cap. No gold path, content, or model
answer was exported. Therefore **r11 r1 is not eligible to freeze**. The
original candidate, all 24 cache/index results, the failed audit, and the
failed verifier attempt remain unchanged. Private preflight scripts and
receipts hash-match their VPS originals under
`/home/vlad_/are-benchmark-archive/g01-r11-preflight-r1-20261001/`.

## R2 replacement qualification — failed before model use

The [score-blind r2 successor](../research/g01-fast-live-v1/propose-g01-r11-clean-cohort-r2.py)
retained all 23 r1-admitted tasks and replaced only the failed TypeScript task
under the same language quotas, seed, and two-per-origin/repository caps. Its
private candidate SHA-256 is
`17b06e1428c79d55d5c78072d4ed41221bd3ee627a0b0614a2cc9078f9f7bdd0`;
the selector SHA-256 is
`d42d9480d080779ac09ff2161c537f535719bcb8b29ca31e41b94bfca7c38cc3`.
This successor is also preflight-only, not frozen.
The candidate and selector have SHA-matched WSL cold copies in
`/home/vlad_/are-benchmark-archive/g01-r11-clean-cohort-candidate-r2-20261001/`.

The [single-replacement qualification](../research/g01-fast-live-v1/qualify-g01-r11-r2-replacement-r1.py)
fetched and verified the replacement's exact MUI commit in a new VPS tmpfs
cache, replayed the unchanged bounded source index, then checked its native
reference membership only inside the evaluator. The one reference file was
**excluded**, not absent: `admission-stopped` at **1,999,951** postings. The
terminal no-model `RESULT.json` SHA-256 is
`51a12e885cbc60413a130d79fa469ebfba53b8e7d8468ce4dcc229126c070b07`;
the qualification script SHA-256 is
`92dec810fe5a0c3d6b58ee5fdce692f67ade686a275c74a17e1368f4c9dc7f6e`.
Both have SHA-matched WSL cold copies in
`/home/vlad_/are-benchmark-archive/g01-r11-r2-replacement-qualification-r1-20261001/`.
No gold path/content was exported, and **no GLM call or native score exists for
r11 r1 or r2**. R2 cannot be frozen or run.

A source-only inventory found that all **18** currently clean, unused
TypeScript source rows are from the same MUI Git origin. Thus swapping to a
different TypeScript origin is unavailable in the known pool. The next
qualification should examine the bounded index policy and remaining MUI
source candidates without using outcomes or native labels for source
selection. Any new index policy requires a new source snapshot and symmetric
benchmark binding; it cannot silently alter r1/r2 receipts. A separately
named candidate must still pass exact cache/tree, task-specific index,
evaluator-only native-reference, storage, and source-snapshot checks before a
campaign freeze.

## R3 qualified replacement — full-cohort replay still required

The [ordered no-model qualification](../research/g01-fast-live-v1/qualify-g01-r11-remaining-typescript-r1.py)
examined the remaining clean MUI TypeScript source rows in the pinned seed
order, stopping at the first whose native reference files were all admitted.
The first candidate had **0/1** admitted at 1,999,916 postings; the second,
`Multi-SWE-Bench__typescript__maintenance__bugfix__8d36ca39`, had **2/2**
admitted at 1,999,960 postings under the unchanged source-index policy. This
is pre-model eligibility evidence, not a quality result. The terminal
count-only receipt SHA-256 is
`9d705ecd9ffe68262d892c98ffcd726e018fe3a2d8103c5c3aec58198e0fea85`,
and its script SHA-256 is
`c411eccd621a76471d8f98a3d4054a2a7b18dabde8584e9ee53566a4e81b6287`.
Both have SHA-matched private WSL cold copies under
`/home/vlad_/are-benchmark-archive/g01-r11-remaining-typescript-qualification-r1-20261001/`.

The [separate r3 selector](../research/g01-fast-live-v1/propose-g01-r11-clean-cohort-r3.py)
retained the same 23 r1-admitted tasks and bound only that first qualified
replacement. Its 24-task, 15-origin candidate SHA-256 is
`4a880cebe939ab25e3c35431cef7396a95534c863547e74024bc5211991bdb66`;
the selector SHA-256 is
`4b3fec9b36536621706931fcc7a896be471228094a41250bce1c810ff1523613`.
Both hash-match their private WSL cold copies under
`/home/vlad_/are-benchmark-archive/g01-r11-clean-cohort-candidate-r3-20261001/`.
The [r3 cache binding](../research/g01-fast-live-v1/verify-g01-r11-r3-cache-binding-r1.py)
verified **24/24** exact commits and trees across 15 origins, using the 23
retained r1 bindings and the separately qualified replacement cache. Its
`VERIFY.json` SHA-256 is
`6f0e9a31382fe5ecc7a28d01e2ff704f1c2e92e1c0634574aae63b7c110fb3f7`.
The first [full source-only replay](../research/g01-fast-live-v1/preflight-g01-r11-r3-runner-index-r1.mjs)
passed 24/24 cache checks and isolated checkouts but only **23/24** indexes:
the retained Transformers task failed at roughly 60.5 seconds. Its failed
receipt SHA-256 is
`74ac93483fcac96b0ebc38ac53c934cd3770a9d5475fd937eb0c4e3bbe2ff166`.
A direct no-model replay of that exact Transformers worker then passed in about
39.1 seconds with index digest
`2545a44db0ce09cc11d8f6dd1d6956a13d2d73b48099a9610cb2f71e73f7a712`.
The failed receipt remains unchanged and cold-archived under
`/home/vlad_/are-benchmark-archive/g01-r11-r3-preflight-r1-20261001/`.

The separately versioned [second full replay](../research/g01-fast-live-v1/preflight-g01-r11-r3-runner-index-r2.mjs)
pinned that failure and passed **24/24 cache checks, 24/24 isolated checkouts,
and 24/24 bounded indexes**. Its receipt SHA-256 is
`61ee7663a11af030975ec412953d32e552584a6ec80beae8594c4d11dea46c6c`.
The independent [evaluator-only native-reference audit](../research/g01-fast-live-v1/audit-g01-r11-r3-index-gold-coverage-r1.py)
then reproduced all 24 index digests and admitted **57/57** distinct native
reference files: zero excluded, zero absent, zero worker-unavailable. Its
`GOLD-INDEX-COVERAGE.json` SHA-256 is
`60ee6f3285418545b3370b969fc3f1e5265fe72cec03ae6b7c3e2cb110277e91`.
Passing source and evaluator receipts plus scripts have SHA-matched WSL cold
copies under
`/home/vlad_/are-benchmark-archive/g01-r11-r3-preflight-passing-20261001/`.
No gold path/content was exported. At this preflight stage, r3 was **not yet
frozen or dispatched**; the separate campaign freeze is recorded below. No
GLM request or native score came from the admission checks.

The [source-only r3 storage census](../research/g01-fast-live-v1/census-g01-r11-r3-storage-r1.py)
found the newly selected MUI TypeScript task to be the worst four-checkout
regular-file allocation: **1,075,036,160 bytes**. At the check, tmpfs had
**2,861,703,168 bytes** available versus the provisional floor of
**2,417,213,440 bytes** (four regular-file copies, 1 GiB reserve, 256 MiB
uncertainty). The lower-bound gate passed; it omits Git metadata, directories,
receipts, logs, archives, and model output. `STORAGE-CENSUS.json` SHA-256 is
`4ef1cab9098e780f6073cf83ecf17f13441e7b5052d56b671fd19e91389e0218`,
with a matching private WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r11-r3-storage-census-r1-20261001/`.
The lower bound alone did not establish that the live pair would fit.

The [exact no-model four-checkout rehearsal](../research/g01-fast-live-v1/probe-g01-r11-r3-scratch-layout-r1.mjs)
used the worst MUI task and passed four base/work checkouts across control
and candidate arms. It consumed **1,453,719,552 tmpfs bytes**, materially
above the regular-file lower bound, leaving **1,407,983,616 bytes** free at
the check. This is only about **65.8 MB above** the 1.25 GiB operational
reserve; live logs/model outputs and archives were not exercised. The probe
receipt SHA-256 is
`910f1ad7471d4c6ac9af27e7c88b2ef45dc75c194c9fc7ad0b29cd664e5af8b1`.

The [WSL cold archive and full-restore comparison](../research/g01-fast-live-v1/archive-g01-r11-r3-scratch-probe-wsl-r1.mjs)
passed: the 682,185,870-byte compressed archive SHA-256 is
`2399183be844affcc5374efdaf7f99f11456492b78b326ff40015351423d5afb`;
the manifest SHA-256 is
`35dbbb5a026f23eb8452506c8cae3368d0cd19d2cd988ca3ea6f091455e9bfb4`.
The restored tree matched the VPS scratch by rsync checksums, modes and
symlinks. Only after that verification, the [exact scratch reclaim](../research/g01-fast-live-v1/reclaim-g01-r11-r3-scratch-probe-r1.mjs)
removed `/tmp/are-g01-r11-r3-scratch-layout-probe-r1` and recovered exactly
**1,453,719,552 bytes**; `SCRATCH-RECLAIM.json` SHA-256 is
`1c332e419a2bf3f549bd2c0797ab7c0e9860b128137067b66ebdc858a60fb9f6`.
Historical caches and receipts were preserved. Archive, manifest, receipts,
and scripts are under
`/home/vlad_/are-benchmark-archive/g01-r11-r3-scratch-layout-probe-r1-20261001/`.
This qualifies the four-checkout layout only, **not** a live pair's peak.
Additional tmpfs headroom or a proven bounded live-output/streaming design is
needed before a 24-pair freeze; VPS root also remains under about 0.6 GB free.

To recover bounded tmpfs headroom without losing historical evidence, the
[fresh cold-copy verifier](../research/g01-fast-live-v1/verify-g01-r10-cold-caches-for-r11-reclaim-wsl-r1.mjs)
restored the existing r10 r1 and r3 source-cache archives and compared each
whole tree against its current VPS cache by checksum, mode and symlink dry-run.
Both matched; `PREFLIGHT.json` SHA-256 is
`0910420733ddae1e5aa654605f517589eea6b7893b25fc5d7bf0d2bb9d8b5724`.
The [exact reclaim](../research/g01-fast-live-v1/reclaim-g01-r10-cold-caches-for-r11-r1.mjs)
then verified r11's 24 cache bindings did not use either historical root and
removed only `/tmp/are-g01-r10-source-caches-r1` and
`/tmp/are-g01-r10-source-caches-r3`. Recovered bytes were **313,430,016** and
**172,978,176** respectively (**486,408,192 total**); reclaim receipt
SHA-256 values are
`49eefedc8e8d03470c2812030e8e1c1cc727e34f10eccb006d173d1fccb122a1`
and `325c7dcf1e02c432730c744fb882aa4c85c36f672aa4d760a193643bc4dfb1d2`.
The WSL cold archives and all VPS source receipts remain recoverable. Free
tmpfs rose to **3,348,111,360 bytes**. Subtracting the measured r3
four-checkout consumption yields **1,894,391,808 bytes**, about **552 MB above**
the 1.25 GiB reserve before live outputs. This is a projected margin, not a
repeated live-pair measurement. VPS root free remains only about **620 MB**,
so its own guarded run floor and raw-output archival still need resolution.

The [full-tree r3 source verifier](../research/g01-fast-live-v1/verify-g01-r11-r3-source-r1.mjs)
bound the existing r32 source snapshot and its **407** files, then ran every
bound test file: **91/91 tests passed across 16 files**, with zero model calls
and no gold loaded. The private `SOURCE-VERIFICATION.json` SHA-256 is
`132b19afd4278e8a15544254bc9a9f866b6bfd534085753b8e9d233c3bb72abb`;
the verifier SHA-256 is
`a42b2b86e63884118e91f81a093216235c97f0210988b746f985633cbc639f45`.
Both match VPS originals under
`/home/vlad_/are-benchmark-archive/g01-r11-r3-source-verification-r1-20261001/`.
This qualifies the source tree and tests, **not** the r11 campaign freeze or
any live-pair reliability, quality or cost outcome. A fresh tiny same-account
provider check separately passed tokenizer and generation HTTP 200/200; its
private receipt SHA-256 is
`90c2270da81dfb0772439418fa78b0c5c90f7d165c8778d542723e7e4a9aa79c`.
Provider readiness must be fresh again at actual dispatch.

To restore the guarded runner's root-disk margin, the
[exact terminal-source archival tool](../research/g01-fast-live-v1/archive-reclaim-terminal-g02-sources-for-g01-r11-r1.mjs)
copied the `sources` subtree of the already scored, exposed G02
`g02-cross-layer-pr3-elem-5c001746` development pair to private WSL storage.
It fully restored the archive and compared the whole tree against the VPS by
checksum, mode and symlink before deleting only that exact subtree. The pair's
decision, scores, logs and other files remain on the VPS, and the decision
SHA-256 stayed `2d04425f5ae3b89669d316be842b253055b82507c839af94b3e23127d23d06b0`.
The recoverable archive SHA-256 is
`00b6ca69e2cc09a37e61111461443a34e31c6ec35a1a37250f9cd7e5e286baa0`;
the reclaim receipt SHA-256 is
`6f6c5fcababe8f82f0c539db08f8f6a79e25bf0b5a8a23503f80f02df8e3ff6a`.
Both are under
`/home/vlad_/are-benchmark-archive/g02-cross-layer-pr3-elem-5c001746-source-reclaim-20261001/`.
The reclaimed source occupied **1,306,279,936 bytes**. VPS root free rose to
**1,925,951,488 bytes**, above the historical **1,476,395,008-byte** guarded
root floor. The two terminal G01 r10 pair roots used 6.6 and 8.6 MB; those
are observations, not an r11 live-output cap. At this stage the campaign was
still unfrozen; the separate versioned freeze and decision rule follow.

## R3 prospective r11 freeze and dispatch

The exact r32 source had passed **91/91** bound tests, but its historical
campaign preparer admitted only 96K-token templates. The [versioned r40
source snapshot](../research/g01-fast-live-v1/verify-g01-r11-r40-source-r1.mjs)
changed only that preparer to admit either 96K or 160K and added its 160K
symmetry test. It retained **407** bound source files, passed **92/92** tests,
and has tree SHA-256
`8b30437bb41bf68ca5385d05054bd9e60444599da7c522c866a54a1635d15faa`.
The VPS snapshot receipt SHA-256 is
`d4f3136be2d3a0e5f9d56d0166fe3f2c724f8706d834adb32310b3d1c89ccf98`;
the full source and receipt match their private WSL copy in
`/home/vlad_/are-benchmark-archive/g01-r11-r40-source-snapshot-20261001/`.
This binder change does not alter the r32 live candidate or control policy.

The [r11 definition checker](../research/g01-fast-live-v1/define-g01-r11-r3-r1.mjs)
passed exact r3 candidate, 24 cache, 24 checkout/index, 57/57 evaluator-only
native-reference, and r40 source bindings without writing manifests or
calling GLM. It fixed a **24-task, 15-origin, six-language** changed
population, symmetric 8K windows, **160K total-token caps per arm**,
**240-second request timeouts**, zero automatic retries or replacements,
and a predeclared explicit-no-final-context zero-abstention rule. A narrow
superiority claim requires 24/24 terminal scored pairs (native predictions or
only those predeclared abstentions), intact seals and independent audits,
no unresolved label/score-integrity issue, and repository-stratified paired
95% intervals favoring ARE on both File-F1 and Span-F1 and on both known
tokens and summed arm time. Other unscored pairs fail that strict gate.

A fresh same-account readiness check passed tokenizer/generation HTTP 200/200
(SHA-256 `27ff2a841f933f6fb10f055674cd38db92b88f5276433d4110a6c15e36ab4474`).
The [one-time freeze](../research/g01-fast-live-v1/freeze-g01-r11-r3-r1.mjs)
then wrote definition SHA-256
`adbaaf8355c8887a18e31360858780fd395a5dfd1cd8838c6a83a5ae10a0e89f`
and campaign SHA-256
`8614ceff2338089f98630ea30c1ed887db55d004de6c77cbddb7a50098048081`,
with **zero campaign model calls**. A whole-tree checksum comparison found no
differences between those immutable VPS input/campaign manifests and their
private WSL copy in
`/home/vlad_/are-benchmark-archive/g01-product-replication-r11-freeze-20261001/`.
The [guarded serial runner](../research/g01-fast-live-v1/run-g01-r11-serial-wsl-r1.mjs)
passed read-only admission with root free **1,915,195,392** bytes above its
**1,476,395,008-byte** floor and tmpfs free **3,348,111,360** bytes above
its **3,173,777,408-byte** pre-pair floor. A second fresh provider check
passed HTTP 200/200 (SHA-256
`27f329f8724df626b469ddf4e1bb0790bdad50ea742c6d79d4387af56036c11e`).
The serial run was then started. Each terminal pair must have its exact source
scratch cold-archived, restored and compared before reclaim; the runner stops
after any unscored pair. This section makes **no scored-result or superiority
claim**; terminal results belong to the later outcome audit.

## R11 stopped result — 13 attempts, 12 scored

The serial coordinator completed the first **12/24** frozen pairs as
terminal `scored` results, then stopped after the **13th unscored** pair.
All 13 exact source scratch trees were cold-archived, whole-tree-compared,
and reclaimed before the stop. The first twelve cold
archive SHA-256 values, in order, are
`83f885c236c96b69cc7406f122a8ad08af51ef09ffab53218fde5291c0b155a4`,
`1097d31ac198e9ba568fc1258f7c96aa089f6f2acc242a7d8843896fc7143306`,
`b4fc6d3aaef7ecb62ad9224c82c73c41962be2af8c43c5dfbfb4b934a9cf08f1`,
`edd33346372288bdb06be162729817e26ef4e6b9ae9be4f0f726fafab8df4f4b`,
`d45beb4d786380481431c6f861efa82b8703d8b73fe46a58123a8726f37a2b40`,
`8f8a0b141126b68d488f9ece2ec304f5bdd2c846a5781e8b3442814928fb2399`,
`ea329fbf0c7eb4c13bbe918021e54a91cd48d3c23f8687c5cc1cb4d84ae5bc18`,
`3f584ea887c6d6b9875996c86c3e91ae07471cd1b22a9f6faa1b2f24c2544d11`,
`bc1bf8b30c0dfd2505eb3c7201a5fa4bb7804ce67da0c08cbcd834a7be92d791`,
`7f1dbaf4e04910f784d89699220235ef395f6aa18fee362909d39cf02d3717f5`,
`9553858c3d0e03c5eacb750852c3eea06e7da54fb8499b7c7c2ab2203933ba50`,
and `5c0c7209f0b38e9b6d56634224af31f100b567a4367fb9838d46e4da526d5ff1`.
Pair 13's archive SHA-256 is
`31dca31cb1874b5e4031225d0e8a31da86be45665f5f919eeea93485fbd5e912`.
The [independent partial receipt auditor](../research/g01-fast-live-v1/audit-campaign-r11.mjs),
SHA-256 `30848a1adefb50d1fe36f048963eff581dd71efb872a707ad4168ae410bd1daf`,
is staged at `/opt/are/evolution-runtime/g01-r11-audit-tool-r2/`. It verified
**407/407** frozen source hashes, pair plans, pre-score seals, native metrics,
one run per arm, and one-attempt tokenizer transport settings for **12/12**
scored pairs. Its stopped-state check reports **13 terminal attempts, 12
scored, 1 invalid, and 11 pending**. Do not write a 24/24 terminal audit or
compute the frozen intervals. The earlier r1 staged auditor remains as
provenance.

The first pair (`cpp-json-0abc73df`) tied at zero on both quality metrics;
the candidate used **75,617 vs 80,958** known tokens and **193.45 vs 238.89**
arm seconds. The second (`cpp-json-b970b964`) improved Span-F1 **0→0.19963**
and File-F1 **0→1.0**, using **39,258 vs 81,153** tokens and **106.47 vs
204.99** seconds. The third (`cpp-fmt-4fc9eca1`) improved Span-F1
**0.04868→0.13826** and File-F1 **0.50→0.66667**, using **40,756 vs 81,331**
tokens and **91.97 vs 150.83** seconds. The fourth
(`cpp-fmt-8ebb764e`) improved Span-F1 **0→0.18404** and File-F1
**0→1.0**, using **49,984 vs 81,635** tokens and **115.84 vs 207.32**
seconds. The fifth (`go-go-ed8db47d`) tied Span-F1 at zero, improved
File-F1 **0→0.5**, and used **49,759 vs 83,538** tokens and **138.25 vs
202.02** seconds. The sixth (`java-jackson-f0db9a27`) improved Span-F1
**0→0.19830**, tied File-F1 at **1.0**, and used **33,977 vs 80,993**
tokens and **103.10 vs 198.05** seconds. The seventh
(`javascript-svelte-2f838a18`) improved Span-F1 **0→0.19405** and File-F1
**0→0.66667**, with **59,202 vs 82,432** tokens, but its candidate arm was
slower (**265.37 vs 230.08** seconds). The eighth
(`javascript-svelte-e647c8ce`) improved Span-F1 **0→0.26095**
and File-F1 **0→0.5**, with **43,678 vs 61,418** tokens and **122.59 vs
128.70** arm seconds. The ninth (`typescript-material-ui-2bb4ea7a`)
regressed Span-F1 **0.41926→0.27180**, tied File-F1 at **0.66667**, and
used **34,655 vs 83,456** tokens and **140.89 vs 212.64** seconds.
The tenth (`typescript-material-8d36ca39`) tied both quality metrics at
zero, with **39,349 vs 81,542** tokens and **218.81 vs 305.99** seconds.
The eleventh (`python-sympy-c4bcf730`) tied Span-F1 at zero and File-F1
at **0.66667**, using **42,474 vs 80,895** tokens and **131.50 vs 210.64**
seconds. The twelfth (`python-sphinx-5462d419`) improved Span-F1
**0→0.53831** and File-F1 **0→1.0**, using **30,874 vs 60,724** tokens
and **99.66 vs 149.66** seconds.
These are partial private observations; the failed frozen 24-pair denominator
precludes an r11 superiority claim or a valid r11 four-interval analysis.

The 13th task (`python-matplotlib-ce7f17a5`) is `unscored`: its control
ended `run_error` / `aggregate-admission.read-binding` after 11 model calls,
while the candidate produced a final context. This is not the predeclared
`instrument.no-final-context` zero abstention and cannot be converted to a
scored pair. Its `PAIR-RESULT.json` SHA-256 is
`ddcdb76e4637e387375b7070670a0c24e9106630198d1ec0ce7b29f68cb1e560`.
The failed control's exact final call used permitted compact
`recover_archived_read` arguments `{archive_sha256, observation_index}`;
the returned observation was successful and carried matching archive origin.
The frozen r40 admission module still required omitted optional path/line/
revision arguments, despite the older r21 development fix. The
[provider-free exact replay](../research/g01-fast-live-v1/replay-g01-r11-stop-r1.mjs)
reproduced the r11 failure and admitted the same exchange through r21 code
with zero model calls. Its receipt SHA-256 is
`f95d2a27fdff2c5ec6d85c4f92e095a873d5f5fc03cecd2b71ee66b13f72cda3`;
the script SHA-256 is
`bd17c139033365ca2bfc4003b468e8dea8a73eb8282e98f985ffa5e86250a471`.
The receipt has a matching private WSL cold copy. The coordinator stopped
after archiving this source, so the remaining 11 frozen pairs were not
attempted. R11's strict 24/24 gate is failed, regardless of the descriptive
12-pair trend. A separately named successor must qualify a corrected source
snapshot and an independently eligible cohort before model dispatch.

The [terminal numerical analyzer](../research/g01-fast-live-v1/analyze-g01-r11.mjs)
was prepared but is **inapplicable to stopped r11** and has not run on
campaign results. Its local and staged VPS
copies match SHA-256
`eaa2c35ed92b4b563d17bfd247df87026dcc4ef8f89b9e15d5901a13d0acf221`
at `/opt/are/evolution-runtime/g01-r11-analysis-tool-r2/`;
its two deterministic tests pass. It requires a terminal 24/24 independent
audit, then computes the frozen 20,000-resample repository-stratified paired
intervals. The cohort has 15 Git origins but 16 literal repository spellings
because `mui/material` and `mui/material-ui` refer to the same MUI origin;
the analyzer binds each row to the pinned candidate's `repo_url` so those
two rows remain one stratum. A prior unstaged-for-use analyzer copy in
`g01-r11-audit-tool-r1` used a literal alias rule and is retained only as
provenance; the versioned r2 path above would have been the terminal r11
tool but must not be run on the stopped campaign.
Numerical gates alone cannot establish label integrity or publication scope.

## Open Questions

- Why did the r40 source snapshot omit the already tested r21 compact-recovery
  admission fix, and which source-lineage check will prevent that regression
  in a separately versioned successor?
- Can a new score-blind cohort exclude all 13 r11 attempts while retaining
  enough clean, index-admitted tasks and honest language/origin coverage for
  a separately frozen 24-pair campaign?
- Will a corrected successor clear 24/24 paired validity and all four frozen
  quality/efficiency intervals without further storage or provider failures?
