---
artifact_role: task-session-context-pack
task: SWU-R3C-007
mode: lean
strict_coverage: pass
created: 2026-07-12
---

# Context Pack — SWU-R3C-007

## Scope

Create one pre-canonical review packet for the three deferred relationship
candidates. The packet specifies evidence and decision criteria; it does not
change `definitions/relationships/relationships.yml` or promote a definition.

## Obligation matrix

| ID | Obligation | Evidence | Coverage |
|---|---|---|---|
| O1 | Cover `depends-on`, Operation-returned Value Object, and Event payload/publisher composite. | task contract; DS-D8 deferred list | covered |
| O2 | Name distinct implementation behavior and active-signature/property overlap. | D18-D25 non-collapse properties; R3A residue | covered |
| O3 | Give positive and negative witnesses for each candidate. | D18 challenge/confirm contracts | covered |
| O4 | State validator or authoring obligation that would change on promotion. | D20/D21/D23/D25 | covered |
| O5 | Give explicit promote/defer/reject criteria and owner route. | task acceptance criteria; definitions-governance boundary | covered |
| O6 | Keep current disposition deferred and avoid root authority mutation. | DS-D8 deferred state; SWU handoff note | covered |
| O7 | Use the configured pre-canonical review surface and pass documentation validation. | `definitions/reviews/README.md`; task validation | covered |

## Selected sources

- `work-pack/tasks/TASK-R3C-FUTURE.md` — SWU-R3C-007 contract (O1-O7).
- `definitions/relationships/relationships.yml` — current deferred reasons (O1, O6).
- `definitions/DEFINITIONS.md` — D18 and D20-D25 non-collapse properties (O2-O5).
- R3A Task Session receipt — original future-evidence residue (O1, O6).
- accepted relationship-card findings — no-card/deferred adjudication (O1, O6).
- `definitions/reviews/README.md` — pre-canonical storage contract (O7).

## Gate verdict

PASS. The task asks for evidence criteria, not an owner ruling. Unknown endpoints
or missing witnesses become explicit promotion blockers inside the packet rather
than blockers to authoring the packet itself.

## Write and validation boundary

- Write one review packet under `definitions/reviews/` plus session/work-pack
  evidence.
- Do not edit canonical definitions, relationship authority, validators, or
  fixtures.
- Validate packet structure, local links, `validate:docs`, and scoped diff.
