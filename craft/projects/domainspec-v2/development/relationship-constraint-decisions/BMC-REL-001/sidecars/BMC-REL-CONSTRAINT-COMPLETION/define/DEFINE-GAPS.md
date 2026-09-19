# Define Gaps and Gates

## Exact Remaining Subject Frontier

| ID | Unresolved domain | Required later evidence | Owner and route |
| --- | --- | --- | --- |
| `F-NONNUMERIC` | Nonnumeric pass: duplicates, ordered occurrence representation, inverse views, self-edge/cycle topology, hostile fixtures, and partial-view behavior. | separate owner decisions, closed representation contracts, positive and hostile fixtures | relationship decision owner through a later owner-gated authoring route |
| `F-PER-FACT` | Per-fact ownership-dimension and membership-kind representation plus executable fixtures. | one exact representation for each fact qualifier, registry-digest binding, positive and hostile executable fixtures | relationship/definitions owners, then later Design/Plan owners |
| `F-RUNTIME` | Runtime-cardinality semantics. | explicit concept-versus-runtime contract and runtime evidence boundary | relationship decision owner before enforcement design |
| `F-NUMERIC` | Numeric bounds separately. | relation-specific evidence, closure basis, owner selection, and no token-derived inference | relationship decision owner |
| `F-PACKET-ACCEPTANCE` | Packet-wide owner acceptance. | all row and facet decisions complete plus exact acceptance receipt | packet owner |
| `F-IMPLEMENTATION` | Implementation and enforcement later. | approved Design and Plan, execution admission, tests, and implementation receipts | later lifecycle and execution owners |

No policy in this remaining frontier is selected by this package. The order above is a separation contract, not authorization to execute each item automatically.

## Separate Route Gate

| ID | Status | Gate | Effect |
| --- | --- | --- | --- |
| `G-DEFINE-APPROVAL` | `block` | exact owner approval of `DEFINE-APPROVAL-MANIFEST.json` | blocks Invoke Design; does not change Define authoring verdict |

This approval is distinct from `F-PACKET-ACCEPTANCE`. Approving the Define baseline allows a later Design route to use these exact artifacts as input; it does not accept the BMC decision packet or any unresolved policy.

## Layering Gap

No implementation-layering seed is emitted because implementation structure and promotion evidence are downstream of approved Design and Plan. The later Plan/full/validate route must create or adopt its own layering artifact under fresh authority.

## Gap Ledger Verdict

- Define-specific blocker ambiguity: `0`
- Target-artifact unresolved domains: `6`, all intentional and owner-routed
- Design handoff blockers: `1`, exact Define approval
- Authority effect: `none`
