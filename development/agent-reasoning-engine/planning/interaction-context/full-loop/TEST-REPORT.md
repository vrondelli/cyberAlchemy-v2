# Full ARE interaction learning loop: local candidate

The local prototype now completes correction -> scoped lesson -> later request
projection -> observed application -> recurring-failure target -> bounded research
and experiment comparison -> durable learning result. The serving runtime is not
activated. Product approval has not been requested or granted.

Candidate: `9582d69429c32ceb94410988a21eb5dde330e106e47a7085efe5dc6a02f46264`. Node v26.8.1; 543
exact source files and 98 test files. Definitions, private business scaffold,
DomainSpec/system scaffold, implementation, tests and runner are bound together.
The final source-identity and deterministic DomainSpec checks passed after testing.

## Current evidence

- **PASS: 638/638 tests**, zero failures, skips or cancellations. This includes
  the 15 new interaction-loop tests and the existing package/product/benchmark
  suites. Earlier package baseline: 547/547 before the new interaction tests.
- **PASS: labeled joined mock cycle**, including negative then distinct supported
  experimental comparison and restart without repeated research or experiments.
- **PASS: 48 synthetic episodes x 4 variants x 2 replays = 384 runs**.
  Full treatment application accuracy: 100%; wrong-scope applications: 0;
  classification checks: 100%; replay mismatches: 0. Maximum selected learning
  projection: 1282 bytes. Extra model calls: 0.
- Full-treatment local lifecycle p95: 23.05 ms in this run;
  this includes local setup and three scripted turns, not provider/model latency.
- **NOT_RUN: real Codex canary**. Installed `codex-cli 0.153.1` differs
  from pinned `codex-cli 0.153.0-alpha.5`. Configured model `gpt-5.6-sol`;
  no observed model, model calls, token measurements, or monetary-cost claim.

| Synthetic ablation | Application accuracy | Wrong-scope applications across two replays |
| --- | ---: | ---: |
| V0 | 41.67% | 0 |
| V1 | 66.67% | 32 |
| V2 | 70.83% | 0 |
| V3 | 100.00% | 0 |

These are lifecycle/selection tests with scripted output. They do not measure
actual baseline model responses, general semantic interpretation, empirical
learning improvement, or independent external holdout performance. V1 intentionally
models a generic summary without scope checks. V2 omits inferred lessons. The
synthetic development/regression/holdout split is not independent scenario research.

## Failure found and resolved

The first expanded run passed 637/638 tests. The impact-profiler integration test
assumed a historical retention receipt remained current even after its pinned
config.mjs changed. Runtime rejection of that stale binding was correct. The test
now requests fresh counterbalanced measurements and checks their coverage and
byte equality. Historical receipts were preserved. Retained-candidate exclusion
continues to have its own unit test. The final expanded run passes 638/638.

## Frontier and residue

Product construction has reached a reproducible local test candidate. Host methods
provide source-attested feedback, inspection, revocation/mode control, and bounded
explicit evolution draining through the existing scheduler. The next meaningful
quality test is actual model output after the runtime compatibility owner resolves
the binary pin. Product review remains owned by the ARE product owner and binds
one immutable candidate; it cannot be inferred from this report.

Operational support remains separate: compatibility work affects live product-test
evidence; integration/publication bookkeeping affects no prototype stage; serving
activation and external provider setup are deferred. No commit, push, deployment,
public subsystem write, or canonical ontology promotion was performed.

The initial worktree contained 72 dirty files. This run changed three already-dirty
wrapper files within its declared scope, retaining their prior requirement work.
Other concurrent modifications were observed outside this run's write envelope
and were not reverted. Historical requirement-continuity and retained performance
receipts remain unchanged. SOURCE-MANIFEST.json is a test closure, not a staging
or publication allowlist.

## Reproduce

From the repository root, with Node v26.8.1 available:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/full-loop/validate.py --test --node /home/vrondelli/.nvm/versions/node/v26.8.1/bin/node
```

The benchmark `interaction-learning/runner.mjs` has `--mode mock`,
`--mode local-benchmark`, and `--mode live-canary`. The live mode first checks the
pinned protocol and reports NOT_RUN on incompatibility. MODEL.json and
INTEGRATION.md describe exact dependencies, host inputs, limits, and open questions.

Authority effect: none. This report is local candidate evidence, not product
approval, production adoption, operational activation, or generalized quality proof.
