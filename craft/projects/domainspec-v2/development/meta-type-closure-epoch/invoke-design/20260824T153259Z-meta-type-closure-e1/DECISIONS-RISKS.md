# Decisions and Risks — WP-MTC-001 Design

## Decisions

The ten architecture decisions are recorded in `ARCHITECTURE.md`. None invents a new product semantic choice: RQ1 and D04 are consumed as owner decisions; all other decisions constrain the closure workflow.

## Risks

| Risk | Control | Residual owner |
| --- | --- | --- |
| untracked predecessor bytes disappear from staged view | freeze exact present/absent and Git-state inventory before repair | meta-type contract owner |
| semantic rebind widens beyond `queries → reads` | exact target list plus negative unrelated-delta fixture | Operation contract owner |
| FMP repair stretches old acceptance | new postimage inventory and renewed Rondelli/Victor requests | primary and second owners |
| unrelated full-regression failures prevent green | classify but never waive; candidate remains blocked | validation owner |
| Workflow D04 exposes a real representation gap | stop with a new bounded candidate rather than silent mutation | Workflow contract owner |
| APE findings inflate closure scope | evidence-class validator and explicit exclusions | APE profile owner |
