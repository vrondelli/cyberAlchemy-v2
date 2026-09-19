# TASK-FMT-GENERATE

- Layer: `L3` · Wave: `W3-GENERATE`
- Units: SWU-FMT-010, SWU-FMT-011, SWU-FMT-012, SWU-FMT-013, SWU-FMT-014
- Authority effect: none

## Intent

Promote comments to typed fields and generate the human cards, making drift structurally impossible.

## Boundary

Task Session owns one unit at a time. Closeout mutation is owned by Invoke Refresh.
No unit in this task may select, admit, or execute its successor.
