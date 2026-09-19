# Template And Profile Selection

## Inventory lookup result

- Mode: `lookup`
- Inventory root mutated: no
- Selected profile: DomainSpec architecture bundle
- Selected companion: Invoke `architecture` family
- Template tie: none; the profile supplies the mandatory six views and the companion supplies source-contract, decision, risk, and transport sections
- Candidate promotion: not requested and not performed
- Validation: exact template paths and hashes recorded in `SOURCE-INVENTORY.json`

## Eligibility

| Candidate | Eligible | Selection | Reason |
| --- | --- | --- | --- |
| `arcanum/spells/invoke/templates/domainspec-spec/architecture-bundle.md` | yes | selected baseline | normal Design from accepted, stable EVF/decision inputs; mandates six views and planned witness separation |
| `arcanum/spells/invoke/templates/architecture/architecture.md` | yes | selected additive companion | cross-owner adapter needs source contracts, dependencies, decisions, risks, and transport notes |
| `research` family | no | not selected | the overlap audit and accepted option close the architecture alternative; the remaining uncertainty is owner acceptance, not missing research |
| `ux-plan` family | no | not selected | no natural-person rendered semantic surface changes |
| `spell` or `sigil` family | no | not selected | target is a private DomainSpec integration contract, not an Arcanum lifecycle artifact |

## Inventory boundary

The repository Inventory is already dirty from unrelated concurrent work, so this lookup does not edit or rely on its changing index. It resolves the exact repository-local Invoke templates directly and records them as run-local selection evidence.
