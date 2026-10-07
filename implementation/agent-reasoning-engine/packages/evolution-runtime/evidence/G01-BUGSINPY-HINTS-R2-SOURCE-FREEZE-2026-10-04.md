# G01 BugsInPy log-path hints: exposed diagnosis and r2 source freeze

The completed [r1 result](G01-BUGSINPY-FRESH-R1-RESULT-2026-10-04.md)
left nine candidate-union misses. A post-hoc evaluator-only check found
that six of those nine changed-file basenames occurred in the *full* public
buggy log, while only two occurred in the original 1,024-byte edge query.
This motivated the [source-only path-hint parser](../research/arb-trace2code-r1/extract-bugsinpy-log-path-hints-r1.py).
It read only the 24 frozen buggy logs and source universes, emitted up to
four existing non-test Python file paths per case, and sealed its r1 hints
at SHA-256 `9e4db2bf719ec196184e320e72866a725949b1ad2740a0306279524c5f13dd6e`.
No r1 model call or score was altered.

The **exposed r1 development** join raised the candidate-union gold-hit
ceiling from 15/24 to **19/24** when hints preceded the original top-ten
ARE and chunk lists under the same 20-candidate cap. It added matplotlib/17,
keras/39, fastapi/7, and sanic/4 without losing a previously covered case.
This was measured after r1 gold was opened and is **not** independent
evidence of a quality gain: GLM has not reranked the hinted packets, and
the policy choice was informed by exposed labels. A top-eight-per-arm
alternative lost two prior hits and was rejected as development.

The [r2 source selector](../research/arb-trace2code-r1/select-bugsinpy-hints-r2-cohort.py)
started from the same 312 exact-commit eligible BugsInPy records, excluded
every r1 bug ID and every r1 `(repository, commit)`, preferred previously
unused repositories, and then selected two distinct commits in each of
12 repositories by a fixed SHA-256 order. Its private WSL freeze is
`/home/vlad_/are-benchmark-archive/bugsinpy-trace-candidate-20261004/source-only-r3/EXACT-COHORT-24-R2-FREEZE.json`,
SHA-256 `77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c`.
The 24 tasks are in ansible, black, cookiecutter, fastapi, httpie, luigi,
matplotlib, sanic, scrapy, tornado, tqdm, and youtube-dl. Ansible,
cookiecutter, and youtube-dl are new repositories relative to r1; nine
repositories recur. No r2 patch, fixed output, score, or model answer was
opened before this freeze. The [paired r2 protocol](G01-BUGSINPY-HINTS-R2-PROTOCOL.md)
fixes the comparison and claim ceiling.

All 24 frozen source commits returned HTTP 200 from their project origins.
Their exact codeload archives were acquired to private WSL
`/home/vlad_/are-benchmark-archive/bugsinpy-trace-candidate-20261004/source-snapshots-r2/`.
The [read-only archive auditor](../research/arb-trace2code-r1/audit-bugsinpy-r2-snapshots.py)
verified 24/24 gzip streams, one root ending in each frozen commit, safe
relative member paths and per-archive bounds. Total compressed size is
**126,196,057 bytes**; total regular member bytes are **359,894,238**;
the largest archive is 40,009,403 compressed bytes. Seven archives contain
links, counted but never followed or extracted. This establishes source
acquisition feasibility, not Git-object equivalence, source-index coverage,
or an r2 GLM result.

The first complete-text-index preflight found **22/24** under the original
r2 64 MiB cap: ansible/11 needed 93,053,131 eligible bytes and ansible/18
needed 75,747,781. This makes that protocol's strict 24/24 admission
impossible. Before any r2 model call or gold opening, the separately
versioned [r2b amendment](G01-BUGSINPY-HINTS-R2B-PROTOCOL.md) retained all
24 cases and raised the *uniform* complete-index cap to 128 MiB for both
arms. R2 remains a failed no-model preflight candidate; no results have
been transferred from it.

R2b subsequently completed 24/24 source projection and matched index
coverage, 48/48 valid paired GLM calls, and 24/24 independently checked
patch labels. Its [terminal result](G01-BUGSINPY-HINTS-R2B-RESULT-2026-10-04.md)
reports an increased candidate-union ceiling but a failed hinted-over-
unhinted interval gate. The source freeze remains unchanged; no r2 patch
or model answer influenced its selection.

## Open Questions

- Will source-only hints produce a stable quality gain beyond the r2b
  21→23 candidate-union increase on a larger untouched cohort?
- Where can a fully repository-disjoint external confirmation and official
  RepoMap comparator be run before a broad product claim?
