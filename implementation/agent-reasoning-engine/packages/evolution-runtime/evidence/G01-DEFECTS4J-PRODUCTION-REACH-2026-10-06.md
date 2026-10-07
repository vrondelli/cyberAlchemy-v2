# G01 production-source candidate reach development

Status: exposed source-retrieval improvement; not prospective accuracy or a
superiority gate pass. Follows the [r2 failure attribution](G01-DEFECTS4J-32-R2-RESULT.md).

The r2 GLM candidate union reached a human-fix modified file in only 20/32
cases. All 20 were Hit@3 successes; all 12 misses lacked a gold candidate.
This made the frozen 24/32 requirement structurally impossible, irrespective
of further GLM calls or output normalization.

The development hypothesis is that Java test callers consume the short
retrieval shortlist intended for production-file localization. The implemented
screen retains the original complete Java index and full BM25 ranking, then
selects its first ten production paths. A production path is Java and has
neither a test/tests/testing/testsrc directory nor a Test-prefixed or
Test/Tests/TestCase-suffixed filename. It still includes the original RepoMap
top ten and stack locator's first eight paths, deduplicated. Test sources
remain available in the complete source index and original caller evidence;
they are not deleted. This is a heuristic, not a language-level definition.

The source-only candidate lists were written before a separate post-gold
reach calculation. The entire 32-case r2 cohort was retained:

| Measure | Original r2 union | Production-aware screen |
| --- | ---: | ---: |
| Cases containing any gold file | 20/32 | **27/32** |
| Newly reachable cases | — | 7 |
| Previously reachable cases lost | — | 0 |
| Maximum candidates per case | 20 | 20 |

No provider calls were made for this screen. Reach is an oracle ceiling for
possible file-localization successes, **not** a model answer score. It cannot
be substituted for Hit@3 or retroactively repair the r2 failed gate. These
cases were exposed before development; this result is not independent evidence.

Implementation:
[candidate screen](../research/arb-trace2code-r1/screen-defects4j-production-candidates-r1.mjs),
[path-selection test](../research/arb-trace2code-r1/screen-defects4j-production-candidates-r1.test.mjs),
[reach scorer](../research/arb-trace2code-r1/score-defects4j-production-reach-r1.py).
The path-selection test passed; the scorer and attribution scripts compile.

Private archive: `/home/vlad_/are-benchmark-archive/defects4j-rerank-r2/`.

- `PRODUCTION-CANDIDATE-SCREEN.json`: SHA-256 `0939bf688ef13cb9133c92f1b64f4846f3ecb5f8da7ce9faf03749725c54dc04`.
- `PRODUCTION-REACH-SCORE.json`: SHA-256 `c9c52e7daf4a267bdded37355bd284da6a2c9a1fa61ebe3a7acf033ca6e55f05`.

Next: build bounded source-only packets for the improved lists and run an
exposed GLM development check without changing the original r2 result. Then
freeze the improved retrieval/reader policy and appropriately matched stronger
comparators before selecting fresh source-order cases. Do not repeatedly
sample unchanged confirmation cohorts until a favorable result appears.

## Routing continuity diagnostic

The shortened user continuation text alone does not contain a benchmark route
signal. Requests 45 and 46 were rejected because their target references were
inferred; the router intentionally excludes inferred references from lexical
selection. Request 47 preserved the latest raw user text and carried the exact
original user-authored active goal as an explicit target reference. It selected
the same benchmark route normally, without changing routing rules, inventing
authority, or bypassing a blocker. Existing private benchmark authorization
was honored. Future short continuations should retain exact explicit goal context.

## Open Questions

- Does GLM turn the seven newly reachable cases into Hit@3 successes?
- Does production-aware selection also strengthen the retrieval baselines?
- Can a frozen policy pass unchanged quality gates on fresh cases?
- Does the heuristic wrongly exclude legitimate production classes?
- Does the gain survive stronger symbol-bearing retrieval and live ARE delivery?
