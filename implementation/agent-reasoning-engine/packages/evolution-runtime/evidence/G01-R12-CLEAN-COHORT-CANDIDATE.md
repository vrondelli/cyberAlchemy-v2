# G01 r12 changed-population clean cohort — private preparation

Status (2026-10-02): **r12 r1 failed evaluator-only index/native-reference
admission before any GLM call. R12 r2 passed 24/24 full no-model source
replay, 49/49 native reference-file admission, and an exact four-checkout
storage rehearsal. R12 r2 froze, but the guarded serial run stopped after
pair 3: 2 scored, 1 unscored, 21 unattempted.** Its strict 24/24 claim gate
failed. No superiority result exists for r12.

## Lineage and population

The isolated r41 source snapshot is qualified at tree SHA-256
`bac9fcdf9d485b6bec42eb9372261dab9fc58797145e17917542f197b5ef13de`;
its 95/95 VPS tests and exact sealed r11 failure replay are bound by private
receipt SHA-256
`310e2703d06b95a193eeeb25d4888f2b5d011d9e2c1cbde36355fa81dd17b6d4`.
This repairs source admission only. The stopped r11 campaign remains
12 scored, 1 unscored, 11 unattempted and fails its strict 24/24 gate.

The [r12 r1 selector](../research/g01-fast-live-v1/propose-g01-r12-clean-cohort-r1.py)
uses pinned source fields, conservative manifested exposure IDs, and
evaluator-only clean/not-clean bits. It excludes all 24 r11 frozen IDs, even
the 11 not attempted. The 53 remaining known-clean tasks have at most 30
slots under two per Git origin; the known pool has no Go or Java task. The
r12 population is therefore explicitly narrower than r11: 24 tasks from
16 Git origins and 16 dataset repositories, with 3 C++, 2 JavaScript,
2 TypeScript, and 17 Python tasks. R1 source-only manifest SHA-256 is
`3b6ac88cc20c565817a023e58735b7d83624a31e80897b7b1acea54a3cdfa23f`;
the selected ID-set SHA-256 is
`58544fee18b29e9b3f41b857344c9f2c0163e951f43719ac8423779bc3d0036f`.
It has a SHA-matched WSL cold copy in
`/home/vlad_/are-benchmark-archive/g01-r12-cohort-candidate-r1-20261001/`.
No model output, native score, or gold path/content was used in selection.

## R1 cache and index admission — terminal preflight failure

All 24 exact commits across 16 origins were hydrated to durable WSL bare
caches (receipt SHA-256
`c5f5b3ae4478a63e012853ebbc0b86f840576e1c7fba22cc2e4f8176d9d0e443`)
and checksum-copied to `/tmp/are-g01-r12-source-caches-r1/`. A separate VPS
Git verifier passed 24/24 exact commit/tree bindings (receipt SHA-256
`a7aa8be8c6ba9e31c01c41d0c9126e165e1faf038248a48190354aa258b46443`).
The first preflight failed 0/24 cache checks on Git `origin-identity`
because the transferred WSL UID was not trusted; receipt SHA-256
`7c325b8b1f7c891bb180626701bde8631d81d7886ed2bea7961c5f57d89dea16`.
R2's exact-path safe-directory verifier passed 24 cache checks but all
checkouts failed because the source helper made its own Git calls; receipt
SHA-256 `cb67367da72f54c7cc03dd6dc1f4f6999e179de7a265179c5fd6ca0d2c5cbc11`.
The symlink-free r12 cache tree was changed to VPS root ownership, matching
the r11 convention, without changing receipt bytes. A separately versioned
[r3 preflight](../research/g01-fast-live-v1/preflight-g01-r12-runner-index-r3.mjs)
then passed 24/24 cache, checkout and bounded-index checks; receipt SHA-256
`d9751dd574802401377c0d3f56909777dbb23b4f8993a97ff7640b7b5a99b73f`.
All three receipts have matching WSL cold copies under
`/home/vlad_/are-benchmark-archive/g01-r12-preflight-r1-20261001/`.

