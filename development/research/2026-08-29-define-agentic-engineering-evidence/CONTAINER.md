# Local Validation Container

## Purpose

The container extends the repository's current Node 26 toolchain image and runs
the research-package validator, L1/L2 zero-model runtime tests, synthetic run
contract, and metric calculator. For L2 it can also materialize an exact pinned
Git commit into an operator-owned run directory without copying dirty worktree
bytes.

It is not a live agent runner. It contains no model credentials, network
integration, source-repository write access, participant data, or authority to
run the live pilot.

## Build

Run from the repository root:

```bash
toolchains/node-typescript/bin/node-env build-image
docker build \
  -f cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/Containerfile \
  -t cyberalchemy-define-research:local \
  .
```

The parent image is `domainspec-node-toolchain:26.8.1-ts7.0.2`, whose authority
is `toolchains/node-typescript/toolchain.json`. That record binds Node 26.8.1,
the digest-pinned source image, and its `linux/amd64` manifest digest. See
`container-provenance.json`.

The child installs Debian's `python3`, `git`, and `tar` packages. Python runs
the dependency-free evidence scripts. Git and tar materialize conversion-free
archives for the L2 rehearsal. Their package versions are resolved during the
build, so the final research-image digest and reported versions are recorded in
the local `container-build-receipt.json`. `Containerfile.dockerignore` excludes
that receipt from the image so recording the image digest does not change the
image.

## Validate The Package

```bash
docker run --rm --network none --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  cyberalchemy-define-research:local
```

## Test The Zero-Model Runtime

```bash
docker run --rm --network none --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --entrypoint node \
  cyberalchemy-define-research:local \
  --test \
  cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/runtime/tests/prepare-cli.test.mjs \
  cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/runtime/tests/isolation-core.test.mjs \
  cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/runtime/tests/synthetic-chain.test.mjs
```

These tests create run fixtures only under `/tmp`. They prove the L1 command,
persistence, L2 isolation, and L3 synthetic-chain contracts. They do not call
a model or authorize a live run.

## Calculate Synthetic Metrics

```bash
docker run --rm --network none --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  cyberalchemy-define-research:local \
  cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/calculate_metrics.py \
  cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/fixtures/pass.jsonl
```

## Validate Later Live Rows

After separate live-run authorization, mount one evidence directory read-only:

```bash
docker run --rm --network none --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --mount type=bind,src=/absolute/path/to/evidence,dst=/evidence,readonly \
  cyberalchemy-define-research:local \
  cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/validate_run.py \
  --live-pilot /evidence/run.jsonl
```

That command checks the row contract only. Before interpretation, also run the
joined validator with the mounted task-selection record and all six condition
manifests:

```bash
docker run --rm --network none --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --mount type=bind,src=/absolute/path/to/evidence,dst=/evidence,readonly \
  cyberalchemy-define-research:local \
  cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/evidence/validate_experiment_bundle.py \
  --live-pilot /evidence/task-selection.json /evidence/run.jsonl \
  /evidence/task-1-manifest.json /evidence/task-2-manifest.json \
  /evidence/task-3-manifest.json /evidence/task-4-manifest.json \
  /evidence/task-5-manifest.json /evidence/task-6-manifest.json
```

The joined validator checks the selection order, ambiguity split, minimum
hidden cases, evidence kind, 24-row cardinality, exact digests, fact/pack/gate
bindings, and cost allocation. Passing it validates record shape and integrity;
it is not product acceptance.
