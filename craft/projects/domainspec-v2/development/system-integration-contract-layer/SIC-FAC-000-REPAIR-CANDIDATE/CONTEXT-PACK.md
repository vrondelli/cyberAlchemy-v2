# SIC-FAC-000-R1 Strict Context Pack

## Decision scope

This pack admits one five-file generic-factory repair candidate for the two blockers in the terminal `SIC-FAC-000` receipt. It does not admit provider work, a target/profile decision, Revision 2 mutation, review, promotion, publication, deployment, or production claims.

## Inventory result

The repository Inventory validator passes, but the compiled Inventory has no factory, `SIC-FAC`, or `architecture-conformance` entry. Exact current-byte sources below therefore provide the bounded fallback evidence. This gap is recorded; it is not silently treated as Inventory coverage.

## Obligations and evidence

| Obligation | Exact evidence | Required change |
| --- | --- | --- |
| O1 claim ceiling binds to the lock | prior Task Session receipt; `execute-factory-run.ts`; `normalize-semantic-receipt.ts` | reject exact inequality at both boundaries |
| O2 mismatch fails before publication | executor binder and `proof-accounting.test.ts` | stable diagnostic and direct/replay-equal hostile case |
| O3 exact equality preserves semantics | binder, normalizer, proof-accounting regression | retain canonical result and semantic hash |
| O4 reproduce remains two isolated roots | `reproduce-reference-suite.ts`; prior timeout receipt | serialize roots while preserving two run roots and observations |
| O5 fixed child timeout remains unchanged | `plan-factory-run.ts`; `run-locked-child.ts` | no edit and no timeout increase |
| O6 regression covers the failing route | `reference-suite.request.json`; `reproduction.test.ts` | replace the one-node fixture with nine-node reference suite |
| O7 no unrelated product drift | pre/post product inventory | exactly five admitted target deltas |
| O8 prior passing invariants remain green | prior result/matrix; typecheck, full tests, reference and W3 lifecycles | fresh passing evidence |

## Current-byte baselines

- `execute-factory-run.ts`: `4c81bdc0e81d142f8f913568326be235c7a2f7c8cef0af3f3f8f2a2731e57137`
- `normalize-semantic-receipt.ts`: `480c7d0fc3955410ffbfe8a4d177a0687b2f22e97c0e292a165be6e5f902855f`
- `reproduce-reference-suite.ts`: `fa3fe55eb2da5d7360f2aa61d66ecd458ae4a1924352a4f0794dacdfe0812e82`
- `proof-accounting.test.ts`: `18d716413e8a2d36fd14d13428f080d9a6682dd8bc1500693e19eccfa3b73cac`
- `reproduction.test.ts`: `222431e16edc0b7473a8125118c32e262e57636112c03e858b0a94bbe194f431`

## Immutable dependencies

- Prior Task Session receipt: `b2eff108dc2159718255c425a924bb96df770b45cef1c376c623952d0d331103`
- Prior result: `024f06b499149a0d23451e4dcbd16f0c55460f738d9a3a2d759bca70a047a9ba`
- Prior compatibility matrix: `675f02b2e1f3b722a310ca2c062c287f8dfe871de3131fb307de1169fb11baec`
- Fixed-timeout planner: `db2f03096de552af29448db70b247f76c8d9a4d95c1b71e692860307f5d09560`
- Child timeout/reaping boundary: `3b0589865e0523a1fa60bdf941be0f24cc4f997869e08e4f178133d0e928ea26`
- Nine-node reference fixture: `bc986e6a2c79c19f41d9420f571ce1a0485968ff0aee57e8902e15003297bd17`
- W3 fixture: `cd8f7b7ee87ed499ecf8074bb06fdc7ae8f5b0c76d3a7393b20019cce3ac8e7b`
- Implementation package manifest: `c36f88e36c34520f87877ff0c9a35f174a77a41348e61ad6f774fbbee23f5a5a`

## Write boundary

Only the five targets in `REPAIR-TASK-CONTRACT.md` are material writes. Candidate-local command, run, probe, and terminal receipts are evidence outputs. Prior `SIC-FAC-000` and Revision 2 artifacts remain immutable.

## Stop conditions

Stop on baseline drift, a sixth product delta, a nonzero acceptance command, a sequential reference timeout, a need to raise the child timeout, or any request to cross the stated authority boundary.
