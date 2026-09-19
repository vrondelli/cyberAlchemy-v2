# BMC-REL-PLAN-01 Decision Gate

Question: Which exact canonical placement, v1 registry policy, and lifecycle owner should govern the coordinated N43/N44 closure-evidence contract chain?

- A — EVF evidence-contract family. Recommended. Both schemas live in EVF `contracts/`, use `evf.* /v1` identities and one scoped contract manifest, and are governed by the EVF evidence-chain lifecycle owner with the relationship-validation contract owner retaining the semantic boundary.
- B — DomainSpec implementation-spec family. Both schemas live under `impl/spec/relationship-validation/`, use `relationship-validation.* /v1` identities and a manifest/index pair, and are governed by the DomainSpec relationship-validation lifecycle owner.
- C — split custody. N43 lives in DomainSpec implementation-spec; N44 lives in EVF contracts; one coordinating lifecycle owner binds both exact digests.
- D — defer. Keep the Plan blocked and schemas proposal-only.
- E — stop. End this implementation route.
- Explain / more context — non-committal; expands the same options without selecting.

Recommendation: A. Both artifacts are validation evidence contracts, and the repository assigns EVF ownership of the evidence chain while DomainSpec retains the relationship meaning.

Selection: A — `BMC-REL-PLAN-01-A-EVF-EVIDENCE-CONTRACT-FAMILY`.

Selection source: exact user response `A`; recorded in `OWNER-SELECTION-RECEIPT.json` without inventing a response timestamp.

Selection effect when chosen: the selected action fixes the exact placement family, v1 identity/compatibility and registry policy, and named lifecycle ownership for Plan/apply/closeout. It closes only `PLAN-BLOCK-002` and `PLAN-BLOCK-003`; it does not create schemas or authorize Task Session execution.

Claim ceiling: no canonical schema, implementation, packet/profile change, admission, publication, release, deployment, production effect, or D06 work follows from gate preparation or presentation.
