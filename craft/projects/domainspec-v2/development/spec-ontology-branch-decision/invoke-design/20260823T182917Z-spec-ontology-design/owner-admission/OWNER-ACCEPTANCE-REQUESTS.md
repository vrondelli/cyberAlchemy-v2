# Specification-Ontology Design Contract Acceptance Requests

Status: `request-candidate-not-sent`

Package: `dsv2-spec-ontology-owned-branches-design@1`

Manifest digest: `05eb47c790f764795825fd6cf951521bb3a4f73ed75a799c334d662703dbba6a`

Package content digest: `58c3c2274ce02bcb8b903e416c7bb84740d40f9e8735e84808e6ad39bb97d7ef`

## Request boundary

These are prepared requests, not owner receipts. They ask each owner to accept or reject only its exact Design-contract slice. Acceptance would establish owner agreement with this architecture contract; it would not create canonical schema adoption, materialize or migrate bytes, execute validators, discharge an obligation, promote a record, or authorize publication.

Exact role/node/relation/receipt/manifest/catalog/projection schema files are not yet materialized. Therefore no response to this request can be reported as canonical schema admission. Any later schema bytes require a new package manifest and fresh exact owner review.

## Owner requests

| Request ID | Owner route | Exact JSON pointers | Requested decision | Explicit non-scope |
| --- | --- | --- | --- | --- |
| `OAR-01` | DomainSpec v2 authority-model and primary-source owner | `/owner_roles/0`, `/structural_envelope` | accept or reject the formal-claims role under existing authority and the DomainSpec structural posture | no new authority kind; no CAV2-local acceptance standing in for DomainSpec adoption |
| `OAR-02` | business source owner | `/branches/0`, `/node_contracts/0`, `/acceptance_receipt_contracts/1` | accept or reject business-meaning ownership and fidelity-only contract | no formal statement authorship, proof, discharge, or promotion |
| `OAR-03` | formal-claims owner role holder | `/branches/1`, `/owner_roles/0`, `/node_contracts/1`, `/relation_contracts/0`, `/acceptance_receipt_contracts/0` | accept or reject exact claim, `formalizes`, and formal assertion contract | no business-meaning ownership, discharge, or publication |
| `OAR-04` | specification-composition owner | `/owner_roles/1`, `/node_contracts/2` | accept or reject ordered immutable composition | no right to rewrite or supersede claim meaning |
| `OAR-05` | validation-governance | `/branches/2`, `/node_contracts/3`, `/relation_contracts/1`, `/derivation_context_manifest_contract`, `/validator_contracts` | accept or reject obligation identity, derivation, provenance, and validator boundary | no claim meaning, proof truth, runtime correctness, or discharge |
| `OAR-06` | proof/evidence owner | `/branches/3`, `/node_contracts/4` | accept or reject evidence-record and discharge-posture boundary | no business/formal meaning or derivation authority |
| `OAR-07` | ontology-protocol and relationship owners | `/logical_model`, `/structural_envelope`, `/relation_contracts`, `/catalog_contract` | accept or reject four-branch, identity, endpoint, direction, inverse, and catalog grammar | no endpoint truth or semantic owner acceptance |
| `OAR-08` | owner-authentication mechanism and verifier owners | `/owner_authentication_contract` | accept, reject, or require a specific principal/role/receipt authentication topology | no semantic truth, owner-scope expansion, or self-issued proof by default |
| `OAR-09` | projection, privacy, and publication owners | `/projection_contract` | accept or reject deterministic private projection and separately gated public-output bindings | no source promotion or publication from freshness alone |
| `OAR-10` | negative-corpus and aggregate-command owners | `/validator_contracts`, `/negative_corpus` | accept or reject ordered typed aggregation and the fixed twelve classes | no owner-result reinterpretation or authority grant |
| `OAR-11` | promotion-lifecycle owner | `/admission_gate`, `/migration_boundary` | accept or reject exact-byte admission/invalidation and migration prerequisite boundary | no semantic acceptance by implication and no migration authorization |

All JSON pointers resolve within `design/CANDIDATE-CONTRACTS.json` at SHA-256 `b933114000253986fbed175b6108b931c5289fc1603f80f8cd7bc0e38d7ee2b1`. The companion human architecture is SHA-256 `36907f247ee3de169eb0a2f10b697a423e0143a8dc3af57aa4d39415e675ea25`.

## Required response shape

Each response must contain:

```yaml
request_id: OAR-XX
package_id: dsv2-spec-ontology-owned-branches-design@1
package_manifest_digest: 05eb47c790f764795825fd6cf951521bb3a4f73ed75a799c334d662703dbba6a
package_content_digest: 58c3c2274ce02bcb8b903e416c7bb84740d40f9e8735e84808e6ad39bb97d7ef
contract_artifact_digest: b933114000253986fbed175b6108b931c5289fc1603f80f8cd7bc0e38d7ee2b1
accepted_json_pointers: [exact pointers from the request row]
decision: accept-contract | reject-contract | defer
decision_owner_ref: exact owner namespace/id/version/digest
current_owner_role_assignment_ref: exact ref/digest
decision_scope: exact row scope
explicit_non_scope: exact row non-scope
decision_timestamp: RFC3339
decision_evidence_ref: exact path-or-handle plus digest
receipt_digest: sha256 over the complete response excluding receipt_digest
```

If owner authentication is required for the route, the response must also bind the fields in `/owner_authentication_contract`. A semantic owner receipt cannot authenticate itself unless the governing owner contract explicitly permits it.

## Invalidation and join rule

- Any acceptance-bound byte or scope change invalidates every affected request and receipt.
- Owners respond independently; one receipt never covers another owner's slice.
- A reject or defer remains visible and blocks the corresponding downstream edge.
- The requests do not join into canonical application until all required slices have current exact responses and separately materialized schemas have their own exact acceptance package.
- No request has been sent and no acceptance has been received in this Invoke Design run.
