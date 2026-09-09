# Contrast and Non-Color Attack

Fresh Chromium 1217 / Playwright 1.59.1 black-box evidence. No application source was inspected. Browser mechanics only; no human-comprehension or complete-accessibility claim.

| ID | Verdict | Class | Severity | Current evidence | Repair and acceptance |
| --- | --- | --- | --- | --- | --- |
| C-01 | FIX | hard_gate | high | Enabled 16px `Overview`, `Deep Dive`, and `Semantic` controls measured `rgb(107,95,83)` on `rgb(26,26,26)`, `2.807:1`; the relevant border token was also below `3:1`. | Use tokens reaching `4.5:1` text and `3:1` required component-boundary contrast; assert computed ratios. |
| C-02 | FIX | hard_gate | critical | 231 rendered edges had no visible predicate text, no markers, and no line pattern. Accessible names gave endpoints but omitted the exact predicate. `builds_on` was about `2.57:1` in forced colors; translucent `related` was about `1.20:1` over white and `1.64:1` on the dark default. | Expose exact predicate and direction visibly and accessibly; use a stable color per exact `sourcePredicate`, a redundant `presentationRelation` pattern, and `>=3:1` graphical contrast. |
| C-03 | FIX | hard_gate | critical | 489 focusable items; after 13 top controls, focus entered 231 edges before the first node. Focused edges had no outline/shadow and Enter did not open relation detail. | Remove non-actionable edges from sequential focus or use roving graph focus; require visible focus and Enter/Space relation activation. |
| C-04 | FIX | hard_gate plus screenshot_review | high | Default rendered 237 nodes and 231 edges at scale `0.157981`; median node about `34.76 x 13.98px`, with common leaf text boxes 2–4px high. Header showed `ALL / 17 layers`. | Make the bounded-context home default and gate the full graph behind `Show all loaded graph`. |
| C-05 | FIX | hard_gate | high | A Path from SuggestedTrack to Source-Backed Track rendered four numbered node buttons but no exact predicates or directed hop semantics. | Each hop must show source, exact predicate, direction, target, and a route-projection boundary. |
| C-06 | FIX | hard_gate | high | No portal control/open state existed; direct node selection and Back breadcrumb were not a context portal. | Implement named portal entry and test Back restoration of prior node/relation/direction focus. |

Bounded passes: the default scene used one computed color for all 72 `builds_on` edges and one for all 159 `related` edges; reduced-motion transitions collapsed; top-level controls had a visible cyan focus outline; selected-node detail exposed `authority:none`; 390x844 had no document-level horizontal overflow. These do not prove cross-scene color stability, portal recovery, human visual recovery, or narrow-state comprehension.
