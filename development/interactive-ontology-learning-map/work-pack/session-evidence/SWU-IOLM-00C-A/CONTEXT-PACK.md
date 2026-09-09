---
schema: context-pack/v1
task: SWU-IOLM-00C-A
mode: strict-on
status: ready
preparedAt: 2026-07-20
filesSelected: 8
excerptLines: 54
---

# Context Pack — SWU-IOLM-00C-A

## Execution target

Implement only the candidate input, build-receipt, and view contracts plus one
positive envelope and discriminating negative fixtures. The result proves the
candidate authority guard; it does not compile the candidate graph, build UI
views, or perform the later authoritative rebind.

## Selected evidence

| # | Selector | Obligation carried into execution |
|---|---|---|
| 1 | `work-pack/tasks/TASK-IOLM-00C-CANDIDATE-SUBSTRATE.md#SWU-IOLM-00C-A` | Exact inputs, outputs, write scope, named rejects, validation, and stop boundary. |
| 2 | `SPEC.md#Candidate-record-contract`, `#DomainSpec-graph-consumer-boundary`, `#Non-collapse-invariants`, `#Acceptance-criteria` | Candidate posture is machine-visible; stable identity and provenance are mandatory; candidate evidence never satisfies `G-DSV2-SG`; AC-12 is the local acceptance anchor. |
| 3 | `ARCHITECTURE-BUNDLE.md#Component-contracts`, `#Stable-identity-policy`, `#Validation-architecture`, `#Degraded-behavior` | Candidate adapter emits normalized candidate data only; identity is deterministic; missing posture/provenance/identity blocks; missing authoritative `Sg` does not block candidate work. |
| 4 | `IMPLEMENTATION-LAYERING.md#Active-layer-window`, `#Non-regression-guardrails` | L0C is active and only 00C-A is selected; L0A and 00C-B/C remain outside this session. |
| 5 | `refreshes/2026-07-20-candidate-posture-apply/REFRESH-REPORT.md#Approval`, `#Applied-deltas`, `#Next-route` | Operator-approved candidate-first posture authorizes one Task Session for 00C-A and narrows `G-DSV2-SG` to authoritative labeling/rebind. |
| 6 | `work-pack/shared/G-OWNER-DECISION.md#Decision-envelope` | `private-learning-map-product-owner` may govern private projection fields/enums but not DomainSpec, CAV2, Craft, proof, runtime, or publication authority. |
| 7 | `projects/domainspec-v2/impl/spec/minted-project/INDEX.md#Authority`, `#Boundary-rules` | Source owners retain meaning; graphs/manifests/receipts are generated read models; digests are lowercase SHA-256; generated records are not hand-repaired. |
| 8 | `projects/domainspec-v2/impl/spec/minted-project/contract-manifest.json#/schemas` | Bind the candidate wrappers to the live minted graph, source-manifest, and build-receipt schema identities without copying their authority. |

## Obligations and tests

| ID | Required behavior | Acceptance evidence |
|---|---|---|
| O-01 | All three records require `posture: candidate`. | Positive passes; missing-posture and authoritative-self-label fixtures fail. |
| O-02 | Input binds a stable candidate ID, project ID, source-set digest, compiler identity/version, and live minted schema identities. | Positive passes; missing source digest/compiler version and invalid stable ID fail. |
| O-03 | Build receipt remains non-authoritative candidate evidence and cannot claim any authority gate. | `G-DSV2-SG` evidence-claim fixture fails by named code. |
| O-04 | View binds the same candidate/source/compiler identity, contains stable node/edge IDs, and carries record-level provenance. | Positive passes; missing provenance and duplicate/dangling identity mutants fail. |
| O-05 | Cross-document identity, source digest, and compiler version agree. | Validator performs semantic checks after Draft 2020-12 schema checks. |
| O-06 | Validation is deterministic and fixture expectations are explicit. | Host-native command exits zero only when the positive passes and every named negative is rejected for its expected code. |

## Constraints

- Implementation writes: `prototype/contracts/candidate/` and
  `prototype/fixtures/candidate-contract/` only.
- Session evidence and status synchronization may update this SWU's work-pack and
  Craft surfaces after validation.
- Use Draft 2020-12 JSON Schema and the already available Python `jsonschema`
  validator; install no dependencies.
- Treat minted receipts as structural/conformance evidence, not semantic proof or
  authority admission.
- Do not mutate `projects/domainspec-v2`, public `arcanum/`, 00C-B/C artifacts,
  production surfaces, or upstream FPR state.

## Gate interpretation

- `G-OWNER`: pass for the bounded private projection contract.
- `G-POSTURE`: pass through `DEC-CAV2-IOLM-POSTURE-001` and the apply-approved
  refresh receipt.
- `G-DSV2-SG`: open, but relevant only to L0A authoritative labeling/rebind.
- Precedence: the later apply-approved posture receipt supersedes the older
  blanket prototype block in `G-OWNER-DECISION.md` for this selected L0C unit
  only. It does not widen G-OWNER or alter the authority gate.

## Ready verdict

`READY` — no unresolved blocker prevents SWU-IOLM-00C-A. Stop after its result
receipt; selecting or executing 00C-B requires a new explicit continuation.
