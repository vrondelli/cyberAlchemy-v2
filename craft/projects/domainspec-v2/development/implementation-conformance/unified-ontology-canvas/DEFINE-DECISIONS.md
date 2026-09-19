# Define Decisions

| ID | Decision | Rationale | Revisit trigger |
| --- | --- | --- | --- |
| DEF-D01 | One persistent graph replaces lens-specific graph reconstruction. | Directly matches the user's request and preserves cross-layer traceability. | The source bundle becomes too large for bounded browser rendering. |
| DEF-D02 | Use five ordered semantic bands. | Makes the ontology-to-finding chain legible without collapsing layers. | User testing shows another ordering is consistently clearer. |
| DEF-D03 | Deterministic layout before auto-layout. | Stable mental map, repeatable fixtures, and no new dependency. | Graph size/edge routing exceeds the deterministic scheme. |
| DEF-D04 | Filters are visibility/focus state over one graph. | Avoids hidden semantic graph replacement. | Never; changing this reopens the feature definition. |
| DEF-D05 | Preserve current JSON contracts in the first implementation slice. | Isolates presentation risk from ontology/data migration risk. | A required bridge cannot be expressed from current explicit fields. |
| DEF-D06 | UX companion is mandatory. | Navigation, reading order, focus, recovery, and accessibility semantics change. | Not applicable. |
