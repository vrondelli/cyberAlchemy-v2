# Strict Context Pack — OEW 013B Effective Build Order

Status: **PASS**

This is persisted run evidence for one private Invoke Refresh. It is not a
canonical planning source.

## Task

Resolve only `SWU013B_EFFECTIVE_BUILD_ORDER_UNBOUND` by binding the exact
pinned Understand Anything core build after the frozen `--ignore-scripts`
install and before dashboard Vitest. Do not execute the build.

## Obligations and Evidence

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| ORDER-OEW-01 | prove the exact blocker | attempt-002 receipt, build attempt, continuation | covered |
| ORDER-OEW-02 | bind the intended equivalent lifecycle command | pinned archive root package and prepare script | covered |
| ORDER-OEW-03 | bind root/core/dashboard bytes and core outputs | archive plus live lock and UPSTREAM lock | covered |
| ORDER-OEW-04 | close command order and producer evidence | live lock, core exports, dashboard dependency | covered |
| ORDER-OEW-05 | keep the repair minimal and owned | work pack, manifest, chain, continuity | covered |
| ORDER-OEW-06 | fail closed on all named negative cases | attempt receipt and lock negative witnesses | covered |
| ORDER-OEW-07 | preserve frontier/package/budget ceilings | manifest, chain, continuity, package registry | covered |
| ORDER-OEW-08 | preserve authority and lifecycle ceilings | attempt closeout, work pack, lock claims | covered |

## Exact Pinned Members

- Root `package.json`: SHA-256
  `5bab7c02882423ae7448a3bf1b1a3f908922f7cbb0158e04bb51bfda0e3ccdd0`,
  1,898 bytes; `prepare` is
  `pnpm --filter @understand-anything/core build`.
- Core `understand-anything-plugin/packages/core/package.json`: SHA-256
  `00c8c100bc2e8a266699a1076dbb77c1f2a16ed63bb00c5dbacf90117844e805`,
  1,714 bytes; name `@understand-anything/core`; `build` is `tsc`; published
  imports resolve from its `dist` export map.
- Dashboard package: SHA-256
  `e0d64356b36013371d98f97d8b9ad389405c6995ce0a814b17cb51f1e5299bf6`,
  1,218 bytes; it depends on `@understand-anything/core: workspace:*`.

## Closed Mutation and Non-Goals

The admitted targets are the private L1 build lock and the minimum seven
Plan/route projections. The generalized frontier validator and the only
package root remain unchanged. Build execution, implementation sources,
browser work, L2, public Arcanum, authority, publication, release, and
production are excluded.

Strict coverage: **8/8 obligations covered; no gaps or contradictions.**
