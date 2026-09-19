---
node_type: reference
is_session: false
status: candidate
created: 2026-07-02
authored_by: task-session
purpose: REVIEWER-ONLY. The typing coverage task.md is designed to force. NEVER give this to the novice — it telegraphs the answers.
history: moved here 2026-07-02 after it leaked (inside task.md) into the baseline blind run and partly contaminated stall S6.
---

# Reviewer-only — coverage `task.md` is designed to force

> **Historical baseline notice (2026-07-11):** Saga-specific coverage below
> documents the frozen pre-collapse instrument and is not a current task
> requirement.

Do **not** show this to the novice. It exists so a reviewer can confirm the task exercises the surface.

The CampusRead brief is built to force:
- **≥3 identity-bearing concepts** (Patron, Copy, Loan) → Entity.
- **an equal-by-value concept** (the late fee) → Value Object (explicit "don't track a fee's identity").
- **a boolean gate** (the borrow limit — "blocks or allows") → Rule, **vs a strategy choice** (return
  routing — "chooses… configured differently") → Policy. *(the Rule≠Policy discrimination)*
- **a lifecycle with transitions** (the loan: requested→active→returned/overdue) → State Machine,
  **vs a flat set** (patron type, routing method) → Enum. *(the State-Machine≠Enum discrimination)*
- **a multi-step process** (return) → Workflow, **vs a cross-boundary process** (cross-branch
  reservation) → Saga. *(the Workflow≠Saga discrimination — note: this is exactly the contrast the leak
  telegraphed; keep it out of task.md)*
- **things-that-happened** (book returned, fee assessed) → Event.
- **≥2 typed relationships** (a rule enforcing an operation; an operation producing an event; …).
- **a checkable target-state** (a "settled" loan).

If a future edit to `task.md` drops one of these, the task no longer exercises that slice of the surface.
