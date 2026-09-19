# Define Dispatch Spec technique trace

| Technique | Activation | Effect on Define | Validation expectation | Status |
| --- | --- | --- | --- | --- |
| `sequence` | accepted decisions precede definition | decision → context → SPEC/requirements/glossary → validation | every output cites the accepted decision | pass |
| `concrete_path_evidence` | private, drift-prone sources | context records exact repository paths/selectors | no claim rests only on Inventory prose | pass |
| `owner_boundary_check` | CLI consumes canonical/profile evidence | SPEC separates product, profile, conformance, and release owners | no planning artifact self-authorizes | pass |
| `artifact_contract_bridge` | 21 branches become testable requirements | requirements map choices to discriminators | each branch has an acceptance surface | pass |
| `residue_ledger` | implementation details remain open | Define records them as Plan obligations | no missing implementation byte lowers Define completeness | pass |
| `protected_context_flag` | DomainSpec material is private | outputs stay in the private project namespace | no public or external transport | pass |

A full Dispatch Spec is required for the composed Define→Design→Plan route and
is authored at `EXECUTION-DISPATCH.json` during Plan. Define itself uses this
technique trace and performs no delegation or execution.

Skipped: `route_menu` because all blocker-level choices are resolved;
`ux-plan` because no rendered semantic UI is introduced; `tournament` because
the user selected one candidate direction.

