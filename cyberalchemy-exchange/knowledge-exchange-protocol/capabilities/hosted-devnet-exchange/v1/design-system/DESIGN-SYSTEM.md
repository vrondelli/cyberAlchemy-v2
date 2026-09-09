# KEP interface design system

Status: user-confirmed visual direction; implementation prototype. This is a design
selection, not tested-product approval, ontology admission or operational authority.

## Direction

Cream editorial landing page and charcoal guided console. Keep the red orb on the
landing page; use simple icons in the console. One task stays primary, with owner
state and activity beside it. The white paper remains a light reading surface.

## Confirmed decision map

| Dimension | Selected direction | Evidence |
| --- | --- | --- |
| Reference | The two local HTML examples shown in this conversation | User: “the examples” |
| Personality | Editorial introduction; precise guided work | User: “editorial for the landing page and console for the console” |
| Aesthetic | Cream publication / charcoal console | User confirmed the examples |
| Type | Serif display for landing; sans headings and monospace references for console | Selected rendered examples |
| Color/mode | Light landing and paper; dark Exchange | User confirmed pairing |
| Density/shape | Generous landing; compact console; flat surfaces and 4px control corners | Selected rendered examples |
| Structure/rhythm | One task with state and activity alongside; stack at narrow widths | User selected guided console “A” |
| Signature | Red orb and origin-preserving access motif | User: “keep” |
| Imagery/icons | Existing orb; simple functional console icons | User: “keep” |

The exemplars define visual direction, not replacement protocol logic or fabricated
state. Real UI values continue to come from the existing runtime. EN and PT-BR remain
supported interface languages. Local system fonts avoid a new external font dependency.

## Build contract

Prototype token source: `../implementation/static/assets/design-system.css`. The component
reference and application load that same stylesheet. Existing selectors consume compatibility
aliases; migration of the entire legacy stylesheet is not complete.

Do not replace task-specific layouts with generic feature cards, add decorative effects to working
scenes, or hide effect/network/identity information to achieve visual simplicity.

Canonical implementation token source: `../implementation/static/assets/design-system.css`.
Root roles define the editorial surface; `body[data-view="explore"]` and
`[data-theme="console"]` remap those roles for the console. Forced colors uses system
colors. The surface determines the authored mode; there is no saved theme toggle.

| Role | Editorial | Console |
| --- | --- | --- |
| Canvas | `#fdfaf3` | `#101418` |
| Surface | `#fffdf8` | `#171c21` |
| Main text | `#151515` | `#e0e6eb` |
| Supporting text | `#625e57` | `#a2afbb` |
| Accent | `#bd1230` | `#ef806b` |
| Focus | `#245eb0` | `#92bbff` |

Use semantic roles in components. The legacy stylesheet still contains fixed layout
and diagram values; this is a bounded migration, not a claim that every legacy rule is
fully tokenized. Root and console tokens are hex/sRGB values from the selected examples;
a complete OKLCH ramp is not part of this prototype.

## Building another interface

1. Load `style.css`, `brand.css`, then `design-system.css` in that order while legacy
   layouts remain. Do not copy token values into a new stylesheet.
2. Use `.ds-button`, `.ds-button-secondary`, `.ds-field`, `.ds-input`, `.ds-help`,
   `.ds-notice`, `.ds-status`, `.ds-row` and `.ds-stack`. Inspect `/design-system` for
   working specimens. The console theme is scoped with `data-theme="console"`.
3. Give inputs labels and help/error associations. Keep one primary action per scene.
   Use native disabled state and explicit guidance; preserve protocol-owned guards.
4. Keep public state and activity adjacent on wide screens and after the task on narrow
   screens. DOM order must match the reading order. Keep progress labels visible.
5. Run the source/bundle tests, Rust asset test and the browser checks in `REVIEW.md`.
   A new visual choice must be checked against this interview, not an unrelated template.



## Construction frontier

Local implementation prototype completed; bounded browser/test evidence is in `REVIEW.md`.
The next product-construction frontier is visual review of the exact candidate, then
remaining live-wallet/assistive-technology coverage before any broader readiness claim.
Publication and deployment are deferred operational work owned by the product operator;
neither blocks local construction. Prior candidate approvals remain frozen and do not
cover these changed UI bytes.

## Next review

Compare the resulting landing page and guided console against the selected examples.
TasteCheck findings are diagnostic evidence; no automated score grants product approval.

## Provenance

TasteCheck main `ec04b37ad447404c2237fe1bea51f8e7344fe10f`, read directly from a temporary
checkout. Applied entry: improve-existing-website; design-system-interview records the
user-confirmed direction. tastecheck-pass and a11y-pass auditors supply baseline discovery.
No global skill installation or external publication was performed.
