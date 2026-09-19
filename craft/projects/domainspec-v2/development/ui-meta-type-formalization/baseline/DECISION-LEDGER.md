---
module: ui-meta-type-formalization
artifact_id: UIF-BASELINE-DECISIONS-v0.1
status: current
updatedAt: 2026-07-11
created_by: SWU-UIF-001
authority_boundary: task-level experimental decisions; no canonical promotion
---

# Decision Ledger: UI Hypothesis Baseline

## Resolved Task Decisions

| ID | Decision | Selected route | Rejected alternatives | Rationale and source | Downstream effect |
| --- | --- | --- | --- | --- | --- |
| UIF-BD1 | What status does the matrix grant? | Frozen experimental input; all labels stay formation-deferred. | Treat matrix as definition, approval, ranking, or promotion. | Accepted UI11 review requires explicit defer and complete later evidence. | UIF-002 may register experiments; no schema or authority mutation is unlocked. |
| UIF-BD2 | What is one complete hypothesis row? | Label plus formation hypothesis, neighbors, allowed witness pressure, forbidden shortcuts, possible outcomes, correction route, and source pressure. | One-line meaning only; schema draft; outcome selection. | SWU-UIF-001 done criterion and Context Pack O2. | Every label can enter the same experiment/result contract. |
| UIF-BD3 | Which evidence classes may support formation? | Structural tables, exercised active DS-D8 instances, and separating fixtures. | Self-declared tags, naming conventions, framework APIs, raw edge-set inequality, or endpoint use alone. | Formalism findings establish bounded table walks; non-collapse findings require separating exercised evidence. | UIF-002 fixtures must target structure and neighbor discrimination. |
| UIF-BD4 | Which outcomes must the matrix preserve? | Schema-ready, merge, relation-not-node, framework vocabulary, split, and defer-evidence-gap. | Binary promote/reject; force all labels to survive. | Architecture decision flow and experiment outcome contract. | Experiments can remove or reroute candidates without treating that as failure. |
| UIF-BD5 | Does hypothesis ordering select pilot promotion order? | No. E0 contrasts remain method tests only. | Infer Page/Form/Adapter priority from attacker confidence or earlier pilot texture. | UI11 review demoted per-type ordering as non-authoritative. | No row is marked stronger, earlier, or preferred for promotion. |
| UIF-BD6 | How are DS-D8 signatures used? | Cite them as graph pressure and require exercised instances in later experiments. | Treat active endpoint signatures as DS-D1 formation authority. | UI11-F2 and Peirce's verified relation-consequence boundary. | Relationship evidence can support but never independently clear a type. |
| UIF-BD7 | How are correction routes represented? | Route malformed or neighbor-shaped specimens to the nearest existing/candidate type, relation, framework vocabulary, split, or evidence gap. | Generic "invalid" with no repair; silently broaden candidate. | Candidate artifact contract requires correction; non-collapse requires paired discrimination. | UIF-002 can register expected reject-or-reroute behavior. |

## Assumptions

| ID | Assumption | Risk | Expiry / owner |
| --- | --- | --- | --- |
| UIF-BA1 | Markdown is sufficient for the SWU-001 frozen matrix; machine experiment manifests begin in UIF-002. | Manual table parsing could drift if copied. | Expires when UIF-002 emits the machine manifest; experiment owner. |
| UIF-BA2 | Neighbor sets are broad enough to register first experiments but are not exhaustive ontology claims. | A later corpus may reveal a missing neighbor. | Version matrix before affected experiments; UIF baseline owner. |
| UIF-BA3 | Current active DS-D8 signatures are source evidence as of this task run. | Relationship authority may change. | Refresh before experiment registration if `relationships.yml` changes. |
| UIF-BA4 | Real-corpus availability is not required to freeze hypotheses. | Synthetic intuition may bias wording. | UIF-002 must select provenance-bearing corpus and may version hypotheses before execution. |

## Deferred Decisions

| Decision | Why deferred | Owner / next SWU |
| --- | --- | --- |
| Corpus and specimen selection | Requires provenance and registered expected outcomes. | SWU-UIF-002 |
| Machine result and corpus schemas | Belongs to experiment-manifest freeze. | SWU-UIF-002 |
| E0 expected accept/reject/reroute results | Must be registered against concrete fixtures. | SWU-UIF-002 |
| Any per-label provisional outcome | Requires executed evidence. | SWU-UIF-004..007 |
| Candidate schema/card authoring | Requires `candidate-schema-ready` adjudication. | SWU-UIF-008 |
| DS-D1 promotion or DS-D8 repair | External authority decision. | definitions-governance or relationship authority after UIF-011 |

## Blockers

None for `SWU-UIF-001`. `GAP-UIF-REAL-CORPUS` remains a named, non-blocking
input gap owned by `SWU-UIF-002`.

## SWU-UIF-002 Decisions