The [independent evaluator-only r1 audit](../research/g01-fast-live-v1/audit-g01-r12-index-gold-coverage-r1.py)
covered 24/24 tasks but admitted only **43/45** native reference files. Its
two excluded files were the sole reference file on each selected MUI
TypeScript task; no file was absent. Receipt SHA-256 is
`d1d8bdf797463a31ea865ae381c17da410d0856083f99a84c00f39f2f4463ddd`,
with a matching WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r12-index-gold-coverage-r1-20261001/`.
R12 r1 is terminal as an unfrozen preflight candidate; no task may be silently
replaced within it.

## Ordered TypeScript repair and r2 full replay

The [separate ordered qualifier](../research/g01-fast-live-v1/qualify-g01-r12-remaining-typescript-r1.py)
examined the 14 other known-clean untouched MUI TypeScript source rows in
the fixed source-only seed order. It opened native labels only inside the
evaluator and exported count-only admission results, not gold paths,
content, native scores, or model answers. Ranks 1, 3, 4 and 5 were
index-ineligible; ranks **2** and **6** were the first two fully admitted.
The terminal receipt SHA-256 is
`5f9817dbe06153cadf0d8f657d0686f1d39029eeaa4abbc3b8b04a88974ae3e1`.
Its script, receipt, and complete qualified Git cache have verified WSL
cold copies under
`/home/vlad_/are-benchmark-archive/g01-r12-remaining-typescript-qualification-r1-20261001/`.

The [r12 r2 selector](../research/g01-fast-live-v1/propose-g01-r12-clean-cohort-r2.py)
retains the 22 r1-admitted tasks and replaces only the two r1-ineligible
TypeScript tasks with the rank-2 and rank-6 qualified rows. Its separate
source-only manifest SHA-256 is
`427a3dbdc746f9260ad705a9599041f69572cdb9d79e5efb19fa63190c91cbbd`;
ID-set SHA-256 is
`f12a9e256e429e45e8cda907593a976a1855c52d394f80632dd5c1edf66c19fc`.
The 24 exact Git commit/tree bindings passed (receipt SHA-256
`924154f3dcee88baa9393decb7e8408e37c06b67298632c76689189c98afbd2c`).
The [full r2 preflight](../research/g01-fast-live-v1/preflight-g01-r12-r2-runner-index-r1.mjs)
passed 24/24 cache checks, isolated checkouts, and bounded indexes
(receipt SHA-256
`41e00a91e5456c90a5920a24c3dffec1036b8bc13c80c8339b8a8db2e27dd47b`).
Its [independent evaluator-only full audit](../research/g01-fast-live-v1/audit-g01-r12-r2-index-gold-coverage-r1.py)
admitted **49/49** native reference files across **24/24** tasks, with
zero excluded, absent, or worker-unavailable files; receipt SHA-256
`d6442bb34d2240fb2f903ef442284efa3974a768a5d06603e1511e7d2901d406`.
Each artifact has a matching private WSL cold copy in its corresponding
`g01-r12-r2-*` archive directory.

## Storage and archival

The [source-only storage census](../research/g01-fast-live-v1/census-g01-r12-r2-storage-r1.py)
identified rank-6 MUI TypeScript as the largest four-checkout task. Its
regular-file lower bound was 1,158,496,256 bytes; with the declared reserve
and uncertainty, the provisional floor was 2,500,673,536 bytes against
2,946,789,376 available tmpfs bytes. Census receipt SHA-256 is
`4abc7f4dcabbbb8c5e87f790226159f74a9b70b14d69875061a89631cdd10f15`.
That lower bound omitted Git metadata and was not treated as a live capacity
proof.

The first exact [four-checkout probe](../research/g01-fast-live-v1/probe-g01-r12-r2-scratch-layout-r1.mjs)
consumed 1,606,123,520 bytes and stopped because only 1,340,665,856
bytes remained, about 1.5 MB below the unchanged 1.25 GiB reserve.
The full failed scratch was cold-copied to
`/home/vlad_/are-benchmark-archive/g01-r12-r2-scratch-probe-r1-20261001/`,
compared in both directions by checksum, and only then reclaimed on VPS.
After separately archiving and reclaiming a terminal r11 MUI cache, the
separate [r2 probe](../research/g01-fast-live-v1/probe-g01-r12-r2-scratch-layout-r2.mjs)
passed with the same four checkouts, consuming 1,606,123,520 bytes under
the unchanged reserve. Receipt SHA-256 is
`66ddcc5c87b1d9ac70ca18ec90eb5507536ab5d3c5c422280d0b6a9fdd8ad16e`.
The complete passing scratch and receipt have checksum-verified WSL copies
under `/home/vlad_/are-benchmark-archive/g01-r12-r2-scratch-probe-r2-20261001/`;
the VPS scratch was then reclaimed. After another terminal post-r8 source
cache was copied to WSL and bidirectionally checksum-verified, its exact
285,843,355-byte VPS tmpfs tree was reclaimed. The launch preflight saw
3,334,402,048 bytes free tmpfs and 2,239,565,824 bytes free root, above
the unchanged 3,173,777,408-byte and 1,476,395,008-byte floors.
The passing probe still does not bound live output,
logs, archive streaming peak, or provider reliability.

To create that headroom, only exact already-terminal private VPS duplicates
were removed after WSL recovery checks: the r11 source-cache tree, r11
remaining-TypeScript cache, r11 r2 MUI cache, and the r7 compressed archive
plus its manifest. Their WSL copies remain; the r7 archive and manifest
match SHA-256 `59d9bf27620441fa2be59da37273a9969de7a7530f93a36fd6cbb8ba66783b14`
and `27539b8a573c6fae1256ba67fd76754436dd9dfbaa9fc708477c6d97199aa11f`.
No campaign score or receipt was deleted.

## Frozen r12 r2 dispatch

The [check-only definition](../research/g01-fast-live-v1/define-g01-r12-r2-r1.mjs)
bound all 24 source-only tasks, exact cache paths, r41 source tree, full
preflight and native-reference audit, and the unchanged paired 8K protocol.
Its projection SHA-256 is
`380f32df5cc52a5fc5e5a28e9498d67c34f99dd21dbfabbf6b17e81bba21eb9b`.
The [freeze](../research/g01-fast-live-v1/freeze-g01-r12-r2-r1.mjs)
used a fresh same-account HTTP 200/200 readiness receipt SHA-256
`7517329af3edf8de1c0edcaf7718cb573a5f0aa97cc9c029e6961272e7c30eef`.
Definition SHA-256 is
`d7410c9e5a8ad346f9c6a312d02bda6282b0893a79e0c3017304fa564c70c7c4`;
24-task campaign freeze SHA-256 is
`b47ba1b2ea0a540f085758a84cc45599c9fdf6a124e18c144b6e9a8f2c4f6ee4`.
The VPS paths are `/opt/are/evolution-runtime/g01-product-replication-input-r15/`
and `/opt/are/evolution-runtime/g01-product-replication-r12/`; WSL cold
copies are under `/home/vlad_/are-benchmark-archive/g01-product-replication-r12/`.
A separately fresh dispatch-readiness receipt SHA-256 is
`2ad7aac03c11dfd02f32eb447631a950e98682aabbdcc04cd8aa2ef20e7367a8`.
The existing guarded serial coordinator now admits this exact r12 root and
uses the same pair-by-pair cold archive and scratch-reclaim discipline.
An [independent selected-label join](../research/g01-fast-live-v1/audit-g01-r12-label-lineage-r1.mjs)
matched all **24 frozen IDs and 166 annotations** to 11 pinned pre-dispatch
exact-base clean-label screens without exporting gold paths or content.
Its VPS and WSL receipt SHA-256 is
`8567b38dd0b661c44f6a5e91eb8a65c29a65cfbe3f87ee41ca9739f349801b0f`.
This is mechanical positional-label integrity, not semantic correctness.
The first task, `cpp-fmt-7d2b8c72`, terminated **scored**. Its control and
candidate Span-F1 were 0 and 0.0678560; File-F1 were 0 and 0.666667;
known tokens were 83,500 and 67,328; duration was 297.585 and 273.335
seconds respectively. The source archive SHA-256 is
`bb12e075a3e0ea498f5b0e70c88274dccffa057c69dd2ea4712adc4c8f5990a8`;
the WSL archive was fully restored and checksum-compared before its exact
VPS scratch root was removed. Pair 2, `cpp-json-9b468650`, also terminated
scored: control/candidate Span-F1 0/0.0283506, File-F1 0/0.666667,
known tokens 81,889/41,812, and duration 268.829/157.276 seconds.
Its source archive SHA-256 is
`3477c30d2c7639083758606990d9a3235820e89ffef29ced88bf26e1ad56c66d`.
The separate independent receipt audit passes both terminal scored pairs;
their complete terminal pair trees are checksum-matched in WSL cold storage
under `/home/vlad_/are-benchmark-archive/g01-product-replication-r12/terminal-pairs/`.
Pair 3, `cpp-json-6b14bf49`, ended **unscored**: its control failed
`read.arguments-output-mismatch` and its candidate completed. Its full
terminal pair tree is checksum-copied to WSL, and its source archive SHA-256
is `cdd40bf863ce069d22e963106db7069e8ca61dc6605b7b1fe8fcf4f32cf46556`.
The coordinator stopped after archiving and reclaiming only that exact
scratch tree; 21 frozen pairs were not attempted. Independent receipt audit
confirms 3 terminal, 2 scored, 1 invalid and 21 pending. The two positive
early pairs are preliminary and cannot repair the failed 24/24 gate.

## Separate prospective r42 delivery repair

The r12 pair-3 sealed control archive contains two successful compact
`recover_archived_read` calls. The [old compact delivery binder](../research/g01-fast-live-v1/verify-g01-r13-r42-source-r1.mjs)
reproduces `read.arguments-output-mismatch` because it applies ordinary
`read_file` path/start-line argument matching to compact recovery arguments,
which instead name an immutable archive observation. The separately edited
prospective r42 source validates the recovery origin and optional full-form
range while accepting the compact form. It does **not** mutate r12.
Its 409-file source tree SHA-256 is
`69c0098b5b04acac69825ea572affa1b749948af5e85a51e8859b2a8baced602`;
the pinned VPS run passed **97/97** tests. Exact sealed replay yielded
16 delivered observations and zero unmapped in r42, versus the old error.
Qualification receipt SHA-256 is
`f781977e48e7f62d243b0c1c7b5dc2dbbc076d15eb2256108388c9b92bf68d96`.
The complete source and receipt have checksum-verified WSL cold copies under
`/home/vlad_/are-benchmark-archive/g01-r13-r42-source-development/`.
This is a source reliability qualification only, not a model score or
superiority result.

The [post-r12 source-only census](../research/g01-fast-live-v1/census-g01-r13-clean-supply-r1.py)
conservatively excludes all manifested r12 IDs. Its receipt SHA-256 is
`fff629cdecce763d671295edf36484c4340b4ed71193a2191ecbd3214ac2e15c`
with a WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-clean-supply-census-r1-20261002/`.
Only **32** previously screened-clean, unmanifested tasks remain across
16 Git origins (2 C++, 1 Java, 1 JavaScript, 14 Python, 14 TypeScript).
The unchanged two-per-origin rule permits at most **20** of them; repository
and index constraints can only reduce that bound. A new 24-task cohort
therefore requires independently screening additional previously unmanifested
source rows, not simply reusing r12's 21 unattempted frozen IDs.

