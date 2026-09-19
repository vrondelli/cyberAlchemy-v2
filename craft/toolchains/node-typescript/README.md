# Node and TypeScript Toolchain

This directory is the parent repository's single Node/TypeScript toolchain
authority. It pins the Node container by digest, pins the compiler and package
manager versions, and supplies shared Node and browser TypeScript profiles.

Node applications compile with `tsc` and execute emitted JavaScript with Node.
Browser applications use `tsc` as the type authority and their framework as the
bundle authority. Direct TypeScript execution is transitional only.

```bash
toolchains/node-typescript/bin/node-env build-image
toolchains/node-typescript/bin/node-env validate
toolchains/node-typescript/bin/node-env doctor
toolchains/node-typescript/bin/node-env install --project projects/auth-user-management
toolchains/node-typescript/bin/node-env run --project projects/auth-user-management -- pnpm test
```

Dependency packages live in lockfile-digest-keyed Docker volumes. npm and pnpm
content caches are shared Docker volumes; the host checkout does not need a
`node_modules` directory. When both supported lockfiles are present, the exact
`packageManager` field selects the active dependency authority; without that
field, dual locks remain a fail-closed error.

The active parent workspace and each independently versioned private submodule
have one pnpm lock and one current module volume. Superseded lock-digest volumes
are cleanup artifacts, not dependency authorities. `node-env` removes the empty
checkout mount-point directories after every run.

The image also carries the repository's offline Python YAML and JSON Schema
helpers so Node validators that delegate schema checks run in the same stable
container. Python is supporting validation machinery, not the application
runtime authority.

When the repository's shared Playwright package and browser cache are present,
`node-env` mounts both read-only at `/opt/shared/playwright` and
`/ms-playwright`. Override their host locations with
`DOMAINSPEC_PLAYWRIGHT_ROOT` and `DOMAINSPEC_PLAYWRIGHT_BROWSERS_PATH`. The
image contains the Debian browser libraries, but no duplicate Playwright npm
package or Chromium download.

`node-env doctor` reports migration drift without failing. Add `--enforce` once
all active packages have crossed their wave gates. The exact active, excluded,
protected, and first-cleanup paths live in `migration-inventory.json`.
