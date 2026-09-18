# Service runbook

**Lifecycle status:** NOT_APPLICABLE

**Audience:** Future ARE service operators and incident responders.

**Owner:** Unassigned operations owner.

**Last reviewed:** 2026-09-17.

**Applies to:** No operated ARE service currently exists.

**Claim ceiling:** Defines the runbook contract and current developer diagnostics. It is not an active on-call or incident-response procedure.

## Current developer diagnostics

From the implementation root, these existing read-only or test commands inspect
the local product candidate:

~~~sh
node bin/are.mjs doctor --json
node bin/are.mjs candidate inspect --json
node docs/verify-docs.mjs
~~~

Use [Troubleshooting](TROUBLESHOOTING.md) for candidate-source drift, routing,
gateway reconnect, temporary-directory and research-storage failures. These
commands have no dashboard, pager, service-level target, or production escalation
meaning.

## Required active runbook structure

Each incident procedure must identify:

1. User-visible symptom and applicable SLI.
2. Alert name, severity and exact telemetry query.
3. Dashboard/resource identifier and expected healthy range.
4. Immediate containment that preserves unknown external outcomes.
5. Diagnosis steps and evidence to capture.
6. Mitigation and rollback commands tested against the deployed artifact.
7. Backup/restore and data-integrity checks.
8. Security, privacy, provider and product escalation paths.
9. Recovery and user-impact verification.
10. Post-incident evidence, ownership and follow-up.

Secret values must never appear in the guide. Credential references and access
procedures must be tested by authorized operators.

## First game-day scenarios

- gateway process loss before and after acknowledgement.
- corrupt or incomplete session-store tail.
- missing final Reasoning State checkpoint.
- backend process timeout or protocol mismatch.
- provider unavailable or usage telemetry absent.
- state/disk quota exhaustion.
- secret-provider unavailable.
- failed deployment rollback or restore.
- suspected credential or retained-data exposure.

The runbook becomes `ACTIVE` only when every referenced alert, query, dashboard,
command, contact and credential reference exists and the selected scenarios have
timed recovery evidence.

## Open Questions

- Which service topology and telemetry backend will the runbook target?
- Who carries on-call and security escalation ownership?
- Which failure exercises define minimum operational readiness?
