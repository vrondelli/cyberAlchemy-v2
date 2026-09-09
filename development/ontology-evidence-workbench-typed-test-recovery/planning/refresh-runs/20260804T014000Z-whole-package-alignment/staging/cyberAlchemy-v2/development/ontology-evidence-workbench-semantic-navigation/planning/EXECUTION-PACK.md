# Execution Pack: OEW Semantic Navigation

| Field | Value |
| --- | --- |
| planningGateStatus | blocked-swu-006-compatibility-decision |
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
| W2 | L0 infrastructure then UI | SWU-022 and SWU-005 complete; SWU-006 terminal BLOCK at typed tests | compatibility selection and rebound successor before any fresh retry |
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

SWU-OEWSN-005 is complete-terminal-pass. SWU-OEWSN-006 attempt
`20260803T175337Z` adopted binding006 and patch0004, consumed its one-attempt
immutable-lockfile fetch authorization, and stopped at `TYPED_TESTS_FAILED`
without a build handle, dashboard distribution or browser evidence.

The candidate-local recovery package completed all seven OEWFR SWUs with 25/25
builder tests and V-OEWFR-01 through 13 PASS. Current builder and test
postimages are respectively
`2ae10b97a60f924c82c5da068dab23a9ad61c9c1be2f152d35dca57a93fab86e`
and
`3f94699d92a0e06a0d33710cd7e8771f98055c560ba31ad9056cc5dd2bf402bd`.
Binding006 remains immutable historical attempt material and does not bind
these new identities. The current frontier is therefore the owner-bound
test-side versus config-side compatibility choice, followed by exact successor
planning and separate retry authority. SWU-OEWSN-007 remains unselected.

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
