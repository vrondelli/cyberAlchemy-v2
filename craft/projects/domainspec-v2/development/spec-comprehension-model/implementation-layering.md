---
node_type: implementation-layering
is_session: false
status: candidate
created: 2026-07-02
authored_by: invoke (mode: plan)
work_pack: ./WORK-PACK.md
define: ./DEFINE.md
design: ./DESIGN.md
---

# Spec Comprehension Model — Implementation Layering

**Layer-boundary heuristic:** each layer lands **one move** AND proves it with a **measured stall-drop**
in the novice-test treatment re-run + a **green validator** (no regression). Value rises as author
confusion measurably falls at named points. **Promotion requires the prior layer's targeted stall to have
dropped** — preference is not evidence.

| Layer | Slice | Minimum working unit | Promotion evidence |
| --- | --- | --- | --- |
| **L0 — data intake** | consume Package A's `stall-dataset.md` | the ranked stalls mapped to M1–M4; move order fixed | the top stall-class names L1's move; order recorded in WORK-PACK; no move starts before this |
| **L1 — top-stall move** | the data-decided move (likely **M2** or **M1**) | that move landed on the highest-ranked stall's target | treatment re-run: that stall-class drops; `validate:*`+`tools:test` green; no new stall-class |
| **L2 — remaining discrimination/vocab moves** | the rest of {M1, M2, M3} | each landed in stall-rank order | each: its targeted stall-class drops in the re-run; validators green |
| **L3 — target-state** | **M4** template + oracle | one real target-state authored with the template | the `target-state` stall-class drops; the oracle discriminates DONE vs NOT-DONE on a real example |

**Dependency order:** **L0 ← Package A L0 output** (the coupling) → L1 → L2 → L3.
**Recomposition:** L0–L3 green ⇒ the surface is measurably more comprehensible at the predicted points,
by *distillation + surfaced examples*, with the type system and validators unchanged ⇒ the owner's goal
("understand the proposed abstractions of a new spec") is served **and measured**, not asserted.
**Boundary carried down:** public surface only; fixtures stay the single validator source; UI edges
intact; no engine δ-rules. A move that can only pass by weakening a validator is FALSIFIED, not shipped.
