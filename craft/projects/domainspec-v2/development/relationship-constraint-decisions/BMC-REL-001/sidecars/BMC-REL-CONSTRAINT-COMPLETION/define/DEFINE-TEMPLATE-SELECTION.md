# Define Template Selection

## Inventory Result

- Mode: `lookup`
- Repository: `/home/vrondelli/projects/domainspec-core`
- Inventory files changed: `none`
- Lookup readiness: `pass`
- Projection conformance: `pass-with-warnings`
- Uncontrolled historical tag warnings: `153`
- Authority effect: `none`
- Adjacent results: excluded because the exact BMC decision corpus is more current and direct for every selected obligation.

## Eligibility Evidence

| Candidate | Eligibility | Evidence | Result |
| --- | --- | --- | --- |
| DomainSpec spec baseline | The subject is a DomainSpec capability contract with typed concepts, constraints, source links, and a later Design boundary. | `.agents/skills/invoke/templates/domainspec-spec/README.md`, `SPEC.md`, and Define-stage aspect templates | selected |
| Standalone implementation-layering template | Define may emit a seed but is not required to; this target has no authorized implementation layer decisions. | Invoke Define mode gate | ineligible now; explicit downstream gap recorded |
| Standalone work-pack template | Work-pack construction belongs to Plan/full, not Define. | Invoke root and Define mode contracts | ineligible |
| Candidate feature-profile families | No new feature-profile family is needed; the DomainSpec baseline already covers this bounded capability. | template inventory | ineligible |

## Selection

- Selected template: `templates/domainspec-spec/SPEC.md` baseline, tailored as a constraint-authoring capability.
- Aspect strategy: keep the narrow contract in `SPEC.md` and the required Define evidence companions; do not create empty aspect files.
- Tie result: `no tie`.
- User tie choice required: `no`.
- Candidate-template creation: `not required`.
- Discovery waiver: present in `SPEC.md` and bound to the exact HN-E1384364D9F4 plus D01-D08 corpus.

## Validation Expectation

The sidecar validator requires the DomainSpec ownership, capability, fixed-contract, packet-invariant, frontier, acceptance, and claim-ceiling sections. Template selection changes no registry or release state.
