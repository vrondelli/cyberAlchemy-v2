# Define Transport

## Invoke Result

- Mode: define
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: pass
- Mode contract: `spells/invoke/define.md`
- Outputs: `SPEC.md`, `GLOSSARY.md`, `DEFINE-TRANSPORT.md`
- Implementation layering: explicit downstream Plan requirement
- Template selection: DomainSpec spec baseline; no tie
- Dispatch techniques: `sequence`, `concrete_path_evidence`,
  `owner_boundary_check`, `state_namespace_boundary`, `residue_ledger`,
  `handle_handoff`
- Distill validation: pass; the thin adapter witness is the smallest coherent
  definition unit
- Decisions: new development namespace, zero new manifests, existing runtime
  seam, Poker-Team witness, old package read-only
- Unresolved gaps: runtime behavior remains unimplemented and unwitnessed
- Necronomicon transport: not applicable; no matching section was mutated
- Next route: design

## Evidence capability

- `execution_path`: Context Builder → Inventory lookup → Invoke Define
- `dispatch_trace`: [TECHNIQUE-TRACE.md](TECHNIQUE-TRACE.md)
- `template_selection`: [TEMPLATE-SELECTION.md](TEMPLATE-SELECTION.md)
- `layering_or_gap`: Plan must author the standalone L0–L3 artifact
- `result`: pass for Define authoring only
- `next_route`: Design
