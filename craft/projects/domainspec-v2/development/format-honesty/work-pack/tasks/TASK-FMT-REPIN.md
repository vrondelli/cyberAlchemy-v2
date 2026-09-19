# TASK-FMT-REPIN

- Layer: `L2` · Wave: `W2-FORMAT`
- Units: SWU-FMT-006, SWU-FMT-007, SWU-FMT-008, SWU-FMT-009
- Authority effect: none

## Intent

Make every machine file honestly named, in one re-pin transaction, without disarming any oracle fixture.

## Boundary

Task Session owns one unit at a time. Closeout mutation is owned by Invoke Refresh.
No unit in this task may select, admit, or execute its successor.
