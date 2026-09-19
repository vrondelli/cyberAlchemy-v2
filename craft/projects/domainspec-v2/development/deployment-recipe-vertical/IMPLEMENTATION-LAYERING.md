---
title: DomainSpec Docker PostgreSQL Terraform Recipe Vertical
status: implemented-candidate
updatedAt: 2026-09-03
owner: DomainSpec v2
scope: product capability
---

# DomainSpec Docker PostgreSQL Terraform Recipe Vertical

This plan changes the product boundary from "DomainSpec hosts an application"
to "DomainSpec compiles a checked project into a deterministic deployment
recipe." The CLI remains a compiler, generator, verifier, and certifier. It
does not become an application server, workflow host, database driver, or cloud
control plane.

## Context

- Target: one complete recipe target for a TypeScript application packaged as
  OCI images and provisioned on AWS ECS Fargate with RDS PostgreSQL by
  Terraform.
- Current state: brownfield. The compiler already produces a deterministic
  compiled graph, project artifacts, certificates, checked interchange, and
  provider-neutral system-integration manifests. Experimental in-memory and
  PostgreSQL execution code exists as a conformance harness.
- Primary user: a product team that supplies an executable application and
  wants DomainSpec to emit a reviewable, reproducible infrastructure package.
- Primary operator: a platform engineer who reviews the generated Terraform,
  builds images, plans infrastructure, and separately authorizes any apply.
- Primary constraint: derive only what the compiled graph and explicit recipe
  input justify. Never infer transport endpoints, physical persistence
  mappings, credentials, cloud account details, or deployment authority.
- Source references:
  - `projects/domainspec-v2/impl/cli/src/input/project-model.ts`
  - `projects/domainspec-v2/impl/cli/src/generation/project-build.ts`
  - `projects/domainspec-v2/impl/cli/src/system-integration/types.ts`
  - `projects/domainspec-v2/impl/system-integration/README.md`
  - `projects/domainspec-v2/impl/cli/src/runtime/durable.ts`
  - `projects/domainspec-v2/impl/cli/src/runtime/postgres-outbox.ts`

## Product Boundary

### DomainSpec owns

- validating recipe input against a closed versioned schema;
- binding the input to the compiled graph, certificate, checked interchange,
  system-integration manifests, and application artifact digests;
- deriving the required API, outbox worker, queue consumer, PostgreSQL, outbox,
  message channel, and dead-letter topology;
- rendering deterministic Docker, Terraform, migration, configuration,
  observability, and CI recipe files;
- checking exact output membership and byte currency;
- emitting a no-effect generation receipt and deployment manifest.

### The consuming product owns

- executable API, worker, and queue-consumer entrypoints;
- HTTP or messaging transport semantics not present in DomainSpec;
- domain-table physical mappings and domain migrations;
- secret values, DNS names, certificates, cloud account selection, and budgets;
- image build and publication, Terraform plan/apply, deployment, rollback, and
  production operation.

### Existing runtime code

The experimental in-memory and PostgreSQL runtime remains test-only reference
behavior. Its atomic-state/outbox, idempotency, retry, lease, quarantine, and
receipt semantics become conformance expectations for generated recipes. It is
not copied into consumer applications and is not promoted into the stable root
API.

## Selected Vertical

The initial target ID is:

```text
domainspec.recipe-target/aws-ecs-fargate-postgres-v1
```

The target contains:

- one API ECS service behind an Application Load Balancer;
- one private outbox-worker ECS service with no inbound listener;
- one private queue-consumer ECS service with no inbound listener;
- one encrypted SQS delivery channel and one encrypted dead-letter channel;
- one encrypted RDS PostgreSQL instance;
- generated DomainSpec-owned outbox, inbox, aggregate-version, and attempt-log
  migrations;
- caller-supplied, digest-bound domain migrations;
- ECR repositories, task roles, execution roles, CloudWatch log groups,
  service discovery/configuration, health checks, alarms, and autoscaling;
- networking as a target-local Terraform module with private application and
  database subnets and explicit ingress/egress;
- secrets referenced from AWS Secrets Manager without emitting secret values;
- immutable image digest inputs in Terraform. Mutable tags are insufficient
  for a deployable plan.

AWS is a planning assumption selected to make the vertical concrete. Replacing
AWS with another provider changes the target implementation, fixtures, and
acceptance surface, but not the provider-neutral recipe IR.

## Inputs

The compiler consumes two independent inputs:

1. An admitted DomainSpec source root, compiled through the existing graph and
   certificate path.
2. An explicit `domainspec.deployment-recipe-request/v1` JSON document.

The recipe request contains only deployment selections that cannot be derived
from domain semantics:

