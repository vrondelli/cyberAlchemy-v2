# BMC-REL-001 Constraint Completion — Invoke Define Candidate

This candidate package defines the bounded constraint-authoring capability needed to continue `BMC-REL-001`. It compiles the fixed D01-D08 source contracts, preserves the current candidate packet exactly, and names the remaining decision frontier without choosing any remaining policy.

## Status

- Invoke mode: `define`
- Define phase: `artifact-authored-candidate`
- Design handoff: `blocked-pending-exact-owner-approval`
- Authority effect: `none`
- Canonical mutation: `none`
- Implementation or enforcement: `not-authorized`

## Package Map

| Artifact | Purpose |
| --- | --- |
| `SPEC.md` | DomainSpec-shaped constraint-authoring baseline |
| `GLOSSARY.md` | Evidence-linked terms and unresolved vocabulary boundaries |
| `DEFINE-CONTEXT.md` | Closed Context Builder denominator and Inventory lookup record |
| `DEFINE-INTENT.md` | Exact authorization and zero-question Interrogation result |
| `DEFINE-TEMPLATE-SELECTION.md` | DomainSpec template eligibility and no-tie result |
| `DEFINE-DISPATCH-TECHNIQUE-TRACE.md` | Techniques actually used by this bounded helper route |
| `DEFINE-DISTILL-VALIDATION.md` | Standard, one-track, two-round Proposer/Balancer simulation |
| `DEFINE-COMPLEXITY-EXAMPLES.md` | Low, medium, and complex explanatory hypotheticals |
| `DEFINE-GAPS.md` | Exact remaining subject frontier and separate Define approval gate |
| `DEFINE-TRANSPORT-REPORT.json` | Non-authority stage transport report |
| `DEFINE-RESULT.md` | Invoke Define result and next decision |
| `DEFINE-APPROVAL-MANIFEST.json` | Closed digest set for exact owner approval |
| `DEFINE-VALIDATION.json` | Mutable live-validation receipt, excluded from approval closure |
| `validators/validate-bmc-rel-constraint-completion-define.mjs` | Deterministic sidecar validator |
| `evidence/RUNTIME-HANDOFF.md` and `.json` | Preserved, pre-existing runtime evidence |

## Validation

Run the sidecar validator with the pinned runtime:

```bash
/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/define/validators/validate-bmc-rel-constraint-completion-define.mjs
```

A passing Define validator proves candidate authoring and digest closure only. It does not approve the candidate, start Design, accept the BMC packet, or establish registry release or mutation-runtime readiness.
