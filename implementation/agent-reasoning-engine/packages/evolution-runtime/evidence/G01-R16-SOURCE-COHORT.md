# G01 r16 — source-only successor candidate, before dispatch

Status, 2026-10-03: **r16 frozen but stopped before campaign dispatch**;
the same still-unexposed cohort is now in a separately frozen
[r17 live campaign](G01-R17-R16-COHORT-LAUNCH.md). The prior r15
24-pair validity gate failed after two attempts; none of its 24 selected IDs
is reused. The three r15 r1 preflight-only IDs replaced before r15 r2 are
also conservatively excluded, for **27 excluded r15 candidate IDs** total.
The original 233 reserved-confirmation IDs remain excluded.

A pinned, source-only post-r15 census found **99 unscreened source-valid
development tasks** across Ansible (17), Django (54), Transformers (20), and
Sympy (8), plus five previously screened but unselected clean tasks. Its
private VPS/WSL receipt SHA-256 is
`35b8990980132ce22cb8faf657c4087aea4d7cec0a615f0ad7fd7efb8b28e757`.
No evaluator labels or model calls entered that census.

All 99 remaining source-valid tasks were then sealed in a separate source-only
manifest at SHA-256
`6f969430e052295d9bf495078589a39379518bb7747a6c8ac9beee00556e446d`.
Only after that seal, an evaluator-only exact-base lineage audit found
**31/99 mechanically clean**: seven Ansible, 14 Django, eight Transformers,
and two Sympy. It made zero GLM calls and exported no gold file paths or
content. The private VPS/WSL eligibility receipt SHA-256 is
`646c3d367332531c8d7bd82d225ded47edadccc08230e395e00c965515aea5f0`.
The five previously screened clean tasks bring eligible, unselected supply to
36; lineage cleanliness is not native-reference or answer-quality admission.

A separate score-blind round-robin selector used only source fields and
Boolean lineage eligibility, with a maximum of eight tasks per Git origin.
The resulting [24-task candidate](../research/g01-fast-live-v1/select-g01-r16-clean-candidate-r1.py)
contains 21 Python and three TypeScript tasks: six Ansible, seven Django, six
Transformers, three MUI, and two Sympy. Its private VPS/WSL manifest matches
SHA-256 `13debf87a53346d0aa667c7b49b1fd0b3291d922d09a5a2a2533e4000365405e`.
No G01/G02 prior exposed ID or reserved-confirmation ID is in it. The changed
origin/language mix is a development population, not full ContextBench.

All 24 exact commits were fetched into a new 361,040,289-byte WSL bare cache,
with zero fetch failures (receipt SHA-256
`d7e221bbd4f421bc5f36326a3aeabfc21784f66eec850161c6e142a89162cdb0`).
Its copy on VPS `/dev/shm` had no differences in a checksum dry run; an
independent no-network commit/origin/tree check passed **24/24** at private
VPS/WSL receipt SHA-256
`1429fa1923985054b25c6780026404e1e18d10cca0cbb9c748f91f2c3511c2d7`.
The isolated-checkout and bounded-index preflight then passed **24/24** each,
with a private VPS/WSL receipt SHA-256
`bda3fe0b235dfcc8ae085659461d6d3f08cf8cebea8bf8fc0887e05ee70f317b`.
Temporary preflight checkouts were removed after each probe; all prior
campaign evidence and the new bare cache remain. These checks neither read
gold nor dispatch GLM. Native-reference admission is separate.

The evaluator-only native-reference audit of this exact r1 candidate then
**failed**: 50/53 gold files were admitted across 24/24 audited tasks, with
three files excluded by `admission-stopped` and none absent. Two tasks were
ineligible: MUI TypeScript
`SWE-PolyBench__typescript__evolution__feature__d520ba22` (1/3 files
admitted) and Ansible Python
`SWE-Bench-Pro__python__maintenance__bugfix__3a162f6f` (1/2 admitted).
The private VPS/WSL audit receipt matches SHA-256
`bd914e1007bb352d20ecdd5e3db860ec7d3e7c6860a9fbd8aa53cc990d62ba84`.
No model was called and no gold path or content was exported. **R1 must not
be frozen or dispatched.** Any replacement requires a separately named,
score-blind r2 candidate and a new exact-candidate native-reference audit.

