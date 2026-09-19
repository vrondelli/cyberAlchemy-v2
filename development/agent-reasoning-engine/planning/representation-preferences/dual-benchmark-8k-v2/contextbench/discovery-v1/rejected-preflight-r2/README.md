# Rejected tokenizer preflight 2

The tokenizer-only run stopped on request-failed for contextbench-3 treatment. No model generation was admitted. Earlier successful cells and the failing sealed cell remain preserved. No result is promoted as benchmark success.

An offline parser check also found that preserved historical modules in inherited freeze bindings are not executable entrypoints. Source closure traversal now starts from current local runtime entrypoints only; all inherited732 source hashes remain bound independently. No benchmark task or treatment policy changed.

## Open questions

Current protocol and empirical questions: ../LIVE-PROTOCOL.md.
