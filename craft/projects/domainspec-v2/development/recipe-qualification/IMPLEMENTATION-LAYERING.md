---
title: DomainSpec Recipe Qualification Implementation Layering
status: l1-implemented-candidate
updatedAt: 2026-09-03
owner: DomainSpec v2
scope: product capability
---

# DomainSpec Recipe Qualification Implementation Layering

This document defines the semantic and progressive implementation plan for
qualifying a generated deployment recipe with bounded external tools. The
semantic is host-neutral: a local CLI, CI runner, release-preparation job, or
another execution host may implement it without becoming its meaning owner.

The L0 candidate implementation described here is present in the CLI. This
document does not claim Product Capability adoption or authorize package
publication, image build or push, Terraform plan or apply, AWS access, release,
or deployment.

## Context

- Target: `domainspec.recipe-qualification`.
- Current state: the `aws-ecs-fargate-postgres-v1` generator emits an exact,
  no-effect deployment recipe and verifies its bytes. Terraform format,
  initialization, validation, and Docker Buildx bake checks have been proven
  manually, but their evidence is not yet represented by one reusable semantic.
- Primary user: a product team deciding whether generated recipe bytes are
  executable by an exact supported toolchain.
- Primary operator: a platform or release engineer who needs a deterministic
  qualification certificate before considering a release or deployment step.
- Primary constraint: qualification may observe and validate; it must not
  build, push, plan against a live account, apply, publish, release, or deploy.
- Existing sources:
  - `projects/domainspec-v2/development/deployment-recipe-vertical/IMPLEMENTATION-LAYERING.md`
  - `projects/domainspec-v2/impl/cli/src/recipe/contracts.ts`
  - `projects/domainspec-v2/impl/cli/src/product/capabilities.ts`
  - `projects/domainspec-v2/impl/cli/package.json`
  - `.github/workflows/domainspec-v2-product.yml`

## Semantic Decision

Recipe Qualification is a Product Capability, not a new DomainSpec meta-type
and not a synonym for CI success.

The planned capability identity is:

```text
Product Capability: domainspec.recipe-qualification
Capability-local ontology: domainspec.recipe-qualification-ontology@1
Lifecycle: candidate
Authority effect: none
```

The capability composes existing DomainSpec v2 meta-types:

| Meaning | Existing meta-type | Role |
| --- | --- | --- |
| Qualification profile selection | Policy | Selects required checks for an exact recipe target and qualification level |
| Qualification flow | Workflow | Orders pure checks and bounded tool checks without authorizing later effects |
| Individual checks | Operation | Executes one closed adapter such as Terraform format or Buildx bake check |
| Check predicates and effect ceilings | Rule | Determines pass, fail, or not-evaluable from exact observations |
| Tool and recipe boundaries | Interface | Declares exact inputs and normalized outputs for each adapter |
| Check observations | Event | Records that a bounded check produced an observation |
| Qualification lifecycle | State Machine | Moves planned to running and then to passed, failed, or not-evaluable |
| Certificate and run receipt | Value Object | Carries immutable digests and closed result data |
| Tool-output normalization | Mapping | Removes host paths, timestamps, and unstable presentation from semantic evidence |

The capability does not reinterpret `Operation` as arbitrary shell execution.
Every adapter is closed, versioned, argument-bounded, and assigned an explicit
effect class.

## Canonical Definitions Candidate

### Deployment Recipe Subject

One exact generated recipe directory identified by its deployment manifest,
generation receipt, plan digest, target implementation digest, and exact
artifact inventory.

### Qualification Profile

A closed, versioned policy that selects required checks, exact adapter IDs,
tool identities, network posture, timeouts, evidence normalization rules, and
the effect ceiling for one recipe target and qualification level.

### Qualification Check

One bounded predicate evaluation over declared recipe artifacts. A check is
either pure or invokes one named no-effect adapter. It cannot contain arbitrary
shell text.

### Qualification Observation

The normalized result of one attempted check. It records the adapter identity,
selected input digests, exit classification, normalized facts, and raw-log
digests without treating presentation bytes as semantic truth.

### Qualification Certificate

