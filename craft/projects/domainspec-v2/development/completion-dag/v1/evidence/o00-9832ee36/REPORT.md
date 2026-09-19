# O00 — isolated compiler verification environment

**PASS: environment prepared and checked.** C01 product verification and C02 qualification are dependency-ready; neither was executed by this task.

## Source and isolation

- Detached checkout: `/home/vrondelli/projects/domainspec-v2-verification-9832ee36`.
- Exact source: `9832ee36c5332be825ff065fb8cff05b23b2fd81`.
- All **206 C00 source hashes match**; the isolated checkout remains clean after dependency installation.
- Shared compiler edits and other active work were preserved. Dependencies and caches are local to this task; shared Node volumes were not used.
- Tool image: `sha256:ec7f87fd5731fb7441d91d37abcd388df7ac38ad1f03e880b608aec034bd77f7`. The runner selects this immutable ID.

## Verified tools

| Tool | Observed version |
|---|---|
| Node / npm / pnpm | 26.8.1 / 11.19.0 / 10.34.5 |
| TypeScript (`tsc`) | 7.0.2 |
| Lean | 4.33.1 |
| Rust / Cargo | 1.94.0 |
| Python / jsonschema | 3.12.14 / 4.26.0 |
| Docker / buildx | 28.0.1 / 0.21.3 |
| Terraform adapter | 1.16.0 |

The workspace TypeScript 6 alias exposes `tsc6`; `tsc` invokes the pinned `@typescript/native` package. The initial probe incorrectly expected 6.0.2. Its result is retained in `tool-probes.initial.json`; the corrected version check and executable mapping are in [tool-probes.json](tool-probes.json).

All **22 tool checks passed**, including minimal Lean and Rust compilation, TypeScript compilation/loading, Python schema validation, PostgreSQL image availability, Docker connectivity, both qualification adapters, and a daemon-side mount-path check. The PostgreSQL client version and full installed package inventory are recorded in [environment.json](environment.json). Tool smoke checks are not compiler product tests.

## Run the next tasks

The persistent runner is `/home/vrondelli/projects/domainspec-v2-o00-9832ee36-tools/run.py`; a review copy is [run.py](run.py). It sets the exact work directory, immutable image, tools and task-local temporary paths. Use the persistent runner at its original path because its cache paths derive from that directory.

```bash
python3 -B /home/vrondelli/projects/domainspec-v2-o00-9832ee36-tools/run.py npm run verify:product
```

C01 must retain each phase's result and collect independent checks if the aggregate short-circuits; the phase DAG remains in `../p00-c00-9832ee36/test-phases.json`. A failed aggregate is never a blanket PASS.

For C02, choose a new output directory whose parent exists:

```bash
python3 -B /home/vrondelli/projects/domainspec-v2-o00-9832ee36-tools/run.py npm run recipe-qualification:l1 -- --output-root /home/vrondelli/projects/domainspec-v2-o00-9832ee36-tools/qualification-c02
```

These commands are handoff instructions, not evidence that they ran. The environment uses host networking for local PostgreSQL loopback and access to the Docker daemon. Temporary paths are identical inside and outside the container, as required by the Terraform adapter. No application, cloud resource, release or deployment was started.

## Frontier

- **Next compiler work:** C01 and C02, using the pinned source and runner.
- **Other ready product work:** E00, R00, U00 and L00.
- **Operational residue:** hosted evidence/release, EVF distribution, stale status views and deployment retain their separate owners.

[receipt.json](receipt.json) binds this result to C00 and the exact output files. Recheck source and tool bindings before reuse; this environment is not an approval or admitted execution state.
