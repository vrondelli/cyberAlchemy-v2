# Execution Pack: OEW Semantic Navigation

| Field | Value |
| --- | --- |
| planningGateStatus | pass-for-swu-005-task-session-preflight |
| complexity | high |
| baselineWave | W0 |
| workPackManifest | `WORK-PACK.md` |
| layeringArtifact | `IMPLEMENTATION-LAYERING.md` |
| specRef | `../define/SPEC.md` |
| activeLayerWindow | L0 |
| readinessProfile | pilot |

## Ordered waves

| Wave | Layer | Tasks/SWUs | Gate after |
| --- | --- | --- | --- |
| W0 | admission | SWU-001–003 and 021 | scoped exact owner decisions and frozen profile digest |
| W1 | L0 | SWU-004 | relation schema/derivation fixtures pass |
| W2 | L0 infrastructure then UI | SWU-022 complete; selected SWU-005, then SWU-006 sequential over shared renderer | rebound cumulative binding-chain proof, then cross-scene selected-edge and keyboard proof |
| W3 | L1 | SWU-007–009 sequential over store/renderer | Home/portal/Back/card matrix pass |
| W4 | L1 | SWU-010 then 011 | Path derivation then surface/recovery pass |
| W5 | L1 | SWU-012, 013, 014, 019, 015, 016, 020 sequential over OewApp/CSS | control, contrast, trust-copy and count hard gates pass |
| W6 | L2 | SWU-017 then 018 | current run and independent delta receipt pass |
| W7 | L2 | TASK-OEWSN-VERIFY exemption | recomposition and claim ceiling pass |
| W8 | L3 | TASK-OEWSN-PORTABILITY-READINESS exemption | deferred until second project is authorized |

## Parallelization boundary

No product mutation wave is parallel by default. The retained overlay,
generated patch and manifests are shared write surfaces; each SWU closes and
refreshes its baseline before the successor starts. Read-only validation may
run in parallel only after all product writes in its wave are complete.

## Current frontier

SWU-OEWSN-022 terminal and owner closeout PASS bind builder postimage
`6a762811808932c698ebebb7eb176b27bf7f65c5153ef03edc9010a26c9aee24`
and test postimage
`bdb5d6440533134c23fd6504f45ae4214ec59f12b751e68574b2ba327134de18`.
SWU-OEWSN-005 is selected for a fresh Task Session preflight with
`mutation_authorized=false`; this Execution Pack does not execute it.

## Stop conditions

- owner decision missing or changed after profile freeze;
- source graph/sidecar/build digest drift;
- lossy relation field or unmapped predicate/presentation relation;
- an independently acceptable behavior appears inside one SWU;
- acceptance-critical test, browser matrix, contrast or restoration failure;
- external network, token persistence, ontology/promotion write or protected
  path mutation;
- Task Session closeout inventory or receipt mismatch.
- direct mutation of historical overlay UI bytes, hard-coded successor identity,
  or a cumulative patch that is unordered, repeatable, escaping or colliding.
