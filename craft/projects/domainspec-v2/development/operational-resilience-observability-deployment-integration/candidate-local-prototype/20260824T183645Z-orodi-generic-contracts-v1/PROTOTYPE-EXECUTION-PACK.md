# Prototype Execution Pack

Execution lane: `candidate-local-prototype-fast-lane`

Normal Task Session / Invoke execution readiness: `not-claimed`

| Wave | Unit | Entry | Exit | Stop boundary |
| --- | --- | --- | --- | --- |
| W0 | planning and deferred-governance notice | explicit user authorization | exact Work Pack plus joined Handoff Notice | no product mutation before notice join |
| W1 | SWU-ORODI-P-001 | W0 pass | closed contracts compile and schema-validate | no profile/tool/live binding |
| W2 | SWU-ORODI-P-002 | W1 pass | deterministic validator and CLI | no actuation or external write |
| W3 | SWU-ORODI-P-003 | W2 pass | positive/hostile tests and consolidated report | any acceptance-critical failure blocks closeout |

Implementation is strictly serial because each unit consumes the previous unit's exact contract. The only background helper is the repository-local deferred-governance Handoff Notice publisher; it owns no product bytes.
