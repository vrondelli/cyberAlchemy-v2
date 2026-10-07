# G01 BugSwarm external trace population — metadata feasibility

Status, 2026-10-04: **historical pre-run admission record, superseded by the
[terminal r1 result](G01-BUGSWARM-TRANSFER-R1-RESULT-2026-10-04.md).** The
fixed candidate subsequently ran 24/24 matched GLM calls but failed its
predeclared improvement gate. This record preserves how its exact failing
commits, original-log copies, bounded pre-fix source archives, source-only
code projections and queries, and evaluator-only patch paths were admitted
before scoring. It is a candidate external transfer population for G01's
failure-output-to-code retrieval mechanism, not ContextBench or a substitute
for its native Span-F1 campaign.

The [author's BugSwarm 1.3.1 release](https://www.bugswarm.org/releases/)
provides fail→pass CI artifacts. Its [metadata schema](https://www.bugswarm.org/docs/dataset/database-organization/)
includes a failing-job ID and commit, reproduction status, code-patch
classification and changed-file count; its [API](https://www.bugswarm.org/docs/toolset/bugswarm-rest-api/)
can retrieve original build logs. Those are feasibility inputs, not proof that
any selected log, exact failing source snapshot, or patch-derived file label
is valid. In particular, a passing commit may change tests/build files rather
than the root-cause implementation, and a PR's CI virtual commit may not be
directly retrievable from the public origin.

The exact public 1.3.1 JSON was acquired to private mode-700 WSL storage at
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/1.3.1-bugswarm.json`
with mode 600. It has **19,289,793 bytes**, SHA-256
`c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d`,
and **4,388** uniquely tagged records. It was not transferred to the VPS.

The [source-side projector](../research/arb-trace2code-r1/project-bugswarm-source-r1.py)
(SHA-256 `dd6639f1625cd1407d9084c8d629ac45d51d82dad7e99cfb3049406047a26ef6`)
emitted all 4,388 failure-side rows across **455** repositories at private
`source-only-r1/FAILURE-SIDE-METADATA.jsonl`, SHA-256
`5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686`.
The only row fields are `image_tag`, `repo`, `language`, `ci_service`,
`failure.job_id`, `failure.trigger_sha`, `failure.failed_tests`, and
`failure.num_tests_failed`. The projection excludes the passing job, patch
classification, changed-file metrics, and other downstream fields. Its
receipt SHA-256 is
`ecbf04926ca34a33aa1b7f977d5c5d24a5c813f511fedaf7f6dc1f6e16ee3aae`.

A separate [counts-only evaluator audit](../research/arb-trace2code-r1/audit-bugswarm-metadata-feasibility-r1.py)
(SHA-256 `717aeb9edff1fa54f2b52143ecc74fcb2d051c7e1c16d90c0f88e3a58d4da791`)
verified source-row identity against the raw metadata and the two frozen
BugsInPy cohorts. Its preliminary screen required active, reproducible,
non-error fail→pass records; `classification.code == Yes`; one to three
changed files; at least one failing test; complete 40-hex failed/passed
commits; and a unique failing-job ID. It found **1,136 cases in 246
repositories**: 697 Python and 439 Java. Conservatively excluding all 15
repository basenames touched by BugsInPy r1/r2b removed **zero** of these
cases. The private counts-only receipt is `EVALUATOR-FEASIBILITY.json`,
SHA-256 `d8e0b960fea2b5f2c484e063b1bd4a407e08229941673a593bba612200cdfd68`.
No eligible ID list, changed path, diff, label, or score was exported by this
audit.

The [source-only deterministic order](../research/arb-trace2code-r1/order-bugswarm-source-r1.py)
(SHA-256 `104b4e73400d6a7cc38b2337c87d3a13d502823982ca776b5a801c4073fa6cf0`)
was sealed before opening patch labels. Its private `ORDERED-CANDIDATES.json`
has SHA-256 `63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c`.
The [evaluator-only metadata admission](../research/arb-trace2code-r1/admit-bugswarm-metadata-candidate-r1.py)
(SHA-256 `c67ea47af75dec072a1c2d99ed93526b5bc23ce417bfb75b8e7b6ea5f265f65c`)
walked that order and fixed **24 candidate IDs in 24 distinct repositories**,
12 Python and 12 Java. It screened 33 Python and 44 Java source-order
positions, with no outcome-based substitution. The private candidate receipt
`METADATA-CANDIDATE-24-R1.json` has SHA-256
`fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d`.
This is not yet the scored campaign freeze.

The [source/log preflight](../research/arb-trace2code-r1/preflight-bugswarm-candidate-r1.py)
(SHA-256 `acca101e21e60cddc4515bb7d25ea7b21e9f89d5ff712360073c8785011b9a3c`)
verified **24/24 exact failing commit SHAs** via GitHub HTTPS and retrieved
**23/24** nonempty, job-ID-matched original logs within a 4 MiB cap. Its
private `source-only-r1/CANDIDATE-PREFLIGHT-R1.json` has SHA-256
`aab056dd6156051b9807d2e0c5b171310a92323899f9570842ee18a5adb98710`.
The 24th log was not absent: it was **4,528,636 UTF-8 bytes** and exceeded
that cap. A bounded [normalization](../research/arb-trace2code-r1/normalize-bugswarm-oversize-log-r1.py)
(SHA-256 `f5f8402b4242ccdd8f9f9dad2290fa8b18bffe3509e454ca3c618da10469c382`)
matched job `40368752256` and stored its nonempty log separately, SHA-256
`4fcf8cbf0d042f5ff373804317786d5fc7312b9c0856fa7de5d0ff4ea130961d`.
Thus **24/24 original-log copies** exist in private source-only WSL storage.
The BugSwarm API answered on HTTP, not HTTPS, so these copies are
**transport-provisional** until an authenticated or independently verified
source is established; no token was sent over HTTP.

The separate [evaluator-only diff audit](../research/arb-trace2code-r1/audit-bugswarm-candidate-gold-r1.py)
(SHA-256 `719cb691ab7bf0aeb17a57c6e3b1f8fafb79fbdd16f0d5bbed117e4da68886ad`)
matched all **24/24** BugSwarm diff image tags and fail/pass SHAs, found **30
non-test language-source gold paths**, and confirmed each path exists at the
exact failed commit through GitHub HTTPS. Its private
`evaluator-only-r1/CANDIDATE-GOLD-AUDIT-R1.json` has SHA-256
`962da35d492866ce6e587f82863ce6fda7969645be0b615ab07c8b315df957f8`.
The 24 raw diffs are mode-600 in evaluator-only storage; no gold path was
exported to source-side data. The API diffs share the HTTP transport caveat.

The [bounded source acquisition](../research/arb-trace2code-r1/acquire-bugswarm-source-archives-r1.py)
(SHA-256 `67ddf0c2b6ff1f456b206773e551f79e6d48a80723deee80a515cdbc801cc09c`)
initially admitted 22/24 exact failing-commit GitHub HTTPS tarballs under a
100 MiB compressed cap, receipt SHA-256
`8c325e0c5e7b7e33da2c91e0e248bfe4b2a6b13b9145318be44c444d4f532c42`.
The two cap exceptions were downloaded separately into the same private
source-only archive directory at **105,473,893** and **157,629,199** bytes;
neither was rejected as a case or replaced. The independent
[all-archive validator](../research/arb-trace2code-r1/validate-bugswarm-source-archives-r1.py)
(SHA-256 `8b55e1f38ff3fd6ca8d66a9bc7a0c64bb92e3816c6908176b244aba3b7293f90`)
verified **24/24** tarballs, exact commit-prefix roots, safe member paths,
and prospective code-only projection: `.py`/`.java` regular files at most
1 MiB each and at most 64 MiB total per case. The private
`source-archives-r1/SOURCE-ARCHIVES-VALIDATED-R1.json` has SHA-256
`c9db3ac9ae7bd4ef32dd9bb3edaef74e85a6ba9bf7abd8a658017939843ce6fc`.
These archives have not yet been extracted or sent to the VPS.

An [evaluator-only projection join](../research/arb-trace2code-r1/audit-bugswarm-projection-gold-r1.py)
(SHA-256 `cbda9d744180230b18ea6241a4a4675549ee2209baff45fd3f53c5d0a501adfc`)
confirmed **30/30 gold source files across 24/24 cases** survive that exact
projection rule. Its private receipt `evaluator-only-r1/GOLD-PROJECTION-AUDIT-R1.json`
has SHA-256 `46ee78cabe65f4df304971fdab3640e0141aa6c5a87b2b0cc22a122a47f9c524`.
The join did not export any gold path to the source-side directory.

The [source-only materializer](../research/arb-trace2code-r1/materialize-bugswarm-code-r1.py)
(SHA-256 `49995dc47c2746e424e1ba37a65be5a0615151572997d405aa95fbb034b93692`)
created **24 isolated pre-fix Git-indexed code roots** with **26,186 files**
and **160,136,657 projected source bytes** in private WSL storage. Its
`source-only-r1/code-projection-r1/SOURCE-PROJECTION-RECEIPT.json` has SHA-256
`29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818`.
It used only candidate IDs, failed-commit tarballs, and the source-archive
receipt—no patch label or passed source. This is a code-only ranking corpus,
not a full runnable repository checkout.

The [query projector](../research/arb-trace2code-r1/project-bugswarm-queries-r1.py)
(SHA-256 `a01f36e8e9fa05ce92582904ec7d2ccd0ad92304268d79c6390b4cf8bbf55884`)
combined up to 256 UTF-8 bytes of failure-side failed-test names, when
present, with the ANSI-stripped tail of the original failed-job log under
a **1,024-byte** limit. Three cases lacked parsed test names; all retained
nonempty log tails. Its secret-like token redactor made zero replacements
under its explicit pattern; this is a bounded check, not proof that public
logs contain no sensitive data. The private source-only query SHA-256 is
`4dafeef345483b050df368efc6f3ec636b0b1bca5681950c08ab5da5846ce8e3`;
`QUERY-SEAL.json` SHA-256 is
`0470c4aa7119b269a7150c0fa6a14567709605dc4d02a025823f87d797895995`.
No raw diff header was found in the 24 stored original logs by a bounded
header scan. The same sealed queries must go to all matched rankers.

At this historical pre-run boundary, that established a prospectively
selected, repository-separated **admission candidate**, not yet an admitted
or scored benchmark. The later freeze, VPS rankings, GLM dispatch and score
are recorded in the linked terminal r1 result. HTTP-derived payloads remain
provisional and need independent validation.
Run both the retained standalone rankers and the reranker on identical
source/query inputs; include provider and end-to-end costs. Even a successful
BugSwarm transfer would support only the stated trace-to-code retrieval
comparison, not broad ARE or ContextBench superiority.

## Open Questions

The remaining HTTP-authenticity, source-acquisition, and live-delivery
questions are owned by the [terminal r1 result](G01-BUGSWARM-TRANSFER-R1-RESULT-2026-10-04.md#open-questions).
