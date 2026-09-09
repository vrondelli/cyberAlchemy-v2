# Claim Ledger

Status: working adjudication ledger

| ID | Draft claim | Kind | Support | Disposition and ceiling |
| --- | --- | --- | --- | --- |
| WP-C01 | The protocol models sharing as expansion from `{A}` to `{A,B}`. | product meaning | `LOCAL-THESIS`, `LOCAL-DEFINITIONS`, `LOCAL-CAP-BASE` | Include as protocol definition; never imply exclusive legal transfer. |
| WP-C02 | Stable Knowledge Identity is distinct from wallet and encryption keys. | product meaning | `LOCAL-DEFINITIONS`, `LOCAL-HOSTED-DEFINITION-ACCEPTANCE`, `LOCAL-HOSTED-CAPABILITY-ADOPTION` | Include; hosted definitions and Product Capability are accepted/adopted, while ontology admission and later D65 stages remain open. |
| WP-C03 | Plaintext and content keys need not enter public chain state or hosted persistence. | architecture and historical tested behavior | `LOCAL-CAP-DEVNET`, `LOCAL-HOSTED-IMPLEMENTATION-BINDING-PREACCEPTANCE` | Include as design invariant and accepted-target preacceptance property; not evidence about later replacement bytes or a production secrecy proof. |
| WP-C04 | A successful modeled grant preserves A, adds B, increments revision, binds B's commitment, and consumes replay identity. | formal model | `LOCAL-LEAN-EVIDENCE` | Include as a Lean model theorem only; not a Solana or Rust refinement proof. |
| WP-C05 | The accepted-target preacceptance run completed the two-party local grant, decryption, and reissue test. | historical implementation observation | `LOCAL-HOSTED-IMPLEMENTATION-BINDING-PREACCEPTANCE` | Include only for the accepted historical target; finality was mocked and the current replacement bytes were not assessed. |
| WP-C06 | Accepted-target preacceptance covered client-held cryptography, message construction, instruction construction, and bundle currency. | historical implementation observation | `LOCAL-HOSTED-IMPLEMENTATION-BINDING-PREACCEPTANCE` | Include only for the accepted historical target; not current replacement-byte evidence, wallet compatibility, or browser-security certification. |
| WP-C07 | The PostgreSQL adapter migrated, journaled, archived, and recovered state in a disposable loopback environment. | implementation observation | `LOCAL-POSTGRES-EVIDENCE` | Include; do not call this independent off-host backup or production durability. |
| WP-C08 | The hosted process served its health boundary on loopback. | implementation observation | `LOCAL-HTTP-EVIDENCE` | Include only as process/route smoke evidence. |
| WP-C09 | The finality adapter read a prior finalized Devnet transaction and exact program-owned account state. | external observation | `LOCAL-DEVNET-OBSERVATION` | Include as read-only evidence; not a fresh hosted third-party transaction. |
| WP-C10 | The hosted vertical is D65-conformant. | governance claim | `LOCAL-HOSTED-ONTOLOGY-ADMISSION`, `LOCAL-HOSTED-DOMAINSPEC-ADMISSION`, `LOCAL-HOSTED-SYSTEM-ONTOLOGY-ADMISSION`, `LOCAL-HOSTED-IMPLEMENTATION-BINDING-ACCEPTANCE`, `LOCAL-HOSTED-CONFORMANCE`, `LOCAL-HOSTED-IMPLEMENTATION-BINDING-CANDIDATE-002`, `LOCAL-HOSTED-IMPLEMENTATION-BINDING-PREACCEPTANCE-002`, `LOCAL-HOSTED-IMPLEMENTATION-BINDING-DRIFT-002` | Exclude; historical assessment is `BLOCK`, candidate 002 is stale after preacceptance, and D65 conformance remains `not_evaluable`. |
| WP-C11 | The cryptographic construction is production secure. | security claim | no independent security review | Exclude. Describe selected algorithms and open review obligations only. |
| WP-C12 | The three storage layers are independent backups. | durability claim | one local SQL failure domain | Exclude. State the opposite explicitly. |
| WP-C13 | Protocol co-ownership confers copyright, license, or legal title. | legal claim | no legal model or review | Exclude. |
| WP-C14 | Users want or will pay for this product. | market claim | no user or market study | Exclude; list as future empirical work. |
| WP-C15 | Later pricing, royalties, rights, and reputation can build on this substrate. | product hypothesis | product roadmap only | Include as future work, not implemented behavior. |
| WP-C16 | The historical implementation README recorded no critical/high finding and one moderate transitive advisory. | implementation observation | `LOCAL-HOSTED-IMPLEMENTATION` | Dated observation only; no fresh dependency audit or security clearance. |
| WP-C17 | The encrypted durable successor defines seven formal claims projected fifteen times across Lean, TLA+/TLC, and Alloy with deterministic `PASS_BOUNDED` receipts. | formal model | `LOCAL-EVF-CLAIMS-V2`, `LOCAL-EVF-FORMAL-RECEIPT-V2` | Include as bounded model evidence; not Rust refinement, external behavior, acceptance, or aggregate conformance. |
| WP-C18 | Five local provider observations report 29 Rust, 3 cryptographic, 1 PostgreSQL, 13 Solana program-test, and 7 formal-provider cases as `PASS_BOUNDED`. | implementation observation | `LOCAL-EVF-PROVIDER-OBSERVATIONS` | Include only as exact historical bounded observations for their bound bytes and environments. |
| WP-C19 | The relation matrix contains 204 distinct system-ontology relation mappings to bounded providers. | structural correspondence | `LOCAL-EVF-RELATION-MATRIX` | Include as mapping coverage; each record explicitly is not independent relation-specific behavioral proof. |
| WP-C20 | Independent review 009 reports zero unresolved high or critical findings for immutable candidate 011 while carrying ten medium residues. | independent review | `LOCAL-EVF-INDEPENDENT-REVIEW-009` | Include with both halves; not production readiness, aggregate conformance, or proof of a live Devnet effect. |
| WP-C21 | The current evidence stack proves the exact formal-to-implementation refinement relation. | conformance claim | no accepted E2 refinement receipt | Exclude; formal claims, structural relation mappings, and implementation observations do not establish this join. |
| WP-C22 | The current evidence stack establishes aggregate hosted protocol conformance. | aggregate conformance claim | no accepted E6 adjudication | Exclude; mandatory predecessors and environment evidence remain incomplete or unaccepted. |