```json
{
  "schema_version": "domainspec.deployment-recipe-request/v1",
  "request_id": "settlement-production-recipe",
  "target": "aws-ecs-fargate-postgres-v1",
  "application": {
    "language": "typescript",
    "source_root": "application",
    "lockfile": "package-lock.json",
    "base_image": "node:26.8.1-bookworm-slim@sha256:<64 lowercase hex characters>",
    "api": {
      "entrypoint": ["node", "dist/api.js"],
      "port": 8080,
      "health_path": "/healthz"
    },
    "worker": {
      "entrypoint": ["node", "dist/outbox-worker.js"]
    },
    "consumer": {
      "entrypoint": ["node", "dist/queue-consumer.js"]
    },
    "domain_migrations_root": "database/domain-migrations"
  },
  "integration_binding_ids": ["settle-runtime"],
  "environment": {
    "name_variable": "environment_name",
    "aws_region_variable": "aws_region"
  },
  "authority_effect": "none"
}
```

Every path is normalized, relative, and contained beneath one explicit
consumer root. Referenced files are regular files, are inventoried, and become
digest-bound inputs. The request cannot contain credentials, account IDs,
secret values, Terraform backend credentials, or an apply instruction.

## Intermediate Representation

Add one provider-neutral `domainspec.deployment-recipe-plan/v1` before any text
renderer. It contains:

- project ID and source-manifest digest;
- compiled-certificate and checked-interchange digests;
- recipe-request digest;
- selected target ID and exact target-rendered artifact-inventory digest;
- selected node and relationship-edge IDs plus exact system-integration
  binding ID/digest pairs;
- derived components and the exact evidence for each component;
- caller-supplied application and migration artifact inventory;
- required configuration and secret-reference names;
- planned output inventory and plan digest;
- `authority_effect: "none"`.

Derivation rules are closed and fail-closed:

- an API component requires an explicit executable entrypoint and at least one
  selected Interface/Operation exposure binding;
- a worker component requires a selected Operation-to-Event production path;
- message publisher and consumer components require one exact candidate
  transport binding joined to `Operation --produces--> Event` and every
  `Event --triggers-cross--> Operation` consumer edge;
- PostgreSQL requires an exact persistence binding;
- the generated transactional outbox requires an exact transaction-guarantee
  binding joining state and outbox participants;
- no matching evidence means no component; contradictory or incomplete
  evidence rejects the plan rather than falling back;
- target-specific defaults are versioned renderer constants, never ambient
  environment values.

## Generated Bundle

```text
generated/
├── .dockerignore
├── application/
│   ├── package.json
│   ├── package-lock.json
│   ├── <consumer application bytes>...
│   └── <DomainSpec generated TypeScript project bytes>...
├── images/
│   ├── api.Dockerfile
│   ├── worker.Dockerfile
│   ├── consumer.Dockerfile
│   └── docker-bake.hcl
├── infrastructure/
│   └── terraform/
│       ├── versions.tf
│       ├── variables.tf
│       ├── locals.tf
│       ├── network.tf
│       ├── database.tf
│       ├── registry.tf
│       ├── iam.tf
│       ├── messaging.tf
│       ├── compute.tf
│       ├── observability.tf
│       ├── outputs.tf
│       └── README.md
├── database/
│   ├── domainspec/0001_outbox.sql
│   ├── domainspec/0001_outbox.down.sql
│   └── domain-migrations.manifest.json
├── operations/
│   ├── configuration.schema.json
│   ├── health-contract.json
│   ├── observability-contract.json
│   ├── message-boundary-contract.json
│   └── rollback.md
├── ci/
│   └── github-actions.example.yml
├── deployment-manifest.json
└── .domainspec/deployment-recipe-receipt.json
```

The CI file is an inert example. It must contain explicit plan and apply gates;
generation never installs it into `.github/workflows`.

## Implemented Candidate

The repository now carries the complete no-effect candidate recipe-product slice:

- closed request, manifest, and receipt JSON Schemas;
- provider-neutral plan and exact evidence derivation from the compiled graph,
  checked interchange, project certificate, and selected integration bindings;
- deterministic `aws-ecs-fargate-postgres-v1` rendering for OCI build inputs,
  Terraform, RDS PostgreSQL, transactional-outbox migrations, operational
  contracts, rollback guidance, and inert CI checks;
- stable `recipe-plan`, `recipe-generate`, and `recipe-verify` CLI commands and
  matching root library exports;
- atomic new-directory publication, exact byte verification, hostile-input
  rejection, source-sensitivity checks, and two-consumer packed-package
  determinism coverage.

