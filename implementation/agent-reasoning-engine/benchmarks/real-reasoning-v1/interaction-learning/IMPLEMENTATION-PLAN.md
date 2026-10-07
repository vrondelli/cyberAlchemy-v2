# Interaction-Learning Ingestion and Baseline Plan

Status: executed and closed; supported candidate retained without activation  
Authority effect: none

## Current product frontier

Materialize a provider-free, privacy-safe historical evidence cohort and compute
an evaluator-labeled `episode_success_rate` baseline without copying the raw
Codex stores into the evolution runtime.

## Runnable product work

1. Stream both Codex JSONL roots and select the exact working-directory cohort.
2. Persist one compact ingestion manifest under the evolution cycle root.
3. Provide source locators and record ordinals to a separate evaluator without
   persisting source message or tool content.
4. Import evaluator labels through a closed JSON contract.
5. Fail closed on invalid causal attribution, duplicate turns, or unknown labels.
6. Freeze chronological objective-grouped partitions and baseline metrics.
7. Diagnose the dominant failure category and register bounded hypotheses only
   after the baseline exists.
8. Preserve negative results and iterate until a candidate clears the frozen
   contract or the owner stops the cycle.
9. Settle every evidence artifact through the durable coordinator and verify
   restart and SQLite-loss reconstruction.

## Implemented prototype surfaces

- `src/interaction-learning-ingestion.mjs` — streaming selection, structural
  derivation, closed evaluator-label validation, partitioning, and baseline.
- `bin/interaction-learning.mjs` — JSON stdin operations for scan, seal,
  baseline, hypothesis, offline screen, independent assessment, and learning
  package materialization; generated artifacts stay under
  `cycles/<cycle-id>/` in the supplied runtime root.
- `src/interaction-learning-cycle-v1.mjs` — frozen hypotheses, offline screens,
  uncertainty-aware validation, and learning packages.
- `src/deterministic-continuity-renderer-v4.mjs` — the supported, reversible
  high-risk transition candidate; it is not serving-integrated.
- `test/interaction-learning-ingestion.test.mjs` — cohort filtering, excluded
  sensitive content, causal-label rejection, objective grouping, metrics, and
  durable CLI output.

## Operational support

| Task | Owner | Affected stage | Causal blocker? |
| --- | --- | --- | --- |
| Keep Windows and WSL Codex source roots readable | Local operator | ingestion | Yes, only while scanning |
| Supply an independent evaluator process or agent | Evolution-cycle operator | labeling | Yes, before baseline measurement |
| Choose archive movement for old raw Codex logs | Local operator | storage lifecycle | No; sources are indexed in place |
| Supply model/provider credentials for later live validation | Live-canary operator | prospective validation | No; not needed for ingestion/baseline |

## Deferred operational residue

- No raw-source deletion, movement, or compression is performed by this plan.
- No provider call, credential access, model-weight change, serving upgrade,
  publication, or deployment is authorized.
- Automatic cycle-definition admission remains disabled.

## Verification contract

The full evolution-runtime suite must pass. The real scan selected 73 Windows
sessions and 2 WSL sessions, persisted no excluded content, and produced a
stable manifest. Independent labels covered all 1,269 turn candidates. The
coordinator settled 22 artifacts and passed restart and SQLite-loss recovery.
The runtime then recorded the owner's DG-IL-15 retention decision and closed the
objective without activation. See [RESULTS.md](RESULTS.md).

## Open Questions

The empirical and evaluator questions are owned by
[CYCLE-DEFINITION.md](CYCLE-DEFINITION.md#open-questions).
