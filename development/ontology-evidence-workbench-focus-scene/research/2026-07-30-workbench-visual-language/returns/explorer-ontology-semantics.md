# Explorer return — ontology visual semantics

Agent: Ashby, W. Ross  
Action: `spawn-0002`  
Status: pass, read-only

## Core finding

The source model already separates the necessary semantic axes, while the current OEW projection loses some of them. The UI may encode only fields already present in the bundle or fields added through a lossless adapter extension.

`projects/body-war/ontology/business/profile.json#classification_axes` explicitly separates `concept_role`, `business_kind`, `candidate_status`, `authority_effect`, and `lifecycle_state`.

## Typed visual-semantics matrix

| Axis | Canonical source | Current OEW binding | Viable encoding | Non-collapse constraint |
|---|---|---|---|---|
| Business category | `nodes/*.json#/business_kind`; 17-value schema enum | node category, `business-kind:*` tag, sidecar `source_kind_original` | Always-visible exact text chip; optional deterministic icon decoration | It is project-local and is not CAV2 `node_type` |
| Node role | `nodes/*.json#/concept_role` | `concept-role:*` tag; partly collapsed into presentation type | Primary icon family keyed by exact role, with accessible text | Presentation `claim|source` is not the ontology role |
| Candidate state | `nodes/*.json#/candidate_status` | `candidate-status:*` tag | Text status badge and optional border pattern | Do not merge with lifecycle, confidence, or authority |
| Authority | package and source relation `authority_effect`; adapter effect | nodes expose `authority:none`; edge effect currently represents projection authority | Package trust treatment; add distinct `source_authority_effect` before per-edge use | Projection none does not reproduce source relation blocked/projection/none |
| Presentation relation | `relationProjection()` | edge `type`; sidecar `presentation_relation` | Small fixed color and line-pattern family | Name it presentation relation; it is coarse |
| Source predicate | relation `predicate` | edge `description`; sidecar `source_relation`; portal `sourceRelation` | Exact inline label in focus; keyboard/pointer-recoverable label elsewhere | Never replace it with the coarse type or color |
| Direction | source `direction` | projected forward/bidirectional; graph/portal direction | One- or two-ended markers plus `→`/`↔` text | Add `source_direction` before claiming full fidelity |
| Evidence status | confidence fields, source refs, relation evidence refs and projection diagnostics | node confidence absent; edge evidence and diagnostics partial | Separate text/badges for confidence, evidence, mapping loss, policy, and grounding | Evidence presence is not confidence; mapping loss is not validity |

## Card icons

Use `concept_role` as the primary icon family because it is an existing closed axis:

- `authority object` → owner/authority glyph
- `evidence object` → document/evidence glyph
- `workflow object` → process glyph
- `projection object` → view/projection glyph
- `residue object` → reserved fallback

The exact role remains accessible text or tooltip. `business_kind` remains an always-visible exact-value chip. A secondary kind icon is viable only as a deterministic mapping across all 17 schema values while retaining the label. Shared artwork may not imply shared ontology kind.

Bindings:

- Canonical: `projects/body-war/ontology/business/nodes/*.json#/concept_role` and `#/business_kind`.
- Current graph inputs: `presentation-graph.json#/nodes/*/tags`.
- Adapter: `src/body-war-adapter-writer.mjs#buildArtifacts`, lines 370–404.
- Renderer mapping: `0002-knowledge-focus-scene.patch`, node-construction hunk around lines 170–189.
- Fixture oracle: `generated/BODY-WAR-ONTOLOGY-001/presentation-graph.json#/nodes`.

## Edge grammar verdicts

| Alternative | Verdict | Reason |
|---|---|---|
| Unique color per individual edge | KILL | Arbitrary identity palette, no semantic owner, does not scale to 231, and lacks non-color redundancy |
| Presentation-relation color | KEEP as subordinate cue | Deterministic, but coarse; pair with line pattern and exact predicate text |
| Invented semantic groups | KILL | No canonical grouping axis |
| Line patterns | KEEP for presentation relation | Use a small stable set, not 23 predicate-specific patterns |
| Arrow markers | REQUIRE | Directly encode projected direction; retain textual arrows |
| Inline labels | REQUIRE in bounded scenes | Prefer exact predicate visually; qualify coarse type as presentation relation |
| Hover/focus labels | REQUIRE outside bounded scenes | Full graph cannot label all edges simultaneously, but exact names must be pointer and keyboard recoverable |
| Legend | REQUIRE | Separate presentation styles, predicates present in the scene, direction, and evidence/status cues |

Minimum grammar:

```text
edge identity     = sidecar.edges[*].source_ref
coarse style      = graph.edges[*].type / sidecar.presentation_relation
exact name        = graph.edges[*].description / sidecar.source_relation
direction cue     = graph.edges[*].direction + marker(s) + textual arrow
evidence details  = sidecar.evidence_refs + mapping_loss +
                    policy_disposition + grounding_inclusion + diagnostics
```

Current portal bindings already preserve the separation through `KnowledgeFocusPortal`, `evidenceForEdge`, `toPortal`, and the `data-presentation-relation`, `data-source-relation`, and `data-authority-effect` attributes.

## Required lossless adapter additions

Before encoding missing semantics, extend the sidecar:

```text
nodes[id]:
  concept_role
  business_kind
  candidate_status
  evidence_confidence
  commitment_confidence
  confidence_basis
  source_refs [{path, selector, sha256}]

edges[id]:
  source_direction
  source_authority_effect
  value_effect
  cycle_policy
  evidence_refs [{path, selector, sha256}]
```

Rename the existing adapter effect to `projection_authority_effect` to avoid collision with source relation authority.

## Semantic collapses to kill

- business kind = CAV2 node type
- concept role = presentation claim/source
- candidate state = lifecycle state, evidence confidence, or authority
- projection authority none = source relation authority
- relation identity = predicate
- presentation relation = source predicate
- edge color = edge identity
- arrow direction = predicate
- evidence-ref presence = confidence
- mapping loss = ontology validity
- shared icon artwork = shared kind
- legend = ontology authority or promotion

## Deterministic fixture evidence

- 237 nodes and 231 relations
- 17 business kinds
- roles: 135 authority, 32 evidence, 44 workflow, 26 projection
- candidate states: 165 reviewed-candidate, 31 candidate, 29 blocked, 12 deferred
- presentation relations: 72 `builds_on`, 159 `related`
- mapping loss: 72 generalized, 159 lossy
- all 231 current source relations directed
- source relation authority: 190 none, 34 blocked, 7 projection
- 23 source predicates

Residue: node confidence/full source selectors and several source-edge semantics are absent from the OEW bundle; icon artwork and token names remain presentation-owner decisions after the semantic keys are fixed.
