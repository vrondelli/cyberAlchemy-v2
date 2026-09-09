# Define Context: Ontology Vault Runtime API

## Target

Author a governed Define, Design, and Plan package for the owner-preserving
Ontology Vault runtime/API accepted in
[`../findings.md`](../findings.md). Invoke is the authoring capability; the
target is a private runtime module whose lifecycle and implementation owners
are still unselected.

## Approval And Interview Record

- User request: `$invoke define design and plan`.
- Approval meaning: author all three lifecycle artifacts from the accepted
  research packet.
- Questions asked: zero.
- Why zero is valid: the accepted research fixes the target, v0 boundary,
  non-goals, claim ceiling, package sequence, and unresolved decisions. Asking
  the user to repeat them would not discriminate the design.
- Approval does not select runtime-contract, implementation, transition,
  retention, security-risk, or release owners.

## Bounded Context

| Obligation | Selected evidence | Status |
| --- | --- | --- |
| Preserve authority | `../findings.md` §§0–2, 13 | covered |
| Define package/adapter/snapshot contracts | `../findings.md` §§3–4 | covered |
| Define API and typed failures | `../findings.md` §§5–6 | covered |
| Preserve resource/security ceilings | `../findings.md` §7 | covered |
| Keep project adapters deferred | `../findings.md` §§8, 11 | covered |
| Keep implementation blocked | `../findings.md` §§9, 12–13 and `../CLOSEOUT.json` | covered |

Mode: lean. The three accepted packet files are sufficient for the Define
baseline; downstream Design binds exact generated Define artifacts separately.

## Non-goals

No source code, runtime, fixture execution, owner selection, package adapter,
measurement, deployment, publication, registry release, ontology mutation, or
promotion is in scope. `authority_effect` remains `none`.

