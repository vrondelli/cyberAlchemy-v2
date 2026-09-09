# Private interface and rollout policy v1

- **Owner:** `human-project-gatekeeper@local`
- **Authority basis:** explicit D6 selection in
  [`ENGINE-CLOSURE-GATE.md`](ENGINE-CLOSURE-GATE.md)
- **Version:** `1.0.0`
- **Status:** selected; local-interface evidence pending; rollout deferred
- **Effective time:** `2026-07-22T19:51:16-03:00`
- **Selector:** any integration or packaging of the private candidate
- **Revision route:** reopen D6 through `decision-gate` under the accountable
  human project gatekeeper or an explicitly recorded successor
- **Gate references:** `G-ARE-L3`, `BLK-ARE-ROLLOUT-001`, `SWU-ARE-008`

## Rules

1. Expose only a versioned private local CLI with no network listener.
2. Preserve typed outcomes, digests, full gate records, and non-authority
   metadata.
3. Reject unknown versions, missing authorization, envelope mismatch, and real
   effect requests.
4. Invocation remains manual and offline.
5. Shadow deployment, canary deployment, public release, general-engine
   promotion, and real effects require new gates.
6. Disabling or removing the CLI never rewrites historical records.

## Examples

- A valid local fixture may be evaluated through the private CLI.
- A remote request has no listener and cannot enter the candidate.
- A real-effect flag is rejected even when the semantic outcome is positive.

## Deferred residue

`GAP-ARE-ROLLOUT-READINESS` remains unproven and outside current scope. Selecting
no rollout removes it from the local-CLI critical path but does not close it.
