# G02 r11 development campaign — terminal after pair 13

The separately selected r11 development-only 24-pair definition was frozen
before model dispatch at SHA-256
`0ec225f9df7cc0140dffeee53da9e57c4f2b92176b7b15c8c6fb48728bd46ddf`.
It excludes the original ContextBench reserved-confirmation IDs and all r10
screened IDs. The first 12 pairs settled with native scores and independent
audits. Pair 13's ARE arm completed, but the DSH arm exited after an observed
benchmark-transport HTTP 502. Its sealed export was unsettled, so there is no
pair decision, DSH source-selection prediction, or native score. The
coordinator stopped without dispatching pairs 14–24 or retrying pair 13.

A subsequent [sealed transport diagnosis](../research/g02-product-r4/diagnose-g02-r11-transport-r1.mjs)
(source SHA-256 `5794a14affd0a13ff8af09e18c3dd9d34fc21ca4b5c9a90a805d75d21f86b5a2`;
receipt SHA-256 `1a9198819ecc3d4f33b9c98941793012e1fc9ce0e7925dfa22d47741716d5847`)
reconciled all 292 journal events. DSH had made **41 model calls** with
**969,273 known tokens**, zero unknown-usage dispatches, and no unsettled
attempts. Attempt 42 needed a 69,058-token reservation, which would have
raised the episode total to 1,038,331 against its fixed 1,000,000-token
budget. The transport rejected that attempt **before model dispatch** with
`dsh-transport.request-budget`; its server mapped this internal denial to the
generic HTTP 502. Thus the terminal cause is comparator episode-budget
exhaustion, not evidence of a model-provider outage. The original terminal
audit remains valid for the campaign counts and is not rewritten by this
causal diagnosis.

The independent [terminal auditor](../research/g02-product-r4/audit-g02-r11-terminal-r1.py)
(source SHA-256 `24dc2c96ed2caae89eb112005ab4c9efb5ab0429d6c6c585fa75027adac126e7`)
verified 12 scored/audited, one invalid/unscored, and 11 unattempted pairs,
with receipt SHA-256
`843c413a43e5646f21a3323058a885b1837c0c21b8494b91e787752ee2aac4f0`.
All 13 dispatched pairs have private WSL raw archives. Pair 13's full VPS
scratch remains retained, and a fresh `rsync --dry-run --checksum` comparison
against its WSL archive found no differences. Its raw archive receipt SHA-256
is `d8071fab2fe2b86bd44ec2e3ff2111d0e3e46c18488140a0b2f0f949b4d5b2bd`.
The evidence root is
`/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/`.

The strict 24/24 validity gate **failed**. No r11 campaign aggregate, native
paired bootstrap interval, or superiority claim is valid. The separate
aggregate analyzer correctly refused the incomplete campaign; no aggregate
artifact was written. The 12 completed pairs are exploratory development
diagnostics only. Their descriptive, non-inferential point estimates were
ARE-minus-DSH Span-F1 `-0.00172` and File-F1 `-0.02761`, with ARE/DSH total
known-token ratio `1.269` and arm-time ratio `1.383`. Each of the four
repositories contributed only three of its planned six tasks; these figures
do not substitute for the frozen 24-pair analysis.

The r11 selected manifest is conservatively exposed for successor selection.
Do not retry, repair, or top up r11. A new development policy needs source-
grounded improvement before spending another fresh cohort, especially for
cross-file acquisition and model-call efficiency. Any future campaign must be
separately selected, qualified, and frozen; product-page review by Vlad and
Dave remains separate from a passing benchmark gate.

A post-r11 [source-only census](../research/g02-product-r4/census-g02-post-r11-r1.py)
(source SHA-256 `f8729b317e12e276babae19b960af24497ae6b8127e70131ed2d6000a64b50e2`;
private receipt SHA-256 `996c2fb35a34aef9b74a18c01613f2256ced59aa7aa1aff69dba648a435b1a4d`)
found **428** untouched, source-valid development rows after excluding the
entire r11 screened pool, with no gold or native scores loaded and no model
calls. The old strata have six Pro/Ansible, 61 Verified/Django, 20
Verified/Sympy, and **five** Multi/nlohmann JSON rows remaining. Thus the
same six-per-stratum r11 population cannot form another untouched 24-task
cohort. Broader supply exists, including 46 Poly/Transformers, 31 Multi/MUI,
and 19 each Multi/Pony and Multi/Jackson source-valid rows, but eligibility
and claim scope for a changed population remain untested. The receipt is
checksum-matched between VPS and WSL under
`/home/vlad_/are-benchmark-archive/g02-post-r11-source-census-r1-20261002/`.

