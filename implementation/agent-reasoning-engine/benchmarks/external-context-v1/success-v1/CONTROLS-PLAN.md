# Public branch-preservation control

## Hypothesis and DAG

Adding a synchronous snippet control beside the asynchronous public reproduction catches the prior branch-preservation regression before submission. The fixture is operator-authored from public snippet semantics and inspection of the prior candidate branch change; no private test bodies or reference patch are used. The prior model patch is used only for preflight and is not included in the fresh model prompt.

`prior evidence → public sync fixture → original passes / prior candidate fails → composite gate tests → freeze → one fresh episode → public-green candidate → private evaluation → all-pass fresh reproduction → M1`

Baseline evidence combines the unchanged prior async baseline with the new sync baseline. Each live probe request executes both checks in separate clean containers; four requests permit at most eight component probe executions. All other limits remain unchanged: 24 model calls, 48 tokenizer calls, two candidates, no retries, 120-second request deadline, 1800-second episode, USD 0.10 reserve, 12,000 local threshold / 16,384 hard bound, output cap 2048 and receipt-bound reasoning reservations. One fresh episode only. No previous patches, private evaluator test names or private test contents enter model context.

## Construction boundary

D65 product frontier: isolated combined public checks and one measured model episode. Runnable work: new controls files and evidence in success-v1; all previous freezes remain unchanged. Native owner-directed candidate implementation; no ontology record/selector dependencies or runtime admission. Operational owner: local operator supplies existing credential reference and Docker prerequisites. Causal blockers: source drift, credential failure, accounting/provenance errors, or cleanup failure. Deferred residue: production activation, general qualification, publishing and deployment are separate objectives.

## Gates

Three deterministic composite tests pass. The sync fixture must pass baseline and reject the previous faulty model candidate. Public success requires both checks in DOM and hydrate, bound to the same candidate, with verified cleanup. M1 still requires 67/67 repair and 5120/5120 regression labels in two fresh evaluators for the exact exported patch. No pressure episode before M1; a new pressure run is separate bounded work. Failed candidates and episodes remain evidence, never successful outcomes.

## Open Questions

Does the added control enable a repair preserving both branches? Does a public-green result generalize to the full evaluator? One repeatedly used development example cannot establish a causal effect or general success rate.
