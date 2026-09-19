# Meta-Type Factory Reproducibility Prototype Validation

Date: 2026-08-07

Status: candidate-local prototype validation passed

Authority effect: none

## Outcome

The bounded DomainSpec architecture reference suite can now be planned, locked,
executed, replayed, verified, and reproduced twice from one request. The two isolated
runs produced the same semantic receipt while retaining different process
observations. The product tree inventory remained unchanged during reproduction.

This is same-host local reproducibility evidence. It is not cross-host provisioning,
ontology promotion, implementation authority, publication, deployment, release, or
production-readiness evidence.

## Final immutable identifiers

- Request SHA-256: `ebc534c13d19261a8a4d180529f89c06a0cd15c92ba5569f8ad31a9ab1b5f0c1`
- Lock SHA-256: `793dc3009dc78007d4e9559abae42878e2a2ebd6cc861c310ca77b7abad0bde6`
- Semantic receipt SHA-256: `11de13e5f2f195ef808d680414d3a9acdd0f63e6b509f91770ec80e74f41c7bf`
- Product tree inventory SHA-256: `820d772c14e0cdc128dd654bc24c280b8ce448dd37529efc01090476fdec7c57`
- Run A: `runs/final/run-a/factory-793dc3009dc78007d4e9559a`
- Run B: `runs/final/run-b/factory-793dc3009dc78007d4e9559a`
- Reproduction receipt: `runs/final/reproduction-receipt.json`

## Reproduced graph

The locked graph contains nine nodes:

1. TypeScript `OrderStatus` Enum proof.
2. TypeScript `ShipmentPriority` Enum proof.
3. TypeScript `completeSettlement` Operation proof.
4. Python `canSettlePayout` Rule proof.
5. Rust `canSettlePayout` Rule proof.
6. TypeScript `canSettlePayout` Rule proof.
7. TypeScript Rule-enforces-Operation composition proof.
8. Cross-language Rule parity proof over TypeScript, Python, and Rust.
9. A non-authorizing readiness projection accounting for all 25 ontology meta-types.

Every join consumes current-run handles. Historical proof directories are rejected as
factory inputs. The lock covers raw inputs, provider components, validators, and the
resolved toolchain used by the run.

## Acceptance evidence

- Historical-dependency test first failed with
  `FACTORY_HISTORICAL_EVIDENCE_DEPENDENCY`; the expected-red receipt is
  `receipts/RPF-001.expected-red.json`. The same test passed after the repair.
- Full factory suite: 6 test files and 11 tests passed.
- Full architecture-conformance regression: 42 test files and 141 tests passed.
- Final focused contract and deterministic-planning regression: 2 test files and 5
  tests passed after closing the final evidence-component boundary.
- Factory TypeScript typecheck passed.
- Python reference realization: 3 tests passed.
- Rust reference realization: 3 tests passed with an isolated run-local target.
- Type-test-engine regression: 8 test files and 41 tests passed; pipeline terminal
  SHA-256 `37d0e400e81276649f01647f9d2141b057cca71a05be0da0c0194f51e98c3fc4`.
- Ontology validation passed for 4 profiles and the 25-meta-type projection.
- Provider import firewall passed.
- Scoped tracked whitespace validation passed.
- Final historical proof validation passed: 29 receipts joined, 128 current claims
  verified directly, 3 historical expected-red claims retained as non-live, 10 evolved
  current claims verified through the locked reproduction, 2 reproduction runs and 2
  raw runs verified, and all 25 meta-type IDs accounted for.

The historical validator does not rewrite old receipt claims. When a current source
has legitimately evolved, it accepts the new digest only when that exact path and
digest are present in the final reproducible lock. The validator itself is part of
that component closure.

## Operational boundary

- The process is exposed through `inspect`, `init`, `plan`, `run`, `replay`, `verify`,
  and `reproduce` CLI verbs.
- `inspect` and `init` admit only active, mapped, ontology-owned packages.
- Publication is atomic and refuses collisions or overwrite.
- Replay uses a separate bounded child process with a timeout, output cap,
  environment allowlist, and child reaping.
- Semantic evidence and process observations remain separate.
- No TypeScript runtime `enum` was introduced in the factory implementation; its own
  contracts use literal unions and `as const` values.

One pre-existing ignored directory remains at
`architecture-conformance/targets/python/__pycache__`; the prototype did not create or
remove it. Superseded final runs were preserved under `runs/archive/` so no evidence
was destroyed.

## Deferred work

Cross-host toolchain provisioning and cross-platform reproduction remain outside this
prototype. Invoke Refresh, Task Session lifecycle synchronization, promotion, and
publication were intentionally deferred by the candidate-local fast lane. The durable
handoff is `.arcanum/handoff-notices/notices/HN-0E0F441CAF9E.md`.