An evaluator-only, no-model [raw-versus-pruned diagnostic](../research/g02-product-r4/score-g02-r11-raw-vs-pruned-exposed-r1.py)
scored the raw ARE selection on all six completed r11 pairs where the fixed
policy removed at least one file. The scorer ran with networking disabled and
the six inputs were sealed before these additional scores. An [independent
audit](../research/g02-product-r4/audit-g02-r11-raw-vs-pruned-r1.py)
(source SHA-256 `582a08a2c9bf5cbf0a8e585035787e5b567f5be9ac936c097cd2fbe8450a9ac9`;
receipt SHA-256 `d2961c5fad40029adab3e233ccbfea9a33538f59fe0c46ced0abb6835966407f`)
bound every prediction, native score, and frozen pair decision. Pruning
improved both File-F1 and Span-F1 on **five of six** changed selections and
tied on the sixth, with zero regressions in this exposed subset. Mean
pruned-minus-raw F1 among these six was `+0.12102` File and `+0.06854`
Span. This is not an independent estimate or r11 recovery; it weakens the
hypothesis that deletion-only pruning caused r11's quality deficit and makes
missing relevant-file acquisition a better development target. Complete
private inputs, scores, and audit are under
`/home/vlad_/are-benchmark-archive/g02-r11-raw-vs-pruned-exposed-r1-20261002/`.

A separate no-model, source-only [retrieval seal](../research/g02-product-r4/seal-g02-r11-retrieval-exposed-r1.py)
(script SHA-256 `9717d382e579eea0b4b6168df9df74f568ee18cc096ac1e12f5ca5e558956f1e`)
applied the previously fixed code-file BM25 rule to all 12 exposed r11
pairs, with three proposed new reads per task. It bound the exact base commits,
issues, tracked source corpus, and ARE-delivered paths before native gold was
opened. Its seal SHA-256 is
`eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901`.
The evaluator-only [audit](../research/g02-product-r4/audit-g02-r11-retrieval-exposed-r1.py)
(script SHA-256 `cab200ecc1d4c56045eb735ab95b67543c3b70fe36d30eb732ec0c683f79182e`)
found **22 undelivered native gold files** across the 12 tasks. Raw-query
BM25 proposed **36 reads with zero new gold hits**. The structured-query
variant proposed **36 reads with one new gold hit and 35 false positives**;
that one hit was on a Pro task. The receipt SHA-256 is
`fa47fa9a181e0bd6f27237f6a9b56db17fe0df3a54b9977731ed1c168d48d239`.
VPS and WSL seal/receipt hashes match; the private cold copy is under
`/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002/`.
This fixed top-three lexical acquisition rule is rejected for a fresh
campaign. The proposals were not actually read or selected by ARE, so this
does not measure native F1, added cost, or a new paired comparison.

A second evaluator-only [depth audit](../research/g02-product-r4/audit-g02-r11-retrieval-depth-r1.py)
(script SHA-256 `cfc779cad7eca9d1e93b65448d5ae390136e0d18aa326f2bc2abb23feb203f8c`)
used the **same sealed rankings**, not a retuned query. At ten proposed new
reads per task, raw and structured queries found five and four of the 22
undelivered gold files, respectively. At top 30, each found only **six of
22**, while proposing **316/322** and **311/317** false-positive files,
respectively. Receipt SHA-256
`3ec02c7f90c7267271b66389803576fed7c30e2c4129e61db609d0674fb31c31`
matches on VPS and WSL. Thus simply widening this code-file lexical read
budget is also rejected. Each query's top-30 candidate lists omitted 16
undelivered gold files; the diagnostic cannot yet distinguish
query failure, rank depth beyond 30, corpus exclusions, or base-tree absence.

