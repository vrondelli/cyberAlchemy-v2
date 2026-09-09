---
tags: [ontology, vault, visualization, ccb]
node_type: spec
is_session: true
layer: [ontology, domain]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T13:19:00-03:00
expires: 2026-05-19
conversation_id: df036658-3294-4b7a-ab91-2840bcd50a04
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/empresa-geradora-discovery.md"]
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed graph visualization physics to properly handle central gravity compaction and improved 3D labels."
---

# Graph Physics Tuning & Label Polish

**Date:** 2026-03-20 13:19 (UTC-3)
**Tags:** #ontology #vault #visualization #ccb

## Summary

This session focused on fixing and polishing the Ontology Explorer's graph visualization, specifically addressing issues with node spreading and label readability in 3D mode. We first attempted to add a "Graph Spread" slider, but realized the existing ForceAtlas2 and Gravity parameters should handle compaction if implemented correctly. We fixed the ForceAtlas2 math so that increasing central gravity genuinely compacts the graph without inflating charge repulsion. We also significantly improved the 3D node labels by increasing their size, adding dark semi-transparent backgrounds, and disabling depth testing so they always render above the nodes. Separately, the `empresa-geradora-discovery.md` spec was updated to `in-progress` following parallel updates to the CCB template matching configuration.

### 3D Label Rendering Improvements
- **Problem/Goal:** 3D labels were too small, had no background contrast, and were frequently occluded by the node spheres themselves.
- **Decision:** Enhance `SpriteText` styling and rendering pipeline.
- **Changes:** Increased font size from 2.5 to 4, moved the label higher above the node (baseline radius + 6), added a dark background (`rgba(10,10,18,0.6)`), and disabled `depthTest` so labels render on top of all 3D geometry preventing occlusion.

### Physics Determinism & ForceAtlas2 Fix
- **Problem/Goal:** Setting the ForceAtlas2 Central Gravity higher actually spread the nodes out more, rather than compacting them.
- **Decision:** The formula was mathematically cancelling itself out because Central Gravity `δ` was scaling mass, which inflated charge repulsion simultaneously with radial pull.
- **Changes:** Changed ForceAtlas2 `mass` calculation to ignore `δ` (just using `degree + 1`). Then updated the radial strength in `setPhysics` to use `δ² / mass`. This ensures increasing `δ` strictly increases central attraction without changing repulsion.

### Fixing Gravity (G) Directionality
- **Problem/Goal:** The "Gravity (G)" slider was causing the graph to spread out when increased, which is counterintuitive.
- **Decision:** Wait, actually we reverted the previous failed attempt to invert G's math and instead renamed the slider to "Field Strength (G)" and updated the tooltip to accurately describe that it controls repulsion/differentiation, directing users to ForceAtlas2 for compaction.
- **Changes:** Renamed the UI element and updated tooltips.

### Empresa Geradora Status Update
- **Problem/Goal:** Parallel to the visual changes, the `template_matching_config.py` file was updated with `EMPRESA_KEYWORDS` patterns. 
- **Decision:** The discovery spec needs its status updated to reflect this active work.
- **Changes:** Updated `specs/002-ccb-validation-workflow/empresa-geradora-discovery.md` status from `Discovery` to `in-progress`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Fixed ForceAtlas2 compute logic, improved 3D label rendering (scale, background, depthTest), and clarified Field Strength tooltips. |
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | Added `EMPRESA_KEYWORDS` and `SUPPORTED_EMPRESAS` to map identifying regex patterns to their generating entity (parallel user edit). |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/empresa-geradora-discovery.md` | `modified` | Bumped status to `in-progress` reflecting the implementation of the `template_matching_config.py` patterns. |
