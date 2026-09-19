# N39 comparative complexity examples

Decision effect: none. Every rung keeps the same N38 owners, N37 incoming-closure proof, and exact-digest snapshot rule.

## Low complexity

A project compiles one feature into one graph and source manifest. The project owner then signs one closure envelope for that exact snapshot. Under A the envelope is a dedicated project-contained sidecar passed by path/digest to the evaluator. Defer leaves placement unresolved; stop ends the route.

## Medium complexity

The same project is rebuilt after one Event source changes. Under A the first sidecar and receipt remain immutable history; a new sidecar binds the new source-set, graph, and source-manifest digests. A transport request references the new sidecar rather than copying it. Defer cannot establish a current pass; stop ends the route.

## Complex

Several loaders assemble the complete eligible Entity/Event populations for one owner-defined boundary. The generated graph and provenance manifest are produced first. Under A the consumer attests their exact digests plus complete incoming adjacency in one sidecar outside generated output, and the evaluator rejects any mismatched or escaping path. Defer preserves `not-evaluated-incomplete-closure`; stop ends the route.

Embedding in `project.json` is excluded at every rung because it changes the source schema and makes generated output digests depend cyclically on an input containing those same digests. An ephemeral request is excluded because it either duplicates A or lacks an independently reviewable attestation.