An evaluator-only [suffix audit](../research/g02-product-r4/audit-g02-r11-retrieval-suffix-r1.py)
(script SHA-256 `648545768b887041182e7919065a30d4200d54559185cf2a31f2035e48e6ef3e`)
resolved one large part of that uncertainty without exposing gold paths to
the source-only stage. Of the 22 undelivered gold files, **12** have a suffix
allowed by this code-file retriever (`.py`) and **10** do not: seven `.hpp`,
one `.md`, one `.rst`, and one `.yml`. The raw and structured top-30 lists
jointly contain seven gold files; five `.py` files are outside their union.
This establishes a source-type coverage defect, especially for C++ headers,
but not whether the other five are below rank 30, zero-scored, oversized,
or absent at the base commit. The private aggregate receipt SHA-256 is
`ff6808fd88d081a5cc2f78ef919b90b7422a4174c139adf96efe6a93dd63e277`,
checksum-matched between VPS and WSL. It is an exposed diagnostic, not an
independent quality improvement or campaign result.

The pre-existing [bounded-text retrieval rule](../research/g02-product-r4/bounded-text-retrieval-r1.py)
was then transferred unchanged to these 12 exposed tasks through a separate
[source-only seal](../research/g02-product-r4/seal-g02-r11-bounded-text-exposed-r1.py)
(script SHA-256 `c01329fc36618c24f92e7ea7af375d0ad2f23463bc08074f137b5025c69e1835`;
seal SHA-256 `4f151b3f316c2cf6fe38ddddfb314dc2554961d6bd6723eb95742b486c10de02`).
Its fixed corpus is every tracked regular UTF-8 text file of at most 262,144
bytes with a nonempty term set. Source-only indexing ranged from 833 to
16,479 files per task and took several minutes on WSL. The evaluator-only
[audit](../research/g02-product-r4/audit-g02-r11-bounded-text-exposed-r1.py)
(script SHA-256 `33786691f24ad580776d143f5322e35c372d4e7790a03f8ecc1228b7b8858d4c`;
receipt SHA-256 `50f1e32499ffadb85d963e98d19f23750e6c2432b2e9d32cd0eff23c4cac9f67`)
found only **two new gold files in 36 proposed three-read slots**, with 34
false positives. Its top-30 lists still contained only **six of 22**
undelivered gold files, with 328 false-positive files. Multi/nlohmann JSON
contributed one top-three and one top-30 hit across its eight missing gold
files. WSL and VPS seals/receipts match by SHA-256. This broad-corpus policy
is also rejected for a fresh campaign: extension coverage alone did not
solve candidate ranking, and the scan cost is high. No proposed read was
actually delivered to ARE, so no native F1 or all-in cost changed.

A bounded C++ [direct-include neighborhood](../research/g02-product-r4/seal-g02-r11-include-neighbors-exposed-r1.py)
was then sealed from the three exposed Multi/nlohmann JSON tasks, using only
tracked base source and files ARE had already read. Its source SHA-256 is
`1f7177804194d6a1e9122dff1d8c093014e78d5b93009e37de4aebcca56dc07f`;
seal SHA-256 is
`031c44de02388b89261a921ef3def5a17eecae5c5faa8f308594e9b3a645c15d`.
The evaluator-only [pool audit](../research/g02-product-r4/audit-g02-r11-include-neighbors-exposed-r1.py)
(script SHA-256 `c5ad092eeae63a3705d6e56072ece14342e2de97290329a051d8139dc7bb03b1`;
receipt SHA-256 `150954fb7f0c79e95ed69dab9de472ef2bbc34a74490ae50e54b333d8bcd864b`)
found **five of eight** undelivered gold files in the unranked 71-file pool;
only **four of eight** were within the 256 KiB read cap in a 67-file pool.
This is a candidate-generation signal, not a usable three-read policy.

A fixed source-only [top-three ordering](../research/g02-product-r4/rank-g02-r11-include-neighbors-exposed-r1.py)
(script SHA-256 `8e7aa92752f0711c11ec4590351e2d7d3e0c71e08d6df1506630e70e706750cb`;
seal SHA-256 `b2a9ebddaec7f8c53a536ce45638275d6b501e0fa35dc5a8e3efc0c25bc89b1d`)
combined direct-edge count, shared path locality, and issue term overlap.
The evaluator-only [ranking audit](../research/g02-product-r4/audit-g02-r11-include-neighbor-rank-exposed-r1.py)
(script SHA-256 `0e1b7dc7249e2ee3d18de4bbaacd2d66777a4ac2fe08fe770516c77c0798b683`;
receipt SHA-256 `14ee6abe891f345a3efb17aacb0cf6d43bedf153134bb2b9cf6d21894a6747ad`)
found **zero new gold files in nine proposed reads**, all false positives.
This ordering is rejected; it cannot qualify a fresh campaign. All four
seal/audit files are checksum-matched between private VPS and WSL storage
under `/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002/`.
No model call, delivered read, or native score was added.