## Adjudication rule

A paper sentence may be stronger than a source only when it is explicitly
marked as synthesis, hypothesis, or future work. Passing validation cannot
upgrade a governance, security, legal, market, durability, or production claim.

## September 6 development claims

| ID | Claim | Support | Ceiling |
| --- | --- | --- | --- |
| WP-C23 | Encrypted account recovery and interrupted-save retry were observed locally. | `LOCAL-SEP6-BROWSER-RECOVERY`, `LOCAL-SEP6-COMMIT-TABS`, account sources | Test signer; no wallet compatibility, lost-secret recovery, or divergent-edit merge. |
| WP-C24 | Original-file retention starts at first signed acknowledgement and resets on later distinct acknowledgements. | September 6 file sources; `LOCAL-SEP6-BROWSER-RECOVERY` | Client acknowledgement, not proof of disk save; no independent backup erasure claim. |
| WP-C25 | Participating PostgreSQL writers are excluded by a shared session lock. | `LOCAL-SEP6-SINGLE-WRITER`, `LOCAL-SEP6-SRC-STORE-RS` | Direct SQL and old binaries excluded; disconnected reads may be stale. |
| WP-C26 | Known pre-submission checkpoint failure can be retried. | `LOCAL-SEP6-CHECKPOINT` | Restored uncertain submissions remain blocked; no general crash-recovery proof. |
