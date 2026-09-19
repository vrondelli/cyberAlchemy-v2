# Plan — Stable Foundation CLI

Status: authored planning candidate; no SWU selected or executed.

## Implementation objective

Create `@domainspec-v2/cli` under `projects/domainspec-v2/impl/cli/` as a
read-only, compiled-JavaScript `domainspec-v2` command for exact P2 project-root
structural validation. The implementation must satisfy SF-01 through SF-21,
the passing Design selection, and the evidence ceilings in `SPEC.md` and
`DESIGN.md`.

## Approved design references

| Ref | Binding | Use |
| --- | --- | --- |
| `SPEC.md` | SHA-256 `1e2da8cbde2c103ffe4ac2d407f51ff2c0416d5b17d9e8bbe16368752dd6f5b0` | product/interface boundary |
| `DESIGN.md` | SHA-256 `44ee587945bcb08a319c760bf7ebb1331ecc98da76a5431f54626a1816ecf365` | six-view architecture |
| `DESIGN-SCOPE-MANIFEST.json` | input digest `b97b87b3338ef171dce6016c61f665d8048609836fa602b7e0a5e9e3111cf18f` | closed source denominator |
| `DESIGN-SELECTION-RESULT.json` | design-validator-pass; fixed point `1858fe78c07d97e02dea1d106eb5c485a553602b1cb901008e4f17b685f20f03` | selected concerns/extensions |
| `PLANNED-WITNESS-CONTRACTS.md` | unexecuted | future discriminating evidence |

## Delivery boundary

Included:

- a new CLI workspace package without renaming `@domainspec-v2/impl`;
- exact project-root/P2 profile/C2 receipt binding;
- separate structural-receipt, diagnostic-report, and operational-fault contracts;
- deterministic `lint` pagination and compact `receipt` output;
- npm/one-lock migration, reviewed script policy, compiled JS, clean-root proof;
- security, resource, compatibility, archive/recovery, and operator campaigns.

Excluded:

- profile or canonical schema admission;
- current development CLI rewrite outside exact curated interfaces;
- RMT/W3/W4/factory/UI/hosted/public/runtime-convergence work;
- actual release staging, tag, publication, deployment, or production approval.

## Planned product layout

```text
projects/domainspec-v2/impl/
  package.json
  package-lock.json
  cli/
    package.json
    tsconfig.json
    README.md
    contracts/
    src/{cli,contracts,input,evaluation,output,version}/
    test/{contract,input,schemas,commands,build,security,resources,compatibility}/
    fixtures/
    tools/
    acceptance/
```

`impl/pnpm-workspace.yaml`, `impl/test-derivation-engine/pnpm-lock.yaml`, and
`impl/test-derivation-engine/pnpm-workspace.yaml` leave the supported build path
only in their exact migration SWU. Their present bytes remain untouched by this Plan.

## Delivery slices

| Slice | Outcome | Layer | SWUs |
| --- | --- | --- | --- |
| SFC-S1 | closed foundation, input, and result contracts | L0 | 001–006 |
| SFC-S2 | two supported commands and compiled package | L1 | 007–010 |
| SFC-S3 | dependency, privacy, resource, and fault hardening | L2 | 011–014 |
| SFC-S4 | compatibility, archive, invalidation, and recovery | L2/L3 | 015–018 |
| SFC-S5 | independent operator and candidate readiness | L3 | 019–020 |

## Dependency rule

The order in `work-pack/shared/SWU-MANIFEST.json` is normative. Parallel work is
allowed only where a wave explicitly declares disjoint scopes. An owner receipt,
schema, profile, benchmark, build, or pilot that does not yet exist remains a
required input or output of its owning SWU; it is never inferred from this Plan.

## Validation strategy

1. Contract tests kill option, schema, grammar, exit, channel, and authority mutants.
2. Source tests cover P2 topology, containment, 13/16 membership, causal receipt
   invalidation, and deterministic manifest ordering.
3. Command tests compare closed JSON bytes and prove no product/project writes.
4. Build tests bind npm/runtime/lock/scripts/dependencies and reproduce two roots.
5. Security tests run canaries, permission, environment, child-process, file,
   network, and retention negatives.
6. Resource tests measure exact boundary/over-bound corpora and early failure.
7. Compatibility tests exercise N-1 decoders, migration, patch, rollback,
   withdrawal, quarantine, and supersession without rewriting history.
8. Candidate closure freezes all bytes, reruns acceptance-binding mutants, and
   requires independent operator/verifier receipts.

## Plan state

- Complexity: high.
- Output: split Work Pack, 10 tasks, 20 atomic SWUs, five waves.
- Plan evidence: `plan-evidence-pending`; Design witnesses remain unexecuted.
- Execution entry: `selection-ready`, with no selected unit.
- First unit: `SWU-SFC-001`, the closed foundation-contract validator.
- Next execution owner: none under this authorization; later direct owner intent
  must pass Implementation Readiness and Task Session admission.

