# Invoke template selection

| Phase | Selected template | Rationale |
|---|---|---|
| Define | `invoke.generic` | The child capability needs a bounded specification and glossary; it is not a public sigil, spell, or research package. |
| Design | `invoke.architecture` | The runtime has explicit component, interface, decision, and ownership boundaries. |
| Plan | `WORK-PACK.md` plus `IMPLEMENTATION-LAYERING.md` | The historical implementation-plan template is retired; the work-pack is the executable planning authority. |

Specialized `sigil`, `spell`, `research`, and `ux-plan` families are
ineligible. Augmentor UX is a consumer-owned follow-on surface, not part of this
private runtime implementation.

Gate result: **pass**. The selected templates cover all requested outputs
without inventing a new lifecycle owner.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
