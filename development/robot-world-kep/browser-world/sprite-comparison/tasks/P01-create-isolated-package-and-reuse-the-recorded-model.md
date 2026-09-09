# P01 — Create isolated package and reuse the recorded model

Lane: **product-construction**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-IMPLEMENT.
Dependencies: P00, O01. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/P01-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `CONTRACTS.md#c1--directory-and-source-ownership`
- `CONTRACTS.md#c2--package-contract`
- `design/implementation-contract.md`
- `runs/<run-id>/environment.json`
- `../app/package.json`
- `../app/tsconfig.json`
- `../app/vite.config.ts`
- `../app/src/session.ts`
- `../app/src/playback.ts`
- `../app/tests/session.test.ts`
- `../app/public/session/session.json`
- `../app/public/session/session-manifest.json`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `app/package.json`
- `app/package-lock.json`
- `app/tsconfig.json`
- `app/vite.config.ts`
- `app/index.html`
- `app/.gitignore`
- `app/README.md`
- `app/src/main.tsx`
- `app/src/App.tsx`
- `app/src/style.css`
- `app/src/env.d.ts`
- `app/src/session.ts`
- `app/src/playback.ts`
- `app/tests/session.test.ts`
- `app/public/session/session.json`
- `app/public/session/session-manifest.json`
- `app/node_modules/**`
- `app/dist/**`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Create only the new private app. Use C2's exact dependency versions and O01's port. Write real package scripts, strict TypeScript, Vite config and a small React root that reports fixture load/error honestly.

2. Copy the two model modules, two fixture files and controller test byte-for-byte with their original relative layout. Record old/new hashes; no validation changes are allowed in this packet.

3. Install the exact new package dependencies to create a lockfile. Do not install Babylon, duplicate Phaser type packages, servers or multiplayer frameworks.

4. Keep the initial App minimal: validate the session and make it available for the renderer bridge. It may show a preparation state; it must not claim the scene is ready.

5. Run the inherited tests and production build. Document the actual launch command and ignore node_modules/dist locally. Leave all parent app files unchanged.

## Decisive checks

- All five reused files are byte-identical to their source.
- Inherited five test groups pass, including negative cases and the two final revisions.
- TypeScript/Vite build exits zero.
- New lockfile pins Phaser 3.90.0; no Babylon/GLB runtime dependency.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

An isolated buildable React/Phaser package loads the exact recorded fixture.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **P02 or P03**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
