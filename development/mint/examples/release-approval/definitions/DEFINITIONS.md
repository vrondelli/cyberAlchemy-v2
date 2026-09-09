<!--
  GOLDEN FIXTURE — worked mint-act output. Hand-instantiated from templates/definitions.md
  for the release-approval process domain. Seeds 2 cards; the owner authors the rest.
-->

# Release-Approval Local Definition Cards

Status: active
Promotion scope: local-release-approval-only
Canonical source: yes

These definitions are local release-approval definitions for this repository. They do not
define the org's release policy, governance weight, production authorization, or deploy
tooling contracts.

Each card keeps three voices together:

- **Formal voice**: the normative local meaning and boundary.
- **Plain-language voice**: non-normative intuition.
- **Domain-context voice**: how the term is used in this repository now.

> **Citation vs authority (Obs-B).** A card's `Evidence:` field MAY cite a harvested
> framework snapshot (e.g. `sources/local-snapshots/cav2/...`). That is **provenance /
> citation** — it records where the idea was harvested. It is NOT a resolution path: the
> card's normative meaning is owned **here**, and removing the framework attachment does
> not change the definition. A `Source kind:` of method-authority points at **this repo's
> own constitution**, never at cav2.

## release-approval-D1. Release-Approval Workflow

Source kind: operator-reading; local-inference

Evidence: [authority/AUTHORITY-MODEL.md](../authority/AUTHORITY-MODEL.md), [README.md](../README.md)

Formal voice:

```text
release-approval-workflow =
  classify a change into a ruled change-class
  AND fire the gate-set bound to that class
  AND require an external owner decision before release
```

Plain-language voice: the process that decides whether a change is safe enough to ship and
who has to sign off, based on how big its blast-radius is.

Domain-context voice: this repo governs the *classification + gating* half; the actual
release authorization is an external owner decision the repo only recommends into.

Use carefully: the workflow ends at a recommendation; it never itself authorizes production.

Misuse warning: do not conflate "gates passed" with "released" (non-collapse rule 2).

Promotion boundary: local-only

## release-approval-D2. Change-Class Ruling ⟵ *domain-originated*

Source kind: local-inference  *(may cite a harvested precedent in Evidence — citation only)*

Evidence: [authority/AUTHORITY-MODEL.md](../authority/AUTHORITY-MODEL.md), [authority/source-spine.md](../authority/source-spine.md)

Formal voice:

```text
change-class-ruling =
  an owner-ratified assignment of a change to a class in {routine, significant, emergency}
  ruled by change-class-governance (NOT by the change author's declaration)
  WHOSE EFFECT is to bind the change to that class's gate-set
  AND which holds no power to approve, waive, or release
```

Plain-language voice: the standing call on "how big is this change?" — made by a neutral
ruler, not the person who wrote it — that decides which approvals it needs.

Domain-context voice: the load-bearing authority this repo originates; the
`change-class-governance` owner route exists to make and maintain these rulings and the
class→gate-set bindings.

Use carefully: a ruling binds a gate-set but never substitutes for the gates passing or for
the external release decision.

Misuse warning: a ruling is not an approval and not a re-classification mid-flight; do not
let an author self-rule (constitution rule C3/C4).

Promotion boundary: promotion-candidate *(could be proposed back into cav2 as a new authority
kind via the D49 owner-gate — a SEPARATE downstream owner act, never the mint act)*
