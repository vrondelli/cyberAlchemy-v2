---
title: DomainSpec v2 Stable 1.0 Release-Candidate Preparation
status: implemented-candidate-awaiting-clean-commit-ci
updatedAt: 2026-09-04
owner: DomainSpec v2 product owner
scope: private compiler-product release preparation
authority_effect: none
---

# DomainSpec v2 Stable 1.0 Release-Candidate Preparation

## Outcome

This vertical turns one clean source commit, the dependency-free
`@domainspec-v2/cli@1.0.0` tarball, and one passing two-run L1 recipe
qualification evidence package into an immutable, independently checkable
release-candidate bundle.

It prepares evidence. It does not publish a package, create a tag or GitHub
release, sign or attest publisher identity, deploy infrastructure, grant
product approval, or establish production use.

## D65 construction accounting

| Stage | Selected predecessor or output | Boundary |
| --- | --- | --- |
| Canonical definitions | Existing DomainSpec Product Candidate, Deployment Recipe Subject, Qualification Certificate, evidence, and release definitions | This vertical introduces no new product meaning. |
| Product Capability | Stable compiler/generator/verifier/certifier package plus `domainspec.recipe-qualification` candidate surface | Release preparation cannot broaden the supported product capability. |
| Capability-local ontology | `domainspec.recipe-qualification-ontology@1` and its subject/check/observation/certificate relations | The implementation consumes the existing qualification result; it does not adopt ontology records. |
| DomainSpec authored source | Exact clean Git commit and `projects/domainspec-v2/impl/cli/package.json` | Dirty or mismatched source is rejected. |
| Compiled graph/system ontology | The already certified compiled product and qualified recipe subject | No graph facts are added by packaging. |
| Exact implementation binding | Release-candidate manifest schema, builder, standalone verifier, tests, and GitHub job | All outputs are byte-bound and no-effect. |
| Conformance evidence | Deterministic rebuild, two clean packed consumers, hostile mutations, source sensitivity, product verification, and hosted CI artifact | Passing evidence establishes candidate reproducibility only. |

## Bundle contract

```text
candidate.json
SHA256SUMS
verify-release-candidate.mjs
package/
  domainspec-v2-cli-1.0.0.tgz
evidence/
  package-inventory.json
  sbom.spdx.json
  provenance.intoto.json
qualification/
  qualification-profile.json
  equivalence.json
  run-1/**
  run-2/**
```

`equivalence.json` is normalized only at `evidence_root`, from an ambient
absolute runner path to the fixed relative value `qualification`. Every other
qualification byte is copied unchanged. The manifest records that
normalization explicitly.

The builder rejects dirty or mismatched checkouts, archives the exact selected
commit into a temporary source tree, links only the already installed pinned
build dependencies, compiles there, and packages that isolated output. Ignored
or stale `dist/` bytes in the invoking checkout therefore cannot enter the
candidate.

The SBOM uses SPDX 2.3 and binds every packed file plus the tarball digest. The
provenance candidate uses the in-toto Statement v1 and SLSA provenance v1
shape. It binds the clean Git commit, package manifest, package lock,
workspace lock, qualification certificate, Node/npm identities, and tarball digest. It is
deliberately unsigned, so it does not prove publisher identity.

## Commands

After installing the pinned dependencies and producing L1 qualification
evidence from a clean checkout (the builder performs its own isolated build):

```bash
npm run release-candidate:prepare -- \
  --qualification-evidence-root /absolute/qualification \
  --output-root /absolute/release-candidate \
  --source-commit "$GITHUB_SHA"

npm run release-candidate:verify -- \
  --bundle-root /absolute/release-candidate \
  --expected-source-commit "$GITHUB_SHA"
```

The verifier is also copied into the bundle so a consumer with only Node can
run it offline.

## Exit evidence

- two builds from the same committed source and qualification evidence are
  byte-identical;
- changing product bytes changes the package and candidate digests;
- dirty source, missing evidence, certificate substitution, package mutation,
  checksum drift, and source-SHA mismatch fail closed;
- two isolated consumers install the tarball and observe the same root API and
  CLI version without workspace imports;
- the hosted GitHub job builds the exact commit and uploads the candidate
  bundle only after Stable 1.0 product verification and L1 qualification pass;
- an independent review has no unresolved correctness or security finding.

The first five items are implementation/CI evidence. Independent review and a
new hosted run remain required for each new candidate commit.

## Deferred effects

- package-registry publication and credentials;
- tag, release, or signing publication;
- release approval or product adoption;
- live Terraform plan/apply, AWS calls, deployment, rollback, or production;
- a second recipe target and qualification L3 productization.
