# G01 r8 prospective source snapshot — WSL-only development qualification

Status, 2026-10-03: **candidate source snapshot, not a campaign freeze or VPS
qualification**. No model call, evaluator reference, or native score was used.
Frozen G01 r17 remains terminal failed; its VPS source was read but not changed.

The retained r17 source tree at
`/opt/are/evolution-runtime/g01-r17-r16cohort-overlay-latebind-source-r1`
was copied read-only from the VPS to the separate WSL candidate
`/home/vlad_/are-benchmark-archive/g01-r18-r8-source-candidate-r1`. Before
any candidate edit, the source binder returned **415 files** and tree SHA-256
`742352c5178404016e0b068d07825116faad67fc883b24fcbb0b7c49f4ae0143`,
matching the r17 source qualification receipt. The candidate then added the
five versioned r8 native index files and switched only its
`discovery-v1/orchestrate-intent-anchor-r3.mjs` import from the r1 service to
the r8 service. Its current binder result is **420 files**, tree SHA-256
`6e7d9ba3ba09fb97322c203f1547d9636d69c849a87dfcf84d3075aed51d85e1`.
The changed orchestrator SHA-256 is
`ed78c723370a3a8cea56cf8819ef641fd0b75afc9d1fdebc674354549f9af33e`.
The read-only [candidate source verifier](../research/g01-fast-live-v1/verify-g01-r8-candidate-source-r1.mjs)
is SHA-256 `347e760c5dc78222a692d77bac60068cb03ed639cb6e286988719d174fd343fc`;
it passed all six changed-file pins, the 420-file tree binding, and both
runner/service import closures, reporting zero model calls and no gold access.

The candidate's exact `run-pair.mjs` import closure passed locally without
dispatch. Through the candidate's own native Node → Python service, an exposed
r17 MUI task-3 initial empty-query index matched the archived complete
manifest, query result, and logical index digest
`b11dd953966f8d2d25df667b0d9a7a34a0e1f5918a619498ff385aa10325455d`.
The single local check took **20.38 seconds**, requested 13,067 Git blobs,
and settled both process groups without forced termination. This tests the
candidate source path, not a mounted four-view layout or VPS concurrency.

No r18 cohort has been selected or frozen. The r17 IDs remain exposed and
cannot serve as a new confirmation cohort. The VPS still fails the provisional
4 GiB `MemAvailable` preflight floor, and the separately approved deletion
of two exact historical scratch copies remains unexecuted because the
repository route/effect contract does not admit it. The next gates are an
actual-layout no-model VPS rehearsal after safe host-capacity admission,
an independently selected clean population with native-reference admission,
and a separate freeze before any GLM task dispatch. No superiority claim
follows from this source-only qualification.

## Fresh development-supply audit

The pinned r16 source-only census found **99** remaining unscreened
source-valid development instances and **five** previously screened clean
unselected instances. The subsequent exact-base screen found **31/99** clean.
The private WSL source receipts are the r16 census SHA-256
`35b8990980132ce22cb8faf657c4087aea4d7cec0a615f0ad7fd7efb8b28e757`,
lineage screen `646c3d367332531c8d7bd82d225ded47edadccc08230e395e00c965515aea5f0`,
r1 candidate `13debf87a53346d0aa667c7b49b1fd0b3291d922d09a5a2a2533e4000365405e`,
and r2 candidate `b9fbc9c5462419d5c1857379835a52425194560055dca8325c9b7d6e049ac112`.
The r16 r1 and r2 candidate manifests each selected 24 IDs; their union is
**26** IDs because two native-reference-ineligible r1 tasks were replaced.
Those 26 are conservatively unavailable for a fresh r17 successor cohort;
the r17 r2-selected 24 are frozen/exposed, while the two replaced r1 IDs
failed native-reference admission. Thus the old 903-instance development
partition has at most **10** lineage-clean, unselected IDs remaining
(31 + 5 − 26), before any native-reference check. By origin, the residual
upper bound is seven Django and three Transformers; Ansible, MUI and Sympy
have no remaining clean, unselected IDs in this pinned supply. This is a
source/lineage count, not a native-admitted ten-task cohort. A fresh 24-pair
development claim cannot be constructed from these known clean leftovers
under the existing cap-eight origin rule; it needs a separately admitted
additional population or an explicitly different research design. The
233-instance reserved-confirmation partition was not opened in this audit.

A later cross-benchmark join against the separately frozen G02 r11
`DEFINITION.json` (private WSL definition SHA-256
`0ec225f9df7cc0140dffeee53da9e57c4f2b92176b7b15c8c6fb48728bd46ddf`)
found **two** of those seven Django IDs selected there:
`SWE-Bench-Verified__python__maintenance__bugfix__b10cbb79` and
`SWE-Bench-Verified__python__maintenance__bugfix__ac705f35`. G02 r11 is
terminal after pair 13, and its fixed 24-ID selection is conservatively
exposed; those two cannot be recycled as a fresh G01 development cohort.
The globally unselected, known lineage-clean upper bound is therefore **eight**:
five Django and three Transformers, before native-reference admission or
any later exposure check. This supersedes the G01-only ten-ID bound above
for prospective cross-benchmark selection.

