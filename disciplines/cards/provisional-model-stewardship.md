# Provisional Model Stewardship

Status: candidate
Steward: CyberAlchemy v2 authority owner

## Purpose

Govern the recurring practice of treating a **structural model** — any artifact
that enumerates a finite set of members (altitudes, layers, authority kinds,
ontology branches, status tiers, taxonomies) — as a *candidate frame with its
own evolution lifecycle*, not as authority that is true merely because each of
its members is well-described.

A model under this discipline carries two things its individual members do not:

- **A frame status, separate from its members' statuses.** The set as a whole is
  `candidate-frame` until its completeness has been probed and the frame earns
  promotion on its own evidence — even when every member is already canonical.
- **An explicit evolution lifecycle.** The frame may gain, merge, split, or
  retire a member, and each such move is a named, gated change, not a silent
  redraw.

This discipline absorbs two narrower practices as internal clauses:

- **Completeness probe (validation move).** Before a finite set is presented as
  complete, explicitly search for the next member and record the result:
  `found-and-added`, `searched-and-none`, or `deferred-with-reason`. A set with
  no recorded probe is `candidate-frame` by default.
- **Frame-context marking (boundary clause).** A model declares the bounded
  context it was derived inside, and flags any claim of generality beyond that
  context. Deriving a frame inside one corpus does not license asserting it as
  universal.

## Boundary

This discipline names the operating practice over models. It does **not** define
canonical terms, author constitutions or the CyberAlchemy method, promote
ontology, or redesign any specific model. It cannot itself add or retire a
member of a governed set — that is a blocker-level change.

Mutation routes it hands off to:

- `decision-gate` — adding, merging, splitting, or retiring a member of a frozen
  frame is a blocker-level decision.
- `constitution-governance` — when the frame's structure must be enforced (a
  model-frame clause requiring a recorded completeness probe + frame status +
  derivation context). This route stays **private** to the CyberAlchemy v2
  surface; it must not be written into the public `CYBERALCHEMY-METHOD.md`.
- the owning model's author (e.g. the ontology route for `AUTHORITY-KINDS.md`,
  the product owner for the IDE-ergonomics spine) — for the actual edits.

## Evidence

- [Unified IDE Ergonomics product view](../../../projects/ide-ergonomics/UNIFIED-PRODUCT-VIEW.md) -
  asserts "three altitudes of one spine" as a closed set with no recorded
  fourth-member probe; a trust/confidence axis (the graduated-trust dial) and an
  authority/ownership axis (Owner-Boundary Preservation) are folded into
  altitude 1 rather than tested as members. The triggering case for this card.
- [Authority Kinds](../../ontology/AUTHORITY-KINDS.md) - a "Candidate Kinds"
  table, status `candidate`, with no completeness probe over the kind set: the
  same premature-closure shape in the ontology layer, proving cross-capability
  recurrence.
- [CyberAlchemy v2 discipline catalog](../DISCIPLINES.md) and its status ladder -
  a finite tier set (`candidate`..`deprecated`) asserted as the maturity frame
  without a probe for a missing tier.
- [CyberAlchemy Method](../../../arcanum/framework/CYBERALCHEMY-METHOD.md) -
  read-only cite: supplies the governed synthesis/trace/route principles this
  discipline extends to the model-as-artifact; the discipline does **not** write
  back into this public surface.

## Validation

- Mode: prose-review
- Check: review card against this catalog, source links, and the per-model
  completeness-probe record; local Markdown link check. (No deterministic
  validator yet — the CAV2 catalog is outside `validate-discipline-catalog.py`'s
  arcanum scope.)
- Latest result: pass, 2026-06-24 local Markdown link check

## Quality Bar

A useful provisional-model-stewardship entry must:

- treat a finite category-set as a candidate frame with its own status, distinct
  from the statuses of its members,
- require a recorded completeness probe before the set is presented as complete,
- mark the bounded context the model was derived inside,
- keep the model's evolution (add/merge/split/retire) gated, not silent,
- name the route that owns each structural mutation rather than performing it.

## Promotion Guardrail

This discipline can recommend decision-gate, constitution, or model-author
routes. It cannot directly promote a model to canonical authority, add or retire
a member of any set, or define ontology, definitions, or constitutions itself.
Raising it above `candidate` requires naming its owner, evidence, validation
surface (the completeness-probe record), and mutation boundary.

## Next Hardening Move

Route a **private** CyberAlchemy v2 model-frame clause through
`constitution-governance` (frame status + recorded completeness probe +
derivation context as enforceable structure), and make the completeness probe a
deterministic validator surface. Do not edit the public
[CyberAlchemy Method](../../../arcanum/framework/CYBERALCHEMY-METHOD.md).
