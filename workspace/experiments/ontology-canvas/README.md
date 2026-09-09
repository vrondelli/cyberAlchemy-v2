# CyberAlchemy Ontology Canvas Experiment

This package is a private, read-only product experiment. It asks whether the
current CyberAlchemy Workspace capability graph can become a clean open-canvas
map without turning the canvas into an ontology editor or authority source.

The experiment projects the exact `workspace/nodes.json` and
`workspace/relations.json` bytes named in `EXPERIMENT.json`. Missing relation
endpoints become visibly bounded external-reference nodes instead of being
silently dropped or invented.

The visual treatment follows the candidate relation-encoding rule documented
in `development/ontology-evidence-workbench-semantic-navigation/design/UX-PLAN.md`:
one stable color per exact predicate, redundant line patterns by presentation
family, visible predicate text, and arrow direction. The Workspace-specific
mapping is experimental and does not import Body War ontology meaning or
authority.

Selecting a node now opens a reversible one-hop portal scene: the origin and
its directly connected nodes and relations remain bright while all other
loaded graph elements darken in place. `Show all loaded graph` restores the
complete projection. Icons are redundant scanning cues keyed by the exact
local `kind`; ontology-labelled records use an experimental factory cue while
retaining their visible source kind.

## Hypothesis

A person can navigate the complete bounded graph, understand labeled
relationships, and disclose every available detail for a selected node while
the surrounding canvas stays visible.

## Run

```bash
pnpm install
pnpm run validate
pnpm test
pnpm run build
pnpm run preview -- --host 127.0.0.1
WORKSPACE_CANVAS_BASE_URL=http://127.0.0.1:<port> pnpm run browser:proof
pnpm run validate:proof
```

Generated evidence is written under `evidence/`. A passing experiment proves
only the behavior of this isolated projection against its digest-bound fixture.
It does not accept the Workspace capability, modify or admit an ontology,
register an implementation binding, prove product value, publish, release, or
deploy anything.