The implementation does not invoke Docker, Terraform, AWS, PostgreSQL, image
publication, or deployment. L1 disposable runtime exercises and L2 cloud plan
or rehearsal evidence remain separate operator-owned validation campaigns;
their absence does not widen this recipe generator into a runtime or control
plane.

## Layering Method

Each layer ends at the smallest slice that changes what the product team can
responsibly decide. Later layers must preserve all earlier determinism,
containment, provenance, and no-effect guarantees.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | User/operator outcome | Main risk reduced | Promotion decision |
| --- | --- | --- | --- | --- | --- |
| L0 — deterministic recipe | After this layer, we know whether a compiled graph and explicit request can produce one exact, reviewable AWS recipe without inventing missing application semantics. | Closed request schema, provider-neutral plan, AWS renderer, receipt, golden and hostile tests | A byte-stable bundle can be inspected and regenerated | Semantic overreach and nondeterministic generation | Continue only if two isolated generations are byte-identical and every component has source evidence |
| L1 — executable local proof | After this layer, we know whether the generated images and PostgreSQL migration work together using the consumer fixture. | Build both images, start local PostgreSQL, migrate, probe API, exercise one Operation/Event/outbox path, stop cleanly | A developer can prove the recipe locally without AWS | Packaging, entrypoint, migration, and integration mismatch | Continue only if clean-machine execution and destructive failure tests pass |
| L2 — AWS plan and resilience proof | After this layer, we know whether the generated Terraform expresses a secure, recoverable, reviewable AWS deployment. | Pinned Terraform validation/tests, provider plan in an isolated test account, policy checks, recovery/rollback rehearsal | A platform engineer gets a credible plan and cost/resource inventory | Cloud-provider, IAM, network, recovery, and operability risk | Continue only on an independently reviewed plan with no unbound resource or secret |
| L3 — stable recipe product | After this layer, we know whether the target can be released as a supported, compatibility-managed DomainSpec package capability. | Public API/CLI contract, upgrade fixtures, clean-package consumer test, docs, changelog, independent review | A consumer can reliably generate and verify the recipe across compatible updates | Packaging, compatibility, and adoption risk | Release candidate only after full product verification; deployment remains separately authorized |

## Capability Progression

| Area | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| Compiler boundary | Graph plus explicit request to recipe IR | Same plan drives local exercise | Same plan drives AWS plan | Versioned stable contract |
| Docker | Deterministic Dockerfiles and bake file | Real image builds and probes | Immutable ECR image digests | Reproducibility and upgrade fixtures |
| PostgreSQL | Outbox migration plus migration inventory | Transaction/outbox path on ephemeral PostgreSQL | RDS encryption, backup, failover, restore checks | Compatibility policy and migration guide |
| Terraform | Deterministic AWS module bytes | Syntax and module validation | Isolated provider plan and policy checks | Stable target version and consumer test |
| Evidence | Plan and generation receipt | Local execution receipt | Infrastructure-plan and recovery evidence | Product verification and independent review |
| Effects | None | Local disposable containers only | Plan by default; test-account apply only by separate authorization | No deployment authority in package |

## Layer Definitions

### L0 — Deterministic Recipe POC

Included scope:

- request, plan, manifest, and receipt TypeScript contracts plus JSON Schemas;
- strict duplicate-key, exact-member, identity, path, size, and digest checks;
- derivation from the complete compiled project graph and selected
  system-integration bindings;
- one TypeScript/AWS target renderer;
- atomic publication to a new absolute target directory;
- exact output-set verification;
- canonical full-vertical fixture and hostile fixtures;
- source-sensitivity tests for domain source, integration binding, recipe
  request, application bytes, migration bytes, and target renderer bytes;
- unrelated-byte insensitivity tests;
- Dockerfile, Terraform, SQL, JSON, HCL, YAML, and Markdown escaping tests.

Explicitly deferred:

- executing Docker, PostgreSQL, Terraform, or AWS;
- generating transport handlers or domain persistence mappings;
- image publication, Terraform apply, deployment, rollback, release, and
  production claims;
- Python, Rust, Kubernetes, Azure, GCP, serverless, and multi-region targets.

Exit evidence:

- two isolated generation runs produce identical artifact paths, bytes,
  digests, manifest, and receipt;
- every planned component names its graph/binding/request evidence;
- missing or hostile evidence produces a stable error and no target directory;
- changing any selected input changes the relevant plan/artifact/receipt
  digest; unrelated bytes change none of them;
- the existing compiler, generator, formalization, and package suites remain
  green.

Promotion decision:

- Continue when deterministic generation, containment, provenance, and hostile
  tests pass.
