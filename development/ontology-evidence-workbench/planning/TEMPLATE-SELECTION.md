# Plan Template Selection

## Inventory Evidence

- `.arcanum/inventory/index.json` validated with `lookup_readiness=ready`.
- Existing candidate-graph and IOLM work packs demonstrate split work-pack,
  receipt, isolation, and browser-evidence patterns.
- Inventory is discovery evidence only.

## Selection

| Template | Eligibility | Result |
| --- | --- | --- |
| standalone `implementation-layering` | required for Plan | selected |
| standalone `work-pack` | required for Plan | selected |
| DomainSpec execution pack | medium complexity and wave planning | selected |
| split task contracts | more than five tasks and algorithmic/UI work | selected |
| SWU manifest | medium complexity | selected |

No tie required another user choice.

## Authority

Templates shape artifacts. They do not select SWUs, grant Task Session
admission, or promote implementation/runtime readiness.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
