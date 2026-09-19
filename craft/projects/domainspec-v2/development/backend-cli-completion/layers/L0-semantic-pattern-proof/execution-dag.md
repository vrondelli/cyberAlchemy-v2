# L0 Execution DAG Guide

`execution-dag.json` is the machine-readable execution contract for B00–B04. It is dependency-closed and intentionally serial until the Rule binding candidate is frozen; hostile/source-sensitivity validation and native-equivalence validation then run in parallel before the CLI replay.

```text
L0-B00-01  freeze D65 chain and denominator
  └─ L0-B01-01  classify drift and roots
      └─ L0-B01-02  bounded reproducibility repair
          └─ L0-B01-03  aggregate predecessor validation
              └─ L0-B02-01  extract Rule semantic contract
                  └─ L0-B02-02  typed semantic IR
                      └─ L0-B03-01  authoring invariant tests
                          └─ L0-B03-02  generic add dispatcher
                              └─ L0-B04-01  Rule authoring + graph projection
                                  └─ L0-B04-02  one-helper binding candidate
                                      ├─ L0-B04-03  hostile/source sensitivity
                                      └─ L0-B04-04  native equivalence
                                          └─ join at L0-B04-05 CLI replay
                                              └─ L0-B04-06 independent review
                                                  └─ L0-EXIT-01 evidence join
```

## Execution Semantics

1. A node is ready only when every `depends_on` node has outcome `passed`.
2. Run every check within a ready node and record all failures.
3. A failed node makes descendants `not_evaluable`; name the causal blocker instead of omitting descendants.
4. Never widen a node's write scope. A required wider mutation returns to route selection and plan revision.
5. Never regenerate or rewrite baseline `@10`; validate its exact digest before and after implementation.
6. `L0-B04-02` requires exactly one implementation helper. Freeze and join that helper's candidate before any independent review.
7. Completion means the terminal receipt exists and all nodes are represented. Promotion to L1 additionally requires every node to pass.

## Planned Parallelism

Only `L0-B04-03` and `L0-B04-04` are parallel-ready. All earlier work is deliberately serial because each step fixes the semantic input of the next. Independent review is later and read-only.

## Validation Contract

The DAG is structurally valid when:

- every node ID is unique;
- every dependency names an existing node;
- the graph is acyclic;
- every terminal is reachable from a root;
- every D65 stage appears in at least one node;
- the immutable predecessor identity and digest match the owner-adopted chain;
- the sole delegated implementation node contains the exactly-one-helper rule.
