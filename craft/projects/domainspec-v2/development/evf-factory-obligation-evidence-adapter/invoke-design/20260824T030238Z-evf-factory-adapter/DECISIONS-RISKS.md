# Decision And Risk Register

## Decisions

| ID | Status | Decision | Owner/evidence | Revisit trigger |
| --- | --- | --- | --- | --- |
| D-001 | accepted input | use topology B: EVF -> thin versioned adapter -> existing factory -> registered TLA/TLC provider | DomainSpec primary owner; accepted decision record | only a new owner decision may supersede it |
| D-002 | design decision | keep request translation and evidence translation under one adapter version and identity relation | Invoke Design candidate | owner finds independently versioned halves safer and supplies currentness proof |
| D-003 | design decision | require a factory-owned verification/currentness binding in addition to receipt digest | implemented verify/replay lifecycle plus audit gap | factory exposes an accepted equivalent proof in the receipt itself |
| D-004 | design decision | output claim ceiling is the narrowest of EVF obligation, provider node, and factory run ceilings | accepted non-inflation boundary | never relaxed without owner-approved semantic change |
| D-005 | design decision | unknown, incomplete, stale, mismatched, or wider evidence blocks; it never degrades into an inferred pass | factory and EVF fail-closed rules | never for this claim class |
| D-006 | deferred owner decision | exact schema bytes, version identifiers, fixture bytes, and role-to-person assignments | EVF/factory/provider/DomainSpec owners | owner acceptance receipts exist |

## Risks

| ID | Risk | Mitigation | Owner | Readiness effect |
| --- | --- | --- | --- | --- |
| R-001 | receipt digest is treated as current verification evidence | require factory-owned verification/currentness binding | factory owner | blocks Plan until exact contract accepted |
| R-002 | adapter silently changes obligation meaning or expected outcome | bind obligation digest and EVF-owned expectation reference; negative fixture | EVF owner | blocks on mismatch |
| R-003 | provider result taxonomy is partial or collapses fatal outcomes into pass | require total provider taxonomy and unknown-result negative fixture | provider owner | blocks integration |
| R-004 | claim inflation from bounded model evidence to implementation proof | narrowest-ceiling rule and explicit non-claims | EVF owner | blocks wider handle |
| R-005 | adapter grows replay, verification, accounting, or publication machinery | reuse factory handles and reject duplicate lifecycle | factory owner | Design regression |
| R-006 | two owners accept different schema bytes | exact cross-digest acceptance receipts and version binding | DomainSpec primary owner | blocks planning |
| R-007 | expected-red result becomes generic pass | exact case/property/expected-result identity required | provider and EVF owners | blocks result translation |
| R-008 | role labels are mistaken for human assignments | keep assignments explicitly owner-gated | DomainSpec primary owner | no authority follows |

## Known absence

No selected source proves EVF invokes FMP today. The adapter, TLA provider, accepted schemas, validators, fixtures, and runtime invocation are all absent or unexecuted.
