# O01 — Verify local toolchain and asset/browser tooling

Lane: **operational-support**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-IMPLEMENT.
Dependencies: none. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/O01-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `VALIDATION.md`
- `../app/package.json`
- `../checkpoints/B1/v1/environment.json`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `runs/<run-id>/environment.json`

Operational effect is limited to stages: P01, P02, T01, T02.

Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Identify a working Linux node/npm pair; the known Node path is in VALIDATION.md. Record resolved binaries, versions, available disk and package-cache location. Do not replace system Node or repurpose system environment variables.

2. Check 16341 and then 16342 for a free loopback port. Record the selected port without killing or changing the existing 16340 service or other listeners.

3. Verify the installed Playwright skill/CLI and a real headed Chrome or Edge executable. Read its instructions before use; give the comparison its own named session.

4. Discover the available imagegen tool and read its skill when applying it. Record whether raster editing can run and where returned files can be saved. Do not claim assets are available from tool discovery alone.

5. Check the CLI's video helper. If it is missing, report the exact helper, resolved cache destination and bounded setup command to the coordinator. This packet only writes environment evidence; any helper installation first gets an exact announced operational write scope from the coordinator, using existing session authorization where applicable. Avoid broad environment reinstallations.

## Decisive checks

- Resolved Node/npm paths belong to the same usable Linux toolchain.
- Browser, raster and video capability states are separately recorded as available or not_evaluable.
- Selected port ownership is recorded; no prior process was stopped.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

P01 has a concrete package toolchain and later art/browser work knows its exact environment gaps.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **P01**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
