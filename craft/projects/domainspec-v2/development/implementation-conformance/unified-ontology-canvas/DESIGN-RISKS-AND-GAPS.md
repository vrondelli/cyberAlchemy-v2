# Design Risks And Gaps

| ID | State | Risk/gap | Response |
| --- | --- | --- | --- |
| DG-01 | open-recommended | usable density and render/navigation cost unmeasured | collect L2 evidence; do not set readiness threshold yet |
| DG-02 | closed-design | constraint provenance could collapse into property meaning | explicit constraint nodes and exact finding links |
| DG-03 | closed-design | profile selection could misrepresent fixed findings | TypeScript pin plus missing-evaluation state |
| DG-04 | open-owner | explanatory copy remains partly hardcoded in HTML | keep unchanged in first slice; route ownership migration later |
| DG-05 | closed-design | SVG-only keyboard access would be incomplete | equivalent navigator plus staged custom keyboard semantics |
| DG-06 | deferred | minimap value is unknown | optional L3 SWU after density evidence |
| DG-07 | deferred | query-string/shareable state creates compatibility contract | separate Define request |
| DG-08 | open-execution | exact browser/accessibility acceptance has not run | Plan closure SWU |

No open gap blocks Plan authoring. All mutation-capable execution remains gated
by SWU selection and Task Session preflight.
