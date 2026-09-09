# Planned Validation Contracts

These are Design contracts, not executed Plan evidence.

| ID | Polarity | Target | Expected result |
| --- | --- | --- | --- |
| V-OEWFR-01 | positive | passing injected command | one call, normal handle, no failure artifact, cleanup true |
| V-OEWFR-02 | negative | nonzero typed command | one call, no later commands, typed BLOCK, actionable bounded reference |
| V-OEWFR-03 | negative | empty diagnostics | `diagnostic-evidence-missing`, no success |
| V-OEWFR-04 | negative | oversized diagnostics | deterministic head/tail, original digest/size retained |
| V-OEWFR-05 | negative | secret/environment marker | marker redacted, environment absent, leakage blocks |
| V-OEWFR-06 | negative | relative/absolute/normalized/symlink escape | reject before command |
| V-OEWFR-07 | negative | evidence writer failure | stronger BLOCK, cleanup true |
| V-OEWFR-08 | negative | cleanup failure | distinct strongest BLOCK; source is not evidence |
| V-OEWFR-09 | negative | missing required reference | Task Session-shaped terminal contract remains BLOCK |
| V-OEWFR-10 | negative | inner BLOCK continuation | evidence reference preserved; no successor advance |
| V-OEWFR-11 | negative | observer recommendation | no mutation, retry, or root-cause authority |
| V-OEWFR-12 | positive | compatibility decision packet | both repair branches, costs, write scopes, validation, and rejection conditions remain visible with no selected option |
| V-OEWFR-13 | static negative | bound DOM test under Node | `document` absence remains reproduced without dependencies; no product defect or repair choice inferred |

This work pack implements V-OEWFR-01 through V-OEWFR-11. V-OEWFR-12 and 13
close the separate decision packet only; the selected repair and its runtime
witnesses belong to a later admitted package. No generalized build, network,
or consumed SWU006 attempt is part of this suite.