A deterministic Value Object binding the exact recipe subject, profile,
toolchain, required check set, normalized observations, aggregate result, and
claim ceiling. It excludes timestamps, durations, host paths, runner IDs, and
other run-specific fields.

### Qualification Run Receipt

An observational Value Object binding one real execution to its qualification
certificate. It may include run ID, timestamps, duration, runner platform, and
raw log inventory. It is not deterministic across runs and cannot replace the
certificate.

### Qualification Result

The closed aggregate result is one of:

- `pass`: every required check ran and its predicate passed;
- `fail`: at least one required check ran and its predicate failed;
- `not_evaluable`: no required check failed, but at least one required check
  could not be evaluated because an exact prerequisite was missing, ambiguous,
  unavailable, or stale.

There is no aggregate `skipped` state. Optional checks may be absent only when
the selected profile declares them optional. A missing required check is
`not_evaluable`, never pass.

## Claim Boundaries

| Claim | Meaning | Granted by Recipe Qualification? |
| --- | --- | --- |
| Recipe current | Generated bytes exactly match their manifest and receipt | Required predecessor |
| Syntactically valid | Selected parsers accept exact artifacts | Yes, for named checks only |
| Toolchain qualified | All required checks pass under the exact bound toolchain | Yes |
| Release qualified | Packaging, install, SBOM, provenance, and checksum checks pass | Later profile level only |
| Deployable | Environment, account, cost, IAM, secrets, state, and plan are acceptable | No |
| Deployed | External infrastructure or services were changed | No |
| Runtime conformant | The deployed system satisfies runtime guarantees | No |

A passing certificate therefore means only:

```text
these exact recipe bytes passed these exact required predicates
under this exact qualification profile and toolchain
```

## Candidate Semantic Contracts

### `domainspec.recipe-qualification-profile/v1`

Required fields:

- `profile_id`
- `qualification_level`
- `recipe_target`
- `required_checks`
- `optional_checks`
- `toolchain`
- `network_policy`
- `normalization_profile`
- `effect_ceiling: "no-effect"`
- `authority_effect: "none"`
- `profile_sha256`

Each tool is bound by name, semantic adapter ID, expected version, executable
or OCI image digest, supported platform, and invocation timeout. Terraform
provider identity must be closed by a checked lockfile or an exact provider
installation manifest; ambient latest-provider resolution is insufficient for
a deterministic qualification claim.

### `domainspec.recipe-qualification-plan/v1`

The pure planner binds:

- deployment manifest and receipt digests;
- exact recipe artifact inventory;
- profile digest;
- toolchain digest;
- ordered required and optional checks;
- each check's selected input paths and digests;
- adapter ID, predicate ID, network posture, timeout, and effect class;
- expected certificate and run-receipt output locations;
- `authority_effect: "none"`;
- deterministic plan digest.

### `domainspec.recipe-qualification-certificate/v1`

The deterministic certificate binds:

- recipe subject identity and all predecessor digests;
- qualification plan and profile digests;
- toolchain and Terraform-provider-lock digests;
- exact required check set;
- normalized observations ordered by check ID;
- causal blockers for every `not_evaluable` check;
- aggregate result;
- explicit denied claims;
- certificate digest.

### `domainspec.recipe-qualification-run-receipt/v1`

The run receipt binds one execution to the certificate and may additionally
carry runner, timestamps, duration, and raw-log digests. These observational
fields must never influence the deterministic certificate digest.

## Closed Adapter Set Candidate

| Adapter ID | Fixed semantic action | Effect class | Minimum predicate |
| --- | --- | --- | --- |
| `terraform-fmt-check-v1` | Run recursive Terraform format check against `infrastructure/terraform` | no-effect | Exit 0 and no diff |
| `terraform-init-backendless-v1` | Initialize providers with backend disabled and lockfile readonly | bounded-local-cache | Exit 0; selected provider identities match the bound lock |
| `terraform-validate-v1` | Validate the initialized Terraform module | no-effect | Exit 0 and success result |
| `docker-buildx-bake-check-v1` | Check every declared bake target without building | no-effect | Exit 0 for API, worker, and consumer targets |
| `recipe-byte-verify-v1` | Replay DomainSpec recipe verification | pure | Exact artifact membership and digests pass |
| `package-clean-install-v1` | Pack and install the CLI into an isolated consumer | bounded-local-write | Exact package inventory and smoke checks pass |
| `sbom-generate-check-v1` | Generate and verify a deterministic release-candidate SBOM | bounded-local-write | Subject inventory is complete and digest-bound |
| `provenance-envelope-check-v1` | Construct a no-publish provenance candidate | pure | Subject, builder, materials, and outputs close exactly |

