# Challenge Contract Confidence Axis Review

Status: decision recorded
Owner: definitions-governance plus decision-gate
Date: 2026-06-30
Canonical effect: none in this artifact
Work-pack receipt: SWU-OCON-003 / R-OCON-003

## Authority Boundary

This review records the owner route needed before source-model mutation. It
does not update canonical definitions, amend live schema, promote a node model,
or change specs by itself.

Canonical definition authority remains
[../DEFINITIONS.md](../DEFINITIONS.md). The next SWU may patch the allowed
files listed below, but only by preserving the decision in this receipt.

## Blocked Question

Should challenge-contract and node-schema confidence wording keep the imported
legacy axis names `veracidade` and `conviccao` as canonical or aliases, or
should the forward CyberAlchemy v2 schema use only `evidence_confidence` and
`commitment_confidence`?

## Decision Gate Receipt

Result: PASS for SWU-OCON-004 source sync.

Selected option: use `evidence_confidence` and `commitment_confidence` as the
only canonical forward schema field names. Do not carry `veracidade` and
`conviccao` forward as aliases or grandfathered active-schema fields.

Source of decision: the 2026-06-23 authority object schema proposal already
records the G7 owner decision to use the canonical forward fields and says the
supersession of D40's legacy wording must be recorded. This review is that
decision-gate and definitions-governance receipt for SWU-OCON-003. Owner update
on 2026-06-30 clarified that no active consumer requires the legacy keys, so
the forward model should remove them rather than preserve aliases.

## Options Considered

| Option | Benefit | Cost Or Risk | Choose When | Downstream Impact |
| --- | --- | --- | --- | --- |
| Keep legacy names canonical. | Preserves active D40 wording exactly. | Leaves source-local Portuguese labels as global schema fields and conflicts with the schema proposal. | Only if imported House-vault field names should remain the global CAV2 schema. | SWU-OCON-004 would need to reject or rewrite the schema proposal's G7/G8 route. |
| Canonical fields only. | Aligns D23 evidence/commitment wording with the schema proposal and avoids a dead compatibility surface. | Historical imports still contain source-local terms, so source evidence readers must treat them as historical source vocabulary only. | Use when no active CAV2 consumer requires the old keys. | SWU-OCON-004 may remove active CAV2 references to `veracidade` and `conviccao` from `NODE-MODEL.md`, `PACKAGE-MODEL.md`, and D40/D23 wording. |
| Canonical fields plus legacy aliases. | Preserves a compatibility bridge for imported material. | Keeps unused terms alive and can make aliases look like supported schema. | Only if active consumers still require the old keys. | Rejected by owner update; do not preserve aliases in active CAV2 docs. |
| Remove confidence mention from challenge contract with no definitions note. | Avoids nesting node confidence under challenge protocol. | Silently reverses active D40 and can make older challenge-contract material ambiguous. | Only if a later definitions-governance pass retires D40's confidence-reference language entirely. | Larger definition rewrite; not needed for the current package sync. |

Selected option: canonical fields only.

## Reconciliation Rule

Forward CAV2 node schema should expose node confidence as a top-level node
property, with these canonical fields:

```yaml
confidence:
  evidence_confidence: high
  commitment_confidence: high
```

`challenge_contract` remains the challenge protocol: valid challenge modes,
contradiction and validation edges, owner route, resolution gate, blocking
questions, and challenge residue routing. It must not contain the node's own
confidence value, must not contain the node's own residue value, and must not
create a third confidence axis.

If a challenge-contract definition or package model needs to name confidence
semantics, it should reference the existing `CAV2-D23` evidence/commitment split
using the canonical names above. Active CAV2 schema and model docs should not
use `veracidade` or `conviccao` as fields, aliases, or compatibility handles.
Those terms may remain only inside immutable historical import evidence.

## Allowed Mutation Scope For SWU-OCON-004

SWU-OCON-004 may update these files if the edits follow this receipt:

| File | Allowed Change |
| --- | --- |
| `cyberAlchemy-v2/ontology/NODE-MODEL.md` | Replace the minimum challenge-contract shape so node confidence is top-level and canonical fields are `evidence_confidence` and `commitment_confidence`; keep challenge contract protocol-only. |
| `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | Update the package candidate record shape if needed so it does not make `confidence_reference` look like nested node confidence. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` | Add a limited D40/D23 reconciliation note or wording adjustment that removes active legacy-field support and makes the canonical fields explicit. |

SWU-OCON-004 must not update these files as part of this reconciliation:

| File Or Surface | Reason |
| --- | --- |
| `cyberAlchemy-v2/specs/` | Specs receive promoted contracts after owner gates; this receipt is not a spec promotion. |
| `projects/domainspec-v2/` | DomainSpec v2 remains candidate/project-local until its own instantiation task. |
| `cyberAlchemy-v2/ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md` | Historical proposal already records the owner decision and should remain evidence, not be rewritten as the live source. |
| Public `arcanum/` | This is private CAV2 authority-model work and must not leak private evidence into public Arcanum. |

## Definitions Governance Review

Definitions updated: none.
Index synced: not applicable.
Drift found: yes.

Drift summary:

- Active D40 text preserves `veracidade`/`conviccao` as House-vault-derived
  confidence dimension names.
- The schema proposal records a later owner decision to use
  `evidence_confidence` and `commitment_confidence` as canonical forward fields.
- `NODE-MODEL.md` still shows `confidence_reference` inside
  `challenge_contract` with legacy axis names.
- Owner update says no active consumer uses the legacy keys, so compatibility
  aliasing is not required.

Recommended remediation for SWU-OCON-004:

1. Patch `NODE-MODEL.md` so node confidence is top-level and challenge contract
   remains protocol-only.
2. Patch `PACKAGE-MODEL.md` only if its candidate record shape still implies
   nested confidence values.
3. Patch D40/D23 narrowly enough to remove active legacy-field support and
   record canonical field names without promoting a new third confidence axis.
4. Defer full promotion of separate `evidence confidence` and
   `commitment confidence` definition entries unless a later
   definitions-governance task explicitly requests it.

## Review Verdict

Proceed to SWU-OCON-004.

The blocker is resolved for source sync because the owner route has selected
canonical forward field names, removed legacy alias preservation from the active
model, named the downstream files allowed to change, and restated the
no-third-confidence-axis rule.
