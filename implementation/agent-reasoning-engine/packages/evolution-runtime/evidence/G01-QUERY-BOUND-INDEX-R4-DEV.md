# G01 query-bound source index r4 — exposed no-model development

Status, 2026-10-03: **local WSL prototype only**. The frozen G01 r17 campaign
remains terminal failed; this change does not amend its source, score, cohort,
or 24/24 gate. No provider call or native score was made here.

## Mechanism and exact source

The existing one-shot worker receives one query before indexing, but the r3
core retains every line's full token set after computing the corpus manifest
and document frequencies. The [r4 core](../research/g01-fast-live-v1/source-index-capacity-r4/ranked_source_hints_r4.py)
retains only each line's intersection with the first 128 distinct query terms.
It still counts all postings and all terms in per-file document frequency,
preserving the manifest, weighting, output, and logical index digest. The
[r3 worker](../research/g01-fast-live-v1/source-index-capacity-r4/ranked_source_worker_r3.py)
binds its one query to that compact representation. An unbound core retains
the old multi-query behavior; a bound core rejects a different query.

SHA-256: core `dfe0df62831256e1c8d98e23bafea1843ccf4c10aeb53786e6775b19dab88ddf`;
worker `aa0c81c048daea2f647c535c9b418d0676c61e88ba5c6ab51806a8c67bd71d9e`;
[focused test](../research/g01-fast-live-v1/source-index-capacity-r4/test_query_bound_r4.py)
`e673ffd1e69f7f05452a12d9dec709a5235cb657b255eb642696dd077824359a`.
The r3 originals were not changed.

## Exposed task-5 check

Input: archived r16 Transformers bare source cache, pinned commit
`56b64bf1a51e29046bb3f8ca15839ff4d6a92c74`, and the exact task-5
problem-statement query from task JSON SHA-256
`5eeaaeba1e893cede78ae692a2988a061aa566103ea480280db525df751137ab`.
Both standalone workers completed with 4,120 admitted files, 71,093,962
admitted bytes, 7,480,735 postings, 40,349 matching windows, and index
digest `d6b77a28fb670df4bc5bfda43fc3c941e4d79814d18a48f7a1b37ee064ad9570`.
The complete `{manifest,query_result}` JSON, canonicalized by `jq -S -c`,
had matching SHA-256
`096264dec18bea6e01145d146070eb2ffbb8f266f46df20dce0e79522eb916cb`.

| Worker | Peak RSS | Standalone elapsed |
| --- | ---: | ---: |
| r3 baseline | 1,178,812 KiB | 59.08 s |
| query-bound r4 | 555,560 KiB | 50.03 s |

This is a **623,252 KiB (52.9%) lower peak RSS** on one exposed local task;
the single elapsed comparison is not a reliable speed estimate. Two r4 and
two pre-existing r3 focused Python tests passed. The replay used a local bare
cache, not the VPS's live overlay views or service/memory state. It does not
show that a 60-second supervised worker settles under actual concurrent VPS
load, or that a new 24-pair campaign can complete.

An additional exposed r17 MUI TypeScript task
`SWE-PolyBench__typescript__maintenance__bugfix__7827bc22` gave the same
complete `{manifest,query_result}` digest for both workers:
`f7e37af9da62d71f55c5d4e33e14b67b1d663fbdf93361959e2df1b4a41e07c2`.
However, r3 completed locally in **58.73 s / 370,236 KiB peak RSS** while
r4 took **87.27 s / 199,524 KiB**. The memory saving came with a serious
elapsed regression, and r4 would miss the current **60-second supervised
deadline** on that local run. Therefore **r4 fails reliability qualification
for prospective dispatch**, despite exact output parity. The one-pass r5
successor is a separate experiment; neither changes frozen r17.

## Next qualification

1. Check full-output parity and peak RSS on additional exposed large-index
   tasks and the exact prospective native runner path, with no model calls.
2. Rehearse under the VPS's actual host load and overlay layout only after a
   non-destructive memory/storage preflight. Fail closed on worker deadline,
   OOM, or settlement errors; retain all receipts.
3. Select a distinct clean, native-admitted population and separately freeze
   a prospective campaign. Do not top up r17 or reuse its 24 IDs as an
   independent confirmation cohort.

## Open Questions

- Does the query-bound representation preserve full output and stay below
  host-memory/deadline limits on other large repositories and queries?
- What non-destructive VPS layout provides adequate `MemAvailable` while
  retaining historical evidence and active services?
- Which fresh, label-clean population can support the full 24-pair claim gate?