The L0 profile includes only recipe-byte verification, Terraform checks, and
Buildx bake checking. Package, SBOM, and provenance checks enter at later
layers.

Forbidden adapter actions include:

- `terraform plan` against a real account, `apply`, `destroy`, or state mutation;
- Docker image build, load, push, registry login, or signing publication;
- AWS authentication or API mutation;
- npm publication;
- Git commit, tag, release, or push;
- secret retrieval;
- arbitrary caller-supplied commands.

## Semantic Invariants

1. **Exact subject**: every result binds one current recipe manifest and receipt.
2. **Closed checks**: only profile-declared adapter and predicate IDs may run.
3. **Exact toolchain**: tool versions and immutable identities are evidence, not
   ambient assumptions.
4. **No-effect ceiling**: every adapter has a statically declared effect class;
   forbidden actions cannot be represented by a qualification plan.
5. **Collect all**: all required checks are reported as pass, fail, or
   not-evaluable with causal evidence.
6. **No inference**: missing output, unavailable tools, absent provider locks,
   or timeouts never become pass.
7. **Deterministic certificate**: host-specific run metadata is separated into
   the run receipt.
8. **Source sensitivity**: changing any selected recipe, profile, adapter,
   predicate, tool, or provider-lock byte changes the certificate identity.
9. **Unrelated-byte insensitivity**: unselected repository bytes do not change
   the certificate.
10. **No promotion by validation**: pass does not make the recipe stable,
    releasable, deployable, deployed, or runtime-conformant.

## D65 Construction Chain Candidate

```text
canonical Recipe Qualification definitions
  -> Product Capability domainspec.recipe-qualification
  -> domainspec.recipe-qualification-ontology@1
  -> DomainSpec authored Qualification Policy/Workflow/Operations/Rules
  -> deterministic compiled qualification graph and system ontology
  -> CLI planner, adapters, certificate emitter, and CI binding
  -> conformance and hostile evidence
```

The L0 implementation rows are candidate implementation evidence; they do not
manufacture adoption, acceptance, publication, release, or deployment authority.

## L0 Implementation Decisions

- Native executables are bound by exact observed version and executable SHA-256;
  executable paths remain host receipt concerns and do not enter the certificate.
- Terraform initialization operates only on a temporary copy of the generated
  module with `-backend=false`; the resulting provider lock is hashed into the
  certificate and never written into the generated recipe.
- Raw stdout and stderr are stored beside the receipt under five fixed evidence
  paths. Their digests enter the run receipt, while normalized observations enter
  the deterministic certificate.
- Tool unavailability and timeouts are `not_evaluable`; version mismatch and
  nonzero predicate exits are `fail`; dependent Terraform validation reports its
  initialization blocker instead of being skipped.

## Layering Method

- Minimum proof: qualify one already-generated canonical recipe with the
  smallest useful no-effect check set.
- Decision-first: each layer exists to unlock one product decision.
- Progressive hardening: each layer adds one bounded theme.
- Non-regression: exact subject binding, no-effect execution, collect-all
  results, and claim ceilings survive every layer.
- Evidence-gated promotion: no later layer begins by assuming an earlier layer
  passed.

## Layer Boundary Heuristic

```text
Layer value = decision unlocked + user-visible outcome + risk reduced
Layer cost = implementation time + verification time + coordination burden
```

