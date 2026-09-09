# Ontology Canvas Experiment Result

Status: **PASS**

The experiment demonstrates that the current digest-bound Workspace projection can be rendered as a clean, open ontology canvas with pan, zoom, minimap navigation, compact translucent nodes, redundant semantic icons, reversible one-hop portal scenes, exact-predicate relation colors, redundant line patterns, search, and click-to-expand detail without adding mutation authority.

## Observed surface

- 12 source-owned nodes
- 3 explicit external-reference placeholders
- 15 rendered canvas nodes
- 14 labeled relations
- Source epoch: `c044b617b61633708c17955f84750241f8e3525baa43fd256799ae2316f9d169`

## Verification

- Deterministic fixture generation: PASS; two consecutive generations produced `d35f60136c2fc7b4ecda250d89cef664f3729c002e583f8d3a8fff19163cc8af`
- Source and experiment validation: PASS
- TypeScript typecheck: PASS
- Unit tests: PASS, 6 of 6
- Production build: PASS
- Real-browser proof: PASS, 18 of 18 checks
- Desktop, expanded-detail, and mobile screenshots: captured
- Non-local browser requests: none observed
- Browser console and page errors: none observed

During validation, two defects were found and repaired inside the experiment: missing React Flow handles prevented edges from rendering, and an absent favicon produced a browser-console 404. The final proof includes both corrections.

## Relation-encoding evidence

The revision translates the candidate rule in
`development/ontology-evidence-workbench-semantic-navigation/design/UX-PLAN.md`
into a Workspace-local presentation table: every one of the ten exact
predicates has a unique stable color, while four experimental presentation
families supply redundant solid/dash/dot patterns. Predicate labels and arrow
markers remain present, so color is not the sole identity or direction cue.

- Hard browser checks: compact card geometry, exact-predicate legend coverage,
  distinct rendered colors, labels, arrows, interaction, containment, console,
  and network behavior
- Screenshot review: reduced card mass and clearer relation scanning at the
  desktop fixture
- Human-review residue: the run does not prove color memorability,
  comprehension, preference, workload, or real-user task success

## Portal and icon evidence

Selecting one node derives a presentation-only scene from that node and its
exact incident relations. For the primary browser witness, the selected
Product Capability produces 8 bright nodes and 7 bright relations; the other
7 nodes and 7 relations remain loaded but dark. `Show all loaded graph`
reverses the scene and restores focus to the graph heading.

Every rendered node retains a visible source `kind` alongside a redundant
outline icon. Icon selection is conservative: exact local kinds own the base
mapping, and the `Ontologies` label receives an experimental factory cue while
remaining visibly typed as `Collection`. This does not define a canonical
ontology icon vocabulary.

- Hard browser checks: icon coverage and text redundancy, one-hop counts,
  outside-scene darkness, keyboard selection, full-graph reversal, and focus
  restoration
- Screenshot review: portal origin, neighbor scene, scope bar, and icons are
  visually distinct at desktop and contained at the narrow fixture
- Human-review residue: icon interpretation, portal discoverability,
  comprehension, and preferred darkness level are not proven

## Claim ceiling

This is local candidate UX evidence against two digest-bound Workspace projection files. It does not adopt a Product Capability, admit ontology records, prove accepted Workspace implementation conformance, authorize semantic mutation, publish, release, or deploy anything.
