# Disposable validation worker

`packages/coding-agent-runtime/owned-container.mjs` wraps the existing sandbox with explicit ownership and cleanup. `runOwnedContainer({config, repository_root, command})` returns the sandbox result plus a separate cleanup record. The image remains digest-pinned and local; no network or image pull is allowed by the underlying sandbox. Only a generated container name is removed. Output is capped during CLI execution, and cleanup/absence checking each have a ten-second deadline. A cleanup failure prevents an overall passing result. No host-execution fallback exists.

The standalone runner packages minimal read-only inputs and executes the six declared proposals with the already-installed Node 26.8.1 image. It first forces a one-second timeout to test container cleanup, then uses 120-second limits for six validations. Each worker caps memory at 512 MiB, CPU at two, and PIDs at 64. These caps do not reserve capacity or isolate performance from the host.

```sh
/path/to/node-26.8.1 isolated-validation-run.mjs /path/to/fresh-output-directory
```

The runner uses the retained corrected/unchanged proposals declared in its manifest; it makes no model calls and applies no patches. Candidate source and public-plan hashes bind the returned validation. Child expected values remain in the trusted parent comparison process. All temporary input files are removed after cleanup. The explicit feedback runner now integrates `container-public-validation.mjs` at both validation points under v3. Original and remapped plan hashes are retained and checked; unconfirmed cleanup stops the run. See the [integrated result](evidence/container-feedback-2026-09-08/README.md).

## Open Questions

Owned by the [result report](evidence/isolated-validation-2026-09-08/README.md#open-questions): integration, sustained pressure and actual capacity reservation remain unproven.
