# E03 consumer repair successor

Candidate DSV2-E03-OWNS-REACHABILITY-002 retains the E01 definitions and E02 design.
The only changed implementation file is consumer.py. The remaining producer,
compiler bridge and IO files are byte-identical copies of the original candidate.

The independent E04 source review found two defects: contradictory native claim
source/results and execution-stage details could pass integrity after rehashing.
This successor closes the claim record fields, joins its source, observed result,
evidence kind, description and assumptions, and validates the thirteen stage detail
shapes. S6/S7 now require exactly two successful observations of the declared
positive/negative summaries, the correct output hashes, replay equality, killed
negative control and matching input references. Existing graph reconstruction and
partial diagnostic algorithms are unchanged. The original BLOCK review is retained
in ../e04-review-v1/reviewer/.

Evidence reuse: compiler, producer, provider and native artifacts are unchanged.
Fresh consumer runs use new expected epochs pinning this consumer source manifest.
Native evidence is retained evidence from E04, not a new provider execution.
The initial unreviewed successor replay preserves all six positive technical
baselines and all nine mutation outcomes. A separate successor source review and
review-bearing replay are still required before E04 completion. No approval,
activation, publication, release or deployment is granted by this candidate.
