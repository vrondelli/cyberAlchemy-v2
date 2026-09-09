# Understand-Anything Upstream Baseline

Inspection date: 2026-07-27
Repository: <https://github.com/Egonex-AI/Understand-Anything>
Pinned commit: `2cda14e89535049e49120198886bc0b82e9e630f`
License: MIT

## Verified Source Facts

1. The repository describes a graph dashboard for codebases, knowledge bases,
   and documents, with search, guided tours, domain views, diff analysis, and
   persona-adaptive presentation.
2. Generated graphs are JSON. A standalone Node viewer can serve an existing
   graph locally, read-only, on loopback, with a one-time access token and no
   LLM call.
3. The dashboard stack at the pin is React 19, XYFlow, Zustand, Vite, graphology,
   d3-force, ELK, and Dagre.
4. The graph contract has a closed node/edge vocabulary. Knowledge types include
   `article`, `entity`, `topic`, `claim`, and `source`; knowledge edges include
   `cites`, `contradicts`, `builds_on`, and `exemplifies`.
5. That vocabulary does not include CyberAlchemy's exact `derives-from` or
   candidate `specializes` semantics. Direct projection is therefore
   intentionally generalized and cannot be the evidence source.

## Inspected File Digests

| Path at pin | SHA-256 |
| --- | --- |
| `README.md` | `b5f411781b131fd16cc712100dd5ffc3f97bb3e22a5aba5e2b14a549d42fc86a` |
| `LICENSE` | `24c4b35344840f1abaf3a3a4a44f5e29ee0e73b6bf25e42ef108e0afebd402bc` |
| `understand-anything-plugin/packages/core/src/types.ts` | `34ed1953e3fb688301457b2f240cddd7572e4e822c67230517e8d6c2b7290733` |
| `understand-anything-plugin/packages/core/src/schema.ts` | `e043d70c2d4485fe717ccee9eb54ad4e36256fdafc0713999e7b9b345bbc7c97` |
| `understand-anything-plugin/packages/dashboard/package.json` | `e0d64356b36013371d98f97d8b9ad389405c6995ce0a814b17cb51f1e5299bf6` |
| `understand-anything-plugin/packages/dashboard/src/App.tsx` | `91db4c86cc6ad515c5244cd34a4e0a3066d8709fbfa868f0629698160e9dc681` |
| `understand-anything-plugin/packages/dashboard/vite.config.ts` | `308cdd59979d43b3480169708c128534c87185d0861c1ac96b534b252e182919` |
| `understand-anything-plugin/packages/viewer/README.md` | `8c80d59d9f1a3a1936bc09ae971ff6d6f51d2535ca05e9d576702b1c84450db8` |

## Integration Decision

L0 will use an **unmodified viewer build from the immutable upstream pin** and
an OEW-produced compatible graph. L1 will use a small, explicit patch overlay
applied to the same pinned source during a reproducible build; it will not copy
private CyberAlchemy material upstream or make the upstream schema authoritative.

The implementation package will own:

- an upstream lock manifest with repository, commit, license, and file digests;
- a fetch/build verifier;
- an OEW patch overlay rather than an opaque fork;
- a compatibility test proving the patch applies to the pin;
- a new review gate for every upstream update.

## L1 Overlay Build Contract

L0's retained source and viewer archives are immutable inputs, not proof of an
L1 overlay build. Before any L1 feature SWU, the private OEW bootstrap must:

1. verify the retained L0 handle, upstream lock, Node bytes, and exact pnpm
   `10.6.2` bytes;
2. create a fresh digest-named workroot outside any workspace package graph;
3. declare either `online` or an independently admitted `isolated-store` mode,
   use the effective frozen lock, and forbid workspace/global fallback;
4. verify patch and overlay preimages, apply exactly once, record postimages,
   and reject drift or reapplication;
5. run dashboard Vitest and `tsc -b && vite build`;
6. emit an immutable build handle binding inputs, tools, mode, test/build
   results, output digest, protected equality, cleanup, and residue;
7. clean the workroot on every exit and let a distinct verifier recompute the
   retained evidence.

Rollback is deletion of the disposable workroot and rejection of its handle;
the immutable L0 pin/archive remains unchanged. No L1 run may silently replace
the active upstream lock or write into a repository/workspace dependency tree.

## Evidence Limits

This file records source inspection and an architecture pin. It is not proof
that the future build succeeds in this repository, that upstream remains
unchanged, or that its security/accessibility claims satisfy OEW. Those are
Plan witnesses.

Fresh `verify:upstream` validates retained L0 bytes only. It cannot satisfy the
L1 overlay, typed-build, browser, teardown, or independent-verifier contracts.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
