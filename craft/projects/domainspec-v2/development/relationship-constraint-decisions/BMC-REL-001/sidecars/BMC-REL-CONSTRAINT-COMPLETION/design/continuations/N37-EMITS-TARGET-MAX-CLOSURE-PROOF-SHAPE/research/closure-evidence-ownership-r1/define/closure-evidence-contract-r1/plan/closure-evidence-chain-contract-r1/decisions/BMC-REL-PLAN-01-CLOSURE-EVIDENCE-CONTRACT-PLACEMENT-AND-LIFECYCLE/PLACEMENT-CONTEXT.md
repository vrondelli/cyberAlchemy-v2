# Placement and lifecycle context

Status: decision preparation only; no option selected and no implementation authority granted.

## Question

Where should the coordinated N43 closure-envelope and N44 evaluator-receipt schemas live, how should their first compatibility version be registered, and which lifecycle owner should accept apply and closeout responsibility?

## Fixed boundary

- N45 already admits N43 and N44 together as one candidate Design target.
- The two schemas remain validation/evidence contracts. They do not own the canonical meaning of `emits`, accept the relationship packet, attest consumer completeness, establish currentness, or grant release authority.
- Initial admission is additive `v1`; there is no pre-existing canonical version to migrate. An incompatible accepted change creates `v2`. Prior accepted versions and receipts remain immutable and digest-addressable.
- Every action option requires exact-path and digest inventory, closed Draft 2020-12 schemas, positive and hostile fixtures, a chain validator, and an owner closeout receipt.
- Selection closes only Plan blockers 002 and 003. It does not authorize schema mutation, Task Session entry, packet/profile projection, publication, release, deployment, or D06 work.

## Evidence-backed placements

### A — EVF evidence-contract family (recommended)

Targets:

- `projects/domainspec-v2/development/evolvable-validation-framework/contracts/emits-incoming-closure-evidence-envelope.v1.schema.json`
- `projects/domainspec-v2/development/evolvable-validation-framework/contracts/emits-target-max-evaluation-receipt.v1.schema.json`
- `projects/domainspec-v2/development/evolvable-validation-framework/contracts/closure-evidence-contract-manifest.v1.json`

Identity and registry policy:

- `$id`: `https://domainspec.dev/schemas/evf/<artifact>/v1`
- `schema_version`: `evf.<artifact>/v1`
- the scoped manifest plus each schema `$id`, `schema_version`, exact path, SHA-256, role, authority ceiling, and compatibility version is the registry for this family;
- no migration is needed for first admission; incompatible accepted changes create new versioned files.

Lifecycle: the `EVF evidence-chain lifecycle owner` accepts Plan/apply/closeout accountability; the relationship-validation contract owner retains the semantic boundary and must approve any later change that alters the evaluated predicate or responsibility split.

Why it fits: EVF explicitly owns the evidence chain around DomainSpec meaning, including evaluator verdicts and digest-bound receipts, and its existing contracts use the same Draft 2020-12, exact-reference, non-admitting pattern.

Trade-off: it formalizes a scoped registry and named lifecycle role inside a development evidence surface.

### B — DomainSpec implementation-spec family

Targets:

- `projects/domainspec-v2/impl/spec/relationship-validation/emits-incoming-closure-evidence-envelope.schema.json`
- `projects/domainspec-v2/impl/spec/relationship-validation/emits-target-max-evaluation-receipt.schema.json`
- `projects/domainspec-v2/impl/spec/relationship-validation/contract-manifest.json`
- `projects/domainspec-v2/impl/spec/relationship-validation/INDEX.md`

Identity and registry policy:

- `$id`: `https://domainspec.dev/schemas/relationship-validation/<artifact>/v1`
- `schema_version`: `relationship-validation.<artifact>/v1`
- `x-domainspec` records role, evidence-only authority, and version;
- the family manifest is machine source and `INDEX.md` is its generated human view;
- no migration is needed for first admission; incompatible accepted changes create `v2` identities.

Lifecycle: the `DomainSpec relationship-validation lifecycle owner` accepts Plan/apply/closeout accountability.

Why it fits: `impl/spec/<family>/` is the existing private canonical implementation-schema pattern and already has manifest/index precedent.

Trade-off: it creates a new implementation-spec family and must prevent evidence schemas from appearing to own relationship meaning.

### C — Split custody with one coordinating lifecycle owner

Targets:

- N43 envelope under `projects/domainspec-v2/impl/spec/relationship-validation/` using the B identity policy;
- N44 receipt under `projects/domainspec-v2/development/evolvable-validation-framework/contracts/` using the A identity policy.

Registry and lifecycle policy: each artifact is registered in its local family, N44 binds N43 by exact path and digest, and one named `DomainSpec closure-evidence coordinating lifecycle owner` accepts the combined Plan/apply/closeout receipt.

Why it fits: it makes the consumer-facing envelope a DomainSpec contract and the evaluator receipt an EVF contract.

Trade-off: it adds cross-registry lifecycle and digest coordination without evidence that N43 must be meaning-authoritative.

## Structurally rejected constructions

- Calling the BMC sidecar path canonical: candidate-local Design evidence cannot become the reusable lifecycle destination by relabeling it.
- Adding these contracts to the minted-project family: that family governs minted project source and generated read-model records, not closure-evaluation evidence.
- Treating this placement decision as implementation consent: placement and lifecycle selection precede exact mutation targets, readiness, and final acceptance.

## Recommendation

Choose A. Both artifacts are evidence-chain contracts, and EVF is the repository-defined owner of that chain. B is viable if the owner wants all reusable JSON Schema contracts under the implementation-spec surface. C is coherent but needlessly increases lifecycle complexity for this first version.
