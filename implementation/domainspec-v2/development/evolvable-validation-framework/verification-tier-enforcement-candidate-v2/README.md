# EVF verification-tier enforcement V2 candidate

This additive kernel introduces the V3 suite contract. It requires semantic
trait coverage, exact raw-evidence and provider-profile bindings, materially
distinct producer identities, declared shared infrastructure, detected
route-specific mutations, and all five hostile-control classes.

V3 is evaluated as a conjunction of distinct obligations. Provider outcomes
are never voted. Any missing, conflicting, stale, or unbound evidence fails
closed.

Run `python3 -B -m unittest discover -v -s tests`.

`authority_effect: none`

## Open Questions

- Whether a future admitted runtime should expose this kernel as a service.
- Whether infrastructure independence needs a quantitative risk model.
