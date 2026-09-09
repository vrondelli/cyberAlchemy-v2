# Contextual Framings Measurement Research Strategy

Status: resolved research dispatch; candidate measurement design; no experiment executed.

## P1 trigger

P1 passes. The question needs three materially different lenses: comprehension and transfer, analogy fidelity and harm, and ergonomic task performance. Parallel separation protects the Cognitive Tools Tower's evidence boundary from being collapsed into a single attractive productivity score.

## What improvement should mean

The first claim should be narrow:

> Compared with evidence-equivalent prose, does a contextual framing help a person preserve and use the source meaning while introducing fewer critical misconceptions and no unacceptable increase in effort?

Improvement is not one number. It is a guarded relation:

```text
improvement :=
  semantic-and-boundary correctness increases
  AND critical analogy harm does not increase
  AND transfer or return fidelity increases
  WITH time, stalls, interaction cost, and perceived effort reported separately
```

This makes correctness and harm primary. Speed is secondary and cannot compensate for a confident false understanding.

## Candidate measurement families

| Family | Candidate observables | Posture |
|---|---|---|
| Meaning preservation | required distinctions retained, claim ceiling, authority boundary, limitations retained | Source-backed by the Tower |
| Round trip | reconstruct source case after framing; translate plain/formal/plain without drift | Source-backed by the Tower |
| Transfer | apply the distinction to an unfamiliar case and reject a tempting invalid use | Source-backed by the Tower |
| Calibration | confidence aligned with evidential sufficiency and uncertainty | Source-backed by the Tower |
| Analogy fidelity | explicit source-target correspondences, preserved disanalogies, counterexample handling | Candidate framing extension |
| Analogy harm | new misconception count, invalid inference count, unjustified confidence, failure to return to source | Candidate framing extension |
| Task performance | correct completion, critical errors, completion time, steps, help requests, stalls, recovery | Partly source-backed; framing-specific use remains candidate |
| Effort | optional perceived effort plus observed stalls and recovery | Candidate until a local instrument is source-bound |

## Illustrative candidate experiment shape

Freeze one bounded case and two evidence-equivalent arms:

1. Baseline: source material rendered as concise prose.
2. Treatment: the same source material plus one explicit contextual framing with mapping, limits, provenance, and stopping conditions.
3. Tasks: retell the claim, identify its limits and authority, solve one near case, reject one misleading case, and return to reconstruct the original case.
4. Primary family: semantic preservation, boundary accuracy, and critical misconception count.
5. Secondary outcomes: transfer, calibration, stalls, completion time, interaction steps, and perceived effort.
6. First run: agent structural pretest for leakage and scoring defects only.
7. Later run: separately authorized counterbalanced human study before any human-comprehension, cognitive-effort, ergonomic, or productivity claim.

The research found that this shape cannot yet be called the smallest adequate experiment. The exact sample, effect threshold, scoring rubric, fixture bytes, blindness, adjudication, and invalidation rules remain inputs to a separate `research-evidence-harness` route.

## Lanes and dependency flow

- Explorers: Halford (comprehension), Tversky (analogy harm), Simon (task ergonomics).
- Synthesizer: Noether constructs the metric and experiment matrix.
- Skeptics: Lakatos (precedent), Popper (non-vacuity), Wittgenstein (definitions).
- Writer: Baez writes `findings.md` only.
- Auditor: Brandenburg audits `findings.md`; the parent remains final approver.

```text
explorers -> synthesizer <-> skeptics -> writer -> auditor -> parent
                  |
                  +-> explorers (one evidence-repair loop)
```

## Inventory preflight

The repository Inventory is lookup-ready. The primary selected source is the Cognitive Tools Reflection Tower and its evidence handoff, claim ledger, gates, residue, and round-trip example. Verified Body War novice-comprehension and naturalized-interface syntheses supply leakage, learner/reviewer separation, and human-claim boundaries. Superseded or adjacent ergonomics material is excluded from the evidence basis.

Design consequence: use evidence-equivalent arms; make correctness and harm primary; keep agent structural checks separate from human evidence; route executable fixtures and validators to `research-evidence-harness`.

## Gate and authority state

- Dispatch sheet: candidate schema 0.10.0.
- Form validation: pass on schema 0.10.0; sheet SHA-256 `29e7ef9b6f504cdb21813561f12f19e9a98c1311da43a3ab5f5fc1d48fbaa3d4`; ledger mutation `none`.
- Independent check-tension pair: PASS/PASS on the exact sheet digest. The first checker blocked a weaker skeptic-axis statement; that material field was repaired and both independent checks were rerun on the new digest.
- Preconfirmation closure: pass; material SHA-256 `6b1865d2d40730d70c9f0bb0154bfd7648629753deb3aec38f75da8ab9698a46`; spawn attempts `0`.
- Human confirmation: received and bound to material SHA-256 `6b1865d2d40730d70c9f0bb0154bfd7648629753deb3aec38f75da8ab9698a46`.
- Ledger: registered once and closed once with `exit_reason: resolved`.
- Research run: complete; nine agents spawned; two declared loops used; final audit `ACCEPT`.
- Experiment or participant activity: not authorized.
- Capability, ontology, implementation, publication, release, deployment, and external effects: none authorized.

## Next governed action

If an executable protocol is wanted, route the accepted candidate through `research-evidence-harness`. That later route must freeze paired arm bytes, fixtures, evidence equivalence, decision thresholds, scoring/adjudication, contamination controls, and result schemas before any structural pretest. Human participation requires separate explicit authorization.
