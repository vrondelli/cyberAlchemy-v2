# Guide discovery and canvas expansion

Status: implemented and verified locally. No deployment or release claim.

## Objective and scope

Make the newer ARE documentation discoverable through user goals while preserving the canvas reading experience. The documentation picker is navigation; each selected guide is a movable React Flow node. Full-page reading remains an explicit action.

Construction basis: current owner request, `CA2-ROUTE-IMPLEMENT`, native bounded local changes under CAV2-D65. This is construction evidence, not admitted governance execution. Changes cover the documentation site, its reviewed projection, and local tests. Engine behavior and saved lessons are unchanged.

## Content review

The [manual manifest](../../../implementation/agent-reasoning-engine/docs/manifest.json) contains 41 entries. The [projection allowlist](../../../keld-project/are-documentation/scripts/build-documentation.mjs) now exposes nine guides, up from five. Four additions fill distinct reader needs:

| Reader need | Source | Canvas connection |
| --- | --- | --- |
| Connect an agent | [Gateway and agents](../../../implementation/agent-reasoning-engine/docs/GATEWAY-AND-AGENTS.md) | Agent and permissions |
| Follow a request or correction | [Workflows](../../../implementation/agent-reasoning-engine/docs/WORKFLOWS.md) | Goal, next step, and results |
| Understand saved corrections | [Interaction context](../../../implementation/agent-reasoning-engine/docs/capabilities/MANAGE-INTERACTION-CONTEXT.md) | Context and working memory |
| Operate and recover | [Operations and security](../../../implementation/agent-reasoning-engine/docs/OPERATIONS-AND-SECURITY.md) | Permissions, results, and memory |

The interaction guide is labelled “Prototype · off by default” both in the card and full reader. The gateway guide retains its adapter and local-transport limits. Original guide bodies and SHA-256 source receipts remain in the generated projection. Nested document links now resolve relative to their source document. References outside the allowlist remain explicitly unavailable.

The other 32 entries remain inventoried and withheld. In particular, architecture includes umbrella-specific release material, and standalone installation/deployment requires delivery prerequisites. This change does not treat every internal manual as ready for public use.

## Reader experience

- Four ordered reading paths: understand a request, connect an agent, manage memory and corrections, and operate the engine.
- Every guide has separate “Open in canvas” and “Read full guide” links.
- The canvas has a searchable “Add a guide” picker. Its search state stays in an isolated component rather than updating the graph.
- Opening a guide preserves existing cards and their positions. Reopening focuses the existing card instead of duplicating it.
- Unknown guide routes show an explicit message.

```mermaid
flowchart LR
  A[Review manifest and source guides] --> B[Expand reviewed projection]
  B --> C[Add goal paths and guide picker]
  C --> D[Verify canvas and mobile behavior]
  D --> E[Measure scrolling with all nine guides]
  E --> F[Record results and remaining work]
```

## Verification

- Production build, TypeScript, and projection freshness checks passed.
- Nine workspace/persistence unit tests passed.
- [Browser proof](../../../keld-project/are-documentation/evidence/canvas-docs/results.json): 44 checks passed, including mobile picker use, guide links, duplicate prevention, status labels, retained positions, storage failure, and full-page return.
- [Expanded performance run](../../../keld-project/are-documentation/evidence/performance/expanded.json): six scenarios passed, one repetition each: desktop 1/3/5/9 cards and mobile 5/9 cards. Every measured scroll produced zero App/card renders, zero Markdown reparses, two storage writes, no canvas remount, and no viewport movement. Article return and drag checks also passed.
- [Performance contract](../../../keld-project/are-documentation/PERFORMANCE.md) now includes the full corpus by default; `--legacy-five` preserves historical comparison scenarios.

The new bundle is approximately 582 kB minified / 190 kB gzip. Vite's existing 500 kB advisory remains visible. Timing observations on this shared headless host are not device performance guarantees. This expansion run is a bounded regression check, not a repeated statistical study.

## Download follow-up

The initial download was subsequently reduced and per-route budgets are now enforced by the build. See [download targets and evidence](DOWNLOAD-BUDGET.md). The bundle figures above describe the expansion before that optimization.

## Open Questions

- Which of the remaining 32 manual entries should be public, customer-only, or internal?
- Should article bodies and the introduction be loaded separately before the corpus grows again?
- Does the guide picker remain convenient on narrow screens as more guides are added? Automated checks establish operability, not reader preference.
- Do first-time readers complete these reading paths successfully? A reader study remains open.