- Pivot when the provider-neutral IR cannot represent AWS without provider
  details leaking into the compiled domain graph.
- Stop when the recipe must invent executable or physical-storage semantics.

### L1 — Executable Local Proof

Added scope:

- a pinned recipe-validation toolchain for Docker/BuildKit, Terraform, and
  PostgreSQL client tooling;
- a repository fixture application implementing the declared API and worker
  entrypoints without importing the experimental DomainSpec runtime;
- real image builds from isolated contexts with no undeclared files;
- non-root user, read-only root filesystem compatibility, health checks, signal
  handling, and deterministic labels;
- ephemeral PostgreSQL migration up/down checks;
- one accepted Operation that persists state and outbox atomically, one guard
  rejection with no write, one idempotent replay, and one worker delivery;
- teardown verification showing no surviving containers, volumes, networks, or
  temporary credentials.

Prior guarantees preserved: exact inputs, deterministic plan, atomic output,
no inferred semantics, no external deployment, and experimental runtime
isolation.

Exit evidence:

- images build from the generated recipe on a clean runner;
- the local integration campaign passes twice;
- container and migration scanners report no configured critical blocker;
- SIGTERM drains both processes within the declared grace period;
- teardown leaves zero recipe-owned local resources.

### L2 — AWS Plan and Resilience Proof

Added scope:

- pinned Terraform version and AWS provider constraints;
- formatting, initialization, validation, native Terraform tests, and policy
  assertions;
- remote-state interface with backend configuration supplied separately;
- least-privilege IAM, private networking, encryption, log retention,
  database backups, deletion protection policy, Multi-AZ option, autoscaling,
  alarms, and explicit egress;
- image digests, secret ARNs, account, region, DNS, certificate, and sizing as
  validated variables, never generated secret values;
- an isolated non-production AWS plan with resource count, cost estimate, and
  replacement/destruction summary;
- separately authorized ephemeral apply/canary/restore/destroy rehearsal if the
  product owner elects to collect live evidence.

Prior guarantees preserved: generation has no network or cloud effect;
`recipe plan` does not run Terraform; plan evidence is not deployment evidence;
an apply is never implied by a passing test.

Exit evidence:

- Terraform plan contains only target-manifest resources and immutable images;
- policy checks reject public RDS, wildcard IAM, plaintext secrets, mutable
  image tags, absent encryption, and unbounded ingress/egress;
- upgrade and destroy plans expose every replacement/destructive action;
- if separately authorized, canary, restore, rollback, destroy, and residual
  checks complete in the isolated account.

### L3 — Stable Recipe Product

Added scope:

- stable root API and CLI commands;
- target capability manifest and compatibility policy;
- clean-package tests from two isolated consumer projects;
- upgrade fixtures for the current and immediately previous recipe schema and
  target version;
- generated README, operator guide, troubleshooting, migration guide,
  security policy, and changelog;
- independent implementation and security review;
- release tarball inventory proving that fixtures, credentials, live plans,
  Terraform state, and experimental runtime internals are excluded.

Prior guarantees preserved: no deploy/apply command, no secret material,
provider details remain outside DomainSpec meta-types, and every output remains
source- and renderer-digest bound.

Exit evidence:

- `npm run verify:product` includes recipe contract, generation, hostile,
  source-sensitivity, local integration, Terraform, and clean-consumer suites;
- package exports exactly the admitted recipe APIs and schemas;
- two clean consumers generate and verify byte-identical bundles;
- independent review has no unresolved correctness or security finding;
- the candidate is eligible for a separate release decision, not deployment.

## Implementation Wave Backbone

The implementation can run as one dependency-ordered campaign, with validation
after each wave and the aggregate suite at the end.

| Wave | Layer | Work | Principal artifacts | Verification |
| --- | --- | --- | --- | --- |
| W1 | L0 | Contracts and provider-neutral IR | `contracts/deployment-recipe-*.schema.json`, `src/recipe/contracts.ts`, `src/recipe/plan.ts` | Schema golden/hostile tests and deterministic plan digest |
| W2 | L0 | AWS renderer and atomic publisher | `src/recipe/targets/aws-ecs-fargate-postgres-v1.ts`, templates, `src/recipe/publish.ts`, `src/recipe/verify.ts` | Golden artifact inventory, path/escaping attacks, two-run equality |
| W3 | L0 | CLI, API, receipt, and source sensitivity | `recipe-plan`, `recipe-generate`, `recipe-verify`, exports, receipt validators | CLI black box, selected-source mutations, unrelated-byte controls |
| W4 | L1 | Consumer fixture and local executable campaign | fixture API/worker, Docker build harness, PostgreSQL migration harness | health, transaction/outbox, replay, shutdown, teardown |
| W5 | L2 | Terraform and security/resilience validation | pinned toolchain, Terraform tests, policy rules, sandbox-plan harness | format/init/validate/test, hostile HCL policy cases, isolated plan |
| W6 | L3 | Product packaging and independent review | docs, compatibility, migration, changelog, package inventory | full product suite, two clean consumers, review findings closed |

