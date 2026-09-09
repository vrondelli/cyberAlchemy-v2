# exact-json-scoring controlled repair

Restore scoreResponse structural JSON equality while preserving its existing malformed-output reasons.

This disposable source file was adapted from ARE and deliberately mutated for
this experiment. It does not describe an unresolved bug in the repository.
Read src/subject.mjs, this README, evidence/contract.json and evidence/cases.json
on separate turns before proposing a patch. Both evidence files contain relevant
acceptance cases, not executable code. Their examples complement the contract;
the verifier includes independent boundary cases not shown here.

Only src/subject.mjs is mutable. Keep the public export and other behavior.
Use the source and contracts to propose a small patch. Do not modify evidence,
verification files, or add dependencies. No tool execution is required.
After any context recycling, use read-context-evidence at least once to inspect
archived evidence; use inspection progress to avoid rereading completed files.

## Open Questions

Whether the selected retention policy reduces repeated reads and recovery cost
is measured by the enclosing experiment; a passing repair alone does not prove it.
