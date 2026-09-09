# Authority Imports

Status: active import staging surface
Owner: CyberAlchemy v2 authority owner

This folder is the missing layer from the first project start.

CyberAlchemy v2 should import the repository's scattered authority material
before it decides what becomes canonical here. Import means path-level capture,
classification, source posture, and promotion route. It does not mean every
source becomes normative in CyberAlchemy v2 immediately.

## Import Ledgers

| Ledger | Contents | Current status |
| --- | --- | --- |
| [definitions/MANIFEST.md](definitions/MANIFEST.md) | Definition, glossary, taxonomy, relationship, and definition-governance sources. | 149 import candidates, 28 auxiliary/template/audit sources excluded from promotion. |
| [constitutions/MANIFEST.md](constitutions/MANIFEST.md) | Constitution, axiom, quality-bar, and anti-pattern sources. | 106 import candidates, 3 constitution templates excluded from promotion. |
| [resonantos-economy-research/README.md](resonantos-economy-research/README.md) | Standalone ResonantOS economy research repository import posture. | Active external research import; not CAV2 authority by proximity. |

## Import Rules

1. Import sources as candidates first.
2. Preserve their source path and source family.
3. Keep source authority with the original source until promotion.
4. Promote only through the owning governance route:
   - definitions-governance for terms,
   - constitution-governance for structural rules,
   - discipline-governance for recurring practices,
   - decision-gate for public/private, scope, ownership, or extraction choices.
5. Do not import generated mirrors, worktree copies, backups, output packages, or
   node module documentation as authority candidates.

## Open Questions

### OQ-1. Should import candidates be copied or referenced?

Context: this pass references sources by path so it does not silently fork
authority. Recommendation: copy only after a promotion decision names which
content becomes CyberAlchemy v2 canonical source. Status: OPEN.