A separate, owner-approved GLM-5.3-flash read-choice diagnostic tested whether
the model could select better than that fixed ranking from the same exposed
C++ include-neighbor pool. Its [source-only packet builder](../research/g02-product-r4/build-g02-r11-glm-include-packets-exposed-r1.py)
(SHA-256 `017d5cad679f255bd9f7d6cb30942f5f1e90b61a9b07a22c8f60658644bff75a`)
sealed the three issues, ARE-delivered paths, 16/23/28 eligible candidates,
direct-include links, and at most one bounded issue-matching excerpt per
candidate before any provider call. Packet SHA-256 was
`8b4c4939cf328374c295864223a2a431f39cdf89881a63728cff013128e464a8`.
The [VPS runner](../research/g02-product-r4/run-g02-r11-glm-include-choice-exposed-r1.mjs)
(SHA-256 `983132f5a043897f7e86b206ebff79b967108cc93c0b8405ab5d9de5f6b09efc`)
froze model, prompt, transport, packet and three-call limit at SHA-256
`20b88e0a1b6cbc26af84820cbf270f631c557dcd8bc0004d5b36628fc5b02644`.
Fresh same-account tokenizer/tiny-generation readiness passed HTTP 200/200.
All three exposed calls returned valid HTTP 200 choices, with **4,763 known
tokens** in total and no automatic retries. The [response sealer](../research/g02-product-r4/seal-g02-r11-glm-include-choice-responses-r1.py)
bound all three raw responses before gold access at SHA-256
`6de9a6533417dc95231fb7e2539dd951bb55f6963deda9bbe224ce0ddece9f10`.
The evaluator-only [audit](../research/g02-product-r4/audit-g02-r11-glm-include-choice-exposed-r1.py)
(receipt SHA-256 `b1a65c84318716ab1ec0dc9a154a24ee0e38bfcb88002eefa47a98bf77286566`)
found **zero new gold files in nine model-proposed reads**; all nine were
false positives. The complete private VPS record has a checksum-matched WSL
cold copy under
`/home/vlad_/are-benchmark-archive/g02-r11-glm-include-choice-exposed-r1-20261002/`.
This packet-level model chooser is rejected. It is not a live ARE read,
native-score result, r11 recovery, or superiority evidence. Repeatedly
tuning on these same exposed tasks would not provide an independent test.

A separate [source-only Python import-neighborhood seal](../research/g02-product-r4/seal-g02-r11-python-import-neighbors-exposed-r1.py)
(script SHA-256 `20fa4dd03bd1713e46e104befdd56827f1eadbb1e32223c144936c5eb762dcf3`;
seal SHA-256 `777f9d69cc65be69d472ed3a7633f75483e01134c5298527b99fd22f5c490384`)
parsed tracked regular `.py` files of at most 256 KiB in the nine exposed
Python task bases. It resolved direct AST imports under repository-root,
`lib/`, and `src/` package roots and collected one-hop neighbors of paths
ARE had already read, without opening gold or making model calls. The
subsequent [evaluator-only coverage audit](../research/g02-product-r4/audit-g02-r11-python-import-neighbors-exposed-r1.py)
(script SHA-256 `5ad148d793402a158e520ca1af642bd1e19152e863ef5e61e6218d52f689e4d8`;
receipt SHA-256 `47a18c5f767bd22f13c30500e2310840e7e6a9a0784bdb4866e26acf903a12fb`)
found **eight of 12** undelivered `.py` gold files in the graph, but in a
**1,633-file** candidate pool across nine tasks. The eight hits occurred in
only three tasks; one task alone contributed 875 candidates. This is a
candidate-generation signal with poor precision, not a three-read policy.
No new ARE file was read, no native F1 or cost changed, and the exposed
diagnostic cannot confirm superiority. The private source seal and aggregate
audit are under
`/home/vlad_/are-benchmark-archive/g02-r11-python-import-neighbors-exposed-r1-20261002/`.

