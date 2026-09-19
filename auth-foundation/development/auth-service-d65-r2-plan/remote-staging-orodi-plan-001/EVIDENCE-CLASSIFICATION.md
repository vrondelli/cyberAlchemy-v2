# Auth evidence classification

| Class | Required origin | Supports | Cannot support |
| --- | --- | --- | --- |
| Construction evidence | bounded executable/formal tools and mutation controls | correctness claim within declared model/test bounds | environment behavior or deployment |
| Local staging rehearsal | supervised local WSL runtime | local service composition, recovery, proxy controls | remote isolation, external availability, production readiness |
| Remote-staging operational evidence | authorized remote staging run with admitted observer | behavior of the exact subject in the exact remote environment and window | production behavior or production readiness by itself |
| Production-canary evidence | separately authorized bounded production canary with real production conditions | exact canary outcome and rollback/restoration in its bound window | sustained production behavior or certification |
| Sustained production operational evidence | admitted observers over owner-defined production windows and denominators | continuing SLO, resilience, and operational-control claims within those bounds | claims outside the observed subject, window, or denominator |

Evidence moves between classes only through a new authorized run that satisfies
the target class. Copying, renaming, replaying, or re-evaluating an earlier
artifact does not promote its class. Independent replay can strengthen trust in
an evaluation; it cannot change the environment where observations originated.

## Open Questions

See [PLAN.md](PLAN.md#open-questions).

`authority_effect: none`
