# Plan Template Selection

## Inventory result

- Mode: lookup
- Machine index: ready, 0 failures, 111 tag warnings
- Selected evidence: approved OEW runtime rebuild lessons plus current Design
- Inventory writes: none

## Eligibility

| Template | Required/eligible because | Decision |
| --- | --- | --- |
| standalone implementation layering | every Plan requires L0–L3 decisions | selected |
| standalone work pack | every Plan requires the executable source of truth | selected |
| DomainSpec execution pack | five tasks, four SWUs, protected boundaries, and multiple waves exceed low complexity | selected |
| split task and wave files | medium complexity | selected |
| new template family | no unsupported shape exists | rejected |

No eligible tie exists. Complexity is medium: four sequential mutation units,
five tasks, protected state namespaces, and more than two artifacts, but no
cross-team mutation, irreversible migration, or production
rollout risk.