A separately fixed [source-only Python neighbor ranking](../research/g02-product-r4/rank-g02-r11-python-import-neighbors-exposed-r1.py)
(script SHA-256 `57c0e688fa130ee3587fba8c7eb5e24d3fdf0b77bc7c6ee3aeb44f4f44fac90e`;
ranked seal SHA-256 `55f3175c54d683cf9d4fac907fa34cff4982782e092acf9a2d35a50f0fb8e7db`)
combined issue/path/content terms, delivered-file locality, direct import
links, and the already sealed raw-BM25 top-30 indicator. It proposed exactly
three eligible new files for each of the nine exposed Python tasks before
gold access. The [evaluator-only ranking audit](../research/g02-product-r4/audit-g02-r11-python-import-neighbor-rank-exposed-r1.py)
(script SHA-256 `b9129b579c2f89a4cf4d4519ca7055994b4bb60ac1f888f1a76e9c84243df04e`;
receipt SHA-256 `34913b60762958fce98c09d59d1539d6a1b067f120a777400e9dcc13d31f23b7`)
found **three new gold files in 27 proposals**, one each on three tasks,
versus **zero** raw-BM25 and **one** structured-BM25 hits in the same nine
tasks' three-read slots. The other **24 proposals were false positives**.
This is a small exposed file-hit improvement, not evidence that actual ARE
reads improve native F1 or all-in cost. Its 3/27 precision is insufficient
to promote this rule directly to a fresh matched campaign; source-grounded
read-value and independent transfer still need testing. The private ranked
seal and aggregate audit share the archive named above.

The ensuing [evaluator-only File-F1 counterfactual](../research/g02-product-r4/score-g02-r11-python-neighbor-file-counterfactual-r1.py)
(script SHA-256 `f33a264ed06309e24372a96a27fbb6956777fa09cb21ae6b995d51070158feaa`;
private receipt SHA-256 `5429b7e2f0945eb49b847541c72a337d87bb64f9d74f2e7c1513c3604d24ea18`)
bound the already sealed top-three proposals to each archived r11 pruned
prediction and verified its file counts, intersection, coverage, and precision
against the archived native scorer before calculating the expanded file set.
Adding all three proposed paths would change mean native-style File-F1 across
the nine exposed tasks from **0.64241 to 0.41481** (delta **−0.22760**):
three tasks improve and six regress, with negative mean delta in each of
Ansible, Django, and Sympy. This deterministic set-based replay does **not**
deliver the files to ARE or estimate Span-F1, tokens, or time. It rejects the
unconditional top-three Python import-neighbor acquisition rule for a fresh
campaign despite its three file hits. Any later selective gate is a new
development hypothesis and needs separate source-only sealing and independent
transfer; this replay is not superiority evidence.

A separate **cross-benchmark transfer** tested the G01 r8 batched source
indexer as a G02 acquisition candidate on all 12 scored, exposed r11 pair
bases. The pinned [source-only sealer](../research/g02-product-r4/seal-g02-r11-r8-transfer-exposed-r1.py)
(SHA-256 `f7c4e2535e05ad8b2cea1f33cc08ef3dbdfc46f2ce7eb0110f871b7112f9a10e`)
used each issue's first 1,024 UTF-8 bytes and fixed the first three distinct
undelivered paths among r8's first five returned windows. All **12/12**
Git-backed indexes settled without forced termination, at at most **16.44
seconds** and **320,928 KiB** peak worker RSS on WSL. The 31 proposed reads
were sealed before evaluator access at private SHA-256
`75f3c52376f797b6451624c0e374d13bd2acfa2db85815bac591023c01dc8f37`.
The separate [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-r8-transfer-exposed-r1.py)
(script SHA-256 `6e256bf191d2c807b6610e6970d3ca81720a7e92f51036829e25f052cc68285c`;
private receipt SHA-256
`69fbfb7595459829250ccc04c9ca07556403541a6f8e8e84dbe67b9084062eca`)
reconciled the historical 39 native gold files and 22 undelivered gold files,
then found **zero new gold hits in 31 proposed reads**. This direct r8
transfer rule is rejected for a fresh G02 campaign. Its source-index
reliability improvement on G01 does not imply G02 file-acquisition quality.
No proposed path was delivered to ARE, no model call or native F1 was added,
and the private WSL receipts export counts rather than gold paths.

