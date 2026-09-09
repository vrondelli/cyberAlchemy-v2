# Ontology Candidate Graph Prototype — Execution Pack

Status: planned; no execution authorized

## Choreography

| Wave | Layer | Units | Parallelism | Entry gate | Exit gate |
| --- | --- | --- | --- | --- | --- |
| [`W0-L0A.md`](work-pack/waves/W0-L0A.md) | carrier | `001` | none | explicit selection + preflight | `G-OCGP-L0A` |
| [`W1-L0B-L0C.md`](work-pack/waves/W1-L0B-L0C.md) | graph, policy, projection | `002→003→004→005` | none | L0A pass | `G-OCGP-L0C` |
| [`W2-L1-L2.md`](work-pack/waves/W2-L1-L2.md) | evidence and isolation | `006→007→008→009` | none | L0C pass | `G-OCGP-L1` and `G-OCGP-L2` |
| [`W3-L3-DEFERRED.md`](work-pack/waves/W3-L3-DEFERRED.md) | static inspection | no SWU | none | later approved Plan | unavailable |

Sequential execution is intentional. Each later behavior consumes the prior
unit’s exported contract, and no claimed latency benefit outweighs the risk of
inventing parallel intermediate APIs.

## Per-SWU Execution Envelope

1. User explicitly selects one dependency-ready SWU.
2. Task Session reads only its task, wave, shared context, traceability row,
   current source anchors, and exact predecessor receipts.
3. Preflight binds:
   - dependency receipt digests;
   - exact write-scope baseline (`SHA-256` or `ABSENT`);
   - exact closeout-target baseline;
   - Node version and validation command;
   - protected selector digest set.
4. Task Session implements only the selected behavior.
5. Its deterministic validation command runs.
6. The terminal source receipt is written last and validated independently.
7. `invoke:refresh:apply-approved` may synchronize only admitted closeout
   fields and emits the owner receipt.
8. Task Session stops. It may name the deterministic successor candidate but
   cannot select or execute it.

## Required Task Session Result Shape

```json
{
  "swu_id": "SWU-OCGP-NNN",
  "status": "pass|fail|blocked",
  "primary_behavior": "string",
  "source_baseline_digest": "sha256",
  "dependency_receipts": [],
  "changed_paths": [],
  "validation": {
    "command": "string",
    "exit_code": 0,
    "summary": "string"
  },
  "protected_selectors": {
    "before_digest": "sha256",
    "after_digest": "sha256",
    "write_probe": "denied|not-applicable"
  },
  "terminal_receipt": {
    "path": "string",
    "sha256": "sha256"
  },
  "claim_ceiling": "private finite candidate behavior",
  "closeout": {
    "invoke_refresh_receipt": "string",
    "successor_candidate": "SWU-OCGP-NNN|closure|none",
    "successor_selected": false
  },
  "residue": []
}
```

Unknown fields or missing required fields fail closed.

## Failure Policy

- validation failure: preserve failure evidence in the selected SWU run root,
  write no pass receipt, and stop;
- baseline drift: write nothing and request Plan/Task Session refresh;
- protected selector drift: fail L2, even if functional tests pass;
- unknown contract major version: block;
- existing run directory: refuse overwrite;
- owner receipt failure: source evidence may remain, but Plan status and
  successor eligibility remain unchanged;
- attempted authority or Poker Team mutation: stop immediately.

## Completion Boundary

After `001–009` each have independently valid terminal and closeout receipts,
the closure-only task may verify recomposition. That task changes no source and
cannot promote the prototype, authorize L3, or repair Poker Team.
