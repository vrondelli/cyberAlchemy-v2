# TASK-FMT-CHECKS

- Layer: `L0` · Wave: `W0-CHECKS`
- Units: SWU-FMT-001, SWU-FMT-002, SWU-FMT-003
- Authority effect: none

## Intent

Emit three dependency-free checkers that make both defects visible without changing any existing repository content.

## Boundary

Task Session owns one unit at a time. Closeout mutation is owned by Invoke Refresh.
No unit in this task may select, admit, or execute its successor.