A further fixed, source-only [rare exact-symbol gate](../research/g02-product-r4/seal-g02-r11-rare-exact-symbol-exposed-r1.py)
(script SHA-256 `ed7eec17f89b6999f32dff72e3a87efb797686058ecbf706a9814516664b1767`)
required an issue identifier of at least eight characters to exactly match a
Python function/class defined in only one eligible one-hop import neighbor.
It sealed **nine proposed reads across nine exposed Python tasks**, with zero
model calls and no gold access; private source seal SHA-256
`265e8dbb499bfc88e14a41a390296995af12b110c73d39b6a974306fb0835536`.
The separate [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-rare-exact-symbol-exposed-r1.py)
(script SHA-256 `7360629123e61074612c83f574693c4705015b10a827ed2e2db28cb2a4677ff9`)
found **two new gold files and seven false positives**. Its set-based
counterfactual lowered mean File-F1 from **0.64241 to 0.61155** (two tasks
improved, two regressed, five tied); private audit SHA-256
`51e07f65e3cd7b843d2a9b66a45be403b19185efc8539a3a514dae8f698f67eb`.
This sparse issue-to-definition rule is rejected for fresh dispatch. These are
exposed development data, not actual delivered reads, Span-F1, costs, or an
independent superiority estimate. Raw source proposals and evaluator-only
counts are kept separately under
`/home/vlad_/are-benchmark-archive/g02-r11-rare-exact-symbol-exposed-r1/`.

An evaluator-only [perfect-acquisition potential bound](../research/g02-product-r4/audit-g02-r11-perfect-acquisition-bound-r1.py)
(script SHA-256 `49bc997cda2cf6a408d732de9ec43dd07eb4bb292760a9c3850927eb6b8c2977`)
reconciled the archived ARE and DSH file predictions against native scores
on all 12 scored r11 pairs, then hypothetically added **every and only** the
22 undelivered native-gold files to ARE's fixed selected-file sets. It kept
all original ARE false positives. Mean File-F1 would be **0.80395** under
that label-aware oracle, versus actual ARE **0.53597** and DSH **0.56359**;
the oracle exceeds DSH on eight tasks, ties on three, and remains below on
one. The counts-only private receipt SHA-256 is
`574bb77fac2be87964c9655a39a72008e70d85819b3b7c5e77e0866871e56378`
under `/home/vlad_/are-benchmark-archive/g02-r11-perfect-acquisition-bound-r1/`.
This shows *potential* in missing-file acquisition while also quantifying
the precision gap: it uses evaluator labels that ARE cannot see, performs no
actual reads or model calls, and says nothing about Span-F1, cost, fresh
transfer, or superiority. It cannot be promoted as a source-only policy.

The evaluator-only [two-seal Python pool bound](../research/g02-product-r4/audit-g02-r11-python-proposal-union-bound-r1.py)
(script SHA-256 `3434d4198fbc364482a590ce302e2fb4fba3a4d7798c4511020bdbf0d03d67ae`)
joined the previously sealed issue/locality/import top-three and rare
exact-symbol proposals without changing either source rule. Their union
contains **31 files across nine exposed Python tasks**, but still only the
same **three** new gold files and **28** false positives; the sparse rule
adds no recall. Even a label-aware perfect selector choosing only those
three files would move mean File-F1 **0.64241→0.69877** versus DSH's
**0.67130** on this slice. Private counts-only receipt SHA-256
`e87deb43e740daad657bf712ea5becc4409a0c6abc7703cd33b8dfacae9a4541`
is under `/home/vlad_/are-benchmark-archive/g02-r11-python-proposal-union-bound-r1/`.
This is a narrow exposed upper bound before read/model costs, not a usable
selector or independent quality estimate. Running another chooser over this
unchanged bounded pool cannot recover files absent from it; candidate
generation, not only admission, must improve first.

