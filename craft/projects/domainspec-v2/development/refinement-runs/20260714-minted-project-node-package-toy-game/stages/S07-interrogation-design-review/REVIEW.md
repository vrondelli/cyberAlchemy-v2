# Interrogation Refine Design Review

Mode: `refine-design-review`  
Verdict: `flag` — the core layout evidence is valid, but four claims need mechanical strengthening and two limits must be explicit before planning.

## Review Method

The review inspected the six-view design, compiler/harness source, generated graph/source manifest, tournament evidence, and all mutation outcomes. Questions were adjudicated sequentially from the factory, consumer-author, and implementer perspectives. No subagents or external research were used.

## Question 1 — Did three layouts really produce the same graph?

Yes. All three `graph.json` files have SHA-256 `25a637c3608a3fa7d0969b31baf9ff3bc4c06c6c165972c044bb4e887aa902f2`; all Markdown views share SHA-256 `3a2cc32641fb0f000d773db711fcf89bb74c4c10855ad3cd8ad25fed7b66b370`; repeat builds were byte-equal. Layout-specific source locations live only in `source-manifest.json`.

Finding: `pass`. Separating semantic graph from provenance mapping is necessary and coherent, not hidden glue.

## Question 2 — Is layout A empirically proven best?

Only partly. Graph equality, failure behavior, determinism, and source-file counts are measured. `authority_clarity` and `edit_locality` are explicitly assigned rubric scores in `run_tournament.py`; they are reasoned assessments, not observations produced by an authoring study. Layout A is a responsible provisional default because it matches B's semantic behavior with six rather than nine canonical input files and avoids C's multi-record bundles. It is not a universal Pareto theorem.

Finding: `flag`.  
Repair DR-01: label every tournament criterion as `measured` or `assessed`, carry the no-independent-edge-lifecycle assumption into the verdict, and phrase A as the L0 default under that assumption.

## Question 3 — Can an implementer actually traverse graph → manifest → source?

The generated artifacts contain the necessary information: four graph node IDs and exactly four corresponding node records with project-local paths. However, the current harness infers traversal completeness from counts (`4` nodes, `7` total records). It does not execute the join or verify that each referenced file still contains the claimed node/edge.

Finding: `flag`.  
Repair DR-02: add an explicit navigation verification for every graph node and edge across all layouts, including bundle membership.

## Question 4 — Does the receipt prove outputs still match current sources?

Not yet. The receipt stores a source-set digest, but `verify_build` currently checks only graph, source-manifest, and Markdown output bytes. If a canonical source changes after compilation, output verification still passes unless compilation is rerun.

Finding: `flag`. The design currently overstates source invalidation.  
Repair DR-03: make verification optionally source-aware, recompute every input hash and source-set digest from the candidate root, and add a `stale-source` mutant.

## Question 5 — Is language binding failure-tested?

The compiler compares declared and actual registry digests, and valid builds record both. No negative case mutates a registry digest, so R4 is code-inspected rather than mutation-proven.

Finding: `flag`.  
Repair DR-04: add a `language-digest-mismatch` mutant and require that failure class.

## Question 6 — Does this prove DomainSpec node formation?

No. The toy compiler confirms the four kind names exist and enforces exact relationship endpoints, but it does not run the current kind-specific criterion schemas. The toy bodies resemble the criteria, yet formation validity is not established here. This omission does not distinguish A/B/C because all layouts carry the same bodies, but it blocks any claim that the package is production-valid.

Finding: `scope flag`, not an L0 layout blocker.  
Repair DR-05: state that production compiler integration must use the admitted formation validator/profile; do not expand the toy into that engine.

## Question 7 — Does the design enforce its generated output root?

No. `project.json` declares `generated_root`, but the disposable compiler accepts an explicit output path and does not resolve the manifest value. That is appropriate for run containment but not sufficient for a project minter contract.

Finding: `scope flag`.  
Repair DR-06: carry generated-root resolution and containment into the non-executed plan.

## Negative-Control Review

The original 8/8 outcomes are credible and distinct:

- dangling target;
- duplicate edge ownership;
- unknown relationship;
- endpoint-invalid relationship;
- stale graph;
- stale Markdown;
- Markdown-only required field;
- external source-root escape.

The Markdown test is particularly important: the compiler never reads `.md` inputs; the mutation supplies a README with the missing intent and still fails `missing-machine-field`.

## Authority Review

| Boundary | Verdict |
| --- | --- |
| DomainSpec fixture mistaken for consumer authority | pass; path escape fails and candidates are run-local |
| Generated graph becomes writable source | pass; graph is derived and drift-bound |
| Markdown becomes machine dependency | pass; explicit negative control |
| Edge identity lost when embedded | pass; normalized stable edge IDs and duplicate failure |
| Registry maturity inflated to production admission | pass; design states candidate maturity and scope |
| FPR-01 source home silently decided | pass; no FPR artifact or production source path changed |

## Verdict and Repair Route

Continue to Distill Repair. DR-01 through DR-04 are locally repairable and acceptance-critical for the final evidence claim. DR-05 and DR-06 are explicit plan constraints, not reasons to turn the toy into production code. If source-aware verification or navigation joins cannot pass uniformly across A/B/C, layout selection must block.