A layer ends when the next unit has lower value-per-cost for its current
decision than beginning the next decision layer.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Operator outcome | Risk reduced | Promotion decision |
| --- | --- | --- | --- | --- | --- |
| L0 — semantic proof | After this layer, we know whether one exact recipe can be qualified by closed no-effect predicates and produce a deterministic certificate. | Closed profile/plan/certificate contracts, pure planner, four recipe checks, local adapter runner, hostile tests | One command produces a reviewable certificate without deployment effects | Qualification meaning, effect leakage, and skipped-check inflation | Continue only if two isolated runs produce the same certificate and all hostile cases fail causally |
| L1 — CI repeatability | After this layer, we know whether the same qualification is repeatable on clean CI runners with pinned tools and providers. | CI adapter, immutable tool images, provider lock closure, artifact upload, source-sensitivity matrix | Pull requests and master runs produce comparable certificates | Host drift, provider drift, and CI-only hidden behavior | Continue only if local and CI semantic certificates agree for the same subject |
| L2 — release preparation | After this layer, we know whether a qualified product candidate can produce complete package, checksum, SBOM, and provenance candidates without publishing. | Clean package install, SBOM and provenance adapters, release-candidate inventory | Reviewer receives one closed offline release evidence bundle | Incomplete packaging and supply-chain evidence | Continue only if independent verification reconstructs every digest |
| L3 — qualification productization | After this layer, we know whether qualification is reusable across recipe targets without weakening target-specific predicates. | Versioned target profiles, adapter compatibility matrix, degraded-mode receipts, migration docs | A second target can qualify through the same semantic contracts | AWS-specific overfitting and compatibility drift | Promote only after a second target passes the same universal invariants plus its local checks |

## Capability Progression

| Capability area | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| Semantic contracts | Profile, plan, certificate, run receipt v1 | CI-run identity and provider-lock closure | Release-evidence extension | Compatible target-profile extension |
| Tool adapters | Terraform fmt/init/validate and Buildx check | Immutable containerized adapters | npm pack/install, SBOM, provenance | Adapter compatibility matrix |
| Evidence | Deterministic local certificate | Local/CI equivalence | Offline release bundle | Cross-target evidence |
| Failure behavior | Pass/fail/not-evaluable collect-all | Timeout, unavailable registry, cache and network failures | Incomplete package and SBOM failures | Unsupported target and adapter-version failures |
| Host integration | Local CLI | GitHub Actions | Release-preparation job | Multiple CI/runtime hosts |

## Layer Definitions

### L0 — Semantic Proof

Included scope:

- candidate canonical definitions and capability-local ontology;
- authored DomainSpec Policy, Workflow, Operations, Rules, Interface, Events,
  State Machine, Mapping, and Value Objects;
- closed JSON schemas and TypeScript decoders;
- pure qualification planner;
- fixed adapters for recipe byte verification, Terraform format/init/validate,
  and Buildx bake check;
- deterministic certificate plus separate observational run receipt;
- hostile tests for stale recipe bytes, missing Terraform, missing Docker,
  provider-lock drift, timeout, attempted forbidden action, missing required
  output, and refreshed outer digests over changed inner evidence;
- source-sensitivity and unrelated-byte-insensitivity tests.

Explicitly deferred:

- CI workflow integration;
- package release evidence, SBOM, and provenance;
- image builds and scans;
- Terraform plan/apply;
- cloud credentials or APIs;
- publication and deployment.

Exit evidence:

- two isolated qualifications of identical inputs produce byte-identical
  semantic certificates;
- every required check has one result and no skips;
- generated plan cannot encode a forbidden effect;
- certificate verification succeeds from subject, profile, toolchain, and raw
  evidence alone;
- independent review reports no correctness finding.

### L1 — CI Repeatability

Adds:

- exact GitHub Actions binding to the host-neutral command;
- pinned Terraform and Buildx execution environments;
- checked Terraform provider lock or installation manifest;
- clean-runner cache and network postures as explicit profile data;
- qualification certificate and raw evidence as CI artifacts;
- local-versus-CI certificate equivalence test.

Preserves:

- no arbitrary shell;
- no build, push, Terraform plan/apply, AWS calls, or publication;
- deterministic certificate and separate run receipt;
- collect-all result semantics.

Implemented candidate binding:

- Terraform `1.16.0` runs through the committed OCI adapter pinned to the
  linux/amd64 manifest digest
  `sha256:fb5ea091b84f35e111e3a83eb8a6cdeb264bba11687c2eebc52253ade183022f`.