A separate source-only [C++ exact-quote candidate census](../research/g02-product-r4/seal-g02-r11-cpp-quoted-literal-pool-r1.py)
(script SHA-256 `6a0e001a37a02899ed4ff74eb304dbf36aff99b10558f37c3748793641ae7a3e`)
searched tracked, regular, read-cap-eligible C/C++ files on the three exposed
JSON task bases for case-sensitive code-shaped phrases already backticked in
their issue statements. It sealed **0 undelivered candidate files across 3
tasks**, with no gold access or model calls; private source seal SHA-256
`1d858fa5cec00341c8d3af5b8e844624e0aa722e21591b2800a175da4614ea56`.
Two issues supplied qualifying phrases and the third supplied none. Direct
exact-quote matching is rejected as an acquisition generator in this slice;
the issue terms identify files already delivered or absent from the base
code, not missing related files. No evaluator audit, File-F1 change, or
superiority claim follows. The next C++ mechanism must traverse relations
from delivered evidence or use another source-only signal.

An evaluator-only [call-cutoff coverage diagnostic](G02-R11-CALL-CUTOFF-COVERAGE-EXPOSED-2026-10-03.md)
reconciled all 12 scored ARE episode ledgers with their source observations
and native labels. Calls after the tenth used 349,402 known tokens while
delivering zero additional gold files and one additional non-gold file.
This identifies a bounded-finalization cost hypothesis, not a valid stopped
episode, realized savings, native-score improvement, or r11 repair.
The first separately frozen [exposed task-8 12-call rerun](G02-R11-CALLCAP12-EXPOSED-TASK8-RESULT-2026-10-03.md)
finished voluntarily after ten model calls with no `finalization-start` event.
It used fewer tokens than archived r11 task 8, but native Span-F1 and File-F1
remained zero; the cap itself was not tested by that trajectory. The current
quality frontier remains source acquisition and selection, not a cost claim.

The separately frozen [r3 code-anchor full episode on exposed task 4](G02-R11-CODE-ANCHOR-R3-FULL-EPISODE-TASK4-RESULT-2026-10-03.md)
did deliver all three added source reads, but native Span-F1 and File-F1 fell
to **0.1302/0.2222** from archived task-4 ARE **0.4050/0.25**, while known
tokens rose **85,443→136,835**. Its private raw receipt has a checksum-matched
WSL cold copy. This is a failed development hypothesis, not a change to r11 or
an independent claim.

A separate [source-only exact-called-definition gate](G02-R11-PYTHON-CALLED-DEFINITION-NEIGHBORS-EXPOSED-2026-10-03.md)
over the nine exposed Python direct-import pools abstained on six tasks and
proposed nine files on three. The evaluator-only audit found **1** new gold
file and **8** false positives; additive mean File-F1 would fall
**0.642411→0.594880**. This generator is rejected for fresh dispatch; it
made no model calls or actual ARE reads.

The separate [same-directory candidate census](G02-R11-SAME-DIRECTORY-POOL-EXPOSED-2026-10-03.md)
sealed 1,266 bounded tracked text files across all 12 scored exposed tasks
before evaluator access. It covered **7/22** undelivered gold files, including
three outside the earlier raw/structured BM25 top-30 union, but contained
**1,259 non-gold** files. It is a coverage lead, not a usable three-read
selection rule; no GLM chooser or ARE read was dispatched over this pool.

The separately sealed [same-directory filename rank](G02-R11-SAME-DIRECTORY-NAME-RANK-EXPOSED-2026-10-03.md)
reduced that pool to 22 proposals across 12 exposed tasks, but only **1**
was newly relevant and **21** were false positives. An evaluator-only
additive File-F1 replay fell **0.535975→0.441112**; seven tasks regressed.
The rule is rejected before GLM calls or actual ARE reads. This does not
change r11 or support a superiority claim.

The separately sealed [declaration-link rank](G02-R11-SAME-DIRECTORY-DECLARATION-LINKS-EXPOSED-2026-10-03.md)
found three new native-gold files among 36 bounded proposals across the
same 12 exposed tasks, but had 33 false positives. The evaluator-only
additive mean File-F1 fell **0.535975→0.353914**. It is rejected as a
three-read policy without GLM calls or actual ARE reads; its three hits
are candidate-generation evidence only.

## Exposed DSH search-reach comparison

