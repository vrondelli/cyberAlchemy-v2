# Native Micro-Swarm Parity Protocol

The protocol tests one narrow claim: whether six source-bounded Luna explorers,
deterministically reduced, reproduce the frozen six-card control result within
five minutes and without scoring materially below a blind Sol reference arm.

The manifest, source selectors, output schema, gold cards, scorer, criterion,
and run topology are exact-bound before any live model result exists. Each Luna
runner receives exactly one task. The Sol runner receives the same six task
objects in one prompt and cannot read Luna outputs. Temperature is zero where
the endpoint supports it. Every response and timing receipt is preserved.

The quality scorer compares six task-indexed cards with the frozen control
cards. For each task it awards 20 points for the exact claim ID, 20 for the
terminal disposition, 15 for proof status, 30 for the exact set of source and
selector locators, and 15 for the exact set of non-claims. Narrative wording,
confidence, and elapsed time do not affect quality. The arm score is the mean
task score on a 0-100 scale.

The measured deadline is the full Luna arm wall interval from release of the
first wave until all Luna outputs, reduction, and validation are complete. The
Sol arm is a quality reference and is separately timed. The scientific verdict
follows the criterion's invalid-first rule and is calculated by the bound
scorer; no model may rewrite it.

This protocol does not test general intelligence, arbitrary research topics,
GPU serving capacity, dollar cost, or production reliability. A survived run
is evidence only for this frozen six-task benchmark.

