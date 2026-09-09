# Field Ownership Matrix

| Artifact / field | Physical posture | Meaning owner | Validation / resolution law |
| --- | --- | --- | --- |
| SourceGraph `source_relation_id` | stored canonical | SourceGraph | unique within graph revision; never tuple-derived |
| endpoints, `exact_predicate`, source direction | stored canonical | SourceGraph | schema validated and included in relation digest |
| evidence, mapping loss, authority effect | stored canonical | SourceGraph/source binding | inspector/static may project; never edit |
| current cue fields | stored compatibility input | SourceGraph until registry cutover | future registry compares exact-predicate derivation |
| ViewPack membership/destination | stored source-bound view data | ViewPack | exact graph digest; no relation semantics |
| scene internal/cut relation arrays | stored derived partition | scene compiler | lossless union over admitted source relations for scene denominator |
| `relationFacetsById` | derived immutable runtime index | scene compiler as index owner; semantic payload remains SourceGraph binding | exact object reuse, unique keys, totality, facet-set digest |
| `relation_index_receipt` | stored derived receipt | scene compiler | recomputable from partitions and bound to scene revision |
| Portal constituent ref | stored derived reference | portal builder | must resolve in exact scene; no predicate field owned |
| Portal inside/outside/traversal/destination | stored local | portal builder | endpoints agree with facet; traversal distinct from source direction |
| Portal `predicate_summary` | stored derived cache | portal projection | recompute from resolved constituent IDs; mismatch rejects cache |
| PathHop ref/from/to/traversal | stored local reference | Path service | ref resolves; endpoints/direction validate against facet |
| Path display predicate/evidence | resolved display | Path View Model | relation digest carried; no independent truth |
| NavigationFrame selection | stored interaction state | navigation reducer | exact ID plus scene revision; stale restores fail explicitly |
| predicate encoding | stored registry entry | encoding registry | keyed exact predicate; text required; color/pattern redundant |
| SceneGeometry relation sections | stored geometry | layout adapter | keyed exact ID and parent scene digest; semantics forbidden |
| renderer SVG path/label/marker | display projection | renderer | joins facet + encoding + geometry by exact ref |
| inspector row | resolved projection | inspector mapping | resolves canonical source binding and evidence |
| Full Index row | resolved projection | index mapping | SourceGraph/scene resolver; geometry-independent |
| static `RelationSnapshot` | stored detached projection | static serializer | relation ref + digest + schema; mismatch blocks artifact |
| Body War compiled relation | project-neutral adapter output | generic compiler | exact generic schema; no Body War semantic special case |

No row except SourceGraph owns canonical predicate, ordered endpoints, source direction, evidence, mapping loss, or authority effect.
