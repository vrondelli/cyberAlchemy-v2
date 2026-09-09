# Governance First Invariant Vertical

Status: candidate implementation; live admission is fail-closed.
Authority effect: none.
Enforcement effect: none.

This package is the first executable slice of `CAV2-D65`, the
DomainSpec-Governed Construction Invariant. It makes one bounded construction
chain concrete:

```text
CAV2-D65 and CAV2-D67 definitions
  -> Governance Product Capability record
  -> Governance business and authority ontologies
  -> DomainSpec v2 minted-project source
  -> deterministic graph
  -> deterministic system-ontology projection
  -> exact binding to the D65 construction validator
```

The implementation is the check-only validator at
`../scripts/validate-construction.py`. It can report `PASS`, `BLOCK`, or
`NOT_EVALUABLE`; it cannot admit a profile, accept its own implementation
baseline, activate a Constitution, enforce a rule, or perform a product effect.

The live binding is expected to remain fail-closed while the selected
DomainSpec v2 profile has no release admission and the exact implementation
baseline has no postimage acceptance. Hostile tests prove that missing stages,
stale digests, skipped predecessors, hand-authored projections, and inflated
implementation claims do not become PASS.

## Build the derived views

From the repository root:

```bash
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- \
  node --import tsx ../../../cyberAlchemy-v2/ontology/governance/first-invariant/scripts/build.ts
```

The build writes only `domainspec/generated/`. Equal admitted source bytes must
produce equal graph, manifest, human view, build receipt, system ontology, and
projection receipt bytes.

## Validate

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/ontology/governance/scripts/validate-construction.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/ontology/governance/tests/test_d65_construction_mutations.py
```

Use `--verify-build` only where the validator process can access the pinned
container runtime. The normal evaluator still checks the materialized two-run
receipt, exact graph, system-ontology, compiler, and implementation digests.

## Claim ceiling

This vertical implements a deterministic, non-effectful D65 evaluator and a
candidate self-binding. It does not establish that all repository
implementations conform, grant implementation authority, admit the selected
DomainSpec profile or system ontology, accept the implementation baseline,
prove runtime behavior, publish, release, deploy, or perform an external
effect.