## Proposed Stable Surface

```text
domainspec-v2 recipe-plan <source-root> --request <request.json>
domainspec-v2 recipe-generate <source-root> --request <request.json> --target <absolute-new-directory>
domainspec-v2 recipe-verify <source-root> --request <request.json> --target <existing-directory>
```

Root library exports after L3:

```ts
planDeploymentRecipe(sourceRoot, request, consumerRoot)
publishDeploymentRecipe(plan, targetRoot)
verifyDeploymentRecipe(sourceRoot, request, consumerRoot, targetRoot)
validateDeploymentRecipeReceipt(sourceRoot, request, consumerRoot, receipt)
```

None of these functions builds, pushes, plans, applies, deploys, or destroys.

## Test Matrix

### Golden

- complete graph plus matching persistence/transaction/event bindings;
- deterministic TypeScript API and worker image recipes;
- deterministic outbox migration and caller migration inventory;
- deterministic AWS Terraform module, operations contracts, manifest, and
  receipt;
- exact regeneration and verification from two isolated paths.

### Hostile

- unknown target, extra members, duplicate keys, malformed IDs, absolute or
  escaping paths, symlink inputs, FIFO/device inputs, oversized input, and
  stale digest;
- missing application entrypoint or lockfile;
- API requested without exposure evidence;
- worker requested without Operation-to-Event production evidence;
- PostgreSQL requested without persistence binding;
- outbox requested without transaction guarantee;
- mismatched integration subject, duplicate binding, unsupported language, and
  selected graph drift;
- Docker instruction/newline injection, HCL interpolation injection, YAML
  scalar injection, SQL filename injection, and secret-looking literal input;
- output collision, pre-existing target, concurrent publication, partial write,
  extra output, missing output, and modified output;
- public database, wildcard IAM, mutable image tag, plaintext secret, missing
  encryption, open ingress, and unbounded egress in Terraform policy tests.

### Source sensitivity

- changing a selected node or relationship changes the plan and dependent
  artifacts;
- changing a selected integration binding changes the topology and digest;
- changing entrypoint, application bytes, or migrations changes image or
  migration inventory digests;
- changing target renderer bytes changes the target implementation digest and
  receipt;
- adding an unrelated file outside the declared input roots changes nothing.

## Non-Regression Guardrails

- The immutable meta-type baseline remains unchanged; deployment provider
  concepts are not added as domain meta-types.
- The compiled graph is the only domain-semantic input.
- Provider-neutral system-integration contracts remain separate from AWS
  realization.
- No target renderer may infer an endpoint, migration, credential, account,
  secret, or authority-bearing action.
- Generation and verification are deterministic and network-free.
- Output publication is exclusive, contained, atomic, and refuses overwrite.
- Secret values and Terraform state are never generated, inventoried, logged,
  tested as fixtures, or included in the package.
- Terraform consumes immutable image digests.
- `plan`, `generate`, and `verify` never invoke Docker, Terraform, PostgreSQL,
  AWS, or a deployment transport.
- Runtime conformance evidence does not become deployment or production
  evidence.
- The experimental runtime stays outside the stable package root surface.

## Open Decisions Before W1

1. Confirm AWS ECS Fargate plus RDS PostgreSQL as the first target. This plan
   selects it provisionally to avoid an abstract multi-provider design.
2. Confirm that the consuming application supplies API/worker entrypoints and
   domain migrations. This is the boundary that keeps DomainSpec a recipe
   compiler instead of an application runtime.
3. Select the exact pinned Terraform, AWS provider, Docker/BuildKit, Node base
   image, and PostgreSQL major versions during W4/W5 from current supported
   release evidence; do not hard-code recalled versions in W1.
4. Decide whether the first live AWS exercise may apply into a disposable test
   account. Without that separate authorization, L2 can prove plan quality but
   not deployment behavior.

## Recommended Next Layer

Implement L0 first. It is the smallest end-to-end proof that DomainSpec can
turn its compiled graph plus an explicit deployment request into a complete,
deterministic infrastructure recipe without becoming the runtime.

The most important deferred scope is live cloud apply. A generated and
validated Terraform plan can make the recipe reviewable; only an independently
authorized ephemeral deployment can prove provider behavior.
