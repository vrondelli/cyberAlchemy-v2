# Round78 prospective deadline-only task2 pair

Original objective: GLM qualification including8K continuity. Enduring objective: reusable reasoning quality with at least15% fewer cumulative input plus output tokens without quality loss. This diagnostic1M comparison is not the8K or near-limit context benchmark.

H1: the original120-second deadline interrupted useful8192-output generations;300seconds restores complete responses and measurable task outcomes. H0: provider stalls or harness/reasoning failures persist and more waiting does not restore valid source selections.

Two assigned slots: original task2 simdjson, one ARE and one officialDSH, two concurrentVPS workers after the identity-only phase settles. Source is round74's exact original generation with only two numeric timeout changes: ARE model deadline and DSH durable transport deadline120000→300000ms. The scoped-ID policy is intentionally absent here, so this deadline comparison does not combine fixes. Historical task2 failures and their unknown paid usage stay retained.

Same1M context capacity,8192 output allowance, low reasoning,96calls,4Mtokens,1800second wall-time perarm,zero automatic retries, pinned tasks and native evaluator. ARE's timer covers the model request; DSH's timer covers tokenizer plus model as before. Both nominal ceilings become300seconds; tokenizer overhead is a declared semantic difference, not hidden equivalence. The change does not increase any token or call budget. Node's inbound request-body timeout does not cap generation after a fully received body.

DAG: settle identity phase → freeze two timeout changes and competing hypotheses → offline delayed-response accounting tests → source/task/profile/disk review → run pair → reconcile all dispatched calls → score valid exports → observe/review → choose whether further confirmation is justified.

Clear-result criterion: two settled assigned outcomes; complete known/unknown cost classification; matched valid scores when available. H1 receives support only if responses complete, not merely if processes exit. Unknown usage prohibits exact aggregate savings. Preserve failure reasons and do not replace failed samples.

D65 product frontier: isolated candidate experiment and evidence. Operational owner: coordinator under explicit user continuation. Only the newVPS directory, pinned image and existing GLM credential are used. Model workers never see evaluator gold. Disk reserve8GiB; bounded local evidence. No unrelated services, production promotion, release, publication, commit or ontology-runtime selector dependency.

Postprocessing uses read-only source mounts plus32MiB writable temporary storage for unchanged source mapping. Native scorer remains frozen. Exact output/profile settings are inspected before launch. Next experiments require a new hypothesis/decision and source freeze; no automatic retries.

## Open questions

Does300seconds resolve task2 failures? Are remaining failures provider, harness or task reasoning? Can missing historical usage be recovered? Do clear individual results generalize to untouched tasks and meet15% savings without quality loss?