| ID | Decision | Selected route | Rejected alternatives | Rationale | Downstream effect |
| --- | --- | --- | --- | --- | --- |
| UIF-BD8 | What corpus is frozen for E0? | Six local synthetic, framework-neutral normalized fixtures with explicit provenance and `promotion_eligible: false`. | Imply real-product provenance; block all method work until a real corpus exists. | The work-pack allows synthetic E0 for method proof while requiring real evidence before promotion. | UIF-003 may run method smoke tests; promotion remains blocked by `GAP-UIF-REAL-CORPUS`. |
| UIF-BD9 | What is the fixture representation? | Markdown specimens with YAML frontmatter and normalized structural tables. | Framework source code; prose-only examples; canonical aspect files. | Reuses local fixture idiom while making role, provenance, expectation, and route machine-addressable. | UIF-003 can parse frontmatter and inspect bounded tables without application execution. |
| UIF-BD10 | How are E0 and final outcomes separated? | `method_outcome` records structural separation/collapse; `provisional_outcome` remains `not-adjudicated`. | Call Form schema-ready or Adapter merged before execution and full evidence. | Architecture requires constructibility, portability, graph, round-trip, and review before final adjudication. | E0 cannot accidentally promote or eliminate a label. |
| UIF-BD11 | What result is preregistered for each contrast? | Form/Component expects separation; Adapter/Mapping expects structural collapse. | Make both pairs survive; tune expectations after execution. | Counterbalanced E0 must prove the protocol can preserve and collapse candidates. | UIF-003 must version and rerun the protocol if the registered expectations change. |
| UIF-BD12 | Which Form fields are required in E0? | Typed Fields table plus validation/error columns and Contract attributes for submission action, target interface, and error mapping. | Element/name-only Form; make error mapping optional in E0. | UI11 evidence identifies Form as an aggregate contract and explicitly surfaced error-mapping ambiguity. Requiring it makes E0 falsifiable. | The malformed fixture omits those structures and must reject. |
| UIF-BD13 | Which Adapter differences are forbidden as non-collapse witnesses? | UI boundary tag, Adapter name, and `shapes` edge alone. | Treat any one as sufficient separation from Mapping. | Non-collapse findings reject self-attestation and raw edge pressure as independent authority. | Mapping neighbor intentionally passes the same transform probe and should emit a collapse signal. |

## Deferred Decision Status After UIF-002

| Prior deferred decision | Status after UIF-002 |
| --- | --- |
| Corpus and specimen selection | Resolved for synthetic E0; real/owner-supplied corpus remains open for later promotion evidence. |
| Machine result and corpus schemas | Resolved by `experiments/result.schema.yml` and `experiments/corpus.yml`. |
| E0 expected accept/reject/reroute results | Resolved and frozen in `experiments/protocol.yml` before UIF-003 execution. |
| Any per-label provisional outcome | Still deferred to executed evidence and UIF-007 adjudication. |
| Candidate schema/card authoring | Still deferred to UIF-008. |
| DS-D1 promotion or DS-D8 repair | Still external to this package. |

## Current Blockers

None for `SWU-UIF-002`. `GAP-UIF-REAL-CORPUS` remains open but does not block
synthetic E0 method execution in `SWU-UIF-003`.

## SWU-UIF-003 Decisions

| ID | Decision | Selected route | Rejected alternatives | Rationale | Downstream effect |
| --- | --- | --- | --- | --- | --- |
| UIF-BD14 | How is the pre-run `evidence_refs`/`evidence` mismatch repaired? | Correct the protocol comparison selector to `evidence` before run 1 and record `UIF-PRE-001`; keep protocol version v0.1. | Compare a nonexistent field; silently ignore evidence; change outcomes. | The result schema has always required `evidence`; no run exists, so the correction invalidates no evidence and changes no experiment meaning. | Both runs compare the actual frozen result field. |
| UIF-BD15 | Which local runner substrate is used? | Isolated Python runner with installed PyYAML and a bounded Markdown-table parser. | Add a Node YAML dependency; edit shared validators; ad hoc shell parsing. | The project has no installed Node YAML package, PyYAML is available, and the SWU prohibits shared validator mutation. | Runner remains under `experiments/` and carries no canonical authority. |
| UIF-BD16 | How is repeatability established? | Run into `run-1` and `run-2`, require recursive equality, then emit final records with `repeatability: deterministic`. | One run labeled deterministic; in-memory duplicate execution; compare only exit codes. | The protocol requires two runs and byte-for-meaning comparison. | UIF-003 passes only if both directories and configured semantic fields agree. |
| UIF-BD17 | How are graph edges used by the runner? | Check required supporting edge names on the positive fixture and report graph coherence separately. | Let edge presence determine formation outcome; skip graph evidence. | DS-D8 is supporting pressure only. | Structural outcome logic remains independent from graph-coherence status. |

## Current Blockers After UIF-003 Setup

None. Local fallback is selected because runtime subagent permission was not
provided; no subagent lifecycle is opened.

## SWU-UIF-003 Execution Outcome

| Item | Result | Authority effect |
| --- | --- | --- |
| Form versus Component | `structural-separation-survives`; positive accepted, malformed rejected, Component neighbor rerouted. | Method evidence only; Form remains `not-adjudicated` and formation-deferred. |
| Adapter versus Mapping | `structural-collapse-observed`; positive accepted, malformed rejected, Mapping neighbor accepted by the same transform structure. | Method evidence only; Adapter is not yet finally merged or adjudicated. |
| Repeatability | Run 1 and run 2 directories are identical; final records say `deterministic`. | No promotion authority. |
| Graph coherence | Supporting edges passed on positive fixtures. | Supporting evidence only; DS-D8 did not set method outcomes independently. |
| Corpus | Six synthetic fixtures. | `promotion_eligible: false`; real corpus remains required. |
| Portability / round trip | Incomplete / not run at E0. | Blocks promotion-ready claims. |

The initial command wrote generated outputs under package-root `results/`
instead of `experiments/results/`. Those generated outputs were discarded and
the full two-run plus comparison sequence was rerun at the declared path without
changing protocol or fixtures.