- Docker CLI `28.0.1` and Buildx `0.21.3` run through the committed OCI adapter
  pinned to `sha256:043c259759666d273afa94a9c9175a87a11f16cde2f613f4c527e4395b703a1f`.
- The generated recipe carries the Terraform AWS provider `6.63.0` lockfile;
  qualification initializes with `-lockfile=readonly` and rejects missing or
  changed lock bytes.
- `tools/run-recipe-qualification-l1.ts` executes two isolated real-tool runs,
  verifies both evidence packages, compares deterministic certificate bytes,
  and compares the observed certificate to the committed local baseline.
- `.github/workflows/domainspec-v2-product.yml` runs the same harness on a
  clean Ubuntu 24.04 job after product verification and uploads both run
  receipts, certificates, and raw logs.

Hosted GitHub run `33829382844` passed both product verification and the L1
qualification job for predecessor commit
`390538c8138cf6bdbba04a4c7f85a695cfc1f876`, including two real-tool runs and
artifact upload. That evidence remains bound to that immutable predecessor;
each successor commit requires its own hosted run.

### L2 — Release Preparation

Adds:

- packed npm artifact inventory and clean installation;
- checksum manifest;
- SBOM candidate tied to exact package bytes;
- provenance candidate tied to exact source commit, toolchain, materials, and
  outputs;
- offline independent verification command.

Preserves:

- no registry publication, GitHub release, tag, or signing publication;
- exact subject and toolchain binding;
- no claim beyond release-candidate evidence.

Implemented candidate binding:

- `contracts/release-candidate-manifest.schema.json` closes the candidate
  source, package, qualification, artifact, claim-ceiling, and self-digest
  shape;
- `tools/build-release-candidate.mjs` rejects dirty or mismatched Git source,
  packs the exact dependency-free Stable 1.0 package, emits an exact package
  inventory, SPDX 2.3 SBOM, unsigned SLSA-format provenance candidate,
  normalized qualification evidence, and complete checksums;
- `tools/verify-release-candidate.mjs` is copied into the bundle and verifies
  it offline without a repository checkout;
- the test suite proves two-build byte identity, two isolated tarball
  consumers, source sensitivity, and hostile package/evidence rejection;
- the GitHub qualification job prepares and uploads the bundle only after L1
  succeeds. A new hosted run and independent review remain unevaluated until
  the implementation is committed.

### L3 — Qualification Productization

Adds:

- a second deployment-recipe target;
- target-local check profiles under universal qualification invariants;
- adapter and schema migration contracts;
- compatibility and degraded-mode documentation.

Preserves every L0-L2 invariant. A second target may add local checks but may
not weaken exact subject, no-effect, collect-all, or claim-ceiling rules.

## Implementation Wave Backbone

| Wave | Target | Key artifacts | Verification |
| --- | --- | --- | --- |
| W0 | Definition and semantic closure | canonical definition candidates, Product Capability candidate, ontology, DomainSpec source | definition/ontology/schema validation and human semantic review |
| W1 | L0 contracts and planner | four schemas, decoders, pure plan, plan digest | deterministic and hostile contract tests |
| W2 | L0 adapters and certificates | closed adapter registry, runner, normalization, certificate verifier | real Terraform/Buildx checks, two-run equivalence, no-effect tests |
| W3 | L1 CI binding | workflow job, pinned tools/providers, artifact upload | clean-runner and local/CI equivalence evidence |
| W4 | L2 release evidence | package inventory, checksum, SBOM, provenance candidates | offline independent reconstruction |
| W5 | L3 second target | target profile, compatibility matrix, migration guide | universal-invariant and target-local suites |

## Planned Implementation Surface

Candidate files, subject to implementation-time review:

```text
projects/domainspec-v2/impl/cli/
├── contracts/
│   ├── recipe-qualification-profile.schema.json
│   ├── recipe-qualification-plan.schema.json
│   ├── recipe-qualification-certificate.schema.json
│   └── recipe-qualification-run-receipt.schema.json
├── src/qualification/
│   ├── contracts.ts
│   ├── plan.ts
│   ├── adapters.ts
│   ├── normalize.ts
│   ├── execute.ts
│   └── verify.ts
└── test/qualification/
    └── recipe-qualification.test.ts
```