## Separately selected r13 source-only successor

A fixed-seed source-only screen selected **56** previously unmanifested and
unscreened Python tasks from nine Git origins, excluding source-invalid rows
before selection. The source manifest SHA-256 is
`9a6ac987ad8d100584d782b33a3a240ecf5c479d8c402ce3aa550d46c57a20e6`.
A separate evaluator-only exact-base audit found **18/56** mechanically clean
tasks after 152 successful immutable source fetches, with no model calls or
gold paths/content exported. Its receipt SHA-256 is
`67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc`.
Both receipts have SHA-matched WSL cold copies under
`/home/vlad_/are-benchmark-archive/g01-r13-fresh-supply-screen-r1-20261002/`.
The [screen](../research/g01-fast-live-v1/screen-g01-r13-fresh-supply-r1.py)
and [capacity/selector](../research/g01-fast-live-v1/assess-g01-r13-clean-capacity-r1.py)
pin the prior exposure and label lineage.

The union now contains **50** clean, unmanifested tasks across **19** Git
origins, at most **30** slots under two per origin. A separate score-blind
fixed-seed r13 candidate at
`/opt/are/evolution-runtime/g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json`
selects **24 tasks across 19 origins**: 2 C++, 1 Java, 1 JavaScript,
2 TypeScript, and 18 Python. Its WSL cold copy is under
`/home/vlad_/are-benchmark-archive/g01-r13-clean-cohort-candidate-r1-20261002/`.
The VPS and WSL copies match SHA-256
`86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5`.
This is **preflight-only, not frozen or dispatched**. Durable WSL exact-commit
caches passed **24/24 tasks across 19 origins** with receipt SHA-256
`9630e86fc498bdf774d97acb4497f834a7bbcc2f45ecbd1008901de6e507648d`.
The VPS tmpfs transfer reverified every exact commit and tree, with receipt
SHA-256 `11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5`
and a matching WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-cache-transfer-r1-20261002/`.
The source-only VPS runner preflight then passed **24/24** cache bindings,
**24/24** isolated checkouts, and **24/24** bounded source indexes. Receipt
SHA-256 `64bce39720e3acaa1daed56ebddea1591041f24de4b473ba342919bdf7756891`
has a SHA-matched WSL copy under
`/home/vlad_/are-benchmark-archive/g01-r13-runner-index-preflight-r1-20261002/`.
The subsequent evaluator-only native-reference audit **failed**. It audited
23/24 tasks and admitted 61/66 reference files; five files were excluded
(three in one C++ task, one Java, one TypeScript), and the other TypeScript
task returned `worker-unavailable` on its second index run. No reference
file was absent. Failed receipt SHA-256
`a575a28b407000bde24243b0cbdbdaa01acb9ef99973bb4089be6aa52659d182`
has a matching WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-index-gold-coverage-r1-20261002/`.
R13 r1 remains **preflight-only and rejected for freeze**; neither its
24/24 source-only index pass nor the successful Python subset overrides the
native-reference failure. Live scratch storage and provider readiness have
not been tested. The changed
five-language population cannot be merged with r12 or used for a superiority
claim.

