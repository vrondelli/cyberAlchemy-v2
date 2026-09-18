# KELD × ARE release-readiness audit

Audited: 2026-09-17. Objective: prepare the private ARE engine for sale through
KELD, preserving the complete product rather than substituting a demo download.

**Conclusion: working private product/delivery prototype; not ready for customer sales.**
The import-and-research request is fulfilled. The broader sale-preparation plan
remains incomplete. No publication, live payment or sale approval is established.

## Requirements and current evidence

| Requirement | Evidence inspected | Result / practical limit |
| --- | --- | --- |
| Import the supplied KELD project under CyberAlchemy v2 | Import manifest, verifier, preserved prototype | Complete: 59 files, byte-identical; six baseline outputs reproducible. |
| Research how KELD connects to ARE | `ARE-INTEGRATION-RESEARCH.md`, source references, official platform sources | Complete as candidate architecture research; does not select merchant or license policy. |
| Deliver actual complete engine | Private artifact manifest and bundle manifest | Local candidate complete: 3,426 engine files; no feature trimming to obtain a passing test. |
| Verify exact artifact bytes | Actual archive hashes and manifests | Engine `a81380ca…7469d6`; customer bundle `b5c0864c…e8b097`. Full hashes in artifact reports. |
| Current tools match delivered tools | Compared current source hashes with every `tools/` entry in bundle inventory | All eight current: extractor, installer, setup, launcher, runtime, lock helper, reconciliation tool, project starter. |
| Standalone installation | Bundle manifest/container evidence | Complete for tested Linux/Node setup: no development checkout or host home mounted. Other OS support unproved. |
| Engine regression checks | Engine artifact manifest | 1,244 cases across 156 files passed from extraction. This is the engine's declared suite, not a commercial acceptance test. |
| Customer-owned context | Separate-root tests and real-turn result | One synthetic project passes real model task with exact supplied code and zero observed tools. Not broad quality/retention evidence. |
| Persistence and recovery | Customer-turn result and launcher source | Completed frontier restored and exact completion replayed without upstream calls. Outer Linux lock release passes, but a killed full wrapper leaves its internal ledger lock and blocks restart. Four customer recovery tests prove refusal without modifying invalid state. Explicit stopped-writer reconciliation now preserves a backup and permits restart for a verified checkpointed ledger; refusal and restart tests pass. Automatic recovery, interrupted effects and transport resumption remain open. |
| Explain installation to customers | Bundled README/sample and quickstart | Customer definitions/instructions can now create a validated explanation project using the packaged starter. Broader routing authoring and update migration remain incomplete. |
| Storefront reflects the actual offering | Generated release metadata, connected-preview code, browser evidence | 27 checks pass. Preview-only; original starter terms explicitly provisional. |
| Bound selected price and reserve first-100 benefits | Commerce ledger and tests | Implemented locally; first-100 capacity is transactional and customer-scoped. Reservation/calendar policies still need owner adoption. |
| Verify an actual payment provider | Commerce method trust boundary; no provider adapter present | Missing. Synthetic receipts cannot prove signature verification, provider customer binding, taxes or successful payment. |
| Authenticate customers and recover accounts | Delivery methods accept trusted caller identity; no identity integration present | Missing. Passing a customer string in a unit test is not authentication. |
| Deliver purchased artifact safely | Delivery module, 13 commerce tests, real-bundle local journey | Internal grants/bytes path works; release mode denies unapproved candidate. Protected HTTP delivery remains missing. |
| Provide 12 months of upgrades | Benefit dates and boolean status in ledger | Partial. There is no versioned update catalogue or release-by-release eligibility policy. |
| Provide direct-maker support | Starter promise; contact/support channel not configured | Missing operational handoff and destination. |
| Distribution rights and customer license | File/package inventory and clarified custom-license direction; no final engine license bundle | Open. Apache-2.0 is superseded for owner-controlled ARE code. Added functions/integrations qualify redistributed copies for resale; cosmetic edits, renaming and bug fixes do not; hosted access and paid support are outside the resale rule. Exact terms, internal-code ownership and third-party notices require review. |
| Provider sandbox buyer journey | No real checkout/session/webhook evidence | Missing. Local synthetic-payment delivery is not this acceptance criterion. |
| Release approval/publication | Manifest flags false; checkout/fulfillment disabled | Not authorized or performed. Requires completed release review and exact later authorization. |

Evidence locations: [artifact](PRIVATE-ARCHIVE.md), [standalone bundle](CUSTOMER-BUNDLE.md),
[customer integration](CUSTOMER-PROFILES.md), [storefront](CONNECTED-PREVIEW.md),
[commerce source and tests](../commerce/README.md), and [distribution review](DISTRIBUTION-AUDIT.md).
Ignored machine-readable results remain local under `evidence/`; durable reports
record their identities and claim limits. No percentage-complete score is inferred.

## Next work in dependency order

1. **Owner decisions:** license direction and payment provider are already pending
   questions. Then establish merchant/account, customer identity, support destination,
   reservation/refund policy and upgrade-access policy. Do not infer these from
   repeated requests to continue.
2. **Independent implementation:** harden interrupted-state recovery and produce
   the customer authoring/migration path. Those can proceed while commercial
   decisions are pending; they do not substitute for a real buyer journey.
3. **Provider and identity integration:** bind trusted customer identity and provider
   payment verification to the existing ledger. Exercise duplicate, delayed and
   mismatched events in the selected provider's actual sandbox.
4. **Customer delivery and upgrades:** place the tested grant boundary behind
   authenticated HTTP, enforce approved release catalogue entries, add account
   recovery and version-specific update eligibility under the selected policy.
5. **Distribution review:** finish file ownership/private-content review and notices,
   build the exact reviewed artifact, then rerun its relevant installation/integration
   checks. License text alone cannot resolve undistributed dependency rights.
6. **Acceptance:** real provider test checkout → verified payment → authenticated
   download → hash verification → installation → supported agent task; include
   failure/retry/recovery cases and exact support/update terms.
7. **Launch decision:** review concrete evidence and exact configuration, then request
   separate authorization for publication and live operations.

## Corrections to prior progress wording

- Customer-profile setup and a real task are implemented; old notes saying they
  remained entirely unimplemented are historical and have been corrected in the plan.
- No checked-in engine source copy was added, but ignored private archives do contain
  the complete engine. Saying “no engine source duplicated into KELD” was too broad.
- Local delivery is functional with synthetic payment/customer inputs. It is neither
  an actual provider-sandbox purchase nor a public download service.
- Core benefits store an expiry; this does not implement a usable upgrade service.

## Commercial handoff

The [commercial integration contract](COMMERCIAL-HANDOFF.md) maps current ledger,
checkout and delivery interfaces to the pending owner decisions and exact sandbox
acceptance checks. This is the next commerce milestone; more local packaging
checks cannot substitute for provider verification and customer authentication.

## Open Questions

Pending owner decisions are recorded in [project intake](PROJECT-INTAKE.md#open-questions)
and the commerce README. License and provider questions have been asked in the
conversation and remain unanswered at this audit. The full sale-preparation goal
must remain open until its acceptance requirements are actually demonstrated.
