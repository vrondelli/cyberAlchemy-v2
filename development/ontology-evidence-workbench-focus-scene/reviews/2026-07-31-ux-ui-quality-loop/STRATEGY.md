# OEW UX/UI Quality-Loop Review Strategy

Status: confirmation-ready candidate; exact sheet requires human confirmation

## P1 Trigger

Dispatch is warranted by synthesis, isolation, parallelism, and context
protection. Contrast/non-color recovery, reading/task hierarchy, and navigation
state can each produce locally plausible but mutually conflicting repairs; the
review needs opposed verification before returning change requests.

## Lanes, Groups, And Subagents

1. `attackers` runs three whole-interface black-box attacks in parallel.
   - Tversky, Amos: computational contrast, redundant cues, keyboard, forced
     colors, and reduced motion.
   - Simon, Herbert: empirical cold-reader tasks, hierarchy, copy, density, and
     locate/trace/retell/distinguish/boundary/vocabulary loci.
   - Alexander, Christopher: formal navigation state across context clusters,
     portal cards, Path, Back, focus, and semantic non-invention.
2. `synthesizer` runs Moss, Lawrence S. after all attacks and classifies each
   claim by evidence type.
3. `verifiers` runs two opposed skeptics in parallel through one bounded
   zig-zag.
   - Gigerenzer, Gerd: counter-examples, proxy gaming, uncalibrated automation,
     and false cross-project universalization.
   - Wittgenstein, Ludwig: definitional/scope errors across predicate, edge
     instance, presentation relation, cluster, route, ontology, and authority.
4. `writer` runs Shannon, Claude after verification and returns review-only
   attacks/findings content plus a candidate reusable protocol delta.
5. `coverage-auditor` runs Brandenburg, Martin after writing and may request
   one bounded revision. The parent is final approver.

## Dependency Flow

```text
3 attackers (parallel)
        |
        v
 synthesizer <---- feedback when evidence is missing
        |
        v
2 verifiers (parallel, zig-zag cap 1)
        |
        v
     writer <---- one audit revision
        |
        v
 coverage auditor
        |
        v
 parent final approval
```

Whole-sequence `max_loops` is 1. Feedback edges do not create initial
dependencies.

## Concrete Audit Boundary

- Current browser surface and admitted Body War graph are attacked before
  source inspection.
- Candidate focus-scene design is attacked after the black-box baseline.
- A relation color is stable by exact `sourcePredicate`, not by edge instance;
  `presentationRelation` remains a redundant pattern channel.
- Context cards may be cluster portals, but Path may not invent branches or
  membership.
- Browser evidence may establish structure and interaction only. Readability,
  comprehension, trust, preference, and complete accessibility remain bounded
  claims or residues.
- The review does not implement fixes.

## Reuse Outcome

The run must produce a Body War baseline plus a parameterized candidate audit
loop: frozen project profile, evidence classes, three attack lenses, opposed
verification, baseline-to-current rerun, and portability gate. It is practical
for another experimental project profile, but it is not promoted or calibrated
as a universal capability until Body War completes one post-update re-audit and
the fixture requirements in `AUDIT-PROTOCOL-CANDIDATE.md` pass.

## Inventory Preflight

Machine lookup readiness is `ready`; projection conformance passed with zero
failures and 125 uncontrolled-tag warnings. Selected evidence: the verified
Body War ontology UI black-box result, the novice-comprehension instrument
boundary and four cards, the Studio interface evidence-class precedent, and a
cross-project readability review. Excluded: OEW runtime ownership, broader
Studio governance, and SuggestedTrack product-flow results because they do not
own this rendered-interface question.

Inventory changed the design by requiring three distinct methodologies,
explicit structural-versus-human evidence classes, frozen pre/post scenarios,
and a profile boundary before reuse. It remains non-authority; current target
evidence must be recollected.

## Gate And Ledger State

- Form owner: schema `0.8.0`.
- Confirmation-readiness: `pass`; exact sheet SHA-256
  `76cf42d74ea0c12855aa5acbbd37274f36aa85cdb0bb22fee8a5a5636efe4b2b`.
- Dispatch Spec route: `pass`, capability-bound, authorization still
  `requires_user_permission`.
- Check-tension: `PASS + PASS`; independent checker and reviewer, exact digest
  match, no apontamentos, no comparison/repair phase.
- Human confirmation: not requested yet.
- Registration: none.
- Ledger mutation: none.
- Execution: none.
- Expected close: exactly one dispatch append and one close append if later
  confirmed and run.

## Next Human Action

Reply `confirmed` to authorize registration and execution of the exact sheet
digest above, request a revision, or decline. Any sheet-byte edit requires a
fresh validation, two new tension verdicts, and reconfirmation.
