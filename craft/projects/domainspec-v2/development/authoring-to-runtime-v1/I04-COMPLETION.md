# I04 — same-source API construction closure

Date: 2026-09-17. Status: scoped construction complete. Authority effect: none.
Owner of remaining work: `EXECUTION-DAG.json` (I05 onward). This is not whole-
application completion, provider admission, release approval or deployment.

## Acceptance audit

| I04 requirement | Current implementation and evidence |
| --- | --- |
| Inbound/outbound declarations retain authored requests, Operations and responses | Alch `application-external-api.ts`; source-bound composition, routes and trace; inbound-only and outbound-only fixtures. |
| Same-source typed executable join | `application-executable.ts` uses the public API runtime binder and exact Operation request validation. Native Alch fixtures execute public request → Entity or Value Object Mapping → Operation → public response. |
| Named public contracts stay distinct | Qualified Interface/contract identity is retained by graph, integration binding, native imports and Mapping result types. No synthetic request/response domain nodes. Wrong owner, missing contract and type substitutions reject. |
| Selected Mapping consumers support or reject before generation | Shared API/messaging graph binder and TypeScript/Python/Rust planners support v3; reconciled semantic controls select the same successor. Legacy instantiation, in-memory execution and formalization reject unsupported v3 explicitly. |
| Projection is not construction | The exact Value Object successor is required; the old definition still rejects the target. Native Money projection accepts zero without invoking its positive invariant. Factories and Operations remain separate consumers. |
| Hostile and stale inputs reject | Missing/extra/changed formed artifacts, stale interpretation, wrong request parameters, wrong Operation input owner, invalid numeric fields, totality drift and forged graph snapshots reject. |
| Provider/authentication/failure boundaries remain separate | Backend fixtures reject unresolved authentication references, credential values, unsafe retry and escaped failure surfaces. Formation and binding do not claim HTTP or provider execution. |

The source-to-Operation native scenario uses an explicit local test adapter and
in-memory transaction port. It observes the selected Operation's commit outcome;
it does not infer a network request, durability or production transaction behavior.
Three-language whole-application tests exercise native Mapping consumers, not
three-language HTTP servers. I06/I07 retain provider-backed application composition.

## Historical capsule repair

The failed predecessor test conflated current configuration with historical
configuration. They differ only at `/sources/layout/sha256`:

| Configuration | Layout source hash | Configuration hash |
| --- | --- | --- |
| Historical PCR-05/R12 | `858a7f6430e2ddbc79c41696e432bf4a8b7c82910928c7cec72945131d5f95b4` | `77a7ec204fa575c52a1f3c126ce839206c81154e9bbd3541eb2ad992143631eb` |
| Current selected bytes | `e952430bbcac1479d1ed1190766c1f965d3d2f2c7499b0c434883a6a85066413` | `c82035da6f30d440bb9d37960569b5ab8d10ae9d8bdb77ef6de0e7fe52d9dd5d` |

The test now reconstructs the historical bytes in memory and requires the exact
original hash before checking the historical capsule chain. R12's original
`9886ea42053d5c0b918123649317776214b5e92139161f2602e11dde796cffe8` and
R11's `5d5b31d9e62a5bf789272bf6af05045dac915e3d7747484336e513c0ff19f1b1`
are preserved and pass. Current production configuration, historical receipts,
and historical expected digests are untouched. Separately, the additive Mapping
successor must preserve all 131 immediate predecessor sources exactly.

## Verification

- Alch API suite: 7/7, including both native Entity and Value Object Operation paths.
- Backend public Mapping, application binding, API runtime binding and external
  API contracts: 30/30, no skips.
- Source-capsule suite: 5/5, including exact historical reconstruction,
  immediate-predecessor preservation, tamper rejection and relocation.
- Alch typecheck and the unchanged 37-node DAG validator pass.
- Native three-language whole-application projection: 1/1 rerun, all three
  compilers/runtimes executed with zero skips. The prior increment's additional
  poisoned-dependency isolation evidence is retained in `EXECUTION-STATUS.md`.

Selected changed-test identities:

- Alch `test/application-external-api.test.ts`:
  `b416223350b2a939aa206b98da00c930238217f24648135aac78d8f596fa85d4`.
- CLI `test/generation/reconciled-sources.test.ts`:
  `26edaa3557b94dbd13e12d3788954c53128c6d639a02f57e606e105715ba9559`.

## Next work and open obligations

I05 is the next runnable product-construction node. I06/I07 and L1X still own
the complete source-to-provider-backed application path. O01 remains operational
support for P02, not a blocker for I05. No new product decision is needed here.
The full goal still has 24 uncompleted nodes; this audit does not reduce them.