A [counts-only evaluator-side trajectory audit](../research/g02-product-r4/audit-g02-r11-dsh-search-reach-exposed-r1.py)
(script SHA-256 `a1a7c0bf1c8f50134a82a374b387052deef690ff2f2190b4487affd53f4295b2`;
private receipt SHA-256
`f3d9dc7d20e0e8cbea358fdb857bb6b6966719393ace2efd23a70554b9de8e5a`)
joined the 12 existing native references to both sealed final selections and
counted only DSH tool-intent metadata. It exported no raw tool output,
search text, source excerpt, credential or model response. DSH selected 57
files versus ARE's 33 and used 157 tool intents: 74 searches, 70 explicit
reads and 13 file listings. DSH selected **five** gold files absent from
ARE's final selection; four had an explicit DSH `read_file` intent, while
one appeared in DSH's selection without such an intent. ARE selected **two**
gold files absent from DSH's selection. DSH-only gold is concentrated in
four tasks: one Ansible, two Sympy, and two nlohmann/json, including the
JSON task where DSH selected 24 files for one unique gold hit.

This is a descriptive, exposed trajectory comparison, **not** proof that
search caused the hits or that reproducing DSH's broad trajectory would
improve ARE. A prospective development candidate should test bounded,
issue- or symbol-conditioned follow-up search and stopping on the already
exposed population before any separately frozen fresh cohort; it should not
copy DSH outputs into the treatment arm. No new model call, ARE read, or
VPS mutation was made for this audit.

## Selected-span symbol-hop screen — rejected

The [source-only symbol-hop sealer](../research/g02-product-r4/seal-g02-r11-symbol-hop-source-exposed-r1.py)
(script SHA-256 `372a61c6e7df2e453b5193b016a57cae68d30bc198893e82c3758cfd65dfb711`;
private source seal SHA-256
`23cd6c2ad92b7b8cc0262387a92d31fd0fbc1c3e727413c1936be919572a6d9c`)
used code-like symbols in ARE-selected source spans to find exact definitions
elsewhere in the pinned base checkouts. It did not read gold, DSH output or
scores. The separate [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-symbol-hop-source-exposed-r1.py)
(script SHA-256 `1a9fafada6ff35e7e638b772e4a6b2768d1c9b142848806fd9179ca6a5e11019`;
private receipt SHA-256
`c80f23a42b54f25433b1367113cf94632be8477b2b31b2fe55da7856088b5039`)
found **2/22** undelivered gold files in the top three per task and **5/22**
in 175 top-20 candidates, with one of those five outside the old relation
union. Hits spanned three repositories. The fixed advancement gate required
at least seven top-20 hits, including two outside the union, across at least
two repositories; it **failed**. This version is rejected before a model
chooser or fresh cohort. It is candidate recall only, not actual reads,
native F1, cost, independent transfer or superiority.

## Open Questions

- How should a future comparator expose an episode-budget denial distinctly
  from a provider failure, while keeping the predeclared budget fixed?
- Which source-only mechanism improves quality across repositories without
  increasing model calls and tokens? The r11 partial observations cannot
  validate a mechanism selected from these same scores.
- Can an issue-grounded relation/neighbor rule use files ARE already read
  (including `.hpp`) with materially better three-read precision than the
  rejected ordering? Any mechanism selected from r11 is development only
  until tested on a separate untouched cohort with actual read receipts,
  native F1, and full costs.
- The include graph contains four read-cap-eligible gold files in the C++
  pool, but both the fixed top-three ordering and one GLM packet chooser found
  none. Which genuinely different acquisition mechanism can be developed on
  already exposed data and then tested on an untouched cohort with actual
  read receipts, native scores, and full costs? Do not retune on r11 and then
  describe r11 as independent validation.
- Which changed source/repository mix can supply an untouched 24-pair
  development test under the conservative exposure rule, and pass evaluator-
  only native-reference admission?
- Can issue- or symbol-grounding narrow the Python import-neighbor pool enough
  to produce useful read precision, and can a genuinely new rule transfer to
  a fresh untouched cohort? The r11 graph coverage, top-three ranker, and rare
  exact-symbol gate have not done so.
- Can a source-grounded acquisition policy approach the perfect-acquisition
  potential without evaluator leakage or a large false-positive read budget?
  The exposed oracle bound is a target for mechanism research, not an
  implementable benchmark result.
- Which new source-only candidate generator can increase recall beyond the
  31-file Python proposal union and the failed C++ include top-three, before
  spending GLM calls on admission or opening an untouched cohort?
