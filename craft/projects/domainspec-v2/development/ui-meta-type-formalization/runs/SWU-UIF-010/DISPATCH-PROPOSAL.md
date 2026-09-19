---
dispatch_id: 2026-07-11-uif-010-replication-review
dispatch_type: review
status: closed-resolved
created: 2026-07-11
working_folder: projects/domainspec-v2/development/ui-meta-type-formalization/replication/
max_loops: 1
final_approver: Vlachopulos, Ioannis
---

# UIF-010 Replication And Adversarial Review Dispatch

## P1 Trigger

Dispatch: **yes**. Nine candidate twins, multiple second-corpus sources, and five
attack dimensions require synthesis; independent attacks protect parent context,
remain discardable, and can run in parallel.

## Global Anti-Bias

Composite theme: replication credibility versus vacuity, collapse, framework
bias, and authority leakage.

## Group 1 - Replication Attackers

- Role: `explorer` attackers over the full nine-candidate corpus.
- Parallelism: three agents in parallel; `robot_talks: true`.
- Anti-bias axis: composite `methodology + source-corpus`.
- Expected output: initial and final attack positions, second-corpus mappings,
  counterexamples, criterion replay results, and evidence-bounded change requests.

| Agent | Angle | Output expectation |
| --- | --- | --- |
| Simon, Herbert | empirical source-corpus trace across repository-owned real UI artifacts and at least two implementation styles | Candidate-by-candidate specimen map, provenance, normalization, portability observation, and absent-evidence rows. |
| Turing, Alan | computational criterion replay and generated counterexample search against unchanged candidate schemas/fixtures | Reproducible accept/reject traces, collapse pairs, mutations, and mechanical counterexamples. |
| Ashby, W. Ross | adversarial operability and authority trace across DS-D1/DS-D8 boundaries, relationship gaps, framework coupling, and maintenance cost | Authority-leakage attacks, scope failures, operational residue, and kill/demote conditions. |

### Predicted Disagreements

- Simon runs empirical repository specimens while Turing runs computational
  schema replay on the methodology axis; a bias toward hand-picked examples in
  Simon would be exposed by Turing's mechanical counterexamples.
- Simon runs observed portability over real source corpora while Ashby runs
  adversarial authority/operability analysis on the composite
  `methodology + source-corpus` axis; a bias toward visible usability in Simon
  would be exposed by Ashby's ownership and maintenance failures.
- Turing runs mechanical conformance while Ashby runs governance and operational
  failure analysis on the `methodology` axis; a bias toward “validator pass
  equals credible type” in Turing would be exposed by Ashby's authority and
  lifecycle attacks.

## Group 2 - Synthesizer

- Agent: Mac Lane, Saunders.
- Role: `writer`.
- Dependency: sequential after replication attackers.
- Purpose: preserve initial/final attacker returns, write `attacks.md`, and
  synthesize candidate-by-candidate replication findings without final approval.

## Group 3 - Finding Verifiers

- Role: `skeptic` verifiers over every synthesized claim.
- Parallelism: three agents in parallel after the writer opens the zig-zag.
- Anti-bias axis: `attack-vector`.
- Expected output: UPHELD/REFUTED/DOWNGRADED disposition for every proposed
  finding, with literal artifact checks.

| Agent | Attack vector | Output expectation |
| --- | --- | --- |
| Popper, Karl | vacuity | Reject criteria or replication claims that could pass regardless of candidate identity or corpus. |
| Quine, Willard Van Orman | definitional collapse | Test whether candidates rename existing types, relations, or each other without a separating witness. |
| Wittgenstein, Ludwig | scope/framework | Test framework-language dependence, corpus overreach, and category claims that exceed actual use. |

### Predicted Disagreements

- Popper attacks non-falsifiability while Quine attacks type identity on the
  attack-vector axis; a vacuity-only bias in Popper would be exposed by Quine's
  existing-type collapse checks.
- Popper attacks non-discrimination while Wittgenstein attacks scope and
  framework language on the `attack-vector` axis; a mechanically discriminating
  but framework-local result accepted by Popper would be exposed by Wittgenstein.
- Quine attacks definitional identity while Wittgenstein attacks use-boundary
  scope on the `attack-vector` axis; a neat lexical merge proposed by Quine
  would be exposed when Wittgenstein finds distinct operational use, and vice
  versa.

## Group 4 - Coverage Auditor

- Agent: Vlachopulos, Ioannis.
- Role: `auditor` and dedicated `final_approver`.
- Dependency: sequential after verifiers.
- Purpose: verify nine-candidate/lens coverage, citation discipline, dropped
  refutations, authority boundary, zero-findings red flag, and accepted packet.

## Dependency Flow

1. `replication-attackers -> synthesizer`: sequential.
2. `synthesizer -> finding-verifiers`: zig-zag, `loop_cap: 1`.
3. `finding-verifiers -> coverage-auditor`: sequential.
4. `coverage-auditor -> synthesizer`: conditional feedback, `loop_cap: 1`.

## Outputs And Closeout

- `replication/attacks.md`
- `replication/findings.md`
- `replication/REPLICATION-MATRIX.md`
- terminal Task Session receipt
- one dispatch-ledger registration row and one close row
- inventory and observability synchronization

Every agent must be joined and closed. Any timeout/error retains residue and a
reroute; hidden or open agents block Task Session success.

## Gate State

- Check-tension: round 1 reproved by checker and reviewer on four Test-4 axis
  labels; exact fixes applied; round 2 checker PASS and reviewer PASS; post-confirm
  ledger-ID normalization round 3 first attempt hit runtime usage errors; both
  errored agents closed; retry checker PASS and reviewer PASS.
- Human confirmation: option 1 approved on 2026-07-11.
- Registration: appended once as `2026-07-11-uif-010-replication-review`.
- Runtime workers: 8 spawned, joined, and closed; 0 open.
- Review result: final auditor ACCEPT after one bounded CR-ID alignment.
- Reconciliation result: all nine candidates `deferred`; zero promotion-lane survivors.
