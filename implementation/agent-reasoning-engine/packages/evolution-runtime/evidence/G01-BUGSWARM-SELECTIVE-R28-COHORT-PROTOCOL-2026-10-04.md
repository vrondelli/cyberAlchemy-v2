# G01 BugSwarm selective-GLM r28 — untouched metadata census protocol

Status: prospectively fixed before selection, source/log requests, labels,
rankings, selective routing, or model calls. This protocol tests whether the
post-hoc r27 ARE/graph-disagreement routing rule can be transferred to a new
repository-disjoint population. The metadata output is not yet an admitted
benchmark cohort or a superiority result.

Use the pinned BugSwarm 1.3.1 raw release SHA-256
`c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d`
and existing failure-side source order SHA-256
`63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c`.
Apply the unchanged metadata eligibility predicate in
`select-bugswarm-graph-dev-r1.py`, SHA-256
`ac7f77088a4256285b0d733c666ab45e161e2fbd364cb0a3bb3c9b14bec3422e`.

Reproduce all exclusions used by the fresh-r11 selector, whose source is
pinned at SHA-256
`2369939272dee89b3af4425952da70e3fe43a279a1eefe38234e9ba2cce5efb0`.
Also exclude, case-insensitively:

- all 24 repositories in the fresh-r11 metadata cohort, SHA-256
  `67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd`;
- every repository occurring in the 22 ordered fresh-r14 repair attempts.
  The sorted basename/SHA-256 manifest digest is
  `59a1f8c65fd023b194ce43558ab8ebe38915da95864410018f874891f319d56b`;
- the r14 final result and independent audit, SHA-256
  `2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1`
  and
  `7ffa068558092b0be67c997f86266806a34199ea0710c5bae562609e32008696`,
  as fixed evidence that the repair lineage being excluded is complete.

Walk the pinned source order separately for Python and Java. Select the first
twelve metadata-eligible cases in twelve distinct as-yet-unselected
repositories per language after all exclusions. Preserve source-order position,
image tag, failure job ID, and failed commit. Do not inspect a patch,
passing-commit source, log, model output, label, or score. If 24 candidates are
not available, stop with a terminal metadata shortage; do not shrink the
denominator or relax repository disjointness.

Seal the census to private WSL storage before any network or provider access.
The next separately versioned stages are exact source/log admission,
code-only projection, unchanged ARE and graph-r2 rankings, and a source-only
count of ARE/graph top-1 disagreement. Freeze the selective routing gate before
gold access: dispatch GLM only for disagreement cases, while agreement cases
retain the common top-ranked ordering without a provider call. Compare this
selective policy against both unchanged ARE and an always-GLM arm on the same
fully admitted population with complete token, time, validity, and abstention
accounting.

Passing a later prospective gate could support only a bounded BugSwarm
accuracy-efficiency claim after reviewer approval. It does not establish full
ContextBench, G02, G03, end-to-end ARE, or broad product superiority.

## Open Questions

- Can a third repository-disjoint 24-case population pass exact authenticated
  source/log admission without outcome-based replacement?
- What fraction of cases trigger the prospective disagreement router before
  labels, and is the resulting GLM saving material enough to justify the added
  routing stage?
- Does selective GLM retain the fresh-r25 accuracy advantage with a
  prospectively fixed denominator and complete cost accounting?
