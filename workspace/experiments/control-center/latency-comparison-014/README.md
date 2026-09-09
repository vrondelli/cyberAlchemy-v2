# WLC-014: candidate closeout work and blocked product test

## Linux chat-startup repair (2026-09-06)

The qualified `runs/unified-QkPEmk` run failed waiting for chat readiness.
Direct bridge reproduction identified `ARE_CODEX_PROTOCOL_DRIFT`: the runner
selected the synthetic mock server while the proxy expected a real Codex binary
observation. This was a test setup mismatch, not evidence of a real Codex outage.

The runner now explicitly selects `ARE_CODEX_TEST_FIXTURE=workspace-mock-v1`.
The proxy accepts only the checked-in fixture's exact canonical path and pinned
SHA-256. Unknown modes, wrong paths and changed bytes fail closed. Production
mode remains strict and rejects the mock. No real protocol observation was
changed and protocol-drift tolerance remains disabled. Proxy receipts label this
as synthetic-fixture evidence, with no real protocol observation ID; run identity
also includes proxy and fixture-binding hashes. This is not full transitive
source closure or real-Codex conformance evidence.

Validation under native Linux Node 26.8.1: 22 ARE integration tests passed,
including fixture identity/default-deny tests and a mock-backed desktop chat turn;
8 report/population tests passed. `git diff --check` passed for the ARE changes.
The native retry `runs/unified-OjkR5E` was rejected before launch for memory
pressure. Native verification of the repair remains not_evaluable, not PASS.
Frozen native bytes, original failed evidence and all budgets remain unchanged.

Product frontier: verify repaired mock-backed startup through qualified native
smoke, then collect the required populations and differential evidence.
Operational prerequisite: the test operator must provide a host window meeting
the existing memory-pressure policy. No unrelated processes were stopped.
Approval, lab reconciliation, publication and release remain deferred decisions.

This is construction work toward a review-ready benchmark product, not a completed
or approved product candidate. No accepted status or approval-ready digest is issued.

## Implemented

- Exact unchanged Workspace budget binding in budget-binding.json.
- report.mjs replays the ledger, verifies harness bindings and raw artifacts,
  re-imports every native result, checks normalized/raw equality and host identity,
  and enumerates all 13 product metrics. Missing metrics never disappear as PASS.
- population.mjs evaluates complete unified-smoke metric reports: 40 qualified
  sessions, maximum 60 attempts, session maxima, nearest-rank p95, exact per-metric
  minimum samples and unchanged limits. It retains host rejections and functional
  failures independently. The input-list evaluator is not an automatic campaign
  launcher and does not replace raw-runner identity verification.
- smoke.mjs uses the real unified WDIO spec with the frozen WLC-008 control,
  protocol drift tolerance disabled, mock backend, isolated state, retained logs,
  host coverage and bounded owned-process cleanup. It never runs a successor
  implicitly. Production output and frozen predecessor bytes remain unchanged.

## Current evidence

- 27 focused harness tests passed (including 8 new report/population tests).
- Workspace frontend: 78 tests passed; typecheck passed, using existing generated
  source bytes without regeneration.
- Rust integration tests: 14 passed. Library/bin unit targets had zero tests and
  are not counted as additional coverage.
- Fresh production and WDIO-specific Vite builds passed into build/production and
  build/wdio. These are isolated build checks, not a rebuild of the frozen native
  binary. No production-dist restoration was needed because it was never changed.
- Existing WLC-013 raw ledger replay passed; population remains baseline 1/control 0.
- Strict unified smoke rejected the host before launch: normalized load and memory
  pressure exceeded policy. A post-build read-only probe still measured memory
  pressure 5.49–6.26 against maximum 1. No smoke PASS is claimed.

Node is the existing local environment; package.json declares a different Node
version. These checks are local environment evidence, not declared-toolchain parity.

## Commands

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-014/report.mjs cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-013/campaign-integration-001
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-014/smoke.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-014/population.mjs ATTEMPT_DIRECTORY_LIST.json
```

report.mjs exits nonzero for invalid evidence, not merely incomplete evidence;
consumers must inspect product_candidate_ready and metric statuses. smoke.mjs exits
2 for prelaunch host rejection, 1 for execution/qualification failure. The population
command returns nonzero unless the full supplied population passes all budgets.

## Construction frontier and operational support

Current frontier: qualified native product tests and population collection, then
full differential package verification and freeze of one exact testable candidate.
Strict smoke is runnable only after a qualifying prelaunch window; no further
host-qualified execution is claimed from a diagnostic source/build PASS.
Full metric collection is wired through the existing unified smoke report, but
has not been exercised successfully with this strict wrapper on a qualifying host.
The population list importer needs that native validation before empirical use.

Operational blocker: Workspace test operator must provide an uncontended host
window. No unrelated processes were stopped or host policy changed. This exact
dependency blocks native testing, not source/test work; the independent report,
evaluator, frontend, Rust and build work above continued while it was blocked.

Remaining product gates: strict unified smoke; fixed qualified overhead and full
metric populations; identity-bound differential evidence; exact frozen-candidate
test verification. Product approval comes afterward and remains human-owned.
Reconciliation with lab, commit, merge, publication, release and deployment are
separate deferred operational decisions. Inherited D01/D03/D08 scaffolds remain
unchanged. Research-evidence-harness keeps synthetic, local-build and native results
separate. All outputs have authority_effect none.
