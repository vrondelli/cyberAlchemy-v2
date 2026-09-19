# N44 risks and gaps

- A collapsed pass/fail result would hide incomplete closure and execution errors; keep four typed results.
- A visible violation must not be masked by incomplete closure; enforce precedence.
- A receipt must not infer currentness; bind only `unknown` or an external exact reference.
- Typed diagnostics must remain unique and precedence ordered in semantic validation.
- Candidate validation does not admit a schema, producer, evaluator, profile, packet projection, or implementation.

Next dependency: coordinated N43/N44 cross-schema admission at N45.
