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

# Novice-Witness Test — Implementation Layering

**Layer-boundary heuristic:** each layer makes one more part of the measurement real. Value rises as the
stall-dataset becomes producible → reproducible → human-validated. **Promotion requires the prior layer's
output to exist and discriminate** (a dataset with classified, mapped stalls — not a blob).

| Layer | Slice | Minimum working unit | Promotion evidence |
| --- | --- | --- | --- |
| **L0 — instrument + baseline** | the task + blind novice prompt + stall schema + **one** baseline agent run | a ranked `stall-dataset.md` exists | ≥5 distinct stalls captured; each has a class + `what_was_missing` + a stall→move mapping; blindness attested; agent≠human caveat present |
| **L1 — treatment harness** | the re-run recipe (identical task, updated surface) | one treatment run reproduces the protocol on a changed surface | a treatment dataset is produced and a stall-delta vs baseline is computed |
| **L2 — human witness (deferred)** | the human protocol | one person authors the same task | a gold-standard human comprehension datapoint, kept separate from agent numbers |

**Dependency order:** L0 now → L1 (couples to Package B moves) → L2 (deferred).
**Cross-package handoff:** L0's `stall-dataset.md` is the **input to Package B L0** (`spec-comprehension-model`).
**Boundary carried down:** the agent arm is a structural pre-test; only L2 supports a human-comprehension
claim; no engine δ-rules; UI-11 out of scope.
