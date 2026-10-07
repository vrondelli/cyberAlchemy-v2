# G01 BugSwarm selective-GLM r34 — final mechanism-test population

Status: fixed before new requests. R33 ended with 21 authenticated repositories
and exhausted the Java supply. No labels, rankings, model outcomes, or scores
have been opened.

Bind r33 result SHA-256
`bbdb33fce8bc165f16a4dc255510fd0c4f588f8deebbd19adffedba1eb356002`
and r32 queue SHA-256
`42fa759dc368d5b0c88a3029474ca36ebce75c0e7a57352a7eaa1131485d225e`.
Retain every filled r33 row. Reassign empty positions 15, 18, and 19 to
Python, giving a final target of exactly 17 Python and 7 Java repositories.

Begin with the first unconsumed Python candidate, queue index 8. Consume the
sealed Python queue in order. For each target position, continue until one
candidate passes the unchanged r33 authenticated source/log admission rule;
failed candidates remain consumed and preserved. Use zero automatic retries.
Stop terminal if the queue cannot fill all three positions.

The gate passes only with 24 unique, repository-disjoint, authenticated rows
and exact language counts 17/7. This population is admitted only to test the
prospectively fixed selective-GLM mechanism. Its availability-driven language
mix must remain explicit, results must be reported by language as well as
overall, and it cannot support a balanced-language or broad product claim.

No labels, passing source, patches, rankings, provider calls, model outputs, or
scores may be accessed in this stage.

## Open Questions

- How many additional Python attempts will fill the final three positions?
- Does the fixed ARE/graph disagreement router reduce GLM calls on this
  population while retaining the always-GLM accuracy result?
- What independent language-balanced benchmark is required beyond this
  availability-selected mechanism cohort?
