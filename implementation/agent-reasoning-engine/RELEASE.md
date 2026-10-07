# ARE release process

The working product version is `0.10.0-rc.1`, frozen as
`ARE-PRODUCT-CANDIDATE-020`. Candidates 018 and 019 remain immutable historical
evidence. Candidate 020 is verified but not approved, signed, tagged,
published, delivered, deployed, or activated.

The supported release unit is a self-contained source-closure candidate. It
contains the ARE runtime, declared components and integrations, and immutable
test evidence without Alch or DomainSpec build-time or runtime dependencies.
It is not an npm publication or a deployment.

Use Node `26.8.1`. From this directory, run:

```sh
node bin/are.mjs doctor --json
node bin/are.mjs test
npm run release:prepare
npm run release:verify
npm run distribution:materialize -- /tmp/are-standalone
```

`release:prepare` runs the complete suite from a copied source closure and writes
the exact preparation receipt to `evidence/release-preparation.rc1.json`. The
preparation sequence intentionally omits freezing. Candidate 020 was frozen
through its separately approved gate. Signing, tagging, publishing, and
deploying remain later owner-gated effects.

`candidate freeze` binds the exact source closure to the complete product test
result and failure-learning canary. Candidate identities are immutable; change
the candidate number before freezing different bytes. `release:verify` checks
the runtime and metadata, replays candidate inspection, enforces closure size
and content boundaries, requires test coverage for every declared component,
and scans the candidate closure for common credential and private-key forms.

The release closure intentionally excludes ContextBench, GLM fitting corpora,
experiment runs, undeclared packages, interpreter caches, and ontology
research. Declared components and integrations are added to the closure from
the product profile, so adding a required component also adds its exact source
and tests. The declared surface includes `conversation-runtime` and the
model-neutral `are.gateway-backend-adapter/v1` contract; it does not imply a
hosted endpoint, operational installation, or effect authority. Research
assets have independent evidence and lifecycle gates. The
GLM 5.3 Flash 8K chapter is packaged under
[`../../agent-reasoning-engine/research/contextbench-v1/releases/glm-5.3-flash-8k-v1/`](../../agent-reasoning-engine/research/contextbench-v1/releases/glm-5.3-flash-8k-v1/README.md).
Its validation does not imply that the full ContextBench acceptance matrix or
the 10K and 12K chapters have passed.

The materializer accepts an empty destination, copies the exact content-addressed
closure, verifies every copied digest, and emits a distribution receipt. The
isolated candidate suite must report `execution_mode: isolated-source-closure`.

After verification, review the exact changed paths before committing. Product
approval, commit, tag, push, publication, activation, and deployment are
separate owner actions.

## Open Questions

- Which owner will approve the private candidate after reviewing its immutable
  receipt?
- Which repository tag convention will identify the accepted candidate?
- When the 10K and 12K ContextBench chapters finish, should their release
  indexes be linked from a combined research release without entering the ARE
  runtime closure?
- Which archive format and signing identity should wrap the verified source
  closure for delivery?
