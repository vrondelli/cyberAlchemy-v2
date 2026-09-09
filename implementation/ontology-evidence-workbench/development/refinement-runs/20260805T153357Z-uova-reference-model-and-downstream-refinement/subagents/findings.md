# Review Findings

| Finding | Severity | Disposition | Repair evidence |
| --- | --- | --- | --- |
| one semantic owner and exact-ID resolver | critical | KEEP | `ARCHITECTURE.md` |
| v1/v1.1 mismatch needs successor contract | critical | KEEP + FIX | `KNOWLEDGE-SCENE.v1.2.schema.json` |
| facet must not become copied payload | major | KEEP | facet remains an index role |
| reference-first Portal/Path/navigation | major | KEEP | v1.2 compositional schema |
| original schema was not a scene schema | critical | FIX | split reusable definitions from scene composition |
| static snapshot lacked endpoint/traversal fallback | critical | FIX | endpoint labels, traversal fields, nullable cues |
| digest laws were deferred | major | FIX | `DIGEST-AND-MIGRATION-LAWS.md` |
| legacy scene could self-certify | major | FIX | authoritative SourceGraph/ViewPack comparison required |
| bare Node failure is a product regression | minor | REFUTED | plan must bind the owned loader |
| candidate C requires a second facet record | major | REFUTED | selected C is B payload plus revision/index law |

All surviving change requests are represented in the repaired design or reserved as
explicit plan/acceptance obligations. Product readiness remains unclaimed.