The separately named [r2 selector](../research/g01-fast-live-v1/select-g01-r16-clean-candidate-r2.py)
retained the 22 fully admitted r1 tasks and replaced the two failures with
previously unselected, Boolean-clean development tasks. The sole remaining
clean Ansible task replaced the Ansible failure; a seeded, lowest-current-origin
count rule chose a Transformers Python task for the MUI failure because no
clean unselected MUI task remained. The resulting 24-task r2 candidate has
22 Python and two TypeScript tasks across the same five origins, with at most
seven per origin. It remains **preflight-only, not frozen**. Its private
VPS/WSL manifest SHA-256 is
`b9fbc9c5462419d5c1857379835a52425194560055dca8325c9b7d6e049ac112`;
the task-ID-set SHA-256 is
`50860fd53e9a637ec434119707797f57cc5b0ee584fc6820fecb410fd0bd85ab`.
No score or model call influenced replacement. The two replacement commits
were fetched into a separate WSL cache (12,219,498 bytes; receipt SHA-256
`801e975154c65354fdf8dd0efa913406d3946d5c833a9d7ce9f18c2615f58045`),
copied to VPS tmpfs with zero checksum differences, and joined with the 22
retained r1 bindings. The offline 24/24 VPS cache verification passed at
private VPS/WSL receipt SHA-256
`cb20eb1799b71ae48296085647037d56829743f7d4c2002aebb8bdc008138a41`.

The first r2 runner preflight stopped at Git's safe-directory check (22/24
caches passed) because rsync had preserved WSL ownership on the two new VPS
bare caches. Its failed receipt and exact script were archived privately at
`/home/vlad_/are-benchmark-archive/g01-r16-r2-runner-index-preflight-r1/`.
After changing ownership of only those two VPS cache directories to the VPS
runner account, a separately labeled rerun passed **24/24 cache checks,
24/24 isolated checkouts, and 24/24 bounded source indexes**. Its private
VPS/WSL receipt SHA-256 is
`c1ab8a06cf61c628a6fd17839c080acf5a50a8678247480bd96fddf2b522bbd2`.
The evaluator-only exact r2 native-reference audit then passed **52/52 gold
files on 24/24 tasks**, with zero excluded or absent files and zero unavailable
workers. Its private VPS/WSL receipt SHA-256 is
`9a6281ebb60f07cffd92e49f0bc8541ecf30f444d73cb09d8c6a742ea2f78c57`.
No model call, answer score, or superiority result follows from these
preflights.

Separately, the opt-in late-binding path was checked against **13 exposed
scored pairs / 26 arms** from r14 and r15. All normally mapped a delivered
confirmed read, so the `no-delivered-confirmed-read` fallback would not be
entered. The provider-free WSL receipt SHA-256 is
`6d9952e33a15cb4ac2982ee037c26515685e25afef971c81cccff275e8414d0a`.
This is a no-op guard on existing successful receipts, not cross-task transfer
or a fresh quality result.

An r16 r2 source-only storage census found 1,505,611,776 bytes of one-copy
regular-file blocks; its 3 GiB reserve floor passed at private VPS/WSL
receipt SHA-256
`88b9d5d8099b48b41039ceec00e3ac939406f234596a2d8cdb1aa7cccba2435e`.
Actual one-copy residency then passed 24/24, consuming 1,841,606,656 bytes
of tmpfs and leaving 4,208,250,880 bytes free (receipt SHA-256
`8e5a178b26278f9daccc0c8899c1bf6b05406e5f7678135e9232edff087f2e8a`).
The r16 four-view overlay isolation probe passed; the r16 opt-in source tree
was sealed at SHA-256
`7514c70d2d5c77209dc921671033f1d2cce2e8c7c9419fdcfe61d8490ff560fb`.
R16 then froze 24 pairs at SHA-256
`280ee747ed30bc95de56c3247616cab94026590ff94b4ff54c5225a37fca3b33`,
but its first launch failed to import a module absent from that source tree.
An exact private VPS/WSL [no-dispatch receipt](G01-R17-R16-COHORT-LAUNCH.md)
verified 24/24 absent task outputs, absent source scratch, **zero r16 campaign
model calls**, and zero task attempts at SHA-256
`53051a5a599b96662f07eb5fc552aa5528fee7f7267862809c10dc5933f74d6f`.
That freeze is not repaired or rescored. The separately named r17 freeze
corrects source closure while preserving the same source-only cohort.
No r16 score or superiority claim exists.

## Open Questions

- Can the separately frozen r17 run complete all 24 matched pairs without
  source, provider, scoring, or storage failure?
- Can a complete matched r17 campaign clear both quality and efficiency gates,
  followed by an independent population for any broader product claim?
