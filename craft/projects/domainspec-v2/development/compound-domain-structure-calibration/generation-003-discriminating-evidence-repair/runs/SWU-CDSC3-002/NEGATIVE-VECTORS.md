# SWU-CDSC3-002 Negative Vector Table

| Vector | Boundary | Result |
| --- | --- | --- |
| launch-failure | runtime descriptor | rejected |
| missing-browser | runtime descriptor | rejected |
| screenshot-only | observation receipt | rejected |
| unknown-observable | observation receipt | rejected |
| partial-vector | structured state | rejected |
| wrong-runtime | observation receipt | rejected |
| edit-leak | edit-surface diff | rejected |
| source-escape | source manifest | rejected |

Screenshots remain supporting evidence only; every accepted browser receipt must
carry complete structured state.
