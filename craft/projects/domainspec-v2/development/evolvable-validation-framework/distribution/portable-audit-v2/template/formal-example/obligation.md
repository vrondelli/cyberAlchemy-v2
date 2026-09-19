# Demonstration obligations, not a CRABS audit

For the fixed three-node graph, A must reach C through one or more directed
edges. Soufflé and Alloy check the same closed-world graph, not all graphs.
The deliberately broken graph removes B to C.

For canonical pairs, putting two values into ascending order must not depend
on which arrives first. CBMC checks the declared assertion in the provided
loop-free C harness for 32-bit unsigned inputs. Lean proves the corresponding
mathematical statement for all natural numbers. These are different domains:
no verified compiler/refinement bridge between the C code and Lean model is
provided. The broken versions preserve arrival order.

The meaning, input bounds, and source-to-model correspondence remain the audit
author's responsibility. Neither example proves CRABS convergence, concurrent
moves, deletion semantics, memory ownership, deployment behavior, or the whole
EVF implementation. The formal claim files must preserve these limits.
