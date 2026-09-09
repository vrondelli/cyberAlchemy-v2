# OEW plan, architecture, and runtime audit strategy

Status: **closed — coverage rejected at loop ceiling**

Dispatch ID: `2026-07-27-oew-plan-architecture-runtime-audit`

Dispatch type: `review`

## P1 trigger decision

Dispatch is justified on all four P1 tests:

1. **Synthesis** — the question crosses architecture, executable planning,
   current receipts, and several runtime candidates.
2. **Context protection** — no single reviewer should have to hold every
   contract, runtime, reuse precedent, and authority boundary at once.
3. **Isolation** — formal ownership, empirical reuse, and adversarial
   operability require independent attacks before synthesis.
4. **Parallelism** — the three attacks and two verifier checks are independent
   within their respective waves.

The audit is read-only. It may recommend changes but cannot amend the OEW plan,
select an SWU, mutate implementation, promote ontology meaning, or grant
release authority.

## Audit question

Does the current OEW architecture and executable plan assign exactly one
governed owner to every L1 build, test, browser, pin, cache, isolation, and
receipt obligation? If not, which existing runtime can be reused safely, and
what is the smallest dependency-safe plan repair?

The current hypothesis to attack is that repeated `package.json` additions are
a symptom of a missing wave-level validation/runtime owner, not eight
independent feature defects.

## Lanes

| Lane | Shape | Purpose |
|---|---:|---|
| Attackers | 3 explorers, parallel, robot talks | Attack the complete corpus through formal contract, empirical runtime-reuse, and adversarial ownership methodologies. |
| Synthesizer | 1 writer | Reconcile attacks into candidate change requests and a ranked runtime-reuse matrix. |
| Verifiers | 2 skeptics, parallel | Falsify runtime feasibility and scope/authority claims through different attack vectors. |
| Coverage auditor | 1 auditor | Check complete coverage, current quotations, dropped refutations, and a claim-bounded recommendation. |

## Dependency flow

```text
attackers (parallel)
  -> synthesizer
  -> verifiers (parallel, one bounded correction loop)
  -> coverage-auditor
  -> parent decision
```

## Required outputs

- `attacks.md` — all initial attacks, robot-talk changes, verifier objections,
  and refuted candidates.
- `findings.md` — verified findings with quoted current evidence, severity,
  one-line repair, per-artifact `KEEP`/`FIX`, and a ranked runtime-reuse matrix.

The final recommendation must compare at least:

1. binding L1 validation ownership to the existing OEW upstream-preparation
   seam;
2. inserting one dedicated validation-bootstrap SWU;
3. adopting a current Arcanum runtime pattern through a private OEW adapter;
4. tactically amending SWU-OEW-007 to own shared scripts; and
5. reducing the plan to Node-native tests.

Successful execution of an existing runner is necessary but not sufficient for
reuse. The audit must also establish a project-local owner, version pin, cache
and network behavior, write isolation, deterministic entrypoint, and
receipt/cleanup boundary.

## Gate state

- Inventory preflight: ready with warnings; packet persisted beside this file.
- Candidate sheet form validation: pass (`schema 0.7.0`,
  `SHA-256 3006d2961bc89cf099ae72a23034ffd675a7b049440c807a2d4dc2d1475d92f8`,
  ledger mutation none).
- Two-agent check-tension: double pass on the same sheet digest; see
  `CHECK-TENSION.md`.
- Human confirmation: received for the frozen sheet.
- Dispatch ledger: one dispatch row and one append-only close row.
- Audit agents spawned: seven logical agents across four groups.
- Verifier-synthesis loops used: one of one.
- Coverage auditor: `RECOMMEND_REJECT`.
- Parent final approver: `REJECT`.
- Exit reason: `loop_ceiling_reached`.
- Substantive result: four MAJOR candidates, zero CRITICAL, zero MINOR;
  retained below acceptance.

Any edit to the candidate sheet after tension testing invalidates its digest
and requires a fresh form validation and two-agent tension gate.