Planned CLI surface:

```text
domainspec-v2 recipe-qualification-plan ...
domainspec-v2 recipe-qualify ...
domainspec-v2 recipe-qualification-verify ...
```

`recipe-qualification-plan` and `recipe-qualification-verify` are pure.
`recipe-qualify` may perform only the closed local effects declared by its
profile. None of the commands accepts an arbitrary command string.

## Product Construction Lane

| Frontier | State | Runnable work | Exit evidence |
| --- | --- | --- | --- |
| Canonical definitions | planned | Review and freeze the six definition candidates in this document | exact selected definitions and digest |
| Product Capability | blocked by definitions | Create `domainspec.recipe-qualification` candidate and lifecycle boundary | capability schema and review |
| Capability ontology | blocked by capability | Materialize `domainspec.recipe-qualification-ontology@1` | closed records and selector validation |
| DomainSpec authored source | blocked by ontology | Author the existing-meta-type composition | compiled relationship and obligation closure |
| Compiled graph/system ontology | blocked by source | Compile deterministic qualification model | graph/source-sensitivity evidence |
| Implementation | blocked by compiled model | Build W1-W2 contracts, planner, adapters, certificates | L0 suite and independent review |
| CI qualification | blocked by L0 | Bind W3 without changing semantics | local/CI equivalence certificate |
| Release evidence | implemented candidate | Run W4 on one clean committed successor | independent offline reconstruction and review |

## Operational Support Lane

| Task | Owner | Affected stage | Blocking basis | Current state |
| --- | --- | --- | --- | --- |
| Pin Terraform execution image and version | DomainSpec release/toolchain owner | L0 adapters | Exact tool identity is required for certificate meaning | required for W2 |
| Produce or select Terraform provider lock strategy | DomainSpec recipe target owner | L0 planner/adapters | Ambient provider resolution breaks deterministic qualification | required for W1 exit |
| Pin Buildx/BuildKit environment | DomainSpec release/toolchain owner | L0 adapters | Exact adapter behavior must be attributable | required for W2 |
| Define CI cache and network policy | Platform/CI owner | L1 | Clean-runner repeatability depends on explicit provider acquisition | deferred until W3 |
| Select SBOM and provenance toolchain | Release owner | L2 | SPDX 2.3 and unsigned SLSA provenance v1 are implemented candidate formats; signing remains unresolved | implementation candidate; owner selection still required for release |
| Provision publication credentials | Release owner | none | Qualification does not publish | explicitly out of scope |
| Provision AWS credentials/state backend | Deployment owner | none | Qualification does not plan against or mutate AWS | explicitly out of scope |

## Non-Regression Guardrails

- The deployment recipe remains a deterministic no-effect generator.
- Qualification never grants release, publication, deployment, or runtime
  conformance authority.
- Provider acceptance remains distinct from message delivery and application
  commit.
- Tool absence and prerequisite drift remain causal `not_evaluable` results.
- A failed check cannot be hidden by a later passing check.
- Raw logs may support a certificate but never replace normalized predicates.
- CI remains an adapter; local and future hosts use the same semantic plan.
- Earlier recipe receipt and certificate bytes are immutable predecessors.

## Open Decisions Before Implementation

1. Select the immutable Terraform execution image digest and supported version.
2. Decide whether the recipe generator emits `.terraform.lock.hcl` or a
   separate exact provider-installation manifest.
3. Select the immutable Buildx/BuildKit execution identity.
4. Decide whether L0 raw logs are stored beside the certificate or in a
   content-addressed evidence directory referenced by the run receipt.
5. Select the exact definition owner and Product Capability owner for the new
   semantic before any adoption claim.

## Recommended Next Layer

Run the implemented L2 candidate on one clean commit, compare the hosted bundle
with an independent offline reconstruction, and complete correctness/security
review. Only a later owner decision may select those exact bytes for release.

The most important deferred scope is any action that builds, pushes, plans
against a live environment, applies infrastructure, publishes a package, or
deploys a system.
