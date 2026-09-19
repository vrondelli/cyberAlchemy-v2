# N39 examples

These are the same aligned examples validated in `DESIGN-DECISION-EXAMPLES.md`. Decision effect: none.

- Low: one project, one generated snapshot, one consumer-authored sidecar, one evaluator receipt.
- Medium: a source change creates a new graph and therefore a new sidecar; history is not rewritten.
- Complex: multiple loaders contribute one boundary; the sidecar binds their completed populations plus generated digests and is rejected if any path or digest drifts.

At every rung A uses the dedicated sidecar, B defers, and C stops. Embedding in `project.json`, copying completeness into a request, and compiler-authored completeness remain rejected.
