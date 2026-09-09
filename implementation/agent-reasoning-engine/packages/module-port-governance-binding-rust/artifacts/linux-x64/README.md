# Linux x64 packaged verifier candidate

This directory contains the exact locally built L7 release verifier and its
machine-readable manifest. The runtime cutover verifies both files before
execution and has no Cargo fallback.

Regenerate the candidate from the repository root with:

```sh
node implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/scripts/build-release-artifact.mjs
```

This local artifact is not a published release, deployment, external
installation, cross-platform claim, or effect authorization.

## Open Questions

- What distribution and signing envelope should be evaluated before any
  external installation or release decision?
