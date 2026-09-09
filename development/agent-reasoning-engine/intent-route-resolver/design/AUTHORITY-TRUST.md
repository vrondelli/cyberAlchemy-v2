# Authority and trust boundary

| Action | Resolver | Augmentor | ResonantOS host | Retained capability owner |
|---|---|---|---|---|
| preserve raw intent | consumes | captures/projects | may persist source reference | no |
| derive route disposition | owns | no | invokes with frozen inputs | no |
| display/clarify | no | owns projection | supplies owner-backed state | no |
| decide route | no | captures intent only | owns immutable decision | may revalidate its own admission |
| approve protected work | no | displays/captures | owns or routes to exact gate | owns domain-specific gate |
| execute | no | no | invokes retained owner | owns |

`candidate` is never approval. `authority_effect` is always `none`. Any caller
that maps a disposition directly to execution violates this design.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
