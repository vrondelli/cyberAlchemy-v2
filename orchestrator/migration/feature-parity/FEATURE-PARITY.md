# Orchestrator Product-Surface Parity and Functional Gap

Status: implementation candidate  
Authority effect: none

The first standalone deployment proved service health but removed established
ways to inspect and operate the product. Candidate `b04644005462` was rolled
back. The named surfaces now have standalone baselines, but the complete
predecessor behavior has not yet migrated.

| Predecessor capability | Standalone product realization | Source and proof |
| --- | --- | --- |
| Lab | Reusable strategy and run-template catalog plus observed experiments and executions | `frontend/app.js` `renderLab`; browser evidence `lab.png` |
| Graph | Visual DAG calculated from the exact admitted `RunBundle.graph`, with accepted node status | `frontend/ui-model.js` `graphScene`; browser evidence `run-graph.png` |
| Ontology | Relationship projection across templates, strategies, runs, work nodes, roles, and adapters | `frontend/ui-model.js` `buildOrchestratorOntology`; browser evidence `ontology.png` |
| Operations dashboard | Capacity, Gateway, durability, pending-command, recovery, and run-phase observations | `GET /api/v1/operations`; browser evidence `operations.png` |
| Run detail navigation | Overview, graph, results, trace, workers/commands, evidence, recovery, and lifecycle panels | `frontend/app.js` `renderRun` |

The predecessor source was inspected read-only at
`/home/vrondelli/projects/cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/src`.
Its domain-specific persona and research-concept data remain extension
candidates. The standalone core keeps the surface names and user purposes while
deriving records from general orchestration contracts.

## Functional gaps that still block cutover

| Predecessor behavior | Standalone status | Required convergence |
| --- | --- | --- |
| Natural-language question to validated dispatch | missing | Add a planner adapter that emits the canonical `Strategy` and `DispatchProposal`; retain exact proposal review. |
| Live Gateway agent execution and automatic scheduling | partial | HTTP `WorkerApi` transport and the reusable checked `supervise_once` step are implemented; bind the concrete Gateway client and host loop. |
| Pause, resume, manual advance, stop reconciliation | partial | Bind controls to canonical runtime operations and preserve expected-revision checks. |
| ARE route/context workflows and Gateway thread reads | missing | Express these as generic strategy/template capabilities through checked adapters. |
| Full receipt, worker lease, trace, result, and provenance projection | partial | Durable leases, fences, receipts, accepted event bodies, and bounded digest-verified JSON result previews are visible; persist Agent Turn traces and Gateway provenance next. |
| Persona pool and research concept library | extension candidate | Define a general capability/knowledge extension contract rather than embedding research-only records in core. |
| Ontology search, filters, one-hop portal, drag/pan/zoom | missing | Restore interaction behavior over the generic ontology projection. |
| Provider/model, daemon, journal, quarantine, and historical capacity observations | partial | Current operations include capacity plus durable lease and receipt totals; add provider, daemon, journal, quarantine, and retained history observations. |
| Run search/filter and provenance drawer | missing | Restore navigation and exact source/evidence inspection over canonical IDs. |

The public predecessor remains the active deployment until this table is closed
or the owner explicitly accepts a narrower replacement scope.

## Release condition

`python3 orchestrator/migration/feature-parity/verify.py` proves only that the
named surface baselines remain present. A replacement deployment also requires
all functional gaps above to be closed or explicitly dispositioned. Service
health alone cannot satisfy either condition.

## Open Questions

- Which public extension contract should add domain-specific Lab assets and ontology record kinds?
- Should large ontology projections move from browser derivation to a paginated API read model?
- Which Operations observations require retained time-series history rather than a current snapshot?
