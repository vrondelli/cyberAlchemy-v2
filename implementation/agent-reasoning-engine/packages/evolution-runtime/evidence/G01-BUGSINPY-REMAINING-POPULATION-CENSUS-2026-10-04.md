# G01 BugsInPy remaining-population census — source-only

Status, 2026-10-04: read-only census of the existing eligible metadata and two
frozen cohort selections. No patch, gold, provider response, or score was opened;
no new cohort was selected or dispatched.

Inputs in private WSL storage under
`/home/vlad_/are-benchmark-archive/bugsinpy-trace-candidate-20261004/`:

- `source-only-r2/ELIGIBLE-SOURCE-METADATA.jsonl`, SHA-256
  `5cf0241fa5d50118007f55e937ef0e74c7e7ea427c807f6819266378e7256523`;
- `source-only-r2/EXACT-COHORT-24-FREEZE.json`, SHA-256
  `888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33`;
- `source-only-r3/EXACT-COHORT-24-R2-FREEZE.json`, SHA-256
  `77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c`.

The metadata has **312 eligible cases in 16 repositories**. The two frozen
cohorts use **48 distinct case IDs** and collectively touch **15 repositories**.
There are **264 unused case IDs**, but only **one** is in a repository untouched
by both cohorts: `PySnooper` (one distinct base commit). Thus this BugsInPy
eligible population cannot supply a new 24-case *repository-disjoint* claim
cohort under the existing protocol. It can supply task-disjoint development
cases within previously used repositories; that is a weaker independence
condition and must be labeled as such.

The remaining case counts by repository are: PySnooper 1, ansible 16, black
18, cookiecutter 2, fastapi 12, httpie 1, keras 39, luigi 23, matplotlib
22, sanic 1, scrapy 34, spacy 7, thefuck 30, tornado 12, tqdm 5, and
youtube-dl 41. The total is 264. These counts do not establish source
snapshot availability, native label admission, benchmark validity, or model
training independence for any future selection.

Decision implication: do not spend a third BugsInPy run expecting it to
provide fully repository-disjoint confirmation of the r1/r2b reranking
advantage. Prioritize the already prepared matched official RepoMap comparator
for the exposed ARB study, an exact-Git/live-ARE delivery and cost test, and a
separately sourced fresh trace population for independent superiority evidence.
The latter requires its own source-only selection and gold isolation.

## Open Questions

- Which external trace population has enough exact-source, repository-disjoint
  cases and independent file labels for a fresh claim cohort?
- What minimal live-ARE delivery/cost protocol will test the reranker beyond
  its standalone ranking metric?
- Will the pinned official RepoMap comparator change the exposed ARB ranking
  comparison before a fresh population is spent?
