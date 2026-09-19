# Changelog

## 1.0.0

- Stabilizes the compiler, generated-project, verification, and Lean assurance surfaces.
- Exposes all six structured CLI authoring helpers from the package root.
- Adds `--help`, `--version`, `capabilities`, and `doctor` product surfaces.
- Moves runtime library exports to `@domainspec-v2/cli/experimental/runtime`.
- Adds bounded source/request inputs and bounded external tool execution.
- Adds portable, installed-package product verification.
- Adds stable deterministic `recipe-plan`, `recipe-generate`, and
  `recipe-verify` command surfaces for the candidate, no-effect
  `aws-ecs-fargate-postgres-v1` deployment-recipe capability.
- Ships closed deployment-recipe request, manifest, and receipt schemas plus
  OCI Dockerfiles, Terraform, PostgreSQL transactional-outbox migrations,
  operational contracts, and exact packed-consumer verification.
- Adds stable `recipe-qualification-plan`, `recipe-qualify`, and
  `recipe-qualification-verify` surfaces for the candidate
  `domainspec.recipe-qualification` capability. The fixed no-effect adapters
  emit deterministic certificates, host receipts, and hashed raw evidence with
  explicit `pass`, `fail`, and `not_evaluable` outcomes.
- Adds the L1 candidate real-tool binding: immutable Terraform and Docker CLI
  OCI adapters, a generated AWS-provider lockfile enforced read-only, two-run
  certificate equivalence, a committed local baseline, and a clean hosted-CI
  evidence job. Hosted run `33829382844` passed for predecessor commit
  `390538c8138cf6bdbba04a4c7f85a695cfc1f876`.
- Adds the unsigned L2 release-preparation candidate: clean-source package
  binding, exact packed inventory, SPDX 2.3 SBOM, SLSA-format provenance,
  normalized qualification evidence, complete checksums, an offline verifier,
  deterministic rebuild and isolated-consumer tests, and a no-publication CI
  artifact. Each successor remains unevaluated until its own clean hosted run.

The package version records compatibility, not publication, deployment, Product Capability adoption, or authority.
