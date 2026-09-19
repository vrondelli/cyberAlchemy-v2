# Binding candidate fixture - positive

## Concept Registry
| Concept | Type |
| --- | --- |
| ExampleBinding | Binding |

## ExampleBinding
| Attribute | Value |
| --- | --- |
| mode | fetch |
| target_kind | Query |
| target_ref | GetPlayers |
| trigger | filter-change |
| parameter_mapping | ui.filter->query.filter |
| result_mapping | result->PlayerView[] |
| cache_key | players,filter |
| invalidation | player-write |
