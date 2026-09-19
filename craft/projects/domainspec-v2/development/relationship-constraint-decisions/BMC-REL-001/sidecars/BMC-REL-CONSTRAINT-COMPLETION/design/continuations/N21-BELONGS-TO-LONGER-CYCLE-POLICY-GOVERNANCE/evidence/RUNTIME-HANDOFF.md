# N21 Runtime Handoff

## Current State

N20 exact A is immutably closed. Every direct canonical
`belongs-to_k(e,e)` self-edge is rejected uniformly for current and later admitted
D30 membership kinds; source repair removes the invalid edge without requiring a
replacement parent. N21 is formed and remains unselected.

## Owner Question

For same-kind directed canonical `belongs-to` cycles over two or more distinct
Entities, should one future cycle behavior policy govern every current and later
admitted D30 kind, or should behavior be governed independently per exact kind?

- A: `BMC-REL-NONNUMERIC-21-A-UNIFORM-LONGER-CYCLE-POLICY-ACROSS-MEMBERSHIP-KINDS`
- B: `BMC-REL-NONNUMERIC-21-B-KIND-SPECIFIC-LONGER-CYCLE-POLICY`
- C: `BMC-REL-NONNUMERIC-21-C-DEFER`
- D: `BMC-REL-NONNUMERIC-21-D-STOP`
- Standing non-answer: Explain / more context.

Recommendation: A for one stable canonical relationship rule surface. B remains
fully admissible because D30 membership meanings are non-overlapping and cycle policy
is expressly withheld.

## Exact Bindings

- N20 owner receipt SHA:
  `41758e2a5f0c2e1f6bee2177b63a39a333d9e5105a18df85d6da6f9270a4246d`
- N21 manifest SHA:
  `91e9858fdbc0016444e878bc214c68e335cff7ed0d2585d7bfcabf1fecd93e41`
- N21 denominator SHA:
  `b8d04d3399e8ce850f18282b077658537791754ef2d341a2d24519ed7c3c88b1`
- N21 selection SHA:
  `a9e3b9f33fe794485e5cd1a07c5958a8d072e2387102791d1ec7c738cf5d239f`
- N21 request SHA:
  `ee43d788879343e80602feb3d751d3561cca1a0362b87980d9a262cd6db937c7`
- N21 prefilter SHA:
  `833b60a39f23917a4e1760aebaa56ed72dae448cec510dc34b0d328c399778be`
- N21 requestDigest:
  `fb26d848eee88f9f1c28b0fd540a1e7dc795ba0faf53f0c9e6ef0b94e5b1fb05`

## Stop Boundary

Do not infer N21 from N19 or N20, choose reject/allow behavior, evaluate mixed-kind
paths, derive closure, decide duplicates or partial-view semantics, mutate canonical
or packet bytes, plan implementation, promote, or publish. Decision effect: `none`.
