# Ontology Evidence Workbench

This directory owns the standalone candidate-local frontend for inspecting the
Body War business ontology. The browser admits the exact graph, evidence
sidecar, and adapter receipt before rendering any ontology state.

## Run locally

Use the pinned package manager from this root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The direct Vite application is `index.html` -> `src/web/main.tsx`. It starts on
a four-node bounded scene; labeled portals disclose connected areas without
mounting all 237 nodes. Relation color is stable per source predicate and is
always paired with text, direction, and a legend.

Validation:

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm test:standalone-browser
pnpm audit:active-frontend
```

The older upstream workspace, patches, locks, build outputs, and Node harness
remain historical evidence only. Commands prefixed `historical:` and
`test:legacy` are not frontend prerequisites.

## Claim boundary

This is a read-only candidate projection. Passing local tests does not promote
an ontology, execute DomainSpec, prove source-backed geometry or score
authority, publish, deploy, release, or establish production readiness.
