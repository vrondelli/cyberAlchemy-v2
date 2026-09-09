# Invoke Result

- Mode: define
- Spell: invoke
- Canonical ID: `invoke`
- Scope: library
- Phase status: PASS
- Mode contract: `.agents/skills/invoke/define.md`
- Outputs: `SPEC.md`, `GLOSSARY.md`, `IMPLEMENTATION-LAYERING-SEED.md`, `TRANSPORT-REPORT.md`
- Template selection: DomainSpec specification baseline plus standalone layering seed; eligible with no tie
- Dispatch techniques: sequence, owner-boundary check, constraint propagation, residue ledger
- Distill validation: PASS; one coherent cross-component definition unit
- Decisions: define `RelationRef`, canonical semantic owner, resolution, field classes, snapshot/revision/failure laws without selecting storage model
- Unresolved gaps: minimum detached snapshot fields; planned consumer implementation evidence
- Next route: `interrogation:refine-review`
