---
node_type: reference
is_session: false
status: candidate
created: 2026-07-02
authored_by: task-session (SWU-A1)
purpose: the FIXED authoring task for the novice-witness test — identical across baseline and treatment arms.
note: deliberately written in plain product language. It contains NO DomainSpec vocabulary. The novice must do all the typing.
---

# Authoring task — "CampusRead" book lending

You are given a product brief for a small feature. Turn it into a **DomainSpec aspect file** using only
the DomainSpec spec surface provided to you. Do not consult anything outside that surface.

## The product brief (as a product manager wrote it)

CampusRead is a university library app. This feature covers **borrowing and returning physical books**.

1. **People.** A **patron** has a campus account (a student or staff member). We need to know who they are
   across visits, and see their borrowing history.
2. **Books.** The library owns many **physical copies**; each copy has a printed **barcode** and belongs to
   an abstract **title** (e.g. three copies of *Clean Code*). Two copies of the same title are
   interchangeable except for their barcode and condition.
3. **Borrowing.** A patron **borrows** a specific copy. We record a **loan**. The standard loan length is
   **14 days**. A loan moves through: *requested → active → returned*, and can become *overdue* while
   active. We want the borrowing history to survive after the book comes back.
4. **A borrowing limit.** A patron **may not borrow** if they already have **unpaid late fees over $10**.
   This must be checked at the moment they try to borrow, and it simply blocks or allows.
5. **Late fees.** When a book is returned late, we compute a **fee**: an amount of money (e.g. `$4.50 USD`).
   Two fees of the same amount and currency are the same fee — we don't track a fee's identity.
6. **Returning.** The return process: scan the copy → check its condition → if late, assess a fee → mark the
   copy available again → notify the next person who reserved that title. This is a multi-step process.
7. **Routing returns.** When a copy is returned to a **different branch** than it belongs to, the system
   **chooses** a routing method (inter-branch van, courier, or hold-at-branch) based on distance and cost.
   Different libraries configure this choice differently.
8. **Reservations across branches.** A patron at the North branch can reserve a title held only at the South
   branch; fulfilling that reservation coordinates steps **across both branches**.
9. **Notifications.** Other parts of the system react when a book **is returned** and when a **fee is
   assessed** — they should be told these things happened.
10. **"Done" for a loan.** We say a loan is **settled**. Describe what "settled" means concretely enough
    that someone could check whether a given loan is settled or not.

## What to produce
- A DomainSpec aspect file that types every concept above (people, books, copies, titles, loans, fees,
  the loan lifecycle, the borrowing limit, the return process, the routing choice, the cross-branch
  reservation, the notifications) and declares the relationships between them.
- A statement of the **target-state** for a settled loan (item 10).

<!-- Reviewer-only coverage audit moved OUT of this file to task-coverage-audit.md (2026-07-02):
     it leaked intended type contrasts to the blind novice (contaminated stall S6). This file is the
     ONLY doc the novice reads, so it must contain the brief and nothing that telegraphs the typing. -->

