# TASK-SFC-SECURITY — Dependency and pointer-only security

Layer/slice/wave: L2 / SFC-S3 / W2.

## Objective

Bind every shipped/build dependency and prove that supported runtime/build
surfaces cannot disclose protected input or use undeclared network, environment,
permission, script, or retention behavior.

## SWU-SFC-011 — dependency evidence closure

- Primary behavior: produce a total exact-byte dependency/SBOM/license/integrity/
  install-script evidence report for the candidate graph.
- Independent acceptance: every lock package is classified and reachable or
  explicitly build-only; unknown integrity/license/script/duplicate-version/
  unused shipped package fails.
- Split analysis: inventory, SBOM, license, integrity, reachability, and script
  classifications jointly answer one shipped-dependency closure question. Runtime
  abuse behavior remains independently testable in 012.
- Dependencies: SWU-SFC-010.
- Write scope:
  - `projects/domainspec-v2/impl/cli/tools/validate-dependency-evidence.mjs`
  - `projects/domainspec-v2/impl/cli/contracts/dependency-evidence.schema.json`
  - `projects/domainspec-v2/impl/cli/acceptance/dependencies`
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/evidence/dependencies`
- Done: total lock census, exact versions/integrity/licenses/purpose/script class,
  shipped/build-only separation, no unowned exception.
- Validation: `VC-SFC-011`.
- Execution owner: Task Session; cost/risk/license acceptance remains a stop decision.
- Expected receipt: `runs/SWU-SFC-011/TASK-SESSION-RESULT.json`.

## SWU-SFC-012 — redaction, isolation, permissions, and cleanup

- Primary behavior: prove pointer-only output and no network/telemetry/ambient
  disclosure under supported green, red, and fault paths.
- Independent acceptance: source/path/env/stack/secret canaries never occur in
  output/evidence; denied network/child file/env, restrictive permissions, temp
  cleanup, symlink/race, and partial-output mutants pass.
- Split analysis: redaction, environment, network, permissions, and temp cleanup
  share one disclosure/isolation acceptance boundary because a leak through any
  channel violates SEC1. Dependency metadata closure remains 011.
- Dependencies: SWU-SFC-011.
- Write scope:
  - `projects/domainspec-v2/impl/cli/src/output/redaction.ts`
  - `projects/domainspec-v2/impl/cli/src/output/private-temp.ts`
  - `projects/domainspec-v2/impl/cli/test/security`
  - `projects/domainspec-v2/impl/cli/acceptance/security`
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/evidence/security`
- Done: stable pointer projection, zero canary leakage, no network/telemetry,
  restrictive mode evidence, deterministic cleanup/quarantine decision.
- Validation: `VC-SFC-012`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-012/TASK-SESSION-RESULT.json`.

## Claim ceiling

The bounded campaign proves only the selected Linux/Node/local-process scenarios;
it is not perfect isolation or support for secret/regulated inputs.

