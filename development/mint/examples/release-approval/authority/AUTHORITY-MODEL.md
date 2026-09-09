<!--
  GOLDEN FIXTURE — worked mint-act output (NOT a shipped repo). Hand-instantiated from
  templates/authority-model.md by the SWU-3 emit procedure for the `release-approval`
  process domain. Mint-act output state (criterion §5) = the commit including
  authority/decisions/2026-06-29-mint.md. Obs-A/B/C scored at THIS state in the
  task-session record.
-->

# Authority Model

Status: active local authority model
Owner: release-approval owner

## Purpose

This model decides what this standalone repository is allowed to claim while it
operates the **release-approval workflow** — the change-advisory process that decides
whether a proposed software change may proceed through its approval gates to production.

The model deliberately separates:

- the **change record** primary source (what a change request says about itself — its
  diff, blast-radius declaration, rollback plan);
- **repository-local method authority** — owned by *this repo's own* constitution
  (`constitutions/release-approval-CONSTITUTION.md`), NOT by any external framework;
- external evidence (incident history, related change-management corpora);
- local synthesis (a reviewer's reading of a change's risk);
- policy or implementation authority, which this repo does not own (the org's release
  policy and the deploy tooling live elsewhere).

> **Localization invariant (Obs-B, the precedent's leak — stripped).** Method authority
> (source posture, promotion discipline, non-collapse rules, authority separation) is
> owned **locally** by this repo's constitution + this model. **No external framework
> (including CyberAlchemy v2) is named as the method authority.** CyberAlchemy v2 appears
> ONLY as **harvested precedent (supporting source)** in `source-spine.md` — cited for
> provenance, never on a resolution path. This is the emit-time state; it does not require
> a later owner decision to become true.

## Core Rule

A reviewer can propose a change-class, a gate-set, an approval, or a hold. A reviewer
cannot release a change into production: release crosses an **external owner decision**
(the org's deploy authority), and only after the change's bound gate-set is satisfied.

## Authority Kinds

| Kind | Counts as | Owner route | Blocked use |
| --- | --- | --- | --- |
| Primary source | What a change request says about itself (diff, declared blast-radius, rollback plan). | The change record / PR system. | Treating a reviewer's reading as the change's own declaration. |
| **Change-class ruling** ⟵ *domain-originated (PROPOSED; owner-ratify)* | A standing classification of a change's blast-radius (`routine` / `significant` / `emergency`) that **binds which approval gate-set fires** for it. A function that maps an artifact to its required gate-set — neither a rule (constitution) nor a one-off choice (decision). | **`change-class-governance`** *(a new owner route: authors and maintains the class→gate-set mapping; NOT `constitution-governance` and NOT `decision-gate`)*. | **Default-deny: a change-class ruling may NOT itself approve a release, waive a gate it binds, or be self-assigned by the change author** (the class is ruled by `change-class-governance`, the gates fire from the class — the two are separated). |
| **Gate-set binding** ⟵ *domain-originated (PROPOSED; owner-ratify)* | The standing map from a change-class to the exact ordered approval gates that must pass before release (e.g. `significant → {security-review, two-approver, change-window}`). | **`change-class-governance`** *(same new owner route; the binding is the class ruling's enforced consequence)*. | **Default-deny: a gate-set binding may NOT be edited mid-flight for a change already in review, and may NOT route a gate to an approver who is the change author** (no self-approval). |
| Related evidence | Incident history, post-mortems, related change-management corpora. | Relevant evidence/incident route. | Treating one past incident as a general rule. |
| Local synthesis | A reviewer's repo-authored reading of a change's risk or a reviewer note. | Release-approval reviewer review. | Becoming policy by proximity; standing in for the change-class ruling. |
| Candidate gate rule | A proposed approval condition that should hold for a class. | Closure plan + validation (witness on a real change) route. | Becoming a bound gate before witness and owner ratification. |
| Workflow witness | A concrete past change that can test a candidate gate rule. | Evidence harness / validation route. | Being treated as general proof from one change. |
| External policy authority | The org's release policy, regulatory deploy constraints, the deploy tooling's own gates. | The org release-policy + platform owner route. | This repo cannot exercise it directly; it proposes, the org decides. |

> **D49 owner-gate (SPEC §Boundaries).** The bold rows above are **proposed** by the mint;
> the `release-approval` authority owner **ratifies** them. They are this repo's OWN
> domain-local kinds table — NOT a change to cav2's closed D49 enumeration. Seeded from
> cav2's table format, owner-authored thereafter (seed, don't bind).

## Source Movement

```text
change record (diff + declared blast-radius + rollback plan)
  -> source record (captured, dated, kind-labeled)
  -> change-class proposal (routine / significant / emergency)
  -> change-class ruling (owner-ratified class) -> gate-set binding fires
  -> candidate gate rule or workflow witness
  -> validation request (does this gate catch what it claims to?)
  -> external owner decision (release / hold)
```

No arrow is automatic. A change can be blocked, demoted to a higher class, split, or sent
back for more evidence (e.g. a missing rollback plan re-classes it up).

## Non-Collapse Rules

1. A change author's **declared** blast-radius is not the **ruled** change-class. (Authors
   under-declare; the class is ruled by `change-class-governance`, not self-assigned.)
2. A passing gate is not a release. (Gates passing is necessary, not sufficient; release is
   the external owner decision.)
3. An emergency override of a gate is not a re-classification. (Override is logged debt to
   be paid back, not a standing class ruling.)
4. A reviewer's risk reading (local synthesis) is not a change-class ruling.
N. **Harvested external method precedent (incl. CyberAlchemy v2) supports release-approval
   credibility — it is NOT final release-approval correctness, and it holds NO authority
   over release-approval decisions.** *(Obs-B non-collapse rule — forbids the precedent's
   leak at the rule level.)*

## Gate Vocabulary

- `pass`: evidence, source kind, owner route, and validation surface are adequate for the
  next move.
- `flag`: work may continue with named risk and follow-up.
- `block`: stop until a source, authority, witness, or boundary gap closes.
- `defer`: not rejected, but the route or timing is not ready.
