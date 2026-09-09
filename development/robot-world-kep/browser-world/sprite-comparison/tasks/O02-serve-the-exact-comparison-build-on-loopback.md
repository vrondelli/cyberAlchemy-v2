# O02 — Serve the exact comparison build on loopback

Lane: **operational-support**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-IMPLEMENT.
Dependencies: P03, O01. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/O02-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `VALIDATION.md#commands-and-environment`
- `runs/<run-id>/environment.json`
- `app/package.json`
- `app/vite.config.ts`
- `app/README.md`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `runs/<run-id>/preview.json`
- `runs/<run-id>/checks/preview-*.json`
- `app/dist/**` (serialized build output only)

Operational effect is limited to stages: T01, G01, T02, G02.

Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Use the previously selected free loopback port; recheck ownership before starting. Do not stop the old B1 preview or any unrelated process.

2. Run the new app's production build and start its preview. Record process/session ownership, cwd, command, port and time. Join the build before opening the browser.

3. Request the URL, compare its served index and key asset bytes with dist, and open the actual bench view in the owned browser session.

4. Keep the preview running for G01 review. After G01 permits construction and P05/P06 change the app, refresh the production build before T02 and verify served bytes again.

5. Only stop processes owned by this run when replacing its server or when the user requests teardown. A missing old preview affects comparative measurements, not this server's validity.

## Decisive checks

- HTTP succeeds and serves the exact built candidate.
- Bind address is loopback only.
- Known process/session owner and current URL are recorded.
- Existing 16340 app and source files remain unchanged.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

The exact candidate has a verified reachable local preview for visual testing.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **T01**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