An exposed evaluator-only replay of the four failed tasks separated the
mechanisms. The three Catch2 reference exclusions were `encoding`, so a
larger posting budget alone cannot admit them. The Java reference and both
TypeScript references were `admission-stopped` after the bounded index hit
its earlier limit. The previously unavailable TypeScript worker completed
on replay but its reference remained excluded. No reference paths/content or
model outputs were exported. The private diagnosis receipt SHA-256 is
`a15e67153393f83dcd6e699100f50f6ddee6b6390eaf49896784beac8ccadf4f`,
with matching WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-index-failure-diagnosis-r1-20261002/`.
The next mechanism decision must handle encoding and bounded-admission
separately; a capacity-only repair would leave the Catch2 failure intact.

A further exposed no-model index-order diagnosis tested a source-only
issue/path overlap order under the same 2M-posting cap. It admitted **both
TypeScript references (2/2)** in a streaming simulation, but **not Java
(0/1)**. An 8M-posting Java simulation also failed, stopping at rank 2,677
before its issue/path-overlap rank 2,967. The Java issue is only "Allow custom
JsonNode implementations"; the reference basename does not contain that
identifier. A fixed generic Java-source-file cue moved the exposed reference
to rank **261** with issue overlap first (or rank 63 with Java first), versus
2,967 under issue overlap alone. These are **exposed diagnostic projections**,
not a full worker, all-task transfer, or fresh campaign. Receipts have
SHA-matched WSL copies under the `g01-r13-issue-priority-simulation-r1-20261002`,
`g01-r13-java-8m-simulation-r1-20261002`, and
`g01-r13-java-source-variant-ranks-r1-20261002` archive roots. The next
bounded test is whether one fixed language-aware source-file priority admits
all three references under unchanged limits without regressing the other
selected tasks.

A separately sealed, fixed **issue-overlap then language source-suffix**
streaming simulation admitted **3/3** of the exposed Java and TypeScript
references under the original 2M-posting/64 MiB large-inventory tier.
The source-only projections were complete before the evaluator loaded gold.
Receipt SHA-256
`451121273c0a12ef2ea41003336e4dca7765c99b4a9f2441f39e5bf0e25386bf`
has a matching WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-language-priority-simulation-r1-20261002/`.
This is still only an exposed three-task simulation, not an implemented index,
all-task transfer, a fresh r13 cohort, or a superiority result.

