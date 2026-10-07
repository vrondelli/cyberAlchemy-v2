# G02 r11 exposed location-type diagnosis after static navigation failure

Status, 2026-10-04: evaluator-only **diagnosis of already exposed tasks**.
No new candidate policy, ARE read, GLM call, DSH run, fresh score, or
superiority claim follows from this note.

The exact r11 task packet, prior relation union, and reference parquet are
the same pinned inputs used by the [issue-symbol navigation audit](G02-R11-ISSUE-SYMBOL-NAVIGATION-EXPOSED-2026-10-04.md).
A read-only comparison of normalized gold paths, ARE-delivered paths, and the
prior union found **39 gold file paths**, **22 undelivered gold paths**, and
**10 undelivered gold paths outside the read-cap-eligible union** across the
12 scored tasks. A simple extension/path classifier placed the 22 missed
paths in 18 code, two documentation, one configuration, and one test file.
This is a diagnostic classifier, not a benchmark label taxonomy:
`lib/ansible/plugins/doc_fragments/meraki.py`, for example, has a `.py`
extension but serves documentation.

The most concentrated case is exposed Ansible task 5, a feature request for
module respawning and SELinux compatibility. Eight gold files were not
delivered; five were already in the prior relation union, while three were
outside it: an Azure pipeline configuration, the module executor, and a
compatibility utility. The issue spans package-manager modules and core
module utilities. The rejected static issue-symbol rule abstained there,
so reranking its proposals cannot fix this case. Exposed tasks 1 and 9
add a filter user-guide document and a Meraki documentation fragment to
the out-of-union misses. These paths are diagnosis only: **no successor
selector may read evaluator paths or use these exact paths as task-specific
rules**.

This pattern has external precedent. The authors of
[MULocBench](https://arxiv.org/html/2509.25242v1) study issue localization
across code, tests, configuration, documentation, and assets, and report
that code-only methods miss important location types. Their results are on
a different population and are not ARE scores. Crucially, the repository
already tested generic all-text BM25 and a two-channel issue-cue artifact
rule on earlier exposed G02 cohorts; both failed their fixed gates as
recorded in [the G02 r4 hypothesis record](G02-R4-HYPOTHESIS.md).
The r11 [full-repository lexical screen](G02-R11-FULLREPO-LEXICAL-EXPOSED-2026-10-04.md)
also failed its candidate-generation gate. Thus neither a code-only LSP
graph nor a generic mixed-file list is a justified direct successor.

The next *candidate hypothesis* is cross-layer, evidence-gated acquisition:
derive a small set of task claims from issue text and ARE-delivered source;
for each claim, select a typed relation (e.g. module-to-documentation,
module-to-test, import/call to implementation, or build/config dependency)
only when an explicit source anchor resolves it; cap proposed reads and
abstain otherwise. It must be frozen before labels, first screened on
exposed cases for newly reached gold, false reads and native File-/Span-F1,
then transferred to a distinct matched cohort. Given the r11 12/24
terminal denominator and DSH episode-budget denial, no G02 superiority
claim is available from the present population.

## Open Questions

- Can any cross-layer relation be extracted with enough precision to improve
  *actual* three-read ARE episodes, not just candidate reach?
- Which issue strata should be included in the next independent G02 cohort,
  and can DSH complete the matched budget on all of them?
- Is G01's qualified accuracy result and live cost integration a better
  immediate claim frontier while G02's acquisition policy is redesigned?