A [pinned, score-blind selector](../research/g01-fast-live-v1/select-g01-r8-eight-task-transfer-r1.mjs)
(SHA-256 `815857b249751ddf6509fbbc42e065c32c0e02691ba50f82b83045a7c18a12f8`)
materialized the exhaustive [eight-task source-only transfer candidate](../research/g01-fast-live-v1/g01-r8-eight-task-transfer-r1/CANDIDATE.json)
(SHA-256 `a134c8f7df6f4165c4053576365ccfb03d2c8b2c2d57d7dcf1a21848ec3bc0a2`,
ID-set SHA-256 `ae47c3dc223a3fdc09eb8a15e160d41d751a4f3ba9033646dd91671d704c945d`).
It contains five Django and three Transformers tasks, no G01 r16/r17 or
G02 r11 selections, no gold values or paths, no model calls, and no reserved
confirmation ID. Regeneration byte-matches the stored manifest. This is an
eight-task **development transfer** candidate only, pending exact cache,
index and native-reference admission; it cannot stand in for the 24-pair
G01 superiority gate.

The existing WSL r16 bare caches contained **none** of the eight candidate
base commits. Separate WSL bare caches were copied under
`/home/vlad_/are-benchmark-archive/g01-r8-eight-task-caches-r1`, then the
eight exact commits were fetched from their declared public Django and
Transformers origins. All eight commit identities were verified locally;
the frozen r16 caches were not mutated. The
[serial r8 index preflight](../research/g01-fast-live-v1/preflight-g01-r8-eight-task-index-r1.py)
(SHA-256 `44832c6c2f27b39f6a0d80aefd1da1f8a3367aa9cba8465549bc2cb2c649d8e6`)
then passed **8/8** initial empty-query indexes with zero model calls and
no gold access. The [per-task source-only receipt](../research/g01-fast-live-v1/g01-r8-eight-task-transfer-r1/INDEX-PREFLIGHT.json)
is SHA-256 `8cbd61dbb4fca0891c7cef781c1c0ddfacc09be7a4021c6b59a66d3aee3def7e`;
the longest local index took **44.39 seconds**, peak worker RSS was
**292,780 KiB**, and every process group settled without force. The receipt's
task order, candidate digest, maxima, and settlement fields passed an
independent read-only consistency check. This is not native-reference
admission, a live pair, a VPS capacity check, or a superiority result.

As a distinct development-supply option, the [official SWE-PolyBench project](https://amazon-science.github.io/SWE-PolyBench/)
describes a larger 2,110-instance, 21-repository population. Its
[official evaluation repository](https://github.com/amazon-science/SWE-PolyBench)
supports patch-resolution and file/node retrieval metrics. This may provide
new development tasks, but it is **not** the frozen 1,136-task ContextBench
population; any extension requires a separate source/ID-overlap audit,
native-reference mapping and predeclared protocol. It cannot be silently
mixed into a G01 replication denominator or used to open the held reserve.

A subsequent read-only compatibility census checked the official
[SWE-PolyBench full dataset](https://huggingface.co/datasets/AmazonScience/SWE-PolyBench)
and its [published annotations](https://github.com/amazon-science/SWE-PolyBench/blob/main/data/annotations.jsonl).
The streamed annotation file (SHA-256
`407c4654a414eee8b1dcdb6f4a84dd183569f3767f969e2c263f195f47f3d812`)
contained 6,330 annotation rows covering 2,110 unique instance IDs. Its
complete key census had no `gold_context`, file path, or line-span field; the
dataset's published column schema likewise has patch and `modified_nodes`
fields, not ContextBench native `gold_context`. Those annotations therefore
cannot directly supply the gold file/span references needed by the existing
G01 Span-F1 protocol. SWE-PolyBench remains a possible **separate** retrieval
study or a candidate for independently created and admitted ContextBench-style
labels, not a drop-in source of fresh G01 claim pairs. No task was selected,
score inspected, or reserved-confirmation ID opened in this census.

The eight-task candidate subsequently passed a separate, pinned
[evaluator-only native-reference audit](../research/g01-fast-live-v1/g01-r8-eight-task-transfer-r1/NATIVE-REFERENCE-AUDIT.json)
on WSL. The [audit script](../research/g01-fast-live-v1/audit-g01-r8-eight-task-native-reference-r1.py)
recomputed each exact r8 initial index from the pinned bare cache, matched all
eight preflight index digests, and compared the 20 distinct native gold files
internally to the admitted source manifest: **8/8 tasks and 20/20 files
admitted**, zero excluded or absent. Receipt SHA-256 is
`579d6ea8e5c79f4c8175b3f19fff136816b4a05549374a585de71954ad83c688`.
Only per-task counts and status were exported; no gold path, span, answer,
model call or native score was exported. This is development admission only,
not VPS layout qualification, a frozen eight-pair campaign, the missing
24-pair population, or superiority evidence.

A fresh read-only VPS check at 2026-10-03 13:21 UTC found
1,129,566,208 bytes `MemAvailable` against the provisional 4 GiB
(4,294,967,296-byte) G01 floor, a 3,165,401,088-byte shortfall. Four
exposed r17 task-5 source views remain mounted, and the older r15 residency
tree is still the lowerdir of eight separate r15 overlay mounts. No
actual-layout r8 run was attempted under this failed preflight, and nothing
was unmounted or removed. The exact [reclaim note](G01-R15-VPS-RECLAIM-APPROVAL-2026-10-03.md)
now records the live mount dependency; prior mount-free evidence is stale.

## Open Questions

- Can this exact candidate source settle under the real VPS four-view overlay
  and current service load while maintaining the required memory reserve?
- Which distinct G01 population remains eligible for a fresh 24-pair claim
  gate after excluding the r17 selected IDs and all earlier exposure, while
  preserving the reserved-confirmation partition until a development candidate
  is ready?
- What exact route/effect contract can exercise the owner-approved VPS reclaim
  without changing the scope of the benchmark route?