A full **24-task exposed r13 r1** streaming sweep then applied the same
fixed issue-overlap/source-suffix order with the *unchanged* inventory-tier
posting and byte limits. It sealed the source-only projections before gold
access, then evaluator-only coverage found **64/67** native reference files
admitted and **23/24** tasks fully admitted. None of the **20** tasks that
were fully admitted by the old index regressed. The only three remaining
exclusions are the already identified Catch2 encoding files; the Java and
both TypeScript references were admitted. Source-only receipt SHA-256 is
`16fce31b66a7490d5483908198f2e7a845edb8092fca7137400366b7dc0787a5`;
gold-coverage receipt SHA-256 is
`d1e6d607aead5def648e885ed23fe9baf65e1fd3582788c77abf901cab2381cf`.
Both have matching WSL cold copies under
`/home/vlad_/are-benchmark-archive/g01-r13-language-priority-sweep-r1-20261002/`.
This is still an exposed **streaming simulation**, not a full memory-bound,
query-invariant index implementation or an eligible campaign. A separately
selected successor must replace the encoding-ineligible Catch2 task and
pass all admission gates on the versioned runtime before any GLM dispatch.

An isolated prospective **r43** source snapshot now implements that fixed
issue-overlap/source-suffix inventory order with an immutable task context
and language binding. Its source tree contains 412 files at SHA-256
`b59c8474e5a04b5b2ff2033c83ca62df8c4fa5de0d4439c176e8b6ffe12de13d`,
identical on WSL and VPS. The isolated tests passed **103/103 Node** and
**26/26 Python** on the VPS (the Python suite requires the pinned Node
directory on PATH for one native-reader fixture). The [r43 no-model
qualifier](../research/g01-fast-live-v1/verify-g01-r13-r43-index-r1.mjs)
then passed **24/24** real r13 r1 source-index bindings under the existing
worker limits. Its private receipt is
`/opt/are/evolution-runtime/g01-r13-r43-index-qualification-r1/SOURCE-INDEX-QUALIFICATION.json`,
SHA-256 `daa451bcc0f83624905dbfbae9449dd1918953d2ca2a32a32a49b27d94e86947`,
with an identical WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-r43-index-qualification-r1-20261002/`.
This **source-only** qualification loaded no gold and made no model calls.
The exposed evaluator-only 64/67 streaming result above has not yet been
repeated on the full r43 worker; r43 is not a frozen campaign or superiority
result. The Catch2 encoding exclusions still require a separately selected
r13 r2 replacement and a complete no-model admission chain.

The first full **r43 evaluator-only** native-reference audit failed under
the unchanged 60-second worker deadline: **22/24** tasks audited,
**62/65** audited reference files admitted, three Catch2 `encoding`
exclusions, no absent files, and two TypeScript workers unavailable.
Its immutable VPS receipt SHA-256 is
`61c2e8282810a111681836c3e08404cd877981d3731cf172eab0558da5372811`,
with WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-r43-gold-index-coverage-r1-20261002/`.
A source-only replay of the two TypeScript tasks completed both with the
same index digests as the earlier preflight in about 50–53 seconds; receipt
SHA-256
`d5460e9417f4dcaccf9a552ed99fadeef027b8d826400a3ae77c59d1e4e98540`
has a matching WSL copy under
`/home/vlad_/are-benchmark-archive/g01-r13-r43-ts-worker-diagnosis-r1-20261002/`.
A separate evaluator-only two-task replay then **failed**: one MUI worker
hit `worker-deadline` at 60.03 seconds, while the other admitted its one
native reference. Its retained receipt SHA-256 is
`53c512d1a48a381999eda975f97582bf2a5c68ac7858a422a9307f840a60d6cf`,
with WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-r43-ts-gold-coverage-r1-20261002/`.
These are exposed no-model diagnostics, not a pass by combining attempts.
R43 is **not** reliably native-reference-qualified for the five-language
cohort. A separately versioned worker time policy or a changed population
must clear full admission before r13 r2 freeze; Catch2 still needs
replacement separately. No model request or superiority result follows.

A separately versioned prospective **r44** source snapshot changes only
the bounded worker/outer wall deadlines to **120/125 seconds**, retaining
the r43 index order and inventory limits. Its 412-file WSL/VPS source tree
is SHA-256
`034458ba51cf7b8b00873fda75f9d1c126f623e5ca0154bbef72388d7770f484`.
Pinned VPS tests passed **104/104 Node** and **27/27 Python**. Its real
source-only r13 r1 preflight passed **24/24**, receipt SHA-256
`da20307bdaac441106652516480e93d0ddfb674ed044c3b14cdc4446843689fe`,
with WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-r44-index-qualification-r1-20261002/`.
The separate full evaluator-only r44 audit settled all **24/24** workers
and admitted **64/67** native reference files; all three exclusions are
the one Catch2 task's `encoding` files, with zero absent files.
The failed admission receipt SHA-256
`8e419cb6076797c54b3949dc4a7d2ab76640484d903eaf5d8590458cd7ded596`
has an identical WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-r44-gold-index-coverage-r1-20261002/`.
This demonstrates r44's bounded-time mechanism on the exposed cohort,
not r13 r1 eligibility or model quality.

Using only that task-level exclusion and the already pinned clean-source
screen, the [r13 r2 source-only selector](../research/g01-fast-live-v1/select-g01-r13-r2-candidate-r1.py)
replaced Catch2 with the first fixed-seed eligible unmanifested Python
task (`SWE-Bench-Verified__python__maintenance__bugfix__6ed8d38b`) from
five capped choices. R13 r2 retains the other 23 tasks and has **24 tasks,
18 Git origins, five languages** (C++ 1, Java 1, JavaScript 1,
TypeScript 2, Python 19). Its candidate SHA-256 is
`e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d`,
with a WSL cold copy under
`/home/vlad_/are-benchmark-archive/g01-r13-clean-cohort-candidate-r2-20261002/`.
R13 r2 is **preflight-only, not frozen or dispatched**. The replacement
Astropy commit was hydrated into a separate cache; the 24 exact VPS
bindings passed with receipt SHA-256
`e912532f9e9d23e9f7408a6bb94aaf23c366aed6252f7ef10ac32bd723ea7d07`
(WSL cold copy:
`/home/vlad_/are-benchmark-archive/g01-r13-cache-transfer-r2-20261002/`).
Its r44 source-only runner-index preflight passed **24/24**, receipt
SHA-256 `cea56daa0b7408d38694405c894c3d7f464d9bed6789bab83d3e4e336c17d481`
(cold copy:
`/home/vlad_/are-benchmark-archive/g01-r13-r2-r44-index-qualification-r1-20261002/`).
The separately sealed evaluator-only audit admitted **62/62 native reference
files across all 24 tasks**, with zero excluded, absent, or unavailable and
all source-index digests matching; receipt SHA-256
`3960921635df8f42a1f4874775ef29755898ca03540df12fbb8723fe6eda0965`
(cold copy:
`/home/vlad_/are-benchmark-archive/g01-r13-r2-r44-gold-index-coverage-r1-20261002/`).
No gold path or value was exported to the runner.

The first exact storage census failed against the unchanged 1.25 GiB
reserve: `/tmp` had 2,831,638,528 available bytes against a provisional
4,278,468,608-byte floor. Seven terminal, checksum-verified scratch/cache
roots were copied to WSL cold storage and removed only from their exact VPS
`/tmp` paths; the active r13 caches and receipts were untouched. The
post-reclaim census passed with 4,894,838,784 available bytes (receipt
SHA-256 `3d15b1b1f79320e2e8debdb614fbb2e5cf33a4d42c88bb857294fbf48d652421`,
cold copy:
`/home/vlad_/are-benchmark-archive/g01-r13-r2-storage-census-r2-20261002/`).
An exact no-model four-checkout rehearsal of the largest Jackson task then
passed under the pinned r44 orchestrator, consuming 3,089,563,648 bytes of
`/tmp` and leaving 1,805,275,136 bytes free. Its receipt SHA-256 is
`5158becba83450a5c5862d664ba72f3fa325efac00914e27e6c3d9fae6cdede2`.
The full scratch and receipt are cold-copied under
`/home/vlad_/are-benchmark-archive/g01-r13-r2-scratch-layout-probe-r1-20261002/`;
an all-file rsync checksum dry-run reported no differences, and both sides
counted 80,228 regular files. Only the exact verified VPS rehearsal scratch
was then removed, restoring `/tmp` free space to 4,894,838,784 bytes; the
VPS receipt and WSL archive remain. These are admission and capacity
observations, not campaign scores. Source/configuration freeze, fresh
provider readiness, and guarded
dispatch still preceded any G01 r13 GLM call at that admission stage.

The separately checked [r13 r2 freeze gate](../research/g01-fast-live-v1/freeze-g01-r13-r2-r1.mjs)
bound the exact 24 cache identities, 24/24 index receipts, 62/62 evaluator
admission, measured scratch receipt, 412-file r44 source tree, and unchanged
8K/160K matched-arm protocol. Fresh same-account tokenizer and tiny
generation returned HTTP **200/200**. The one-time definition SHA-256 is
`28cab225e56e73b9b36c0a09520a30f8d835910d0b3230a38cc7c5345de4ba58`;
the campaign freeze SHA-256 is
`0f67532e8a8367d4f8b275c07db638c23405a12fa865dc66904ae2a44ec2007d`.
Both complete manifest trees and the readiness receipt have checksum-matched
WSL cold copies under
`/home/vlad_/are-benchmark-archive/g01-r13-r2-campaign-freeze-20261002/`.
The guarded serial run has started. Pair 1 (`cpp-json-72aa7114`) sealed and
natively scored; all four per-pair gates favored ARE. Its source scratch was
fully restored and checksum-compared from a private cold archive before exact
reclaim (archive SHA-256
`f34c2f0734ad22f616e73d530564d44cea35856a56cfa9d32c48d7930fbab5b3`).
Pair 2 (`java-jackson-2bd87230`) also sealed and scored. ARE used fewer
known model tokens but did **not** improve either native F1 metric or arm
duration on that task. Its 276 MB private source archive passed full restore
and checksum comparison before exact scratch reclaim (archive SHA-256
`507539c6bed09cc107a36f3ad78e8af09f3626c212969600b9a6606e17b8f353`).
Pair 3 (`javascript-svelte-d33de279`) sealed and scored: ARE reduced known
tokens and arm duration but did not improve either native F1 metric. Its
source archive SHA-256 is
`d47a18e8501c8c79c36376fdaa8862cff29d728a229d1d74bf8e1a4fc45c2761`;
full restore/comparison preceded exact scratch reclaim. The independent
partial receipt audit verified **3/24** scored, zero invalid, 21 pending
at that point. Pair 4 (`typescript-material-7958c8a7`) then ended
**unscored**: control failed `frontier.revision-arguments` after 12 model
calls, while candidate completed after 13. Its source archive passed full
restore/comparison and exact reclaim (SHA-256
`9273c1c541b4e5cfbb2daa28c24b1c6705ed6d641c1188d30229fece7492a9b8`).
The guarded coordinator stopped with **3 scored, 1 unscored, 20
unattempted**. Independent partial receipt audit verified all four terminal
attempts; the complete 76 MB campaign and frozen inputs have matching WSL
cold copies under
`/home/vlad_/are-benchmark-archive/g01-r13-r2-terminal-run-20261002/`.
The strict 24/24 claim gate is false. Do not top up, repair, or merge r13
results into a successor; these mixed per-pair observations are not an
aggregate interval or superiority claim.

## Development-only post-r13 supply bound (2026-10-02)

A separately pinned, source-only [r14 cap census](../research/g01-fast-live-v1/explore-g01-r14-dev-cap-r1.py) intersected the post-r13 exclusion and label-screen histories with the original 903-ID ContextBench development partition, explicitly excluding all 233 reserved-confirmation IDs. It found **23** unexposed, previously label-clean development tasks and **198** further source-valid, unscreened development IDs. Under the old two-per-origin cap, there are **12** currently clean slots and an absolute **22-slot** upper bound even if all 198 future labels pass. Therefore a fresh development-only 24-task campaign is impossible with that cap. Under three per origin, 14 clean slots are known and the theoretical upper bound is 30; reaching 24 requires at least ten newly clean slots plus complete native-reference, cache, index, and storage admission. This is not a cohort selection or score.

The private VPS `RESULT.json` SHA-256 is `e1316479dee8ff9e7843875f8793518007f2f1c836cd0a7d299d39ec5d29065d`; its acceptance file, script, and receipt have checksum-matched WSL cold copies under `/home/vlad_/are-benchmark-archive/g01-r14-dev-cap-r1-20261002/`. No gold values, references, provider calls, or scores were loaded. This required a changed origin cap and a limited development-population claim before evaluator-only screening; the original reserved-confirmation claim remains unavailable under the conservative exposure rule.

That [r14 cap-three protocol](G01-R14-PROTOCOL-CANDIDATE.md) was written before the new draw. The fixed-seed source-only screen selected 67 previously unscreened development tasks across seven origins and excluded the entire reserve. Its separate evaluator-only exact-base audit found 22 newly clean tasks, with no gold paths/content exported and zero model calls. The full screen receipt SHA-256 is `182cc3cf29858a205d0a6e9ed4c28f9f0dd9a1c3c9a33386bde22f7cc86959fd`; an independent join SHA-256 `74cb2eb893256bbef80d5662e7a8faa4db108f9e7e0337adc1165ef00c8fd868` verifies **45 total clean development tasks and 27 cap-three slots**. A fixed source-only r14 r1 candidate then selected **24 tasks, 13 origins, 21 Python and three TypeScript**, SHA-256 `014c2cb62ac545b91adb123aa5a7494fb197d0e826effdad06217c3a48fa7845`. The exact screen/candidate archives under `/home/vlad_/are-benchmark-archive/g01-r14-dev-screen-r1-20261002/` and `/home/vlad_/are-benchmark-archive/g01-r14-dev-candidate-r1-20261002/` passed whole-tree checksum comparisons with VPS. R14 r1 remains **preflight-only**, not a frozen benchmark, native-reference qualification, or score; its selected IDs are conservatively exposed for any successor.

The 24 exact r14 commits were then hydrated into 13 new WSL bare caches, receipt SHA-256 `803f2ab237263835b262f3f06aac4b6c8542c6f9901d241f57cc88a2afd47333`, with independent remote-origin and commit-tree checks passing 24/24. Total allocated cache bytes are 428,741,261. No VPS cache, index, native-reference, or storage qualification follows from WSL staging; VPS root headroom was about 1.96 GB before transfer and must be measured against the exact run layout.

## Claim ceiling and next gate

R12 r2 and r13 r2 are both terminal and fail their strict 24/24 gates. Do not
top up or repair either frozen run. The separate r45 ledger fix reproduced
and resolved r13 pair 4's source failure on sealed events and passed 105/105
Node plus 27/27 Python pinned VPS tests; its qualification receipt SHA-256 is
`c510b10f05df09cec57bcace74a6c10d551f925aa22f2826580f96dca6442af6`.
It is not a score or a reliability rate.

The post-r13 source-only census (SHA-256
`d74a2e95232bbb4d68d61f49e4600f9465d09400bf856ed82ec91446a63be320`)
found only 13 currently clean two-per-origin slots; even perfect labels on
all remaining source-valid unscreened rows could raise that to only 23.
Thus no new 24-task candidate can retain the current source population,
full-manifest exposure exclusion, and two-per-origin cap simultaneously.
The original preregistered 233-task confirmation split is also no longer
pristine under the conservative exposure rule: 81 IDs were manifested or
selected and 89 more label-screened, leaving 63 untouched, almost entirely
Python. A source-ID-only audit is cold-archived under
`/home/vlad_/are-benchmark-archive/g01-partition-exposure-r1-20261002/`.

The next G01 gate is a prospectively changed population/protocol and an
explicitly limited claim, followed by score-blind selection, complete
no-model admission, a separate freeze and matched run. Neither a smaller
product-page cohort nor the r45 repair proves full ContextBench or general
ARE superiority.

## Open Questions

- What genuinely fresh, adequately diverse population can support a new G01
  holdout without relabeling already exposed ContextBench tasks as untouched?
- Can r45 maintain reliability on a new population, and can a prospectively
  frozen quality mechanism improve both native F1 measures and cost against
  the matched control with valid intervals?
